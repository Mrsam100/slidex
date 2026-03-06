import { NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'
import { GEMINI_MODEL, REWRITE_SYSTEM, rewriteUserPrompt } from '@/lib/ai'
import type { Slide } from '@/types/deck'

export const dynamic = 'force-dynamic'

/** Try to parse JSON, stripping markdown fences if present */
function parseJSON(text: string): unknown {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }
  return JSON.parse(cleaned)
}
export const maxDuration = 60

const rewriteSchema = z.object({
  instruction: z.string().min(3).max(200),
})

// Zod schema to validate AI response
const rewriteResponseSchema = z.object({
  headline: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  bullets: z.array(z.string().max(500)).max(10).optional(),
  leftColumn: z.array(z.string().max(500)).max(10).optional(),
  rightColumn: z.array(z.string().max(500)).max(10).optional(),
  quote: z.string().max(1000).optional(),
  attribution: z.string().max(200).optional(),
  speakerNotes: z.string().max(2000).optional(),
})

// In-memory rate limit for concurrent rewrites per user
const activeRewrites = new Map<string, number>()
const MAX_CONCURRENT_REWRITES = 3

/** POST /api/slides/[id]/rewrite — AI rewrite a slide */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: max concurrent rewrites per user
  const userId = session.user.id
  const current = activeRewrites.get(userId) ?? 0
  if (current >= MAX_CONCURRENT_REWRITES) {
    return NextResponse.json(
      { error: 'Too many concurrent rewrites' },
      { status: 429 },
    )
  }
  activeRewrites.set(userId, current + 1)

  try {
    return await handleRewrite(req, params, userId)
  } finally {
    const count = activeRewrites.get(userId) ?? 1
    if (count <= 1) activeRewrites.delete(userId)
    else activeRewrites.set(userId, count - 1)
  }
}

async function handleRewrite(
  req: Request,
  params: Promise<{ id: string }>,
  userId: string,
) {
  const { id } = await params

  let reqBody: unknown
  try {
    reqBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = rewriteSchema.safeParse(reqBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  // Fetch slide + verify ownership via JOIN (soft-delete safe)
  const [slide] = await db
    .select({
      id: slides.id,
      layout: slides.layout,
      headline: slides.headline,
      body: slides.body,
      bullets: slides.bullets,
      leftColumn: slides.leftColumn,
      rightColumn: slides.rightColumn,
      quote: slides.quote,
      attribution: slides.attribution,
      speakerNotes: slides.speakerNotes,
    })
    .from(slides)
    .innerJoin(decks, eq(slides.deckId, decks.id))
    .where(
      and(
        eq(slides.id, id),
        eq(decks.userId, userId),
        isNull(decks.deletedAt),
      ),
    )
    .limit(1)

  if (!slide) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Build content-only object for AI prompt (no internal IDs)
  const slideContent: Pick<Slide, 'layout' | 'headline' | 'body' | 'bullets' | 'leftColumn' | 'rightColumn' | 'quote' | 'attribution' | 'speakerNotes'> = {
    layout: slide.layout as Slide['layout'],
    headline: slide.headline ?? '',
    body: slide.body ?? undefined,
    bullets: slide.bullets ?? undefined,
    leftColumn: slide.leftColumn ?? undefined,
    rightColumn: slide.rightColumn ?? undefined,
    quote: slide.quote ?? undefined,
    attribution: slide.attribution ?? undefined,
    speakerNotes: slide.speakerNotes ?? undefined,
  }

  // AI rewrite with retry
  let rewritten: Record<string, unknown>
  try {
    const slideForPrompt = slideContent as Slide
    const result = await generateText({
      model: google(GEMINI_MODEL),
      system: REWRITE_SYSTEM,
      prompt: rewriteUserPrompt(slideForPrompt, parsed.data.instruction),
      maxOutputTokens: 800,
    })

    try {
      rewritten = parseJSON(result.text) as Record<string, unknown>
    } catch {
      const retry = await generateText({
        model: google(GEMINI_MODEL),
        system: REWRITE_SYSTEM,
        prompt: `Return ONLY raw JSON. No markdown.\n${rewriteUserPrompt(slideForPrompt, parsed.data.instruction)}`,
        maxOutputTokens: 800,
      })
      rewritten = parseJSON(retry.text) as Record<string, unknown>
    }
  } catch {
    return NextResponse.json(
      { error: 'AI rewrite failed' },
      { status: 500 },
    )
  }

  // Validate AI response with Zod (prevent invalid/oversized content)
  const validated = rewriteResponseSchema.safeParse(rewritten)
  if (!validated.success) {
    return NextResponse.json(
      { error: 'AI returned invalid content' },
      { status: 500 },
    )
  }

  // Merge with original: use AI values where present, fall back to original
  return NextResponse.json({
    headline: validated.data.headline ?? slideContent.headline,
    body: validated.data.body ?? slideContent.body,
    bullets: validated.data.bullets ?? slideContent.bullets,
    leftColumn: validated.data.leftColumn ?? slideContent.leftColumn,
    rightColumn: validated.data.rightColumn ?? slideContent.rightColumn,
    quote: validated.data.quote ?? slideContent.quote,
    attribution: validated.data.attribution ?? slideContent.attribution,
    speakerNotes: validated.data.speakerNotes ?? slideContent.speakerNotes,
  })
}
