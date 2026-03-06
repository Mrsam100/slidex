'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
      setSlideScale(Math.min(width / 1280, height / 720))
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
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])

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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0A]">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-6">
        <Link href="/" className="text-sm font-bold tracking-tight text-brand-blue">
          SlideX
        </Link>
        <h1 className="max-w-md truncate text-sm font-semibold text-white/90">
          {title}
        </h1>
        <p className="text-xs tabular-nums text-white/40">
          {currentIndex + 1} / {slides.length}
        </p>
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
            key={currentSlide.id}
            className="absolute left-0 top-0 origin-top-left animate-in fade-in duration-300"
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
              onClick={() => setCurrentIndex(i)}
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
    </div>
  )
}
