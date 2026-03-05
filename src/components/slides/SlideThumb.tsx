'use client'

import type { Slide, Theme } from '@/types/deck'
import SlideCanvas from './SlideCanvas'

interface SlideThumbProps {
  slide: Slide
  theme: Theme
  active?: boolean
  onClick?: () => void
}

export default function SlideThumb({ slide, theme, active, onClick }: SlideThumbProps) {
  return (
    <button
      onClick={onClick}
      aria-label={`Slide ${slide.position}: ${slide.headline}`}
      className={`group relative block overflow-hidden rounded-lg border-2 transition-all ${
        active
          ? 'border-brand-blue shadow-lg shadow-brand-blue/20'
          : 'border-transparent opacity-60 hover:opacity-90'
      }`}
      style={{ width: 192, height: 108 }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: 'scale(0.15)', width: 1280, height: 720 }}
      >
        <SlideCanvas slide={slide} theme={theme} isThumb />
      </div>
    </button>
  )
}
