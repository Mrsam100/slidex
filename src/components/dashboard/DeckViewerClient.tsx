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
  Sparkles,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  LayoutGrid,
  Copy,
  Type,
  List,
  Columns2,
  Quote,
  ImageIcon,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Slide, SlideLayout, Theme, DeckStatus } from '@/types/deck'
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
  const [exportFormat, setExportFormat] = useState<'pdf' | 'pptx' | null>(null)
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isPublic, setIsPublic] = useState(deck.isPublic)
  const [isTogglingShare, setIsTogglingShare] = useState(false)
  const [deckTitle, setDeckTitle] = useState(deck.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const exportAbortRef = useRef<AbortController | null>(null)
  const addingSlideRef = useRef(false)

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
    if (addingSlideRef.current) return
    addingSlideRef.current = true
    try {
      const res = await fetch(`/api/decks/${deck.id}/slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ afterPosition }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const newSlide = data.slide as Slide

      // Re-fetch all slides from server to get correct positions after shift
      const slidesRes = await fetch(`/api/decks/${deck.id}/slides`)
      if (slidesRes.ok) {
        const slidesData = await slidesRes.json()
        setSlides(slidesData.slides as Slide[])
      } else {
        // Fallback: insert locally with position shift
        setSlides((prev) => {
          const updated = prev.map((s) =>
            s.position >= newSlide.position ? { ...s, position: s.position + 1 } : s,
          )
          updated.push(newSlide)
          return updated.sort((a, b) => a.position - b.position)
        })
      }

      toast.success('Slide added')
    } catch {
      toast.error('Failed to add slide')
    } finally {
      addingSlideRef.current = false
    }
  }

  /* ─── Duplicate slide ─── */
  async function handleDuplicateSlide(slide: Slide) {
    try {
      // Create a new slide after the current position
      const res = await fetch(`/api/decks/${deck.id}/slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ afterPosition: slide.position, layout: slide.layout }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const newSlideId = (data.slide as Slide).id

      // Patch the new slide with duplicated content
      const content: Partial<Slide> = {
        headline: slide.headline,
        body: slide.body,
        bullets: slide.bullets,
        leftColumn: slide.leftColumn,
        rightColumn: slide.rightColumn,
        quote: slide.quote,
        attribution: slide.attribution,
        speakerNotes: slide.speakerNotes,
        imageUrl: slide.imageUrl,
      }
      await fetch(`/api/slides/${newSlideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })

      // Re-fetch all slides
      const slidesRes = await fetch(`/api/decks/${deck.id}/slides`)
      if (slidesRes.ok) {
        const slidesData = await slidesRes.json()
        setSlides(slidesData.slides as Slide[])
      }
      toast.success('Slide duplicated')
    } catch {
      toast.error('Failed to duplicate slide')
    }
  }

  /* ─── Delete slide ─── */
  async function handleDeleteSlide(slideId: string) {
    if (slides.length <= 1) {
      toast.error('Cannot delete the last slide')
      return
    }
    try {
      const res = await fetch(`/api/slides/${slideId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      // Re-fetch to get correct positions
      const slidesRes = await fetch(`/api/decks/${deck.id}/slides`)
      if (slidesRes.ok) {
        const data = await slidesRes.json()
        setSlides(data.slides as Slide[])
      } else {
        setSlides((prev) => prev.filter((s) => s.id !== slideId))
      }
      toast.success('Slide deleted')
    } catch {
      toast.error('Failed to delete slide')
    }
  }

  /* ─── Move slide up/down ─── */
  async function handleMoveSlide(slideId: string, direction: 'up' | 'down') {
    const idx = slides.findIndex((s) => s.id === slideId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === slides.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const slideA = slides[idx]
    const slideB = slides[swapIdx]
    if (!slideA || !slideB) return

    // Optimistic update
    setSlides((prev) => {
      const updated = [...prev]
      updated[idx] = { ...slideA, position: slideB.position }
      updated[swapIdx] = { ...slideB, position: slideA.position }
      return updated.sort((a, b) => a.position - b.position)
    })

    // Persist: swap positions on server
    try {
      await fetch(`/api/slides/${slideA.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swapWithPosition: slideB.position }),
      })
      // Re-fetch to sync positions from server
      const slidesRes = await fetch(`/api/decks/${deck.id}/slides`)
      if (slidesRes.ok) {
        const data = await slidesRes.json()
        setSlides(data.slides as Slide[])
      }
    } catch {
      toast.error('Failed to move slide')
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

  /* ─── Export (PDF or PPTX) ─── */
  async function handleExport(format: 'pdf' | 'pptx') {
    if (isExporting) return
    setIsExporting(true)
    setExportFormat(format)
    setExportProgress(null)
    setShowExportMenu(false)
    const controller = new AbortController()
    exportAbortRef.current = controller
    try {
      if (format === 'pdf') {
        const { exportDeckToPDF } = await import('@/lib/pdf')
        await exportDeckToPDF(
          slides,
          activeTheme,
          deckTitle,
          (current, total) => setExportProgress({ current, total }),
          controller.signal,
        )
        toast.success('PDF downloaded!')
      } else {
        const { exportDeckToPPTX } = await import('@/lib/pptx')
        await exportDeckToPPTX(
          slides,
          activeTheme,
          deckTitle,
          (current, total) => setExportProgress({ current, total }),
        )
        toast.success('PPTX downloaded!')
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      toast.error('Export failed. Try again.')
    } finally {
      exportAbortRef.current = null
      setIsExporting(false)
      setExportFormat(null)
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f6fa]">
      {/* ── Theme Modal ── */}
      {showThemeModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => { if (!isSavingTheme) { setShowThemeModal(false); setPendingThemeId(activeTheme.id) } }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-dark">Change Theme</h3>
              <button onClick={() => { setShowThemeModal(false); setPendingThemeId(activeTheme.id) }} disabled={isSavingTheme} className="rounded-lg p-1.5 text-grey transition-colors hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">
              <ThemePicker selectedTheme={pendingThemeId} onSelect={setPendingThemeId} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowThemeModal(false); setPendingThemeId(activeTheme.id) }} disabled={isSavingTheme} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-mid transition-colors hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSaveTheme} disabled={isSavingTheme || pendingThemeId === activeTheme.id} className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/25 transition-all hover:bg-brand-blue/90 hover:shadow-lg disabled:opacity-50 disabled:shadow-none">
                {isSavingTheme ? 'Saving...' : 'Apply Theme'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Generating Banner ── */}
      {isGenerating && (
        <div role="status" aria-live="polite" className="flex h-10 shrink-0 items-center justify-center gap-2.5 bg-gradient-to-r from-[#0A0A0A] to-[#1a1a2e] text-sm font-medium text-white/90">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-teal" />
          <span>AI is generating your slides — keep this tab open</span>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-teal" />
        </div>
      )}

      {/* ── Top Bar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/60 bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg p-1.5 text-grey transition-colors hover:bg-gray-100 hover:text-dark"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          {isEditingTitle ? (
            <input
              autoFocus
              defaultValue={deckTitle}
              onBlur={(e) => handleTitleSave(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave(e.currentTarget.value)
                if (e.key === 'Escape') setIsEditingTitle(false)
              }}
              className="max-w-xs rounded-lg border border-brand-blue/40 bg-brand-blue/5 px-2.5 py-1 text-sm font-semibold text-dark outline-none ring-2 ring-brand-blue/20"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="max-w-xs truncate rounded-md px-1 py-0.5 text-sm font-semibold text-dark transition-colors hover:text-brand-blue"
              title="Click to rename"
            >
              {deckTitle}
            </button>
          )}
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-grey">
            {slides.length} slide{slides.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => { setPendingThemeId(activeTheme.id); setShowThemeModal(true) }}
            className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-mid transition-colors hover:bg-gray-100 hover:text-dark sm:px-3"
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Theme</span>
          </button>
          <ExportDropdown
            isExporting={isExporting}
            exportFormat={exportFormat}
            exportProgress={exportProgress}
            showMenu={showExportMenu}
            setShowMenu={setShowExportMenu}
            onExport={handleExport}
            disabled={slides.length === 0}
          />

          {/* Share */}
          {isPublic ? (
            <div className="flex items-center gap-1">
              <button onClick={handleCopyLink} className="flex items-center gap-1.5 rounded-lg bg-brand-teal/10 px-2 py-2 text-xs font-medium text-brand-teal transition-colors hover:bg-brand-teal/15 sm:px-3">
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Shared</span>
                <Link2 className="h-3 w-3 opacity-60" />
              </button>
              <button onClick={handleToggleShare} disabled={isTogglingShare} className="rounded-lg p-2 text-grey transition-colors hover:bg-gray-100 disabled:opacity-50" title="Make private">
                <Lock className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={handleToggleShare} disabled={isTogglingShare} className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-mid transition-colors hover:bg-gray-100 hover:text-dark disabled:opacity-50 sm:px-3">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          <div className="mx-0.5 h-5 w-px bg-gray-200 sm:mx-1" />

          {/* Present button */}
          <button
            onClick={() => setShowPresent(true)}
            disabled={slides.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-brand-blue px-3 py-2 text-xs font-semibold text-white shadow-md shadow-brand-blue/20 transition-all hover:-translate-y-px hover:bg-brand-blue/90 hover:shadow-lg disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none sm:px-5"
          >
            <Play className="h-3.5 w-3.5" fill="currentColor" />
            <span className="hidden xs:inline">Present</span>
          </button>
        </div>
      </header>

      {/* ── 3-Column Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {showLeftSidebar && (
          <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200/80 bg-white">
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-grey">Slides</span>
              <button
                onClick={() => setShowLeftSidebar(false)}
                className="rounded-md p-1 text-grey/60 transition-colors hover:bg-gray-100 hover:text-grey"
                aria-label="Close sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Slide thumbnails */}
            <div className="flex-1 overflow-y-auto scrollbar-none px-2.5 pb-2.5">
              <div className="flex flex-col gap-2">
                {slides.map((slide, i) => (
                  <div
                    key={slide.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => scrollToSlide(slide.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToSlide(slide.id) } }}
                    className={`group relative cursor-pointer rounded-lg border-2 transition-all ${
                      activeSlideId === slide.id
                        ? 'border-brand-blue shadow-sm shadow-brand-blue/10'
                        : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <span className={`absolute left-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                      activeSlideId === slide.id
                        ? 'bg-brand-blue text-white'
                        : 'bg-black/40 text-white'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="overflow-hidden rounded-[5px]">
                      <SlideThumb slide={slide} theme={activeTheme} />
                    </div>
                  </div>
                ))}

                {/* Skeleton slides during generation */}
                {isGenerating && Array.from({ length: Math.max(1, 3 - slides.length) }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="aspect-[16/9] animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            </div>

            {/* + New slide button at bottom */}
            <div className="border-t border-gray-100 px-3 py-2.5">
              <button
                onClick={() => handleAddSlide(slides.length)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-grey transition-all hover:border-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue"
              >
                <Plus className="h-3.5 w-3.5" />
                Add slide
              </button>
            </div>
          </aside>
        )}

        {/* Center: Scrollable slide editor */}
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scrollbar-thin"
        >
          <div className="mx-auto max-w-4xl px-6 py-8 lg:px-10">
            {/* Show sidebar toggle if hidden */}
            {!showLeftSidebar && (
              <button
                onClick={() => setShowLeftSidebar(true)}
                className="mb-4 flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-medium text-mid shadow-sm ring-1 ring-gray-200/80 transition-all hover:shadow-md"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Show slides
              </button>
            )}

            {slides.length === 0 && isGenerating && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/10">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                </div>
                <p className="mt-5 text-base font-semibold text-dark">Generating your slides...</p>
                <p className="mt-1.5 text-sm text-grey">Slides will appear here as they&apos;re created</p>
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
                  className="group/card relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-shadow hover:shadow-lg hover:shadow-black/[0.06]"
                >
                  {/* Generating badge on last slide if still generating */}
                  {isGenerating && i === slides.length - 1 && (
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-brand-teal px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-brand-teal/30">
                      <Sparkles className="h-3 w-3" />
                      Generating
                    </div>
                  )}

                  {/* Slide action buttons (top bar) */}
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
                    <RewritePopover
                      slide={slide}
                      onAccept={(updates) => patchSlide(slide.id, updates, 'Rewrite applied')}
                    />
                  </div>
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
                    {i > 0 && (
                      <button
                        onClick={() => handleMoveSlide(slide.id, 'up')}
                        className="rounded-lg bg-white/95 p-1.5 text-grey shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-all hover:bg-white hover:text-dark hover:shadow-md"
                        title="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {i < slides.length - 1 && (
                      <button
                        onClick={() => handleMoveSlide(slide.id, 'down')}
                        className="rounded-lg bg-white/95 p-1.5 text-grey shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-all hover:bg-white hover:text-dark hover:shadow-md"
                        title="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicateSlide(slide)}
                      className="rounded-lg bg-white/95 p-1.5 text-grey shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-all hover:bg-white hover:text-dark hover:shadow-md"
                      title="Duplicate slide"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="rounded-lg bg-white/95 p-1.5 text-grey shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-all hover:bg-red-50 hover:text-error hover:ring-red-200"
                      title="Delete slide"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
                {Array.from({ length: Math.max(1, 3 - slides.length) }).map((_, i) => (
                  <div key={`skel-${i}`} className="aspect-[16/9] animate-pulse rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/[0.04]" />
                ))}
              </div>
            )}
          </div>
        </main>
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
  const [scale, setScale] = useState(0)

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
        style={{ width: 1280, height: 720, transform: `scale(${scale})`, opacity: scale === 0 ? 0 : 1 }}
      >
        <EditableSlide key={slide.id} slide={slide} theme={theme} onSave={onSave} />
      </div>
    </div>
  )
}

/* ─── LayoutDropdown: change slide layout ─── */
const LAYOUT_OPTIONS: { id: SlideLayout; label: string; icon: React.ReactNode }[] = [
  { id: 'title', label: 'Title', icon: <Type className="h-3.5 w-3.5" /> },
  { id: 'bullets', label: 'Bullets', icon: <List className="h-3.5 w-3.5" /> },
  { id: 'two-column', label: 'Two Column', icon: <Columns2 className="h-3.5 w-3.5" /> },
  { id: 'quote', label: 'Quote', icon: <Quote className="h-3.5 w-3.5" /> },
  { id: 'image-text', label: 'Image + Text', icon: <ImageIcon className="h-3.5 w-3.5" /> },
]

function LayoutDropdown({
  currentLayout,
  onChange,
}: {
  currentLayout: string
  onChange: (layout: SlideLayout) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-black/10 px-3 py-1.5 text-xs font-medium text-dark/70 backdrop-blur transition-colors hover:bg-black/20 hover:text-dark"
        title="Change layout"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Layout
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                if (opt.id !== currentLayout) onChange(opt.id)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                opt.id === currentLayout
                  ? 'bg-brand-blue/10 text-brand-blue'
                  : 'text-mid hover:bg-gray-50 hover:text-dark'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── ExportDropdown: PDF or PPTX ─── */
function ExportDropdown({
  isExporting,
  exportFormat,
  exportProgress,
  showMenu,
  setShowMenu,
  onExport,
  disabled,
}: {
  isExporting: boolean
  exportFormat: 'pdf' | 'pptx' | null
  exportProgress: { current: number; total: number } | null
  showMenu: boolean
  setShowMenu: (v: boolean) => void
  onExport: (format: 'pdf' | 'pptx') => void
  disabled: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu, setShowMenu])

  if (isExporting) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-mid sm:px-3"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="tabular-nums">
          {exportProgress
            ? `${exportFormat === 'pptx' ? 'PPTX' : 'PDF'} ${exportProgress.current}/${exportProgress.total}`
            : `${exportFormat === 'pptx' ? 'PPTX' : 'PDF'}...`}
        </span>
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-mid transition-colors hover:bg-gray-100 hover:text-dark disabled:opacity-50 sm:px-3"
      >
        <FileDown className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Export</span>
        <ChevronRight className={`h-3 w-3 transition-transform ${showMenu ? 'rotate-90' : ''}`} />
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          <button
            onClick={() => onExport('pdf')}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-mid transition-colors hover:bg-gray-50 hover:text-dark"
          >
            <FileDown className="h-4 w-4 text-red-500" />
            <div className="text-left">
              <div className="font-semibold">PDF</div>
              <div className="text-[10px] text-grey">High-quality document</div>
            </div>
          </button>
          <button
            onClick={() => onExport('pptx')}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-mid transition-colors hover:bg-gray-50 hover:text-dark"
          >
            <FileText className="h-4 w-4 text-orange-500" />
            <div className="text-left">
              <div className="font-semibold">PowerPoint</div>
              <div className="text-[10px] text-grey">Editable PPTX file</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
