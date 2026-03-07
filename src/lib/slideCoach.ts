import type { Slide, SlideLayout } from '@/types/deck'

export type SuggestionSeverity = 'info' | 'warning' | 'error'
export type SuggestionScope = 'slide' | 'deck'

export interface CoachSuggestion {
  id: string
  scope: SuggestionScope
  severity: SuggestionSeverity
  message: string
  slideId?: string
  slidePosition?: number
}

/** Analyze a single slide and return suggestions */
function analyzeSlide(slide: Slide): CoachSuggestion[] {
  const suggestions: CoachSuggestion[] = []
  const pos = slide.position
  const ctx = { slideId: slide.id, slidePosition: pos, scope: 'slide' as const }

  // Headline checks
  if (!slide.headline || slide.headline.trim().length === 0) {
    suggestions.push({ ...ctx, id: `s${pos}-no-headline`, severity: 'error', message: 'Missing headline — every slide needs one' })
  } else {
    const words = slide.headline.trim().split(/\s+/).length
    if (words > 10) {
      suggestions.push({ ...ctx, id: `s${pos}-headline-long`, severity: 'warning', message: `Headline is ${words} words — aim for 8 or fewer` })
    }
  }

  // Bullet checks
  if (slide.layout === 'bullets' && slide.bullets) {
    if (slide.bullets.length > 6) {
      suggestions.push({ ...ctx, id: `s${pos}-too-many-bullets`, severity: 'warning', message: `${slide.bullets.length} bullets is a lot — consider splitting into two slides` })
    }
    for (let i = 0; i < slide.bullets.length; i++) {
      const b = slide.bullets[i]
      if (b && b.trim().split(/\s+/).length > 18) {
        suggestions.push({ ...ctx, id: `s${pos}-bullet-${i}-long`, severity: 'info', message: `Bullet ${i + 1} is long — keep bullets under 15 words` })
      }
    }
    if (slide.bullets.length < 2) {
      suggestions.push({ ...ctx, id: `s${pos}-few-bullets`, severity: 'info', message: 'Only 1 bullet — add more or switch to a title layout' })
    }
  }

  // Two-column balance
  if (slide.layout === 'two-column') {
    const left = slide.leftColumn?.length ?? 0
    const right = slide.rightColumn?.length ?? 0
    if (Math.abs(left - right) > 2) {
      suggestions.push({ ...ctx, id: `s${pos}-col-imbalance`, severity: 'info', message: 'Columns are unbalanced — try to match the item count' })
    }
    if (left === 0 || right === 0) {
      suggestions.push({ ...ctx, id: `s${pos}-col-empty`, severity: 'warning', message: 'One column is empty — add content or switch layout' })
    }
  }

  // Quote checks
  if (slide.layout === 'quote') {
    if (!slide.quote || slide.quote.trim().length < 10) {
      suggestions.push({ ...ctx, id: `s${pos}-no-quote`, severity: 'warning', message: 'Quote is too short or missing' })
    }
    if (!slide.attribution || slide.attribution.trim().length === 0) {
      suggestions.push({ ...ctx, id: `s${pos}-no-attr`, severity: 'info', message: 'Add an attribution for the quote' })
    }
  }

  // Image-text checks
  if (slide.layout === 'image-text' && !slide.imageUrl) {
    suggestions.push({ ...ctx, id: `s${pos}-no-image`, severity: 'info', message: 'No image set — upload one for visual impact' })
  }

  // Chart checks
  if (slide.layout === 'chart') {
    if (!slide.chartData) {
      suggestions.push({ ...ctx, id: `s${pos}-no-chart`, severity: 'warning', message: 'No chart data — add data to display the chart' })
    } else if (slide.chartData.labels.length < 2) {
      suggestions.push({ ...ctx, id: `s${pos}-chart-few`, severity: 'info', message: 'Chart has very few data points — add more for clarity' })
    }
  }

  // Speaker notes
  if (!slide.speakerNotes || slide.speakerNotes.trim().length < 5) {
    suggestions.push({ ...ctx, id: `s${pos}-no-notes`, severity: 'info', message: 'No speaker notes — these help during presentations' })
  }

  return suggestions
}

