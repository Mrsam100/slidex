'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileDown,
  Share2,
  Palette,
  Loader2,
  Link2,
  Globe,
  Lock,
  X,
  Play,
  Search,
  Type,
  Sparkles,
  ImageIcon,
  LayoutGrid,
  BarChart3,
  Plus,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Slide, Theme, DeckStatus } from '@/types/deck'
import { THEMES } from '@/lib/themes'
import SlideThumb from '@/components/slides/SlideThumb'
import EditableSlide from '@/components/editor/EditableSlide'
import RewritePopover from '@/components/editor/RewritePopover'
import ThemePicker from '@/components/slides/ThemePicker'
import PresentMode from './PresentMode'
import SlideActionBar from '@/components/editor/SlideActionBar'

interface DeckViewerClientProps {
  deck: { id: string; title: string; theme: string; isPublic: boolean; status: string }
  slides: Slide[]
  theme: Theme
}

/* ─── Right Toolbar Icons ─── */
const TOOLBAR_ICONS = [
  { icon: Search, label: 'Search' },
  { icon: Type, label: 'Text' },
  { icon: Sparkles, label: 'AI' },
  { icon: ImageIcon, label: 'Images' },
  { icon: LayoutGrid, label: 'Shapes' },
  { icon: BarChart3, label: 'Charts' },
] as const

