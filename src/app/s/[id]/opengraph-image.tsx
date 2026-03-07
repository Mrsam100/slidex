import { ImageResponse } from 'next/og'
import { and, asc, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { decks, slides } from '@/db/schema'
import { THEMES } from '@/lib/themes'

export const runtime = 'edge'
export const alt = 'SlideX Presentation'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [deck] = await db
    .select({
      id: decks.id,
      title: decks.title,
      theme: decks.theme,
      isPublic: decks.isPublic,
      slideCount: decks.slideCount,
    })
    .from(decks)
    .where(and(eq(decks.id, id), isNull(decks.deletedAt)))
    .limit(1)

  if (!deck || !deck.isPublic) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0A0A',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontSize: 48,
          }}
        >
          SlideX
        </div>
      ),
      { ...size },
    )
  }

  // Get first slide for preview
  const [firstSlide] = await db
    .select({
      headline: slides.headline,
      body: slides.body,
      layout: slides.layout,
    })
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position))
    .limit(1)

  const theme = THEMES.find((t) => t.id === deck.theme) ?? THEMES[0]!
  const headline = firstSlide?.headline || deck.title
  const subtitle = firstSlide?.body || `${deck.slideCount} slides`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.bgColor,
          color: theme.textColor,
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent bar at top */}
        <div
          style={{
            width: '100%',
            height: 6,
            backgroundColor: theme.accentColor,
          }}
        />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 80px',
            textAlign: 'center',
          }}
        >
          {/* Accent dot */}
          <div
            style={{
              width: 48,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.accentColor,
              marginBottom: 32,
            }}
          />

          <h1
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: theme.headlineColor,
              lineHeight: 1.2,
              maxWidth: 900,
              margin: 0,
            }}
          >
            {headline.length > 80 ? headline.slice(0, 80) + '...' : headline}
          </h1>

          {subtitle && (
            <p
              style={{
                fontSize: 24,
                color: theme.textColor,
                opacity: 0.65,
                marginTop: 20,
                maxWidth: 700,
              }}
            >
              {subtitle.length > 120 ? subtitle.slice(0, 120) + '...' : subtitle}
            </p>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 40px',
            borderTop: `1px solid ${theme.accentColor}20`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0047E0' }}>
              SlideX
            </span>
          </div>
          <span style={{ fontSize: 14, color: theme.textColor, opacity: 0.4 }}>
            {deck.slideCount} slides
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
