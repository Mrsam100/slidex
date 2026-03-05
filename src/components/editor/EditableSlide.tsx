'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, ImageIcon, Link2 } from 'lucide-react'
import type { Slide, Theme } from '@/types/deck'

interface EditableSlideProps {
  slide: Slide
  theme: Theme
  onSave: (updates: Partial<Slide>) => void
}

/** Debounced auto-save wrapper — flushes on unmount */
function useDebouncedSave(
  onSave: (updates: Partial<Slide>) => void,
  delay: number,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Partial<Slide> | null>(null)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saved'>('idle')

  const save = useCallback(
    (updates: Partial<Slide>) => {
      setSaveStatus('pending')
      pendingRef.current = updates
      if (timerRef.current) clearTimeout(timerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          onSaveRef.current(pendingRef.current)
          pendingRef.current = null
        }
        setSaveStatus('saved')
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
      }, delay)
    },
    [delay],
  )

  // Flush pending save on unmount (don't lose last edit)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      if (pendingRef.current) {
        onSaveRef.current(pendingRef.current)
        pendingRef.current = null
      }
    }
  }, [])

  return { save, saveStatus }
}

export default function EditableSlide({ slide, theme, onSave }: EditableSlideProps) {
  const [headline, setHeadline] = useState(slide.headline)
  const [body, setBody] = useState(slide.body ?? '')
  const [bullets, setBullets] = useState<string[]>(slide.bullets ?? [])
  const [leftColumn, setLeftColumn] = useState<string[]>(slide.leftColumn ?? [])
  const [rightColumn, setRightColumn] = useState<string[]>(slide.rightColumn ?? [])
  const [quote, setQuote] = useState(slide.quote ?? '')
  const [attribution, setAttribution] = useState(slide.attribution ?? '')
  const [speakerNotes, setSpeakerNotes] = useState(slide.speakerNotes ?? '')
  const [imageUrl, setImageUrl] = useState(slide.imageUrl ?? '')
  const [showImageInput, setShowImageInput] = useState(false)

  const { save, saveStatus } = useDebouncedSave(onSave, 1000)

  // Sync state when slide changes (e.g. after AI rewrite accept)
  useEffect(() => {
    setHeadline(slide.headline)
    setBody(slide.body ?? '')
    setBullets(slide.bullets ?? [])
    setLeftColumn(slide.leftColumn ?? [])
    setRightColumn(slide.rightColumn ?? [])
    setQuote(slide.quote ?? '')
    setAttribution(slide.attribution ?? '')
    setSpeakerNotes(slide.speakerNotes ?? '')
    setImageUrl(slide.imageUrl ?? '')
  }, [slide])

  // Collect current state and trigger save
  const triggerSave = useCallback(
    (overrides?: Partial<Slide>) => {
      save({
        headline,
        body: body || undefined,
        bullets: bullets.length > 0 ? bullets : undefined,
        leftColumn: leftColumn.length > 0 ? leftColumn : undefined,
        rightColumn: rightColumn.length > 0 ? rightColumn : undefined,
        quote: quote || undefined,
        attribution: attribution || undefined,
        speakerNotes: speakerNotes || undefined,
        imageUrl: imageUrl || undefined,
        ...overrides,
      })
    },
    [save, headline, body, bullets, leftColumn, rightColumn, quote, attribution, speakerNotes, imageUrl],
  )

  function updateHeadline(val: string) {
    setHeadline(val)
    triggerSave({ headline: val })
  }

  function updateBody(val: string) {
    setBody(val)
    triggerSave({ body: val || undefined })
  }

  function updateBullet(index: number, val: string) {
    const next = [...bullets]
    next[index] = val
    setBullets(next)
    triggerSave({ bullets: next })
  }

  function removeBullet(index: number) {
    const next = bullets.filter((_, i) => i !== index)
    setBullets(next)
    triggerSave({ bullets: next.length > 0 ? next : undefined })
  }

  function addBullet() {
    const next = [...bullets, '']
    setBullets(next)
  }

  function updateColumn(side: 'left' | 'right', index: number, val: string) {
    if (side === 'left') {
      const next = [...leftColumn]
      next[index] = val
      setLeftColumn(next)
      triggerSave({ leftColumn: next })
    } else {
      const next = [...rightColumn]
      next[index] = val
      setRightColumn(next)
      triggerSave({ rightColumn: next })
    }
  }

  function removeColumnItem(side: 'left' | 'right', index: number) {
    if (side === 'left') {
      const next = leftColumn.filter((_, i) => i !== index)
      setLeftColumn(next)
      triggerSave({ leftColumn: next.length > 0 ? next : undefined })
    } else {
      const next = rightColumn.filter((_, i) => i !== index)
      setRightColumn(next)
      triggerSave({ rightColumn: next.length > 0 ? next : undefined })
    }
  }

  function addColumnItem(side: 'left' | 'right') {
    if (side === 'left') {
      setLeftColumn([...leftColumn, ''])
    } else {
      setRightColumn([...rightColumn, ''])
    }
  }

  const inputClass =
    'w-full bg-transparent outline-none placeholder:opacity-40 focus:ring-1 focus:ring-blue-400/30 rounded px-1 -mx-1'

  return (
    <div
      className="relative h-[720px] w-[1280px] shrink-0 overflow-hidden"
      style={{
        backgroundColor: theme.bgColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        borderRadius: theme.borderRadius,
      }}
    >
      {/* Save indicator */}
      <span className="absolute right-4 top-3 z-10 text-xs opacity-60">
        {saveStatus === 'pending' && 'Saving...'}
        {saveStatus === 'saved' && 'Saved'}
      </span>

      {/* ─── Title layout ─── */}
      {slide.layout === 'title' && (
        <div className="flex h-full flex-col items-center justify-center p-16 text-center">
          <input
            className={`${inputClass} text-center text-5xl font-bold leading-tight`}
            style={{ color: theme.headlineColor }}
            value={headline}
            onChange={(e) => updateHeadline(e.target.value)}
            placeholder="Headline"
            maxLength={200}
          />
          <textarea
            className={`${inputClass} mt-6 max-w-2xl resize-none text-center text-xl leading-relaxed opacity-80`}
            value={body}
            onChange={(e) => updateBody(e.target.value)}
            placeholder="Body text (optional)"
            rows={2}
            maxLength={2000}
          />
          <div
            className="mt-8 h-1 w-24"
            style={{ backgroundColor: theme.accentColor }}
          />
        </div>
      )}

      {/* ─── Bullets layout ─── */}
      {slide.layout === 'bullets' && (
        <div className="flex h-full flex-col p-16">
          <input
            className={`${inputClass} text-5xl font-bold`}
            style={{ color: theme.headlineColor }}
            value={headline}
            onChange={(e) => updateHeadline(e.target.value)}
            placeholder="Headline"
            maxLength={200}
          />
          <ul className="mt-8 flex-1 space-y-4">
            {bullets.map((bullet, i) => (
              <li key={i} className="group flex items-start gap-4">
                <span
                  className="mt-2.5 h-3 w-3 shrink-0"
                  style={{ backgroundColor: theme.accentColor }}
                />
                <input
                  className={`${inputClass} flex-1 text-lg`}
                  value={bullet}
                  onChange={(e) => updateBullet(i, e.target.value)}
                  placeholder="Bullet point"
                  maxLength={500}
                />
                <button
                  onClick={() => removeBullet(i)}
                  className="mt-1 shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-60"
                  aria-label="Remove bullet"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {bullets.length < 10 && (
            <button
              onClick={addBullet}
              className="mt-2 flex items-center gap-1 self-start rounded px-2 py-1 text-sm opacity-50 transition-opacity hover:opacity-80"
            >
              <Plus className="h-3.5 w-3.5" /> Add bullet
            </button>
          )}
        </div>
      )}

      {/* ─── Two-column layout ─── */}
      {slide.layout === 'two-column' && (
        <div className="flex h-full flex-col p-12">
          <input
            className={`${inputClass} text-5xl font-bold`}
            style={{ color: theme.headlineColor }}
            value={headline}
            onChange={(e) => updateHeadline(e.target.value)}
            placeholder="Headline"
            maxLength={200}
          />
          <div className="mt-8 grid flex-1 grid-cols-2 gap-12">
            {(['left', 'right'] as const).map((side) => {
              const items = side === 'left' ? leftColumn : rightColumn
              return (
                <div key={side}>
                  <ul className="space-y-3">
                    {items.map((item, i) => (
                      <li key={i} className="group flex items-start gap-3">
                        <span
                          className="mt-2.5 h-3 w-3 shrink-0"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                        <input
                          className={`${inputClass} flex-1 text-lg`}
                          value={item}
                          onChange={(e) => updateColumn(side, i, e.target.value)}
                          placeholder="Column item"
                          maxLength={500}
                        />
                        <button
                          onClick={() => removeColumnItem(side, i)}
                          className="mt-1 shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-60"
                          aria-label="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {items.length < 10 && (
                    <button
                      onClick={() => addColumnItem(side)}
                      className="mt-2 flex items-center gap-1 rounded px-2 py-1 text-sm opacity-50 transition-opacity hover:opacity-80"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add item
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Quote layout ─── */}
      {slide.layout === 'quote' && (
        <div className="flex h-full flex-col items-center justify-center p-16 text-center">
          <div
            className="font-serif text-7xl leading-none opacity-20"
            style={{ color: theme.accentColor }}
          >
            &ldquo;
          </div>
          <textarea
            className={`${inputClass} mt-2 max-w-3xl resize-none text-center text-3xl font-medium italic leading-relaxed`}
            style={{ color: theme.headlineColor }}
            value={quote}
            onChange={(e) => {
              setQuote(e.target.value)
              triggerSave({ quote: e.target.value || undefined })
            }}
            placeholder="Quote text"
            rows={3}
            maxLength={1000}
          />
          <input
            className={`${inputClass} mt-6 text-center text-base opacity-60`}
            value={attribution}
            onChange={(e) => {
              setAttribution(e.target.value)
              triggerSave({ attribution: e.target.value || undefined })
            }}
            placeholder="— Attribution"
            maxLength={200}
          />
        </div>
      )}

      {/* ─── Image-text layout ─── */}
      {slide.layout === 'image-text' && (
        <div className="flex h-full">
          <div className="flex w-[55%] flex-col justify-center p-16">
            <input
              className={`${inputClass} text-5xl font-bold`}
              style={{ color: theme.headlineColor }}
              value={headline}
              onChange={(e) => updateHeadline(e.target.value)}
              placeholder="Headline"
              maxLength={200}
            />
            <textarea
              className={`${inputClass} mt-4 resize-none text-xl leading-relaxed opacity-80`}
              value={body}
              onChange={(e) => updateBody(e.target.value)}
              placeholder="Body text (optional)"
              rows={3}
              maxLength={2000}
            />
            {bullets.length > 0 && (
              <ul className="mt-6 space-y-3">
                {bullets.map((bullet, i) => (
                  <li key={i} className="group flex items-start gap-3">
                    <span
                      className="mt-2.5 h-3 w-3 shrink-0"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    <input
                      className={`${inputClass} flex-1 text-lg`}
                      value={bullet}
                      onChange={(e) => updateBullet(i, e.target.value)}
                      placeholder="Bullet point"
                      maxLength={500}
                    />
                    <button
                      onClick={() => removeBullet(i)}
                      className="mt-1 shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-60"
                      aria-label="Remove bullet"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div
            className="group/img relative w-[45%] overflow-hidden"
            style={{ backgroundColor: imageUrl ? undefined : theme.accentColor, opacity: imageUrl ? 1 : 0.15 }}
          >
            {imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => setShowImageInput(true)}
                  className="absolute bottom-2 right-2 rounded-lg bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover/img:opacity-100"
                  aria-label="Change image"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowImageInput(true)}
                className="flex h-full w-full flex-col items-center justify-center gap-2 opacity-60 transition-opacity hover:opacity-100"
              >
                <ImageIcon className="h-10 w-10" />
                <span className="text-sm font-medium">Add image</span>
              </button>
            )}
            {showImageInput && (
              <div className="absolute inset-x-4 bottom-4 z-20 rounded-xl bg-white p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0 text-grey" />
                  <input
                    autoFocus
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        triggerSave({ imageUrl: imageUrl || undefined })
                        setShowImageInput(false)
                      }
                      if (e.key === 'Escape') setShowImageInput(false)
                    }}
                    placeholder="Paste image URL..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-dark outline-none placeholder:text-grey/50"
                  />
                  <button
                    onClick={() => {
                      triggerSave({ imageUrl: imageUrl || undefined })
                      setShowImageInput(false)
                    }}
                    className="shrink-0 rounded-lg bg-brand-blue px-3 py-1 text-xs font-medium text-white hover:bg-brand-blue/90"
                  >
                    Save
                  </button>
                  {imageUrl && (
                    <button
                      onClick={() => {
                        setImageUrl('')
                        triggerSave({ imageUrl: undefined })
                        setShowImageInput(false)
                      }}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs text-error hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Fallback ─── */}
      {!['title', 'bullets', 'two-column', 'quote', 'image-text'].includes(slide.layout) && (
        <div className="flex h-full flex-col p-16">
          <input
            className={`${inputClass} text-5xl font-bold`}
            style={{ color: theme.headlineColor }}
            value={headline}
            onChange={(e) => updateHeadline(e.target.value)}
            placeholder="Headline"
            maxLength={200}
          />
          <textarea
            className={`${inputClass} mt-4 resize-none text-xl leading-relaxed opacity-80`}
            value={body}
            onChange={(e) => updateBody(e.target.value)}
            placeholder="Body text"
            rows={3}
            maxLength={2000}
          />
        </div>
      )}

      {/* Speaker notes (shared, bottom edge) */}
      <div className="absolute bottom-0 left-0 right-0 border-t px-6 py-3" style={{ borderColor: `${theme.textColor}20` }}>
        <textarea
          className={`${inputClass} resize-none text-xs opacity-50`}
          value={speakerNotes}
          onChange={(e) => {
            setSpeakerNotes(e.target.value)
            triggerSave({ speakerNotes: e.target.value || undefined })
          }}
          placeholder="Speaker notes..."
          rows={1}
          maxLength={2000}
        />
      </div>

      {/* Slide number */}
      <span className="absolute bottom-4 right-6 text-xs opacity-40">
        {slide.position}
      </span>
    </div>
  )
}
