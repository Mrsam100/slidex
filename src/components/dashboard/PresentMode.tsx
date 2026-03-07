'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  StickyNote,
  Timer,
  SkipForward,
} from 'lucide-react'
import type { Slide, Theme } from '@/types/deck'
import SlideCanvas from '@/components/slides/SlideCanvas'
import SlideThumb from '@/components/slides/SlideThumb'

interface PresentModeProps {
  slides: Slide[]
  theme: Theme
  initialIndex?: number
  onClose: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PresentMode({
  slides,
  theme,
  initialIndex = 0,
  onClose,
}: PresentModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [slideScale, setSlideScale] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [showNotes, setShowNotes] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [isBlankScreen, setIsBlankScreen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbStripRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Touch swipe state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchDeltaRef = useRef(0)

  // Responsive slide scaling
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSlideScale(Math.min(width / 1280, height / 720))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Timer
  useEffect(() => {
    if (showTimer) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1)
      }, 1000)
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [showTimer])

  // Wall-clock time (updates every 15s for efficiency)
  useEffect(() => {
    function updateClock() {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    updateClock()
    const id = setInterval(updateClock, 15000)
    return () => clearInterval(id)
  }, [])

  const goNext = useCallback(() => {
    setDirection('right')
    setCurrentIndex((i) => Math.min(i + 1, slides.length - 1))
  }, [slides.length])

  const goPrev = useCallback(() => {
    setDirection('left')
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'n' || e.key === 'N') setShowNotes((v) => !v)
      else if (e.key === 't' || e.key === 'T') setShowTimer((v) => !v)
      else if (e.key === 'b' || e.key === 'B') setIsBlankScreen((v) => !v)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose])

  // Auto-hide controls after inactivity
  useEffect(() => {
    function handleMouseMove() {
      setShowControls(true)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  // Scroll active thumbnail into view
  useEffect(() => {
    const strip = thumbStripRef.current
    if (!strip) return
    const activeThumb = strip.children[currentIndex] as HTMLElement | undefined
    activeThumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currentIndex])

  // Touch swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    touchDeltaRef.current = 0
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStartRef.current) return
    const touch = e.touches[0]
    if (!touch) return
    touchDeltaRef.current = touch.clientX - touchStartRef.current.x
  }

  function handleTouchEnd() {
    const delta = touchDeltaRef.current
    touchStartRef.current = null
    // Require at least 50px swipe
    if (Math.abs(delta) < 50) return
    if (delta < 0) goNext()
    else goPrev()
  }

  const currentSlide = slides[currentIndex]
  if (!currentSlide) return null

  const nextSlide = slides[currentIndex + 1] ?? null
  const hasNotes = !!currentSlide.speakerNotes

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-[#0A0A0A]"
      onClick={goNext}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar — auto-hides */}
      <div className={`flex h-12 shrink-0 items-center justify-between px-4 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3">
          <p className="rounded-lg bg-white/5 px-3 py-1 text-sm tabular-nums text-white/70">
            {currentIndex + 1} <span className="text-white/30">/</span> {slides.length}
          </p>
          {/* Timer display */}
          {showTimer && (
            <p className="rounded-lg bg-white/5 px-3 py-1 text-sm tabular-nums text-brand-teal">
              {formatTime(elapsedSeconds)}
            </p>
          )}
          {/* Wall-clock time */}
          {currentTime && (
            <p className="text-xs tabular-nums text-white/30">{currentTime}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Timer toggle */}
          <button
            onClick={() => setShowTimer((v) => !v)}
            className={`rounded-lg p-2 transition-colors ${showTimer ? 'bg-brand-teal/20 text-brand-teal' : 'text-white/40 hover:bg-white/10 hover:text-white/70'}`}
            aria-label={showTimer ? 'Hide timer' : 'Show timer'}
            title="Timer (T)"
          >
            <Timer className="h-4 w-4" />
          </button>
          {/* Speaker notes toggle */}
          <button
            onClick={() => setShowNotes((v) => !v)}
            className={`rounded-lg p-2 transition-colors ${showNotes ? 'bg-brand-blue/20 text-brand-blue' : 'text-white/40 hover:bg-white/10 hover:text-white/70'}`}
            aria-label={showNotes ? 'Hide speaker notes' : 'Show speaker notes'}
            title="Speaker notes (N)"
          >
            <StickyNote className="h-4 w-4" />
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Exit presentation"
            title="Exit (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main slide area */}
      <div className={`relative flex flex-1 items-center justify-center px-4 sm:px-8 md:px-16 ${showNotes ? 'pb-0' : ''}`}>
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          disabled={currentIndex === 0}
          aria-label="Previous slide"
          className={`absolute left-4 z-10 rounded-full bg-white/5 p-3 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:invisible ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex flex-1 items-center justify-center gap-4">
          {/* Current slide */}
          <div
            ref={containerRef}
            className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl shadow-black/50"
          >
            <div
              key={`${currentSlide.id}-${currentIndex}`}
              className="absolute left-1/2 top-1/2 origin-center"
              style={{
                width: 1280,
                height: 720,
                transform: `translate(-50%, -50%) scale(${slideScale})`,
                animation: 'present-slide-in 250ms ease-out',
              }}
            >
              <SlideCanvas slide={currentSlide} theme={theme} />
            </div>
          </div>

          {/* Next slide preview (when notes panel is open) */}
          {showNotes && nextSlide && (
            <div
              className="hidden shrink-0 flex-col items-center gap-2 xl:flex"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="flex items-center gap-1 text-[10px] font-medium text-white/30">
                <SkipForward className="h-3 w-3" />
                Next
              </span>
              <div className="w-48 overflow-hidden rounded-lg ring-1 ring-white/10">
                <SlideThumb slide={nextSlide} theme={theme} />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          disabled={currentIndex === slides.length - 1}
          aria-label="Next slide"
          className={`absolute right-4 z-10 rounded-full bg-white/5 p-3 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:invisible ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Speaker notes panel */}
      {showNotes && (
        <div
          className="shrink-0 border-t border-white/10 bg-[#111] px-6 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto max-w-3xl">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/25">
              Speaker Notes
            </p>
            <p className="min-h-[40px] text-sm leading-relaxed text-white/60">
              {hasNotes ? currentSlide.speakerNotes : (
                <span className="italic text-white/20">No speaker notes for this slide</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Thumbnail strip — auto-hides */}
      <div
        className={`shrink-0 border-t border-white/5 bg-black/40 px-4 py-2.5 backdrop-blur-sm transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={thumbStripRef}
          className="flex justify-center gap-2 overflow-x-auto scrollbar-none"
        >
          {slides.map((slide, i) => (
            <SlideThumb
              key={slide.id}
              slide={slide}
              theme={theme}
              active={i === currentIndex}
              onClick={() => {
                setDirection(i > currentIndex ? 'right' : 'left')
                setCurrentIndex(i)
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress bar at very bottom */}
      <div className="h-0.5 shrink-0 bg-white/5">
        <div
          className="h-full bg-brand-blue transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Blank screen overlay (B key) */}
      {isBlankScreen && (
        <div
          className="absolute inset-0 z-[80] flex cursor-pointer items-center justify-center bg-black"
          onClick={() => setIsBlankScreen(false)}
        >
          <p className="text-xs text-white/20">Press B or click to resume</p>
        </div>
      )}

      {/* CSS animation for slide transitions */}
      <style jsx>{`
        @keyframes present-slide-in {
          from {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(${slideScale}) translateX(${direction === 'right' ? '30px' : '-30px'});
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(${slideScale}) translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
