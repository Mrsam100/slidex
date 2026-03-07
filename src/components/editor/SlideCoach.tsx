'use client'

import { useMemo, useState } from 'react'
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Filter,
} from 'lucide-react'
import type { Slide } from '@/types/deck'
import { analyzePresentation, type CoachSuggestion, type SuggestionSeverity } from '@/lib/slideCoach'

interface SlideCoachProps {
  slides: Slide[]
  activeSlideId: string | null
  onClose: () => void
  onGoToSlide?: (slideId: string) => void
}

const SEVERITY_CONFIG: Record<SuggestionSeverity, { icon: typeof AlertTriangle; color: string; bg: string; label: string }> = {
  error: { icon: AlertCircle, color: 'text-error', bg: 'bg-red-50', label: 'Issue' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Suggestion' },
  info: { icon: Info, color: 'text-brand-blue', bg: 'bg-blue-50', label: 'Tip' },
}

type FilterMode = 'all' | 'current' | 'deck'

export default function SlideCoach({ slides, activeSlideId, onClose, onGoToSlide }: SlideCoachProps) {
  const [filter, setFilter] = useState<FilterMode>('all')

  const suggestions = useMemo(() => analyzePresentation(slides), [slides])

  const filtered = useMemo(() => {
    if (filter === 'deck') return suggestions.filter((s) => s.scope === 'deck')
    if (filter === 'current') return suggestions.filter((s) => s.slideId === activeSlideId)
    return suggestions
  }, [suggestions, filter, activeSlideId])

  const errorCount = suggestions.filter((s) => s.severity === 'error').length
  const warningCount = suggestions.filter((s) => s.severity === 'warning').length
  const infoCount = suggestions.filter((s) => s.severity === 'info').length

  // Score: 100 minus penalties
  const score = useMemo(() => {
    const penalty = errorCount * 15 + warningCount * 5 + infoCount * 1
    return Math.max(0, Math.min(100, 100 - penalty))
  }, [errorCount, warningCount, infoCount])

  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-error'
  const scoreBg = score >= 80 ? 'bg-emerald-50' : score >= 50 ? 'bg-amber-50' : 'bg-red-50'

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-gray-200/80 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-dark">AI Coach</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-grey/60 transition-colors hover:bg-gray-100 hover:text-grey"
          aria-label="Close coach"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Score card */}
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${scoreBg}`}>
            <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>{score}</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-dark">
              {score >= 80 ? 'Looking great!' : score >= 50 ? 'Getting there' : 'Needs work'}
            </p>
            <p className="mt-0.5 text-[11px] text-grey">
              {suggestions.length === 0 ? 'No suggestions' : `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {suggestions.length === 0 && (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          )}
        </div>

        {/* Severity summary pills */}
        {suggestions.length > 0 && (
          <div className="mt-3 flex gap-2">
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-error">
                <AlertCircle className="h-2.5 w-2.5" /> {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                <AlertTriangle className="h-2.5 w-2.5" /> {warningCount}
              </span>
            )}
            {infoCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-brand-blue">
                <Info className="h-2.5 w-2.5" /> {infoCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-100 px-2">
        {(['all', 'current', 'deck'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
            className={`flex-1 border-b-2 px-2 py-2 text-[11px] font-medium capitalize transition-colors ${
              filter === mode
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-grey hover:text-mid'
            }`}
          >
            {mode === 'current' ? 'This slide' : mode}
          </button>
        ))}
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="mt-3 text-xs font-medium text-mid">
              {filter === 'current'
                ? 'This slide looks good!'
                : 'All clear! No suggestions.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onGoToSlide={onGoToSlide}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function SuggestionCard({
  suggestion,
  onGoToSlide,
}: {
  suggestion: CoachSuggestion
  onGoToSlide?: (slideId: string) => void
}) {
  const config = SEVERITY_CONFIG[suggestion.severity]
  const Icon = config.icon

  return (
    <div
      className={`rounded-xl ${config.bg} p-3 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] leading-relaxed text-dark/80">{suggestion.message}</p>
          {suggestion.slidePosition && suggestion.slideId && onGoToSlide && (
            <button
              onClick={() => onGoToSlide(suggestion.slideId!)}
              className="mt-1.5 flex items-center gap-0.5 text-[10px] font-medium text-brand-blue transition-colors hover:text-brand-blue/80"
            >
              Go to slide {suggestion.slidePosition}
              <ChevronRight className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
