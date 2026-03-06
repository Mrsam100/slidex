'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  ArrowLeft,
  Loader2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  AlignLeft,
  Image,
  GripVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { OutlineItem, SlideLayout } from '@/types/deck'
import ThemePicker from '@/components/slides/ThemePicker'

/* ─── Types & Constants ─── */
type Phase = 'prompt' | 'outline'

interface GenState {
  phase: Phase
  topic: string
  slideCount: 5 | 8 | 10 | 15
  tone: string
  audience: string
  theme: string
  outline: OutlineItem[]
  deckId: string | null
  isLoadingOutline: boolean
}

const INITIAL: GenState = {
  phase: 'prompt',
  topic: '',
  slideCount: 8,
  tone: 'professional',
  audience: 'general',
  theme: 'minimal',
  outline: [],
  deckId: null,
  isLoadingOutline: false,
}

const SLIDE_COUNTS: (5 | 8 | 10 | 15)[] = [5, 8, 10, 15]
const TONES = ['academic', 'professional', 'casual', 'creative'] as const
const AUDIENCES = ['students', 'educators', 'business', 'general'] as const

const LAYOUT_LABELS: Record<SlideLayout, string> = {
  title: 'Title',
  bullets: 'Bullets',
  'two-column': 'Two Column',
  quote: 'Quote',
  'image-text': 'Image + Text',
}

const CONTENT_LEVELS = [
  { id: 'casual', label: 'Minimal', lines: 1 },
  { id: 'professional', label: 'Concise', lines: 2 },
  { id: 'academic', label: 'Detailed', lines: 3 },
  { id: 'creative', label: 'Extensive', lines: 4 },
] as const

