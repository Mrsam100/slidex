'use client'

import { useEffect, useState, useRef } from 'react'
import type { Slide, Theme } from '@/types/deck'
import SlideThumb from '@/components/slides/SlideThumb'

interface PresenterWindowProps {
  slides: Slide[]
  theme: Theme
  currentIndex: number
  elapsedSeconds: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Content rendered inside the pop-out presenter window.
 * Receives state from the parent PresentMode via props.
 */
export default function PresenterWindowContent({
  slides,
  theme,
  currentIndex,
  elapsedSeconds,
}: PresenterWindowProps) {
  const [currentTime, setCurrentTime] = useState('')
  const notesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function updateClock() {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    updateClock()
    const id = setInterval(updateClock, 15000)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll notes when slide changes
  useEffect(() => {
    notesRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentIndex])

  const currentSlide = slides[currentIndex]
  const nextSlide = slides[currentIndex + 1] ?? null
  if (!currentSlide) return null

  return (
    <div className="flex h-screen flex-col bg-[#0A0A0A] font-sans text-white">
      {/* Top bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <p className="text-sm font-semibold text-white/70">
          Presenter View
        </p>
        <div className="flex items-center gap-4">
          <p className="text-sm tabular-nums text-brand-teal">
            {formatTime(elapsedSeconds)}
          </p>
          {currentTime && (
            <p className="text-xs tabular-nums text-white/30">{currentTime}</p>
          )}
          <p className="rounded-lg bg-white/5 px-3 py-1 text-sm tabular-nums text-white/70">
            {currentIndex + 1} / {slides.length}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: current + next slide previews */}
        <div className="flex w-1/2 flex-col gap-4 border-r border-white/10 p-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Current Slide
            </p>
            <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
              <SlideThumb slide={currentSlide} theme={theme} />
            </div>
          </div>
          {nextSlide && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Next Slide
              </p>
              <div className="overflow-hidden rounded-lg opacity-70 ring-1 ring-white/10">
                <SlideThumb slide={nextSlide} theme={theme} />
              </div>
            </div>
          )}
          {!nextSlide && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10">
              <p className="text-sm text-white/20">Last slide</p>
            </div>
          )}
        </div>

        {/* Right: speaker notes */}
        <div ref={notesRef} className="flex w-1/2 flex-col overflow-y-auto p-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
            Speaker Notes
          </p>
          {currentSlide.speakerNotes ? (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-white/70">
              {currentSlide.speakerNotes}
            </p>
          ) : (
            <p className="italic text-white/20">No speaker notes for this slide</p>
          )}

          {/* Progress bar */}
          <div className="mt-auto pt-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-brand-blue transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="shrink-0 border-t border-white/10 px-4 py-2.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`shrink-0 rounded-md ring-2 transition-all ${
                i === currentIndex ? 'ring-brand-blue' : i < currentIndex ? 'opacity-40 ring-transparent' : 'ring-transparent opacity-60'
              }`}
            >
              <SlideThumb slide={slide} theme={theme} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
