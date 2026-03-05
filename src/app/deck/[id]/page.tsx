import { notFound } from 'next/navigation'
import { and, asc, eq, isNull } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'
import { THEMES } from '@/lib/themes'
import DeckViewerClient from '@/components/dashboard/DeckViewerClient'
import type { Slide } from '@/types/deck'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await auth()
  if (!session?.user?.id) return { title: 'Deck — SlideX' }

  const { id } = await params
  const [deck] = await db
    .select({ title: decks.title, userId: decks.userId })
    .from(decks)
    .where(and(eq(decks.id, id), isNull(decks.deletedAt)))
    .limit(1)

  if (!deck || deck.userId !== session.user.id) return { title: 'Deck — SlideX' }

  return { title: `${deck.title} — SlideX` }
}

export default async function DeckPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const { id } = await params

  const [deck] = await db
    .select({
      id: decks.id,
      title: decks.title,
      theme: decks.theme,
      isPublic: decks.isPublic,
      userId: decks.userId,
      status: decks.status,
    })
    .from(decks)
    .where(and(eq(decks.id, id), isNull(decks.deletedAt)))
    .limit(1)

  if (!deck || deck.userId !== session.user.id) notFound()

  const slideRows = await db
    .select()
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position))

  const foundTheme = THEMES.find((t) => t.id === deck.theme) ?? THEMES[0]
  if (!foundTheme) notFound()
  const theme = foundTheme

  // Map DB rows to Slide type
  const slideData: Slide[] = slideRows.map((row) => ({
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
    createdAt: row.createdAt,
  }))

  // Allow empty slides for generating decks — editor will poll for new slides
  if (slideData.length === 0 && deck.status !== 'generating') notFound()

  return (
    <DeckViewerClient
      deck={{ id: deck.id, title: deck.title, theme: deck.theme ?? 'minimal', isPublic: deck.isPublic, status: deck.status }}
      slides={slideData}
      theme={theme}
    />
  )
}
