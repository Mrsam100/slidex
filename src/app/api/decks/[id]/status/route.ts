import { NextResponse } from 'next/server'
import { and, eq, isNull, lt } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks } from '@/db/schema'

export const dynamic = 'force-dynamic'

/** Max time a deck can stay in 'generating' before auto-recovery (5 minutes) */
const GENERATION_TIMEOUT_MS = 5 * 60 * 1000

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
      updatedAt: decks.updatedAt,
    })
    .from(decks)
    .where(and(eq(decks.id, id), isNull(decks.deletedAt)))
    .limit(1)

  if (!deck || deck.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Auto-recover stuck 'generating' decks (server crashed, timeout, etc.)
  if (deck.status === 'generating') {
    const elapsed = Date.now() - deck.updatedAt.getTime()
    if (elapsed > GENERATION_TIMEOUT_MS) {
      const newStatus = deck.slideCount > 0 ? 'done' : 'error'
      await db
        .update(decks)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(
          and(
            eq(decks.id, id),
            eq(decks.status, 'generating'),
            lt(decks.updatedAt, new Date(Date.now() - GENERATION_TIMEOUT_MS)),
          ),
        )
      return NextResponse.json({
        status: newStatus,
        slideCount: deck.slideCount,
      })
    }
  }

  return NextResponse.json({
    status: deck.status,
    slideCount: deck.slideCount,
  })
}
