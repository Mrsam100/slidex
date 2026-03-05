import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { users, decks } from '@/db/schema'

export const dynamic = 'force-dynamic'

/** DELETE /api/users/me — delete account and all associated data.
 *  Cascade on users.id handles: accounts, sessions, decks, slides. */
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Block deletion if any decks are actively generating (prevents orphaned AI work)
  const [generating] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.userId, userId), eq(decks.status, 'generating')))
    .limit(1)

  if (generating) {
    return NextResponse.json(
      { error: 'Cannot delete account while slides are being generated. Please wait and try again.' },
      { status: 409 },
    )
  }

  // Delete user row — cascade deletes accounts, sessions, decks, and slides
  await db.delete(users).where(eq(users.id, userId))

  return NextResponse.json({ success: true })
}
