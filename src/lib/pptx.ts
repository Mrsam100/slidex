import type { Slide, Theme } from '@/types/deck'
import type PptxGenJS from 'pptxgenjs'

type PptSlide = PptxGenJS.Slide
type TextProps = PptxGenJS.TextPropsOptions

/**
 * Export slides to PPTX using pptxgenjs.
 * Dynamically imports the library so it's only loaded when needed.
 */
export async function exportDeckToPPTX(
  slides: Slide[],
  theme: Theme,
  deckTitle: string,
  onProgress: (current: number, total: number) => void,
): Promise<void> {
  const PptxGenJSLib = (await import('pptxgenjs')).default

  const pptx = new PptxGenJSLib()
  pptx.author = 'SlideX AI'
  pptx.company = 'SlideX'
  pptx.title = deckTitle
  pptx.layout = 'LAYOUT_WIDE'

  // Strip # from hex colors
  const c = (hex: string) => hex.replace('#', '')

  // Font mapping (DM Sans may not be installed, fallback to Calibri)
  const fontFace = theme.fontFamily.includes('Georgia') ? 'Georgia' : 'Calibri'

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    if (!slide) continue

    const pptSlide = pptx.addSlide()

    // Background
    pptSlide.background = { color: c(theme.bgColor) }

    // For gradient themes, overlay a semi-transparent accent shape
    if (theme.bgGradient) {
      pptSlide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: c(theme.accentColor), transparency: 80 },
      })
    }

    // Slide number (bottom-right, subtle)
    pptSlide.addText(`${slide.position}`, {
      x: 12.2, y: 6.9, w: 0.8, h: 0.4,
      fontSize: 9, color: c(theme.textColor), align: 'right',
      fontFace, transparency: 70,
    })

    // Render layout
    switch (slide.layout) {
      case 'title':
        renderTitle(pptSlide, slide, theme, fontFace, c)
        break
      case 'bullets':
        renderBullets(pptSlide, slide, theme, fontFace, c)
        break
      case 'two-column':
        renderTwoColumn(pptSlide, slide, theme, fontFace, c)
        break
      case 'quote':
        renderQuote(pptSlide, slide, theme, fontFace, c)
        break
      case 'image-text':
        renderImageText(pptSlide, slide, theme, fontFace, c)
        break
      default:
        renderBullets(pptSlide, slide, theme, fontFace, c)
    }

    if (slide.speakerNotes) {
      pptSlide.addNotes(slide.speakerNotes)
    }

    onProgress(i + 1, slides.length)
  }

  const filename = deckTitle
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 100)

  await pptx.writeFile({ fileName: `${filename || 'slidex-deck'}.pptx` })
}

type ColorFn = (hex: string) => string

// ── Title Slide ──
function renderTitle(s: PptSlide, slide: Slide, t: Theme, ff: string, c: ColorFn) {
  // Accent line above headline
  s.addShape('rect', {
    x: 5.9, y: 2.2, w: 1.5, h: 0.06,
    fill: { color: c(t.accentColor) },
    rectRadius: 0.03,
  })

  // Headline
  s.addText(slide.headline, {
    x: 1.5, y: 2.5, w: 10.3, h: 1.8,
    fontSize: 40, fontFace: ff, bold: true,
    color: c(t.headlineColor), align: 'center', valign: 'middle',
  })

  // Body
  if (slide.body) {
    s.addText(slide.body, {
      x: 3, y: 4.5, w: 7.3, h: 1.2,
      fontSize: 18, fontFace: ff,
      color: c(t.textColor), align: 'center', valign: 'top',
      transparency: 35,
    })
  }

  // Bottom accent bar
  s.addShape('rect', {
    x: 5.2, y: 6.2, w: 3, h: 0.06,
    fill: { color: c(t.accentColor), transparency: 60 },
    rectRadius: 0.03,
  })
}

// ── Bullets Slide ──
function renderBullets(s: PptSlide, slide: Slide, t: Theme, ff: string, c: ColorFn) {
  const isFun = !!t.emojiSet

  // Accent sidebar stripe (skip for fun theme)
  if (!isFun) {
    s.addShape('rect', {
      x: 0.8, y: 1, w: 0.06, h: 5.5,
      fill: { color: c(t.accentColor), transparency: 80 },
      rectRadius: 0.03,
    })
  }

  // Headline
  s.addText(slide.headline, {
    x: 1.2, y: 0.6, w: 10.5, h: 1.2,
    fontSize: 32, fontFace: ff, bold: true,
    color: c(t.headlineColor),
  })

  // Bullets
  if (slide.bullets && slide.bullets.length > 0) {
    const rows: Array<{ text: string; options: TextProps }> = slide.bullets.map((b, idx) => ({
      text: isFun && t.emojiSet ? `${t.emojiSet[idx % t.emojiSet.length]}  ${b}` : b,
      options: {
        fontSize: 18, fontFace: ff, color: c(t.textColor),
        ...(isFun ? {} : { bullet: { type: 'bullet' as const, characterCode: '25A0', indent: 20 } }),
        paraSpaceAfter: 14,
      },
    }))

    s.addText(rows, {
      x: 1.2, y: 2.0, w: 10.5, h: 4.8, valign: 'top',
    })
  }
}

