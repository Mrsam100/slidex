export type SlideLayout = 'title' | 'bullets' | 'two-column' | 'quote' | 'image-text' | 'chart'

export type ChartType = 'bar' | 'horizontal-bar' | 'pie' | 'donut' | 'line' | 'area'

export interface ChartDataset {
  label: string
  values: number[]
  color?: string
}

export interface ChartData {
  type: ChartType
  labels: string[]
  datasets: ChartDataset[]
  showLegend?: boolean
  showValues?: boolean
  unit?: string
}
export type DeckStatus = 'draft' | 'generating' | 'done' | 'error'
export type SubscriptionStatus = 'free' | 'pro' | 'cancelled'

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
  bgImageUrl?: string
  sectionTag?: string
  chartData?: ChartData
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
  language?: string
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
  bgGradient?: string
  emojiSet?: string[]
}
