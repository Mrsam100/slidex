import { NextResponse } from 'next/server'
import { and, eq, isNotNull } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks } from '@/db/schema'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/decks/[id]/permanent — permanently delete a trashed deck.
 * Intentional exception to Rule 19 (soft-delete only): this is the "empty trash"
 * action for already-soft-deleted decks. Requires { confirm: true } in body.
 * Cascade on FK deletes associated slides atomically at the DB level.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Require explicit confirmation in request body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || (body as Record<string, unknown>).confirm !== true) {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 })
  }

  const { id } = await params

  // Only allow permanent deletion of already-trashed decks
  const result = await db
    .delete(decks)
    .where(
      and(
        eq(decks.id, id),
        eq(decks.userId, session.user.id),
        isNotNull(decks.deletedAt),
      ),
    )
    .returning({ id: decks.id })

  if (result.length === 0) {
    return NextResponse.json({ error: 'Not found or not in trash' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
