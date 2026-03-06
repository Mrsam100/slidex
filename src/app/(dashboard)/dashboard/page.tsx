import { redirect } from 'next/navigation'
import { and, desc, eq, inArray, isNull, isNotNull } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Slide } from '@/types/deck'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Decks — SlideX',
}

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  const params = await searchParams
  const isTrash = params.filter === 'trash'

  // Fetch decks: non-deleted (normal) or deleted (trash)
  const userDecks = await db
    .select({
      id: decks.id,
      title: decks.title,
      status: decks.status,
      slideCount: decks.slideCount,
      theme: decks.theme,
      isFavorite: decks.isFavorite,
      createdAt: decks.createdAt,
    })
    .from(decks)
    .where(
      and(
        eq(decks.userId, session.user.id),
        isTrash ? isNotNull(decks.deletedAt) : isNull(decks.deletedAt),
      ),
    )
    .orderBy(desc(decks.createdAt))
    .limit(100)

  // Fetch first slide for each deck (for thumbnails) — scoped to user's decks only
  const deckIds = userDecks.map((d) => d.id)
  const firstSlides = new Map<string, Slide>()

  if (deckIds.length > 0) {
    const slideRows = await db
      .select()
      .from(slides)
      .where(and(eq(slides.position, 1), inArray(slides.deckId, deckIds)))

    for (const row of slideRows) {
      firstSlides.set(row.deckId, {
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
        createdAt: row.createdAt.toISOString() as unknown as Date,
      })
    }
  }

  const deckData = userDecks.map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    slideCount: d.slideCount,
    theme: d.theme,
    isFavorite: d.isFavorite,
    createdAt: d.createdAt.toISOString(),
    firstSlide: firstSlides.get(d.id) ?? null,
  }))

  return <DashboardClient decks={deckData} isTrash={isTrash} />
}
