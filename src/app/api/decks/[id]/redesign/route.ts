import { NextResponse } from 'next/server'
import { and, eq, isNull, asc } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'
import { THEMES } from '@/lib/themes'
import type { SlideLayout } from '@/types/deck'

export const dynamic = 'force-dynamic'

const CONTENT_LAYOUTS: SlideLayout[] = ['bullets', 'two-column', 'quote', 'image-text', 'chart']

/** POST /api/decks/[id]/redesign — one-click redesign: new theme + shuffled layouts */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify deck exists and belongs to user
  const [deck] = await db
    .select({ id: decks.id, theme: decks.theme, status: decks.status })
    .from(decks)
    .where(
      and(
        eq(decks.id, id),
        eq(decks.userId, session.user.id),
        isNull(decks.deletedAt),
      ),
    )
    .limit(1)

  if (!deck) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (deck.status === 'generating') {
    return NextResponse.json({ error: 'Cannot redesign while generating' }, { status: 409 })
  }

  // Pick a different theme
  const otherThemes = THEMES.filter((t) => t.id !== deck.theme)
  const newTheme = otherThemes[Math.floor(Math.random() * otherThemes.length)]!

  // Get all slides
  const allSlides = await db
    .select({ id: slides.id, position: slides.position, layout: slides.layout })
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position))

  // Reassign layouts: keep first and last as 'title', shuffle the middle
  const updates: { slideId: string; layout: SlideLayout }[] = []
  for (let i = 0; i < allSlides.length; i++) {
    const slide = allSlides[i]!
    if (i === 0 || i === allSlides.length - 1) {
      // Keep title slides as title
      if (slide.layout !== 'title') {
        updates.push({ slideId: slide.id, layout: 'title' })
      }
    } else {
      // Pick a random content layout different from current
      const available = CONTENT_LAYOUTS.filter((l) => l !== slide.layout)
      // Also avoid repeating the previous slide's new layout
      const prevLayout = updates.length > 0 ? updates[updates.length - 1]!.layout : allSlides[i - 1]?.layout
      const preferred = available.filter((l) => l !== prevLayout)
      const pool = preferred.length > 0 ? preferred : available
      const newLayout = pool[Math.floor(Math.random() * pool.length)]!
      updates.push({ slideId: slide.id, layout: newLayout })
    }
  }

  // Apply updates in parallel
  await Promise.all([
    // Update theme
    db.update(decks).set({ theme: newTheme.id, updatedAt: new Date() }).where(eq(decks.id, id)),
    // Update each slide layout
    ...updates.map((u) =>
      db.update(slides).set({ layout: u.layout }).where(eq(slides.id, u.slideId)),
    ),
  ])

  // Return updated state
  const updatedSlides = await db
    .select()
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position))

  return NextResponse.json({
    success: true,
    theme: newTheme.id,
    slides: updatedSlides,
  })
}
