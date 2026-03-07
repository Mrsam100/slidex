'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Link2,
  Check,
} from 'lucide-react'
import type { Slide, Theme } from '@/types/deck'
import SlideCanvas from '@/components/slides/SlideCanvas'
import SlideThumb from '@/components/slides/SlideThumb'

interface PublicDeckViewerProps {
  title: string
  slides: Slide[]
  theme: Theme
}

export default function PublicDeckViewer({
  title,
  slides,
  theme,
}: PublicDeckViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideScale, setSlideScale] = useState(1)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const thumbStripRef = useRef<HTMLDivElement>(null)

  // Touch swipe
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
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      else if (e.key === 'Escape' && isFullscreen) exitFullscreen()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, isFullscreen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fullscreen change listener
  useEffect(() => {
    function handleChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  // Scroll active thumbnail into view
  useEffect(() => {
    const strip = thumbStripRef.current
    if (!strip) return
    const activeThumb = strip.children[currentIndex] as HTMLElement | undefined
    activeThumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currentIndex])

  // Touch handlers
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
    if (Math.abs(delta) < 50) return
    if (delta < 0) goNext()
    else goPrev()
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      rootRef.current?.requestFullscreen().catch(() => {})
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable
    }
  }

  const currentSlide = slides[currentIndex]
  if (!currentSlide) return null

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0A]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 sm:px-6">
        <Link href="/" className="text-sm font-bold tracking-tight text-brand-blue">
          SlideX
        </Link>
        <h1 className="max-w-md truncate text-sm font-semibold text-white/90">
          {title}
        </h1>
        <div className="flex items-center gap-1.5">
          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            aria-label="Copy link"
            title="Copy link"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-brand-teal" />
                <span className="hidden text-brand-teal sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copy link</span>
              </>
            )}
          </button>
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            title="Fullscreen (F)"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
          {/* Slide counter */}
          <p className="ml-1 text-xs tabular-nums text-white/40">
            {currentIndex + 1} / {slides.length}
          </p>
        </div>
      </div>

      {/* Main slide area */}
      <div className="relative flex flex-1 items-center justify-center px-4 sm:px-8 md:px-16">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          aria-label="Previous slide"
          className="absolute left-2 z-10 rounded-full bg-white/5 p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:invisible sm:left-4 sm:p-3"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div
          ref={containerRef}
          className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl shadow-2xl"
        >
          <div
            key={`${currentSlide.id}-${currentIndex}`}
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: 1280,
              height: 720,
              transform: `scale(${slideScale})`,
              animation: 'public-slide-in 250ms ease-out',
            }}
          >
            <SlideCanvas slide={currentSlide} theme={theme} />
          </div>
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex === slides.length - 1}
          aria-label="Next slide"
          className="absolute right-2 z-10 rounded-full bg-white/5 p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:invisible sm:right-4 sm:p-3"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#0A0A0A] px-4 py-3">
        <div
          ref={thumbStripRef}
          className="flex gap-3 overflow-x-auto scrollbar-none"
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

      {/* SlideX branding banner */}
      <div className="flex items-center justify-center border-t border-white/[0.06] bg-[#050505] py-2.5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
        >
          Made with <span className="font-bold text-brand-blue">SlideX</span> <span className="text-white/20">&middot;</span> Create your own &rarr;
        </Link>
      </div>

      {/* CSS animation for slide transitions */}
      <style jsx>{`
        @keyframes public-slide-in {
          from {
            opacity: 0.4;
            transform: scale(${slideScale}) translateX(${direction === 'right' ? '20px' : '-20px'});
          }
          to {
            opacity: 1;
            transform: scale(${slideScale}) translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
