export type SlideLayout = 'title' | 'bullets' | 'two-column' | 'quote' | 'image-text'
export type DeckStatus = 'draft' | 'generating' | 'done' | 'error'

export interface Slide {
  id: string
  deckId: string
  position: number
  layout: SlideLayout
  headline: string
  body?: string
  bullets?: string[]
  leftColumn?: string[]
  rightColumn?: string[]
  quote?: string
  attribution?: string
  speakerNotes?: string
  imagePrompt?: string
  imageUrl?: string
  createdAt: Date
}

export interface Deck {
  id: string
  userId: string
  title: string
  topic: string
  slideCount: number
  theme: string
  status: DeckStatus
  isPublic: boolean
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
  slides?: Slide[]
}

export interface GenerationParams {
  topic: string
  slideCount: 5 | 8 | 10 | 15
  tone: 'academic' | 'professional' | 'casual' | 'creative'
  audience: 'students' | 'educators' | 'business' | 'general'
  theme: string
}

export interface OutlineItem {
  position: number
  title: string
  type: SlideLayout
}

export interface Outline {
  title: string
  slides: OutlineItem[]
}

export interface Theme {
  id: string
  name: string
  bgColor: string
  textColor: string
  headlineColor: string
  accentColor: string
  fontFamily: string
  borderRadius: string
}
