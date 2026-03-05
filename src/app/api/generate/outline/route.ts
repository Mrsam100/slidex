import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { eq } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks } from '@/db/schema'
import { OUTLINE_SYSTEM, outlineUserPrompt } from '@/lib/ai'
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
      slideCount,
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
      model: google('gemini-2.0-flash'),
      system: OUTLINE_SYSTEM,
      prompt: outlineUserPrompt({ topic, slideCount, tone, audience, theme: 'minimal' }),
      maxOutputTokens: 1000,
    })

    // 6. Parse JSON with retry
    let parsed2 = validateOutline(parseJSON(result.text))
    if (!parsed2) {
      const retry = await generateText({
        model: google('gemini-2.0-flash'),
        system: OUTLINE_SYSTEM,
        prompt: `Return ONLY raw JSON. No markdown.\n\n${outlineUserPrompt({ topic, slideCount, tone, audience, theme: 'minimal' })}`,
        maxOutputTokens: 1000,
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
