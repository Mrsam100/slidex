import { NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  slideIds: z.array(z.string().min(1)).min(1).max(50),
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
    .select({ userId: decks.userId })
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

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { slideIds } = parsed.data

  // Update each slide's position based on its index in the array
  for (let i = 0; i < slideIds.length; i++) {
    await db
      .update(slides)
      .set({ position: i + 1 })
      .where(and(eq(slides.id, slideIds[i]!), eq(slides.deckId, id)))
  }

  return NextResponse.json({ success: true })
}
