import { NextResponse } from 'next/server'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'
import type { Slide } from '@/types/deck'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [deck] = await db
    .select({
      status: decks.status,
      slideCount: decks.slideCount,
      userId: decks.userId,
    })
    .from(decks)
    .where(and(eq(decks.id, id), isNull(decks.deletedAt)))
    .limit(1)

  if (!deck || deck.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const slideRows = await db
    .select()
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position))

  const slideData: Slide[] = slideRows.map((row) => ({
    id: row.id,
    deckId: row.deckId,
    position: row.position,
    layout: row.layout as Slide['layout'],
    headline: row.headline ?? '',
    body: row.body ?? undefined,
    bullets: row.bullets ?? undefined,
    leftColumn: row.leftColumn ?? undefined,
    rightColumn: row.rightColumn ?? undefined,
    quote: row.quote ?? undefined,
    attribution: row.attribution ?? undefined,
    speakerNotes: row.speakerNotes ?? undefined,
    imagePrompt: row.imagePrompt ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    createdAt: row.createdAt,
  }))

  return NextResponse.json({
    slides: slideData,
    status: deck.status,
    slideCount: deck.slideCount,
  })
}

const postSchema = z.object({
  afterPosition: z.number().int().min(0),
  layout: z.enum(['title', 'bullets', 'two-column', 'quote', 'image-text']).default('bullets'),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [deck] = await db
    .select({ userId: decks.userId, slideCount: decks.slideCount })
    .from(decks)
    .where(and(eq(decks.id, id), isNull(decks.deletedAt)))
    .limit(1)

  if (!deck || deck.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { afterPosition, layout } = parsed.data

  // Validate afterPosition is within bounds
  if (afterPosition > (deck.slideCount ?? 0)) {
    return NextResponse.json({ error: 'afterPosition out of bounds' }, { status: 400 })
  }

  const newPosition = afterPosition + 1

  // Shift existing slides at or after the new position
  const existingSlides = await db
    .select({ id: slides.id, position: slides.position })
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position))

  const toShift = existingSlides.filter((s) => s.position >= newPosition)
  for (let i = toShift.length - 1; i >= 0; i--) {
    const slide = toShift[i]!
    await db
      .update(slides)
      .set({ position: slide.position + 1 })
      .where(eq(slides.id, slide.id))
  }

  const newSlideId = createId()
  const defaultContent: Record<string, unknown> = {
    headline: 'New Slide',
    layout,
  }
  if (layout === 'bullets') {
    defaultContent.bullets = ['First point', 'Second point', 'Third point']
  } else if (layout === 'two-column') {
    defaultContent.leftColumn = ['Left point']
    defaultContent.rightColumn = ['Right point']
  } else if (layout === 'quote') {
    defaultContent.quote = 'Your quote here'
    defaultContent.attribution = 'Author'
  } else if (layout === 'title') {
    defaultContent.body = 'Subtitle text'
  }

  await db.insert(slides).values({
    id: newSlideId,
    deckId: id,
    position: newPosition,
    layout,
    headline: defaultContent.headline as string,
    body: (defaultContent.body as string) ?? null,
    bullets: (defaultContent.bullets as string[]) ?? null,
    leftColumn: (defaultContent.leftColumn as string[]) ?? null,
    rightColumn: (defaultContent.rightColumn as string[]) ?? null,
    quote: (defaultContent.quote as string) ?? null,
    attribution: (defaultContent.attribution as string) ?? null,
  })

  // Update deck slide count
  await db
    .update(decks)
    .set({ slideCount: deck.slideCount + 1, updatedAt: new Date() })
    .where(eq(decks.id, id))

  const newSlide: Slide = {
    id: newSlideId,
    deckId: id,
    position: newPosition,
    layout: layout as Slide['layout'],
    headline: defaultContent.headline as string,
    body: (defaultContent.body as string) ?? undefined,
    bullets: (defaultContent.bullets as string[]) ?? undefined,
    leftColumn: (defaultContent.leftColumn as string[]) ?? undefined,
    rightColumn: (defaultContent.rightColumn as string[]) ?? undefined,
    quote: (defaultContent.quote as string) ?? undefined,
    attribution: (defaultContent.attribution as string) ?? undefined,
    createdAt: new Date(),
  }

  return NextResponse.json({ slide: newSlide })
}
