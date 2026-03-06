'use client'

import { CheckCircle, Lock } from 'lucide-react'
import { THEMES } from '@/lib/themes'
import { cn } from '@/lib/utils'
import type { Slide, Theme } from '@/types/deck'
import SlideCanvas from './SlideCanvas'

interface ThemePickerProps {
  selectedTheme: string
  onSelect: (themeId: string) => void
  isProUser?: boolean
}

// Mock slide for theme preview
const PREVIEW_SLIDE: Slide = {
  id: 'preview',
  deckId: 'preview',
  position: 1,
  layout: 'bullets',
  headline: 'Sample Slide',
  bullets: ['First point', 'Second point', 'Third point'],
  createdAt: new Date(),
}

function ThemeCard({
  theme,
  isSelected,
  isLocked,
  onSelect,
}: {
  theme: Theme
  isSelected: boolean
  isLocked: boolean
  onSelect: () => void
}) {
  return (
    <button
      role="radio"
      aria-checked={isSelected}
      aria-label={`${theme.name} theme${isLocked ? ' (Pro)' : ''}`}
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col items-center gap-2.5 rounded-xl p-2.5 transition-all',
        isSelected
          ? 'bg-brand-blue/5 ring-2 ring-brand-blue ring-offset-2'
          : 'hover:bg-gray-50',
        isLocked && !isSelected && 'opacity-60',
      )}
    >
      {/* Mini preview — 1280×720 scaled to 160×90 via scale(0.125) */}
      <div className={cn(
        'relative aspect-video w-40 overflow-hidden rounded-lg border-2 transition-all',
        isSelected ? 'border-brand-blue shadow-md shadow-brand-blue/15' : 'border-gray-200',
      )}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: 'scale(0.125)', width: 1280, height: 720 }}>
          <SlideCanvas slide={PREVIEW_SLIDE} theme={theme} />
        </div>
        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-blue/10">
            <CheckCircle className="h-6 w-6 text-brand-blue drop-shadow-sm" />
          </div>
        )}
        {/* Lock overlay for non-pro users */}
        {isLocked && !isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5">
            <div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Lock className="h-3 w-3" />
              Pro
            </div>
          </div>
        )}
      </div>
      <span className={cn(
        'text-xs font-semibold',
        isSelected ? 'text-brand-blue' : 'text-mid',
      )}>
        {theme.name}
      </span>
    </button>
  )
}

export default function ThemePicker({
  selectedTheme,
  onSelect,
  isProUser = true,
}: ThemePickerProps) {
  return (
    <div role="radiogroup" aria-label="Presentation theme" className="flex flex-wrap justify-center gap-3">
      {THEMES.map((theme) => {
        const isLocked = !isProUser && theme.id !== 'minimal'
        return (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme === theme.id}
            isLocked={isLocked}
            onSelect={() => onSelect(theme.id)}
          />
        )
      })}
    </div>
  )
}
