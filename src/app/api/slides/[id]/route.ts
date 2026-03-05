import { NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  headline: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  bullets: z.array(z.string().max(500)).max(10).optional(),
  leftColumn: z.array(z.string().max(500)).max(10).optional(),
  rightColumn: z.array(z.string().max(500)).max(10).optional(),
  quote: z.string().max(1000).optional(),
  attribution: z.string().max(200).optional(),
  speakerNotes: z.string().max(2000).optional(),
  imageUrl: z.string().max(2000).optional(),
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

  // Build explicit updates (no dynamic key mapping)
  const d = parsed.data
  const updates: Partial<typeof slides.$inferInsert> = {
    ...(d.headline !== undefined && { headline: d.headline }),
    ...(d.body !== undefined && { body: d.body }),
    ...(d.bullets !== undefined && { bullets: d.bullets }),
    ...(d.leftColumn !== undefined && { leftColumn: d.leftColumn }),
    ...(d.rightColumn !== undefined && { rightColumn: d.rightColumn }),
    ...(d.quote !== undefined && { quote: d.quote }),
    ...(d.attribution !== undefined && { attribution: d.attribution }),
    ...(d.speakerNotes !== undefined && { speakerNotes: d.speakerNotes }),
    ...(d.imageUrl !== undefined && { imageUrl: d.imageUrl }),
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Verify ownership via JOIN + update in single query scope
  const [slide] = await db
    .select({ id: slides.id, deckId: slides.deckId })
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

  // Update slide + touch parent deck's updatedAt
  await db.update(slides).set(updates).where(eq(slides.id, id))
  await db
    .update(decks)
    .set({ updatedAt: new Date() })
    .where(eq(decks.id, slide.deckId))

  return NextResponse.json({ success: true })
}
