'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Slide, Theme } from '@/types/deck'
import SlideCanvas from '@/components/slides/SlideCanvas'
import SlideThumb from '@/components/slides/SlideThumb'

interface PresentModeProps {
  slides: Slide[]
  theme: Theme
  initialIndex?: number
  onClose: () => void
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
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbStripRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Responsive slide scaling
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      const scaleX = width / 1280
      const scaleY = height / 720
      setSlideScale(Math.min(scaleX, scaleY))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, slides.length - 1))
  }, [slides.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') goPrev()
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

  const currentSlide = slides[currentIndex]
  if (!currentSlide) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-[#0A0A0A]"
      onClick={goNext}
    >
      {/* Top bar — auto-hides */}
      <div className={`flex h-12 shrink-0 items-center justify-between px-4 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <p className="rounded-lg bg-white/5 px-3 py-1 text-sm tabular-nums text-white/70">
          {currentIndex + 1} <span className="text-white/30">/</span> {slides.length}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Exit presentation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main slide area */}
      <div className="relative flex flex-1 items-center justify-center px-16">
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          disabled={currentIndex === 0}
          aria-label="Previous slide"
          className={`absolute left-4 z-10 rounded-full bg-white/5 p-3 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:invisible ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          ref={containerRef}
          className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl shadow-black/50"
        >
          <div
            key={currentSlide.id}
            className="absolute left-1/2 top-1/2 origin-center animate-in fade-in duration-300"
            style={{ width: 1280, height: 720, transform: `translate(-50%, -50%) scale(${slideScale})` }}
          >
            <SlideCanvas slide={currentSlide} theme={theme} />
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          disabled={currentIndex === slides.length - 1}
          aria-label="Next slide"
          className={`absolute right-4 z-10 rounded-full bg-white/5 p-3 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:invisible ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

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
              onClick={() => setCurrentIndex(i)}
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
    </div>
  )
}
