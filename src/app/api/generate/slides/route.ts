import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { and, eq, sql } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'
import { SLIDE_SYSTEM, slideUserPrompt } from '@/lib/ai'
import type { OutlineItem } from '@/types/deck'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const bodySchema = z.object({
  deckId: z.string().min(1).max(50),
  outline: z
    .array(
      z.object({
        position: z.number().int().min(1),
        title: z.string().min(1).max(200),
        type: z.enum(['title', 'bullets', 'two-column', 'quote', 'image-text']),
      }),
    )
    .min(1)
    .max(20),
  topic: z.string().min(3).max(500),
  tone: z.enum(['academic', 'professional', 'casual', 'creative']),
  audience: z.enum(['students', 'educators', 'business', 'general']),
  theme: z.string().min(1).max(50),
})

/** Try to parse JSON, stripping markdown fences if present */
function parseJSON(text: string): unknown {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }
  return JSON.parse(cleaned)
}

export async function POST(req: Request) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1b. Rate limit: max 3 concurrent generating decks
  const [genCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(decks)
    .where(
      and(eq(decks.userId, session.user.id), eq(decks.status, 'generating')),
    )
  if (genCount && genCount.count >= 3) {
    return NextResponse.json(
      { error: 'Too many concurrent generations. Please wait.' },
      { status: 429 },
    )
  }

  // 2. Validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  const { deckId, outline, topic, tone, audience, theme } = parsed.data

  // 3. Verify deck exists, belongs to user, and is in draft status
  const [deck] = await db
    .select({ id: decks.id, userId: decks.userId, status: decks.status })
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1)

  if (!deck || deck.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (deck.status !== 'draft') {
    return NextResponse.json(
      { error: 'Deck is not in draft status' },
      { status: 409 },
    )
  }

  // 4. Delete any existing slides for this deck (in case of retry) and set status + theme
  await db.delete(slides).where(eq(slides.deckId, deckId))
  await db
    .update(decks)
    .set({ status: 'generating', slideCount: 0, theme })
    .where(eq(decks.id, deckId))

  // 5. Generate each slide sequentially
  let insertedCount = 0

  try {
    for (const item of outline) {
      // 5a. Generate slide content
      const result = await generateText({
        model: google('gemini-2.0-flash'),
        system: SLIDE_SYSTEM,
        prompt: slideUserPrompt(item as OutlineItem, {
          topic,
          slideCount: outline.length as 5 | 8 | 10 | 15,
          tone,
          audience,
          theme,
        }),
        maxOutputTokens: 600,
      })

      // 5b. Parse JSON with retry
      let slideData: Record<string, unknown>
      try {
        slideData = parseJSON(result.text) as Record<string, unknown>
      } catch {
        const retry = await generateText({
          model: google('gemini-2.0-flash'),
          system: SLIDE_SYSTEM,
          prompt: `Return ONLY raw JSON. No markdown.\n\n${slideUserPrompt(item as OutlineItem, {
            topic,
            slideCount: outline.length as 5 | 8 | 10 | 15,
            tone,
            audience,
            theme,
          })}`,
          maxOutputTokens: 600,
        })
        slideData = parseJSON(retry.text) as Record<string, unknown>
      }

      // 5c. Insert slide row
      await db.insert(slides).values({
        deckId,
        position: item.position,
        layout: item.type,
        headline: (slideData.headline as string) || item.title,
        body: (slideData.body as string) || null,
        bullets: (slideData.bullets as string[]) || null,
        leftColumn: (slideData.leftColumn as string[]) || null,
        rightColumn: (slideData.rightColumn as string[]) || null,
        quote: (slideData.quote as string) || null,
        attribution: (slideData.attribution as string) || null,
        speakerNotes: (slideData.speakerNotes as string) || null,
      })

      insertedCount++

      // 5d. Update slideCount in DB so polling can track progress
      await db
        .update(decks)
        .set({ slideCount: insertedCount })
        .where(eq(decks.id, deckId))
    }

    // 6. Mark deck as done with final slide count
    await db
      .update(decks)
      .set({ status: 'done', slideCount: insertedCount, updatedAt: new Date() })
      .where(eq(decks.id, deckId))

    return NextResponse.json({
      success: true,
      deckId,
      slideCount: insertedCount,
    })
  } catch {
    // Partial failure: keep inserted slides, mark deck as error
    await db
      .update(decks)
      .set({ status: 'error', slideCount: insertedCount, updatedAt: new Date() })
      .where(eq(decks.id, deckId))

    return NextResponse.json(
      { error: 'Slide generation failed', slidesCreated: insertedCount },
      { status: 500 },
    )
  }
}
