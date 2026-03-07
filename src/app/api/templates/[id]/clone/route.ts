import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { decks, slides } from '@/db/schema'
import { getTemplate } from '@/lib/templates'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const template = getTemplate(id)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Create deck from template
  const [deck] = await db
    .insert(decks)
    .values({
      userId: session.user.id,
      title: template.name,
      topic: template.name,
      slideCount: template.slideCount,
      theme: template.theme,
      status: 'done',
    })
    .returning({ id: decks.id })

  if (!deck) {
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 })
  }

  // Insert all template slides
  await db.insert(slides).values(
    template.slides.map((ts) => ({
      deckId: deck.id,
      position: ts.position,
      layout: ts.layout,
      headline: ts.headline,
      body: ts.body ?? null,
      bullets: ts.bullets ?? null,
      leftColumn: ts.leftColumn ?? null,
      rightColumn: ts.rightColumn ?? null,
      quote: ts.quote ?? null,
      attribution: ts.attribution ?? null,
      speakerNotes: ts.speakerNotes ?? null,
      bgImageUrl: ts.bgImageUrl ?? null,
      sectionTag: ts.sectionTag ?? null,
    })),
  )

  return NextResponse.json({ deckId: deck.id })
}
