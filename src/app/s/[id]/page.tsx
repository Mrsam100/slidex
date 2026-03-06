import { cache } from 'react'
import { notFound } from 'next/navigation'
import { and, asc, eq, isNull } from 'drizzle-orm'
import Link from 'next/link'

import { db } from '@/db'
import { decks, slides } from '@/db/schema'
import { THEMES } from '@/lib/themes'
import PublicDeckViewer from './PublicDeckViewer'
import type { Slide } from '@/types/deck'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

/** Deduplicated deck query shared between generateMetadata and page */
const getDeck = cache(async (id: string) => {
  const [deck] = await db
    .select({
      id: decks.id,
      title: decks.title,
      theme: decks.theme,
      isPublic: decks.isPublic,
      status: decks.status,
    })
    .from(decks)
    .where(and(eq(decks.id, id), isNull(decks.deletedAt)))
    .limit(1)
  return deck
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const deck = await getDeck(id)

  if (!deck || !deck.isPublic) return { title: 'SlideX' }

  return {
    title: `${deck.title} — SlideX`,
    openGraph: {
      title: `${deck.title} — SlideX`,
      description: 'A presentation made with SlideX AI',
    },
  }
}

export default async function SharedDeckPage({ params }: Props) {
  const { id } = await params
  const deck = await getDeck(id)

  // Show private message if deck doesn't exist, isn't public, or still generating
  if (!deck || !deck.isPublic || deck.status !== 'done') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">This deck is private</h1>
          <p className="mt-2 text-white/50">
            The owner has not shared this presentation publicly.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
          >
            Create your own deck
          </Link>
        </div>
      </div>
    )
  }

  const slideRows = await db
    .select()
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position))

  const foundTheme = THEMES.find((t) => t.id === deck.theme) ?? THEMES[0]
  if (!foundTheme) notFound()
  const theme = foundTheme

  // Strip speakerNotes and imagePrompt — private author data, not for public viewers
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
    imageUrl: row.imageUrl ?? undefined,
    createdAt: row.createdAt,
  }))

  if (slideData.length === 0) notFound()

  return (
    <PublicDeckViewer
      title={deck.title}
      slides={slideData}
      theme={theme}
    />
  )
}