// ── Two-Column Slide ──
function renderTwoColumn(s: PptSlide, slide: Slide, t: Theme, ff: string, c: ColorFn) {
  const isFun = !!t.emojiSet
  // Headline
  s.addText(slide.headline, {
    x: 1, y: 0.6, w: 11.3, h: 1.2,
    fontSize: 32, fontFace: ff, bold: true,
    color: c(t.headlineColor),
  })

  // Column divider
  s.addShape('rect', {
    x: 6.55, y: 2.2, w: 0.02, h: 4,
    fill: { color: c(t.accentColor), transparency: 85 },
  })

  // Left column
  if (slide.leftColumn && slide.leftColumn.length > 0) {
    const rows: Array<{ text: string; options: TextProps }> = slide.leftColumn.map((item, idx) => ({
      text: isFun && t.emojiSet ? `${t.emojiSet[idx % t.emojiSet.length]}  ${item}` : item,
      options: {
        fontSize: 16, fontFace: ff, color: c(t.textColor),
        ...(isFun ? {} : { bullet: { type: 'bullet' as const, characterCode: '25A0', indent: 18 } }),
        paraSpaceAfter: 12,
      },
    }))

    s.addText(rows, {
      x: 1, y: 2.2, w: 5.3, h: 4.5, valign: 'top',
    })
  }

  // Right column
  if (slide.rightColumn && slide.rightColumn.length > 0) {
    const rows: Array<{ text: string; options: TextProps }> = slide.rightColumn.map((item, idx) => ({
      text: isFun && t.emojiSet ? `${t.emojiSet[(idx + 5) % t.emojiSet.length]}  ${item}` : item,
      options: {
        fontSize: 16, fontFace: ff, color: c(t.textColor),
        ...(isFun ? {} : { bullet: { type: 'bullet' as const, characterCode: '25A0', indent: 18 } }),
        paraSpaceAfter: 12,
      },
    }))

    s.addText(rows, {
      x: 7, y: 2.2, w: 5.3, h: 4.5, valign: 'top',
    })
  }
}

// ── Quote Slide ──
function renderQuote(s: PptSlide, slide: Slide, t: Theme, ff: string, c: ColorFn) {
  // Large decorative quote mark
  s.addText('\u201C', {
    x: 5, y: 0.8, w: 3.3, h: 2,
    fontSize: 120, fontFace: 'Georgia',
    color: c(t.accentColor), transparency: 85, align: 'center',
  })

  // Quote text
  if (slide.quote) {
    s.addText(slide.quote, {
      x: 2, y: 2.5, w: 9.3, h: 2.5,
      fontSize: 24, fontFace: ff, italic: true,
      color: c(t.headlineColor), align: 'center', valign: 'middle',
    })
  }

  // Attribution
  if (slide.attribution) {
    // Decorative line
    s.addShape('rect', {
      x: 5.7, y: 5.3, w: 2, h: 0.02,
      fill: { color: c(t.accentColor), transparency: 60 },
    })

    s.addText(slide.attribution.toUpperCase(), {
      x: 3, y: 5.5, w: 7.3, h: 0.6,
      fontSize: 12, fontFace: ff, bold: true,
      color: c(t.textColor), transparency: 40,
      align: 'center', charSpacing: 3,
    })
  }
}

// ── Image + Text Slide ──
function renderImageText(s: PptSlide, slide: Slide, t: Theme, ff: string, c: ColorFn) {
  const isFun = !!t.emojiSet
  // Left side: text (55%)
  s.addText(slide.headline, {
    x: 1, y: 1, w: 6.3, h: 1.2,
    fontSize: 32, fontFace: ff, bold: true,
    color: c(t.headlineColor),
  })

  if (slide.body) {
    s.addText(slide.body, {
      x: 1, y: 2.4, w: 6.3, h: 1.2,
      fontSize: 16, fontFace: ff,
      color: c(t.textColor), transparency: 30,
    })
  }

  if (slide.bullets && slide.bullets.length > 0) {
    const rows: Array<{ text: string; options: TextProps }> = slide.bullets.map((b, idx) => ({
      text: isFun && t.emojiSet ? `${t.emojiSet[(idx + 2) % t.emojiSet.length]}  ${b}` : b,
      options: {
        fontSize: 16, fontFace: ff, color: c(t.textColor),
        ...(isFun ? {} : { bullet: { type: 'bullet' as const, characterCode: '25A0', indent: 18 } }),
        paraSpaceAfter: 10,
      },
    }))

    s.addText(rows, {
      x: 1, y: slide.body ? 3.8 : 2.6, w: 6.3, h: 3, valign: 'top',
    })
  }

  // Right side: image or accent placeholder (45%)
  if (slide.imageUrl) {
    try {
      s.addImage({
        path: slide.imageUrl,
        x: 7.6, y: 0, w: 5.73, h: 7.5,
        sizing: { type: 'cover', w: 5.73, h: 7.5 },
      })
    } catch {
      addPlaceholder(s, t, c)
    }
  } else {
    addPlaceholder(s, t, c)
  }
}

function addPlaceholder(s: PptSlide, t: Theme, c: ColorFn) {
  s.addShape('rect', {
    x: 7.6, y: 0, w: 5.73, h: 7.5,
    fill: { color: c(t.accentColor), transparency: 92 },
  })
  // Subtle diagonal lines
  for (let j = 0; j < 10; j++) {
    s.addShape('rect', {
      x: 7.6 + j * 0.6, y: j * 0.75, w: 0.02, h: 1.5,
      fill: { color: c(t.accentColor), transparency: 96 },
      rotate: 45,
    })
  }
}
