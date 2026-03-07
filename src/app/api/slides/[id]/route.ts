import { NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  swapWithPosition: z.number().int().min(1).optional(),
  layout: z.enum(['title', 'bullets', 'two-column', 'quote', 'image-text', 'chart']).optional(),
  headline: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  bullets: z.array(z.string().max(500)).max(10).optional(),
  leftColumn: z.array(z.string().max(500)).max(10).optional(),
  rightColumn: z.array(z.string().max(500)).max(10).optional(),
  quote: z.string().max(1000).optional(),
  attribution: z.string().max(200).optional(),
  speakerNotes: z.string().max(2000).optional(),
  imageUrl: z.union([
    z.string().max(2000).url().refine(
      (url) => url.startsWith('https://'),
      { message: 'Only HTTPS URLs are allowed' },
    ),
    z.literal(''),
  ]).optional(),
  chartData: z.object({
    type: z.enum(['bar', 'horizontal-bar', 'pie', 'donut', 'line', 'area']),
    labels: z.array(z.string().max(100)).max(20),
    datasets: z.array(z.object({
      label: z.string().max(100),
      values: z.array(z.number()).max(20),
      color: z.string().max(20).optional(),
    })).max(5),
    showLegend: z.boolean().optional(),
    showValues: z.boolean().optional(),
    unit: z.string().max(10).optional(),
  }).optional(),
})

/** PATCH /api/slides/[id] — update slide content */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let reqBody: unknown
  try {
    reqBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(reqBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  // Verify ownership via JOIN
  const [slide] = await db
    .select({ id: slides.id, deckId: slides.deckId, position: slides.position })
    .from(slides)
    .innerJoin(decks, eq(slides.deckId, decks.id))
    .where(
      and(
        eq(slides.id, id),
        eq(decks.userId, session.user.id),
        isNull(decks.deletedAt),
      ),
    )
    .limit(1)

  if (!slide) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const d = parsed.data

  // Handle position swap (move up/down)
  if (d.swapWithPosition !== undefined) {
    const [target] = await db
      .select({ id: slides.id, position: slides.position })
      .from(slides)
      .where(and(eq(slides.deckId, slide.deckId), eq(slides.position, d.swapWithPosition)))
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: 'Target slide not found' }, { status: 404 })
    }

    // Swap positions using a temp value to avoid unique constraint
    await db.update(slides).set({ position: -1 }).where(eq(slides.id, slide.id))
    await db.update(slides).set({ position: slide.position }).where(eq(slides.id, target.id))
    await db.update(slides).set({ position: target.position }).where(eq(slides.id, slide.id))
    await db.update(decks).set({ updatedAt: new Date() }).where(eq(decks.id, slide.deckId))

    return NextResponse.json({ success: true })
  }

  // Build explicit content updates
  const updates: Partial<typeof slides.$inferInsert> = {
    ...(d.layout !== undefined && { layout: d.layout }),
    ...(d.headline !== undefined && { headline: d.headline }),
    ...(d.body !== undefined && { body: d.body }),
    ...(d.bullets !== undefined && { bullets: d.bullets }),
    ...(d.leftColumn !== undefined && { leftColumn: d.leftColumn }),
    ...(d.rightColumn !== undefined && { rightColumn: d.rightColumn }),
    ...(d.quote !== undefined && { quote: d.quote }),
    ...(d.attribution !== undefined && { attribution: d.attribution }),
    ...(d.speakerNotes !== undefined && { speakerNotes: d.speakerNotes }),
    ...(d.imageUrl !== undefined && { imageUrl: d.imageUrl }),
    ...(d.chartData !== undefined && { chartData: d.chartData }),
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Update slide + touch parent deck's updatedAt
  await db.update(slides).set(updates).where(eq(slides.id, id))
  await db
    .update(decks)
    .set({ updatedAt: new Date() })
    .where(eq(decks.id, slide.deckId))

  return NextResponse.json({ success: true })
}

/** DELETE /api/slides/[id] — delete a slide and re-number positions */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership via JOIN
  const [slide] = await db
    .select({ id: slides.id, deckId: slides.deckId, position: slides.position })
    .from(slides)
    .innerJoin(decks, eq(slides.deckId, decks.id))
    .where(
      and(
        eq(slides.id, id),
        eq(decks.userId, session.user.id),
        isNull(decks.deletedAt),
      ),
    )
    .limit(1)

  if (!slide) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete the slide
  await db.delete(slides).where(eq(slides.id, id))

  // Shift positions of subsequent slides down by 1
  await db
    .update(slides)
    .set({ position: sql`${slides.position} - 1` })
    .where(
      and(
        eq(slides.deckId, slide.deckId),
        gt(slides.position, slide.position),
      ),
    )

  // Update deck slideCount
  await db
    .update(decks)
    .set({
      slideCount: sql`${decks.slideCount} - 1`,
      updatedAt: new Date(),
    })
    .where(eq(decks.id, slide.deckId))

  return NextResponse.json({ success: true })
}