/** Analyze the entire deck structure and return deck-level suggestions */
function analyzeDeck(slides: Slide[]): CoachSuggestion[] {
  const suggestions: CoachSuggestion[] = []
  const ctx = { scope: 'deck' as const }

  if (slides.length === 0) return suggestions

  // Layout distribution
  const layoutCounts: Record<string, number> = {}
  for (const s of slides) {
    layoutCounts[s.layout] = (layoutCounts[s.layout] || 0) + 1
  }

  const textHeavy = (layoutCounts['bullets'] ?? 0) + (layoutCounts['two-column'] ?? 0)
  const visual = (layoutCounts['image-text'] ?? 0) + (layoutCounts['chart'] ?? 0) + (layoutCounts['quote'] ?? 0)
  const textRatio = textHeavy / Math.max(slides.length - 2, 1) // exclude title slides

  if (textRatio > 0.75 && slides.length > 4) {
    suggestions.push({ ...ctx, id: 'deck-text-heavy', severity: 'warning', message: 'Deck is text-heavy — add visual, chart, or quote slides to break it up' })
  }

  if (visual === 0 && slides.length > 3) {
    suggestions.push({ ...ctx, id: 'deck-no-visuals', severity: 'info', message: 'No visual slides — consider adding an image or chart slide' })
  }

  // Consecutive same layout
  for (let i = 1; i < slides.length; i++) {
    if (slides[i]!.layout === slides[i - 1]!.layout && slides[i]!.layout !== 'title') {
      suggestions.push({
        ...ctx,
        id: `deck-repeat-${i}`,
        severity: 'info',
        message: `Slides ${i} and ${i + 1} are both "${slides[i]!.layout}" — vary layouts for better flow`,
        slidePosition: i + 1,
        slideId: slides[i]!.id,
      })
    }
  }

  // First/last slide should be title
  if (slides[0]!.layout !== 'title') {
    suggestions.push({ ...ctx, id: 'deck-no-opener', severity: 'info', message: 'First slide isn\'t a title — consider starting with a title slide', slideId: slides[0]!.id, slidePosition: 1 })
  }
  if (slides.length > 2 && slides[slides.length - 1]!.layout !== 'title') {
    suggestions.push({ ...ctx, id: 'deck-no-closer', severity: 'info', message: 'Last slide isn\'t a title — a closing title makes a strong finish', slideId: slides[slides.length - 1]!.id, slidePosition: slides.length })
  }

  // Slide count
  if (slides.length < 4) {
    suggestions.push({ ...ctx, id: 'deck-too-short', severity: 'info', message: 'Deck is very short — consider adding more slides for depth' })
  } else if (slides.length > 15) {
    suggestions.push({ ...ctx, id: 'deck-too-long', severity: 'info', message: `${slides.length} slides is quite long — trim to keep audience attention` })
  }

  // Missing speaker notes count
  const noNotes = slides.filter((s) => !s.speakerNotes || s.speakerNotes.trim().length < 5).length
  if (noNotes > slides.length / 2 && slides.length > 3) {
    suggestions.push({ ...ctx, id: 'deck-few-notes', severity: 'info', message: `${noNotes} of ${slides.length} slides have no speaker notes` })
  }

  return suggestions
}

/** Main entry point: analyze slides and return all suggestions sorted by severity */
export function analyzePresentation(slides: Slide[]): CoachSuggestion[] {
  const deckSuggestions = analyzeDeck(slides)
  const slideSuggestions = slides.flatMap(analyzeSlide)

  const all = [...deckSuggestions, ...slideSuggestions]

  // Sort: errors first, then warnings, then info
  const order: Record<SuggestionSeverity, number> = { error: 0, warning: 1, info: 2 }
  all.sort((a, b) => order[a.severity] - order[b.severity])

  return all
}
