import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { and, eq, gte, isNull, sql } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, users } from '@/db/schema'
import { GEMINI_MODEL_PRO, OUTLINE_SYSTEM, outlineUserPrompt } from '@/lib/ai'
import type { Outline } from '@/types/deck'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const outlineResponseSchema = z.object({
  title: z.string().min(1).max(300),
  slides: z
    .array(
      z.object({
        position: z.number().int().min(1),
        title: z.string().min(1).max(200),
        type: z.enum(['title', 'bullets', 'two-column', 'quote', 'image-text']),
      }),
    )
    .min(1)
    .max(20),
})

const bodySchema = z.object({
  topic: z.string().min(3).max(500),
  slideCount: z.union([
    z.literal(5),
    z.literal(8),
    z.literal(10),
    z.literal(15),
  ]),
  tone: z.enum(['academic', 'professional', 'casual', 'creative']),
  audience: z.enum(['students', 'educators', 'business', 'general']),
})

/** Try to parse JSON, stripping markdown fences if present */
function parseJSON(text: string): unknown {
  // Strip common markdown wrapping from LLMs
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

  // 1c. Free tier limit: max 5 decks per month
  const [user] = await db
    .select({ subscriptionStatus: users.subscriptionStatus })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user || user.subscriptionStatus === 'free') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [deckCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(decks)
      .where(
        and(
          eq(decks.userId, session.user.id),
          isNull(decks.deletedAt),
          gte(decks.createdAt, startOfMonth),
        ),
      )

    if (deckCount && deckCount.count >= 5) {
      return NextResponse.json(
        { error: 'limit_reached' },
        { status: 403 },
      )
    }
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

  const { topic, slideCount, tone, audience } = parsed.data

  // 3. Create deck row
  const [deck] = await db
    .insert(decks)
    .values({
      userId: session.user.id,
      title: topic,
      topic,
      slideCount: 0,
      status: 'draft',
    })
    .returning({ id: decks.id })

  if (!deck) {
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 },
    )
  }

  // 5. Generate outline with Gemini
  let outline: Outline

  function validateOutline(raw: unknown): Outline | null {
    const result = outlineResponseSchema.safeParse(raw)
    return result.success ? (result.data as Outline) : null
  }

  try {
    const result = await generateText({
      model: google(GEMINI_MODEL_PRO),
      system: OUTLINE_SYSTEM,
      prompt: outlineUserPrompt({ topic, slideCount, tone, audience, theme: 'minimal' }),
      maxOutputTokens: 4000,
    })

    // 6. Parse JSON with retry
    let parsed2 = validateOutline(parseJSON(result.text))
    if (!parsed2) {
      const retry = await generateText({
        model: google(GEMINI_MODEL_PRO),
        system: OUTLINE_SYSTEM,
        prompt: `Return ONLY raw JSON. No markdown.\n\n${outlineUserPrompt({ topic, slideCount, tone, audience, theme: 'minimal' })}`,
        maxOutputTokens: 4000,
      })
      parsed2 = validateOutline(parseJSON(retry.text))
    }

    if (!parsed2) {
      await db
        .update(decks)
        .set({ status: 'error' })
        .where(eq(decks.id, deck.id))
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 },
      )
    }

    outline = parsed2
  } catch {
    await db
      .update(decks)
      .set({ status: 'error' })
      .where(eq(decks.id, deck.id))
    return NextResponse.json(
      { error: 'AI generation failed' },
      { status: 500 },
    )
  }

  // 7. Update deck title from outline
  await db
    .update(decks)
    .set({ title: outline.title || topic })
    .where(eq(decks.id, deck.id))

  // 8. Return
  return NextResponse.json({ deckId: deck.id, outline })
}
