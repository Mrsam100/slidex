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
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbStripRef = useRef<HTMLDivElement>(null)

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
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose])

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
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0A0A0A]">
      {/* Close button */}
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <p className="text-sm text-white/50">
          {currentIndex + 1} / {slides.length}
        </p>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Exit presentation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main slide area */}
      <div className="relative flex flex-1 items-center justify-center px-16">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          aria-label="Previous slide"
          className="absolute left-4 z-10 rounded-full bg-white/5 p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:invisible"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          ref={containerRef}
          className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl shadow-2xl"
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: 1280, height: 720, transform: `scale(${slideScale})` }}
          >
            <SlideCanvas slide={currentSlide} theme={theme} />
          </div>
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex === slides.length - 1}
          aria-label="Next slide"
          className="absolute right-4 z-10 rounded-full bg-white/5 p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:invisible"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3">
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
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
