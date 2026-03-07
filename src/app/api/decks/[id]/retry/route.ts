import { NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks } from '@/db/schema'

export const dynamic = 'force-dynamic'

/**
 * POST /api/decks/[id]/retry
 * Resets a deck from 'error' status back to 'draft' so the user can
 * re-trigger generation from the generate page, or marks it as 'done'
 * if slides already exist (partial generation recovery).
 */
export async function POST(
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
      userId: decks.userId,
      status: decks.status,
      slideCount: decks.slideCount,
    })
    .from(decks)
    .where(and(eq(decks.id, id), isNull(decks.deletedAt)))
    .limit(1)

  if (!deck || deck.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (deck.status !== 'error') {
    return NextResponse.json(
      { error: 'Deck is not in error state' },
      { status: 409 },
    )
  }

  // If slides were partially generated, mark as done so user can work with what exists
  // If no slides, reset to draft so user can re-generate from scratch
  const newStatus = deck.slideCount > 0 ? 'done' : 'draft'

  await db
    .update(decks)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(decks.id, id))

  return NextResponse.json({ success: true, status: newStatus })
}