/* ─── Compact Dropdown ─── */
function OptionDropdown<T extends string | number>({
  value,
  options,
  onChange,
  display,
  icon,
}: {
  value: T
  options: T[]
  onChange: (v: T) => void
  display: (v: T) => string
  icon?: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-mid">
        {icon}
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value as T)}
          className="appearance-none bg-transparent pr-4 outline-none"
        >
          {options.map((opt) => (
            <option key={String(opt)} value={String(opt)}>
              {display(opt)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-grey" />
      </div>
    </div>
  )
}

/* ─── Content Level Picker (visual cards like Gamma) ─── */
function ContentLevelPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {CONTENT_LEVELS.map((level) => {
        const isSelected = value === level.id
        return (
          <button
            key={level.id}
            onClick={() => onChange(level.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all',
              isSelected
                ? 'border-brand-blue bg-brand-blue/5'
                : 'border-gray-200 bg-white hover:border-gray-300',
            )}
          >
            {/* Visual lines representation */}
            <div className="flex h-8 w-full flex-col justify-center gap-1 px-1">
              {Array.from({ length: level.lines }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-[3px] rounded-full',
                    isSelected ? 'bg-brand-blue' : 'bg-gray-300',
                    i > 0 && 'opacity-70',
                  )}
                  style={{ width: `${100 - i * 15}%` }}
                />
              ))}
            </div>
            <span
              className={cn(
                'text-[11px] font-medium',
                isSelected ? 'text-brand-blue' : 'text-mid',
              )}
            >
              {level.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Main Page ─── */
export default function GeneratePage() {
  const router = useRouter()
  const [state, setState] = useState<GenState>(INITIAL)
  const inputRef = useRef<HTMLInputElement>(null)

  const set = useCallback(
    (patch: Partial<GenState>) =>
      setState((prev) => ({ ...prev, ...patch })),
    [],
  )

  /* ─── API: Generate outline ─── */
  async function handleGenerateOutline() {
    if (state.isLoadingOutline || state.topic.trim().length < 3) return
    set({ isLoadingOutline: true })
    try {
      const res = await fetch('/api/generate/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: state.topic,
          slideCount: state.slideCount,
          tone: state.tone,
          audience: state.audience,
        }),
      })
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/signin')
          return
        }
        if (res.status === 429) {
          toast.error('Too many concurrent generations. Please wait and try again.')
          return
        }
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Something went wrong. Please try again.')
        return
      }
      const data = await res.json()
      set({
        deckId: data.deckId,
        outline: data.outline.slides as OutlineItem[],
        phase: 'outline',
      })
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      set({ isLoadingOutline: false })
    }
  }

  /* ─── API: Generate slides → redirect to editor ─── */
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false)

  async function handleGenerateSlides() {
    if (!state.deckId || isGeneratingSlides) return
    setIsGeneratingSlides(true)
    const currentDeckId = state.deckId

    try {
      const res = await fetch('/api/generate/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: currentDeckId,
          outline: state.outline,
          topic: state.topic,
          tone: state.tone,
          audience: state.audience,
          theme: state.theme,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 401) {
          router.push('/signin')
          return
        }
        if (res.status === 429) {
          toast.error('Too many concurrent generations. Please wait and try again.')
          setIsGeneratingSlides(false)
          return
        }
        toast.error(data.error || 'Failed to start generation. Please try again.')
        setIsGeneratingSlides(false)
        return
      }
    } catch {
      // Network error — still redirect, editor will show error state via polling
    }

    router.push(`/deck/${currentDeckId}`)
  }

  /* ─── Outline helpers ─── */
  function updateOutlineTitle(position: number, title: string) {
    set({
      outline: state.outline.map((item) =>
        item.position === position ? { ...item, title } : item,
      ),
    })
  }

  function removeOutlineItem(position: number) {
    if (state.outline.length <= 1) return
    const updated = state.outline
      .filter((item) => item.position !== position)
      .map((item, i) => ({ ...item, position: i + 1 }))
    set({ outline: updated })
  }

  function addOutlineItem() {
    const next: OutlineItem = {
      position: state.outline.length + 1,
      title: 'New Slide',
      type: 'bullets',
    }
    set({ outline: [...state.outline, next] })
  }

  const canGenerate = state.topic.trim().length >= 3
  const hasOutline = state.outline.length > 0

  /* ─── Main: Prompt + Outline (single scrollable page like Gamma) ─── */
  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-28">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-mid transition-all hover:bg-gray-50 hover:shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <h1 className="text-base font-bold tracking-tight text-brand-blue">Generate</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        {/* ── Options Row (like Gamma's dropdowns) ── */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-mid">Prompt</span>
          <OptionDropdown
            value={state.slideCount}
            options={SLIDE_COUNTS}
            onChange={(v) => set({ slideCount: Number(v) as 5 | 8 | 10 | 15 })}
            display={(v) => `${v} cards`}
          />
          <OptionDropdown
            value={state.tone}
            options={[...TONES]}
            onChange={(v) => set({ tone: v })}
            display={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
          />
          <OptionDropdown
            value={state.audience}
            options={[...AUDIENCES]}
            onChange={(v) => set({ audience: v })}
            display={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
          />
        </div>

        {/* ── Prompt Input ── */}
        <div>
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-5 py-4 shadow-sm ring-1 ring-black/[0.03] transition-shadow focus-within:border-brand-blue/30 focus-within:shadow-md focus-within:ring-brand-blue/10">
            <Sparkles className="h-4 w-4 shrink-0 text-brand-blue/40" />
            <input
              ref={inputRef}
              type="text"
              value={state.topic}
              onChange={(e) => set({ topic: e.target.value.slice(0, 500) })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canGenerate && !state.isLoadingOutline) {
                  handleGenerateOutline()
                }
              }}
              placeholder="e.g. The future of renewable energy, Machine learning basics..."
              maxLength={500}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-dark outline-none placeholder:text-grey/40"
            />
            <button
              onClick={handleGenerateOutline}
              disabled={!canGenerate || state.isLoadingOutline}
              className={cn(
                'shrink-0 rounded-lg p-2 transition-all',
                canGenerate && !state.isLoadingOutline
                  ? 'text-brand-blue hover:bg-brand-blue/10'
                  : 'cursor-not-allowed text-gray-300',
              )}
              aria-label="Generate outline"
            >
              {state.isLoadingOutline ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="mt-1.5 flex justify-between px-2">
            <span className="text-[11px] text-grey/60">
              {state.topic.length < 3 && state.topic.length > 0 ? 'Minimum 3 characters' : '\u00A0'}
            </span>
            <span className={cn('text-[11px] tabular-nums', state.topic.length > 450 ? 'text-error' : 'text-grey/40')}>
              {state.topic.length}/500
            </span>
          </div>
        </div>

        {/* ── Topic suggestions when empty ── */}
        {!hasOutline && !state.isLoadingOutline && state.topic.length === 0 && (
          <div className="mt-6">
            <p className="mb-2.5 text-xs font-medium text-grey/60">Try one of these</p>
            <div className="flex flex-wrap gap-2">
              {[
                'The water cycle explained',
                'Introduction to machine learning',
                'World War II key events',
                'Climate change solutions',
                'How blockchain works',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    set({ topic: suggestion })
                    inputRef.current?.focus()
                  }}
                  className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-mid transition-all hover:border-brand-blue/30 hover:bg-brand-blue/5 hover:text-brand-blue"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading state for outline ── */}
        {state.isLoadingOutline && !hasOutline && (
          <div className="mt-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-blue" />
            <p className="mt-3 text-sm text-grey">Generating outline...</p>
          </div>
        )}

        {/* ── Outline Section ── */}
        {hasOutline && (
          <div className="mt-6 animate-in fade-in duration-300">
            <h3 className="mb-3 text-sm font-semibold text-dark">Outline</h3>

            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm ring-1 ring-black/[0.03]">
              <div className="divide-y divide-gray-100">
                {state.outline.map((item) => (
                  <div
                    key={item.position}
                    className="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-gray-50/50"
                  >
                    <GripVertical className="mt-1.5 h-4 w-4 shrink-0 cursor-grab text-grey/30 transition-colors group-hover:text-grey/60" />
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-blue/8 text-xs font-bold tabular-nums text-brand-blue">
                      {item.position}
                    </span>
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          updateOutlineTitle(item.position, e.target.value)
                        }
                        className="w-full border-none bg-transparent text-sm font-semibold text-dark outline-none"
                      />
                      <span className="mt-0.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-grey">
                        {LAYOUT_LABELS[item.type]}
                      </span>
                    </div>
                    <button
                      onClick={() => removeOutlineItem(item.position)}
                      className="shrink-0 rounded-lg p-1 text-grey/0 transition-all group-hover:text-grey/40 hover:!bg-red-50 hover:!text-error"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add card */}
              <button
                onClick={addOutlineItem}
                className="flex w-full items-center justify-center gap-2 border-t border-dashed border-gray-200 py-3.5 text-sm font-medium text-grey transition-all hover:bg-gray-50 hover:text-brand-blue"
              >
                <Plus className="h-4 w-4" />
                Add card
              </button>
            </div>

            {/* Card count (like Gamma) */}
            <p className="mt-3 text-center text-xs text-grey">
              {state.outline.length} cards total
            </p>

            {/* ── Customize your presentation ── */}
            <div className="mt-10">
              <h3 className="mb-5 text-sm font-semibold text-dark">
                Customize your presentation
              </h3>

              {/* Text content section */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm ring-1 ring-black/[0.03]">
                <div className="mb-4 flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-brand-blue" />
                  <h4 className="text-sm font-semibold text-dark">
                    Text content
                  </h4>
                </div>
                <p className="mb-3 text-xs text-grey">
                  Amount of text per card
                </p>
                <ContentLevelPicker
                  value={state.tone}
                  onChange={(v) => set({ tone: v })}
                />
              </div>

              {/* Visuals / Theme section */}
              <div className="mt-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm ring-1 ring-black/[0.03]">
                <div className="mb-4 flex items-center gap-2">
                  <Image className="h-4 w-4 text-brand-blue" />
                  <h4 className="text-sm font-semibold text-dark">Visuals</h4>
                </div>
                <p className="mb-3 text-xs text-grey">Theme</p>
                <ThemePicker
                  selectedTheme={state.theme}
                  onSelect={(themeId) => set({ theme: themeId })}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Sticky Bottom Bar (like Gamma) ── */}
      {hasOutline && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200/60 bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
            <p className="text-sm font-medium tabular-nums text-grey">
              {state.outline.length} cards
            </p>
            <button
              onClick={handleGenerateSlides}
              disabled={isGeneratingSlides}
              className="flex items-center gap-2.5 rounded-xl bg-brand-blue px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/25 transition-all hover:-translate-y-px hover:bg-brand-blue/90 hover:shadow-xl disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
            >
              {isGeneratingSlides ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
