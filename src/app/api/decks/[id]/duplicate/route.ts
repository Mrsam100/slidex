import { NextResponse } from 'next/server'
import { and, asc, eq, gte, isNull, sql } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides, users } from '@/db/schema'

export const dynamic = 'force-dynamic'

const MAX_TITLE = 200
const COPY_SUFFIX = ' (copy)'

/** POST /api/decks/[id]/duplicate — copy deck + all slides */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Fetch original deck
  const [deck] = await db
    .select({
      title: decks.title,
      topic: decks.topic,
      theme: decks.theme,
      status: decks.status,
      userId: decks.userId,
    })
    .from(decks)
    .where(and(eq(decks.id, id), isNull(decks.deletedAt)))
    .limit(1)

  if (!deck || deck.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (deck.status !== 'done') {
    return NextResponse.json(
      { error: 'Can only duplicate completed decks' },
      { status: 409 },
    )
  }

  // Free tier limit: max 5 decks per month
  const [user] = await db
    .select({ subscriptionStatus: users.subscriptionStatus })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user || user.subscriptionStatus === 'free') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [deckCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(decks)
      .where(
        and(
          eq(decks.userId, session.user.id),
          isNull(decks.deletedAt),
          gte(decks.createdAt, startOfMonth),
        ),
      )

    if (deckCount && deckCount.count >= 5) {
      return NextResponse.json(
        { error: 'limit_reached' },
        { status: 403 },
      )
    }
  }

  // Fetch slides before transaction
  const originalSlides = await db
    .select({
      position: slides.position,
      layout: slides.layout,
      headline: slides.headline,
      body: slides.body,
      bullets: slides.bullets,
      leftColumn: slides.leftColumn,
      rightColumn: slides.rightColumn,
      quote: slides.quote,
      attribution: slides.attribution,
      speakerNotes: slides.speakerNotes,
      imagePrompt: slides.imagePrompt,
      imageUrl: slides.imageUrl,
    })
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position))

  // Truncate title to stay within max length
  const copyTitle =
    deck.title.length + COPY_SUFFIX.length > MAX_TITLE
      ? deck.title.slice(0, MAX_TITLE - COPY_SUFFIX.length) + COPY_SUFFIX
      : deck.title + COPY_SUFFIX

  // Transaction: create deck + copy slides atomically
  const newDeckId = await db.transaction(async (tx) => {
    const [newDeck] = await tx
      .insert(decks)
      .values({
        userId: session.user.id,
        title: copyTitle,
        topic: deck.topic,
        slideCount: originalSlides.length,
        theme: deck.theme,
        status: 'done',
      })
      .returning({ id: decks.id })

    if (!newDeck) throw new Error('Failed to create deck')

    if (originalSlides.length > 0) {
      await tx.insert(slides).values(
        originalSlides.map((s) => ({
          deckId: newDeck.id,
          position: s.position,
          layout: s.layout,
          headline: s.headline,
          body: s.body,
          bullets: s.bullets,
          leftColumn: s.leftColumn,
          rightColumn: s.rightColumn,
          quote: s.quote,
          attribution: s.attribution,
          speakerNotes: s.speakerNotes,
          imagePrompt: s.imagePrompt,
          imageUrl: s.imageUrl,
        })),
      )
    }

    return newDeck.id
  })

  return NextResponse.json({ success: true, deckId: newDeckId })
}
