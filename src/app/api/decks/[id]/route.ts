import { NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq, isNull, isNotNull, ne } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks } from '@/db/schema'
import { THEMES } from '@/lib/themes'

export const dynamic = 'force-dynamic'

const VALID_THEME_IDS = THEMES.map((t) => t.id) as [string, ...string[]]

const patchSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  theme: z.enum(VALID_THEME_IDS).optional(),
  isPublic: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  restore: z.literal(true).optional(),
}).refine(
  (d) =>
    d.title !== undefined ||
    d.theme !== undefined ||
    d.isPublic !== undefined ||
    d.isFavorite !== undefined ||
    d.restore !== undefined,
  { message: 'At least one field required' },
).refine(
  (d) =>
    !d.restore ||
    (d.title === undefined && d.theme === undefined && d.isPublic === undefined && d.isFavorite === undefined),
  { message: 'restore cannot be combined with other updates' },
)

/** PATCH /api/decks/[id] — update deck (rename / change theme) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  // Build explicit updates
  const updates: Partial<typeof decks.$inferInsert> = { updatedAt: new Date() }
  if (parsed.data.title !== undefined) updates.title = parsed.data.title
  if (parsed.data.theme !== undefined) updates.theme = parsed.data.theme
  if (parsed.data.isPublic !== undefined) updates.isPublic = parsed.data.isPublic
  if (parsed.data.isFavorite !== undefined) updates.isFavorite = parsed.data.isFavorite
  if (parsed.data.restore) updates.deletedAt = null

  // For restore: match trashed decks; otherwise match non-deleted
  const deletedFilter = parsed.data.restore
    ? isNotNull(decks.deletedAt)
    : isNull(decks.deletedAt)

  const result = await db
    .update(decks)
    .set(updates)
    .where(
      and(
        eq(decks.id, id),
        eq(decks.userId, session.user.id),
        deletedFilter,
      ),
    )
    .returning({ id: decks.id })

  if (result.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

/** DELETE /api/decks/[id] — soft delete */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Atomic soft-delete: skip generating decks in the WHERE clause
  const now = new Date()
  const result = await db
    .update(decks)
    .set({ deletedAt: now, updatedAt: now })
    .where(
      and(
        eq(decks.id, id),
        eq(decks.userId, session.user.id),
        isNull(decks.deletedAt),
        ne(decks.status, 'generating'),
      ),
    )
    .returning({ id: decks.id })

  if (result.length === 0) {
    // Distinguish 404 from 409
    const [existing] = await db
      .select({ status: decks.status })
      .from(decks)
      .where(
        and(
          eq(decks.id, id),
          eq(decks.userId, session.user.id),
          isNull(decks.deletedAt),
        ),
      )
      .limit(1)

    if (existing?.status === 'generating') {
      return NextResponse.json(
        { error: 'Cannot delete while generating' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
