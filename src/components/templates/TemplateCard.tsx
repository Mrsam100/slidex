'use client'

import { useState } from 'react'
import { Eye, ArrowRight } from 'lucide-react'
import type { Template } from '@/lib/templates'
import type { Theme, Slide } from '@/types/deck'
import SlideCanvas from '@/components/slides/SlideCanvas'

interface TemplateCardProps {
  template: Template
  theme: Theme
  isCloning: boolean
  onUse: () => void
}

/** Convert a template slide to a Slide-like object for SlideCanvas */
function toPreviewSlide(ts: Template['slides'][0], deckId: string): Slide {
  return {
    id: `preview-${ts.position}`,
    deckId,
    position: ts.position,
    layout: ts.layout,
    headline: ts.headline,
    body: ts.body,
    bullets: ts.bullets,
    leftColumn: ts.leftColumn,
    rightColumn: ts.rightColumn,
    quote: ts.quote,
    attribution: ts.attribution,
    speakerNotes: ts.speakerNotes,
    bgImageUrl: ts.bgImageUrl,
    sectionTag: ts.sectionTag,
    createdAt: new Date(),
  }
}

export default function TemplateCard({ template, theme, isCloning, onUse }: TemplateCardProps) {
  const [hovered, setHovered] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const titleSlide = toPreviewSlide(template.slides[0]!, template.id)

  return (
    <>
      {/* Card */}
      <div
        className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Slide preview thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-gray-50">
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: 1280,
              height: 720,
              transform: `scale(${1 / (1280 / 400)})`,
              transformOrigin: 'top left',
            }}
          >
            <SlideCanvas slide={titleSlide} theme={theme} isThumb />
          </div>

          {/* Hover overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center gap-3 bg-black/40 transition-opacity ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              onClick={() => {
                setPreviewIndex(0)
                setPreviewOpen(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-dark shadow-lg backdrop-blur transition-colors hover:bg-white"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={onUse}
              disabled={isCloning}
              className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
            >
              Use template
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-dark">{template.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-grey">{template.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-mid">
              {template.category}
            </span>
            <span className="text-[11px] text-grey">
              {template.slideCount} slides
            </span>
          </div>
        </div>
      </div>

      {/* Full preview modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-dark">{template.name}</h2>
                <p className="text-sm text-grey">{template.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onUse}
                  disabled={isCloning}
                  className="flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  Use this template
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-grey transition-colors hover:bg-gray-100 hover:text-dark"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Slides list — scrollable */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {template.slides.map((ts, i) => {
                const previewSlide = toPreviewSlide(ts, template.id)
                return (
                  <div key={i} className="flex justify-center">
                    <div className="w-full overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                      <div
                        className="relative w-full"
                        style={{ paddingBottom: `${(720 / 1280) * 100}%` }}
                      >
                        <div
                          className="absolute left-0 top-0 origin-top-left"
                          style={{
                            width: 1280,
                            height: 720,
                            transform: `scale(${1 / (1280 / 880)})`,
                            transformOrigin: 'top left',
                          }}
                        >
                          <SlideCanvas slide={previewSlide} theme={theme} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