export default function DeckViewerClient({
  deck,
  slides: initialSlides,
  theme,
}: DeckViewerClientProps) {
  const [slides, setSlides] = useState(initialSlides)
  const [activeTheme, setActiveTheme] = useState(theme)
  const [deckStatus, setDeckStatus] = useState<DeckStatus>(deck.status as DeckStatus)
  const [activeSlideId, setActiveSlideId] = useState<string | null>(slides[0]?.id ?? null)
  const [showPresent, setShowPresent] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [pendingThemeId, setPendingThemeId] = useState(deck.theme)
  const [isSavingTheme, setIsSavingTheme] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null)
  const [isPublic, setIsPublic] = useState(deck.isPublic)
  const [isTogglingShare, setIsTogglingShare] = useState(false)
  const [deckTitle, setDeckTitle] = useState(deck.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const exportAbortRef = useRef<AbortController | null>(null)

  /* ─── Generation Polling ─── */
  useEffect(() => {
    if (deckStatus !== 'generating') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/decks/${deck.id}/slides`)
        if (!res.ok) return
        const data = await res.json()

        setSlides(data.slides as Slide[])
        setDeckStatus(data.status as DeckStatus)

        if (data.status === 'done') {
          clearInterval(interval)
          toast.success('Deck ready!')
        } else if (data.status === 'error') {
          clearInterval(interval)
          toast.error('Generation failed for some slides.')
        }
      } catch {
        /* ignore transient errors */
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [deckStatus, deck.id])

  /* ─── IntersectionObserver for active slide tracking ─── */
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const slideId = entry.target.getAttribute('data-slide-id')
            if (slideId) setActiveSlideId(slideId)
          }
        }
      },
      { root: container, threshold: 0.5 },
    )

    for (const el of slideRefs.current.values()) {
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [slides])

  /* ─── Slide patch helper ─── */
  const patchSlide = useCallback(
    async (slideId: string, updates: Partial<Slide>, successMsg?: string) => {
      try {
        const res = await fetch(`/api/slides/${slideId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!res.ok) throw new Error()
        setSlides((prev) =>
          prev.map((s) => (s.id === slideId ? { ...s, ...updates } : s)),
        )
        if (successMsg) toast.success(successMsg)
      } catch {
        toast.error('Failed to save changes')
      }
    },
    [],
  )

  /* ─── Add slide ─── */
  async function handleAddSlide(afterPosition: number) {
    try {
      const res = await fetch(`/api/decks/${deck.id}/slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ afterPosition }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const newSlide = data.slide as Slide

      setSlides((prev) => {
        const updated = prev.map((s) =>
          s.position >= newSlide.position ? { ...s, position: s.position + 1 } : s,
        )
        updated.push(newSlide)
        return updated.sort((a, b) => a.position - b.position)
      })

      toast.success('Slide added')
    } catch {
      toast.error('Failed to add slide')
    }
  }

  /* ─── Scroll to slide from sidebar ─── */
  function scrollToSlide(slideId: string) {
    const el = slideRefs.current.get(slideId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setActiveSlideId(slideId)
    }
  }

  /* ─── Theme save ─── */
  async function handleSaveTheme() {
    if (isSavingTheme) return
    setIsSavingTheme(true)
    try {
      const res = await fetch(`/api/decks/${deck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: pendingThemeId }),
      })
      if (!res.ok) throw new Error()
      const newTheme = THEMES.find((t) => t.id === pendingThemeId)
      if (newTheme) setActiveTheme(newTheme)
      setShowThemeModal(false)
      toast.success('Theme updated')
    } catch {
      toast.error('Failed to save theme')
    } finally {
      setIsSavingTheme(false)
    }
  }

  /* ─── PDF export ─── */
  async function handleExportPDF() {
    if (isExporting) return
    setIsExporting(true)
    setExportProgress(null)
    const controller = new AbortController()
    exportAbortRef.current = controller
    try {
      const { exportDeckToPDF } = await import('@/lib/pdf')
      await exportDeckToPDF(
        slides,
        activeTheme,
        deckTitle,
        (current, total) => setExportProgress({ current, total }),
        controller.signal,
      )
      toast.success('PDF downloaded!')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      toast.error('Export failed. Try again.')
    } finally {
      exportAbortRef.current = null
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  useEffect(() => {
    return () => { exportAbortRef.current?.abort() }
  }, [])

  /* ─── Share ─── */
  async function handleToggleShare() {
    if (isTogglingShare) return
    const newValue = !isPublic
    setIsTogglingShare(true)
    try {
      const res = await fetch(`/api/decks/${deck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newValue }),
      })
      if (!res.ok) throw new Error()
      setIsPublic(newValue)
      if (newValue) {
        toast.success('Deck is now public!')
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/s/${deck.id}`)
          toast.success('Link copied to clipboard')
        } catch { /* clipboard unavailable */ }
      } else {
        toast.success('Deck is now private')
      }
    } catch {
      toast.error('Failed to update sharing')
    } finally {
      setIsTogglingShare(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${deck.id}`)
      toast.success('Link copied!')
    } catch {
      toast.error('Could not copy link')
    }
  }

  /* ─── Title edit ─── */
  async function handleTitleSave(newTitle: string) {
    const trimmed = newTitle.trim()
    if (!trimmed || trimmed === deckTitle) {
      setIsEditingTitle(false)
      return
    }
    try {
      const res = await fetch(`/api/decks/${deck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!res.ok) throw new Error()
      setDeckTitle(trimmed)
    } catch {
      toast.error('Failed to rename')
    }
    setIsEditingTitle(false)
  }

  const isGenerating = deckStatus === 'generating'

  /* ─── Presentation mode overlay ─── */
  if (showPresent && slides.length > 0) {
    const activeIndex = slides.findIndex((s) => s.id === activeSlideId)
    return (
      <PresentMode
        slides={slides}
        theme={activeTheme}
        initialIndex={activeIndex >= 0 ? activeIndex : 0}
        onClose={() => setShowPresent(false)}
      />
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      {/* ── Theme Modal ── */}
      {showThemeModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => { if (!isSavingTheme) { setShowThemeModal(false); setPendingThemeId(activeTheme.id) } }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">Change Theme</h3>
              <button onClick={() => { setShowThemeModal(false); setPendingThemeId(activeTheme.id) }} disabled={isSavingTheme} className="rounded p-1 text-grey transition-colors hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">
              <ThemePicker selectedTheme={pendingThemeId} onSelect={setPendingThemeId} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowThemeModal(false); setPendingThemeId(activeTheme.id) }} disabled={isSavingTheme} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-mid transition-colors hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSaveTheme} disabled={isSavingTheme || pendingThemeId === activeTheme.id} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50">
                {isSavingTheme ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Generating Banner ── */}
      {isGenerating && (
        <div className="flex h-10 shrink-0 items-center justify-center gap-2 bg-[#1a1a2e] text-sm text-white">
          <Loader2 className="h-4 w-4 animate-spin text-brand-teal" />
          AI Generating: Don&apos;t close this tab while generation is in progress.
        </div>
      )}

      {/* ── Top Bar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg p-1.5 text-grey transition-colors hover:bg-gray-100 hover:text-dark"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {isEditingTitle ? (
            <input
              autoFocus
              defaultValue={deckTitle}
              onBlur={(e) => handleTitleSave(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave(e.currentTarget.value)
                if (e.key === 'Escape') setIsEditingTitle(false)
              }}
              className="max-w-xs rounded border border-brand-blue px-2 py-1 text-sm font-semibold text-dark outline-none"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="max-w-xs truncate text-sm font-semibold text-dark hover:text-brand-blue"
              title="Click to rename"
            >
              {deckTitle}
            </button>
          )}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-grey">
            {slides.length} slides
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => { setPendingThemeId(activeTheme.id); setShowThemeModal(true) }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-grey transition-colors hover:bg-gray-100 hover:text-dark"
          >
            <Palette className="h-3.5 w-3.5" />
            Theme
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting || slides.length === 0}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-grey transition-colors hover:bg-gray-100 hover:text-dark disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {exportProgress ? `${exportProgress.current}/${exportProgress.total}` : '...'}
              </>
            ) : (
              <>
                <FileDown className="h-3.5 w-3.5" />
                Export
              </>
            )}
          </button>

          {/* Share */}
          {isPublic ? (
            <div className="flex items-center gap-0.5">
              <button onClick={handleCopyLink} className="flex items-center gap-1.5 rounded-lg bg-brand-teal/10 px-3 py-1.5 text-xs font-medium text-brand-teal transition-colors hover:bg-brand-teal/20">
                <Globe className="h-3.5 w-3.5" />
                Shared
                <Link2 className="h-3 w-3" />
              </button>
              <button onClick={handleToggleShare} disabled={isTogglingShare} className="rounded-lg px-1.5 py-1.5 text-grey transition-colors hover:bg-gray-100 disabled:opacity-50" title="Make private">
                <Lock className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={handleToggleShare} disabled={isTogglingShare} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-grey transition-colors hover:bg-gray-100 hover:text-dark disabled:opacity-50">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          )}

          {/* Present button */}
          <button
            onClick={() => setShowPresent(true)}
            disabled={slides.length === 0}
            className="ml-2 flex items-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" fill="currentColor" />
            Present
          </button>
        </div>
      </header>

      {/* ── 3-Column Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {showLeftSidebar && (
          <aside className="flex w-52 shrink-0 flex-col border-r border-gray-200 bg-white">
            {/* Sidebar header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <div className="flex items-center gap-1">
                <button className="rounded p-1 text-brand-blue" aria-label="Grid view">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={() => setShowLeftSidebar(false)}
                className="rounded p-1 text-grey transition-colors hover:bg-gray-100"
                aria-label="Close sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* + New button */}
            <div className="border-b border-gray-100 px-3 py-2">
              <button
                onClick={() => handleAddSlide(slides.length)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-mid transition-colors hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5" />
                New
                <ChevronDown className="h-3 w-3 text-grey" />
              </button>
            </div>

            {/* Slide thumbnails */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="flex flex-col gap-2">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    onClick={() => scrollToSlide(slide.id)}
                    className={`group relative rounded-lg border-2 transition-all ${
                      activeSlideId === slide.id
                        ? 'border-brand-blue shadow-sm shadow-brand-blue/10'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <span className="absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded bg-black/40 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="overflow-hidden rounded-md">
                      <SlideThumb slide={slide} theme={activeTheme} />
                    </div>
                  </button>
                ))}

                {/* Skeleton slides during generation */}
                {isGenerating && Array.from({ length: 2 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="aspect-[16/9] animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Center: Scrollable slide editor */}
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-4xl px-8 py-8">
            {/* Show sidebar toggle if hidden */}
            {!showLeftSidebar && (
              <button
                onClick={() => setShowLeftSidebar(true)}
                className="mb-4 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-mid transition-colors hover:bg-gray-50"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Show slides
              </button>
            )}

            {slides.length === 0 && isGenerating && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
                <p className="mt-4 text-sm font-medium text-dark">Generating your slides...</p>
                <p className="mt-1 text-xs text-grey">Slides will appear here as they&apos;re created</p>
              </div>
            )}

            {slides.map((slide, i) => (
              <div key={slide.id}>
                {/* Slide card */}
                <div
                  ref={(el) => {
                    if (el) slideRefs.current.set(slide.id, el)
                    else slideRefs.current.delete(slide.id)
                  }}
                  data-slide-id={slide.id}
                  className="relative overflow-hidden rounded-xl bg-white shadow-md"
                >
                  {/* Generating badge on last slide if still generating */}
                  {isGenerating && i === slides.length - 1 && (
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-brand-teal/90 px-3 py-1 text-xs font-medium text-white shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      AI generating
                    </div>
                  )}

                  {/* AI Rewrite button */}
                  <div className="absolute left-3 top-3 z-10">
                    <RewritePopover
                      slide={slide}
                      onAccept={(updates) => patchSlide(slide.id, updates, 'Rewrite applied')}
                    />
                  </div>

                  {/* The slide itself — always editable */}
                  <SlideEditor
                    slide={slide}
                    theme={activeTheme}
                    onSave={(updates) => patchSlide(slide.id, updates)}
                  />
                </div>

                {/* Between-slide action bar */}
                {i < slides.length - 1 && (
                  <SlideActionBar onAddSlide={() => handleAddSlide(slide.position)} />
                )}

                {/* After last slide */}
                {i === slides.length - 1 && !isGenerating && (
                  <SlideActionBar onAddSlide={() => handleAddSlide(slide.position)} />
                )}
              </div>
            ))}

            {/* Skeleton slides during generation */}
            {isGenerating && slides.length > 0 && (
              <div className="mt-4 space-y-4">
                {[1, 2].map((i) => (
                  <div key={`skel-${i}`} className="aspect-[16/9] animate-pulse rounded-xl bg-white/60 shadow" />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right Toolbar */}
        <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-l border-gray-200 bg-white py-3">
          {TOOLBAR_ICONS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => toast(`${label} tools coming soon`)}
              className="rounded-lg p-2 text-grey transition-colors hover:bg-gray-100 hover:text-dark"
              title={label}
              aria-label={label}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </aside>
      </div>
    </div>
  )
}

/* ─── SlideEditor: wraps EditableSlide with responsive scaling ─── */
function SlideEditor({
  slide,
  theme,
  onSave,
}: {
  slide: Slide
  theme: Theme
  onSave: (updates: Partial<Slide>) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function updateScale() {
      const rect = el!.getBoundingClientRect()
      setScale(Math.min(rect.width / 1280, rect.height / 720))
    }
    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="relative" style={{ aspectRatio: '16/9' }}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: 1280, height: 720, transform: `scale(${scale})` }}
      >
        <EditableSlide key={slide.id} slide={slide} theme={theme} onSave={onSave} />
      </div>
    </div>
  )
}
