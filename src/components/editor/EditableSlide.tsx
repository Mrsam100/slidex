'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, ImageIcon, Link2, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Slide, Theme, ChartData } from '@/types/deck'
import ChartEditor from './ChartEditor'

/** Safely coerce a JSON column to string[] */
function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String)
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); if (Array.isArray(p)) return p.map(String) } catch { /* ignore */ }
    return [val]
  }
  return []
}

/** Strip markdown bold/italic */
function stripMd(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/__(.+?)__/g, '$1')
}

interface EditableSlideProps {
  slide: Slide
  theme: Theme
  onSave: (updates: Partial<Slide>) => void
}

/** Debounced auto-save wrapper */
function useDebouncedSave(onSave: (updates: Partial<Slide>) => void, delay: number) {
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

/** contentEditable block — looks like the real slide, just click and type */
function EditableText({
  value,
  onChange,
  className,
  style,
  placeholder,
  tag: Tag = 'div',
  singleLine,
}: {
  value: string
  onChange: (val: string) => void
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  tag?: 'div' | 'span' | 'h1' | 'h2' | 'p'
  singleLine?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const lastValue = useRef(value)

  // Sync from parent only when value actually changes externally (e.g. AI rewrite)
  useEffect(() => {
    if (ref.current && value !== lastValue.current) {
      ref.current.textContent = stripMd(value)
      lastValue.current = value
    }
  }, [value])

  // Set initial content
  useEffect(() => {
    if (ref.current && !ref.current.textContent) {
      ref.current.textContent = stripMd(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      contentEditable
      suppressContentEditableWarning
      className={`outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:opacity-30 ${className ?? ''}`}
      style={style}
      data-placeholder={placeholder}
      onInput={() => {
        const text = ref.current?.textContent ?? ''
        lastValue.current = text
        onChange(text)
      }}
      onKeyDown={(e) => {
        if (singleLine && e.key === 'Enter') {
          e.preventDefault()
        }
      }}
      onPaste={(e) => {
        // Paste as plain text only
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, singleLine ? text.replace(/\n/g, ' ') : text)
      }}
    />
  )
}

export default function EditableSlide({ slide, theme, onSave }: EditableSlideProps) {
  const isFun = !!theme.emojiSet
  const [headline, setHeadline] = useState(stripMd(slide.headline))
  const [body, setBody] = useState(stripMd(slide.body ?? ''))
  const [bullets, setBullets] = useState<string[]>(toArray(slide.bullets).map(stripMd))
  const [leftColumn, setLeftColumn] = useState<string[]>(toArray(slide.leftColumn).map(stripMd))
  const [rightColumn, setRightColumn] = useState<string[]>(toArray(slide.rightColumn).map(stripMd))
  const [quote, setQuote] = useState(stripMd(slide.quote ?? ''))
  const [attribution, setAttribution] = useState(stripMd(slide.attribution ?? ''))
  const [speakerNotes, setSpeakerNotes] = useState(slide.speakerNotes ?? '')
  const [imageUrl, setImageUrl] = useState(slide.imageUrl ?? '')
  const [chartDataState, setChartDataState] = useState<ChartData | undefined>(slide.chartData)
  const [showImageInput, setShowImageInput] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { save, saveStatus } = useDebouncedSave(onSave, 1000)

  useEffect(() => {
    setHeadline(stripMd(slide.headline))
    setBody(stripMd(slide.body ?? ''))
    setBullets(toArray(slide.bullets).map(stripMd))
    setLeftColumn(toArray(slide.leftColumn).map(stripMd))
    setRightColumn(toArray(slide.rightColumn).map(stripMd))
    setQuote(stripMd(slide.quote ?? ''))
    setAttribution(stripMd(slide.attribution ?? ''))
    setSpeakerNotes(slide.speakerNotes ?? '')
    setImageUrl(slide.imageUrl ?? '')
    setChartDataState(slide.chartData)
  }, [slide])

  const latestRef = useRef({ headline, body, bullets, leftColumn, rightColumn, quote, attribution, speakerNotes, imageUrl, chartData: chartDataState })
  latestRef.current = { headline, body, bullets, leftColumn, rightColumn, quote, attribution, speakerNotes, imageUrl, chartData: chartDataState }

  const triggerSave = useCallback(
    (overrides?: Partial<Slide>) => {
      const cur = latestRef.current
      save({
        headline: cur.headline,
        body: cur.body || undefined,
        bullets: cur.bullets.length > 0 ? cur.bullets : undefined,
        leftColumn: cur.leftColumn.length > 0 ? cur.leftColumn : undefined,
        rightColumn: cur.rightColumn.length > 0 ? cur.rightColumn : undefined,
        quote: cur.quote || undefined,
        attribution: cur.attribution || undefined,
        speakerNotes: cur.speakerNotes || undefined,
        imageUrl: cur.imageUrl || undefined,
        chartData: cur.chartData || undefined,
        ...overrides,
      })
    },
    [save],
  )

  function updateHeadline(val: string) { setHeadline(val); triggerSave({ headline: val }) }
  function updateBody(val: string) { setBody(val); triggerSave({ body: val || undefined }) }

  function updateBullet(index: number, val: string) {
    const next = [...bullets]; next[index] = val; setBullets(next); triggerSave({ bullets: next })
  }
  function removeBullet(index: number) {
    const next = bullets.filter((_, i) => i !== index); setBullets(next); triggerSave({ bullets: next.length > 0 ? next : undefined })
  }
  function addBullet() {
    const next = [...bullets, '']; setBullets(next); triggerSave({ bullets: next })
  }

  function updateColumn(side: 'left' | 'right', index: number, val: string) {
    if (side === 'left') {
      const next = [...leftColumn]; next[index] = val; setLeftColumn(next); triggerSave({ leftColumn: next })
    } else {
      const next = [...rightColumn]; next[index] = val; setRightColumn(next); triggerSave({ rightColumn: next })
    }
  }
  function removeColumnItem(side: 'left' | 'right', index: number) {
    if (side === 'left') {
      const next = leftColumn.filter((_, i) => i !== index); setLeftColumn(next); triggerSave({ leftColumn: next.length > 0 ? next : undefined })
    } else {
      const next = rightColumn.filter((_, i) => i !== index); setRightColumn(next); triggerSave({ rightColumn: next.length > 0 ? next : undefined })
    }
  }
  function addColumnItem(side: 'left' | 'right') {
    if (side === 'left') {
      const next = [...leftColumn, '']; setLeftColumn(next); triggerSave({ leftColumn: next })
    } else {
      const next = [...rightColumn, '']; setRightColumn(next); triggerSave({ rightColumn: next })
    }
  }

  async function handleImageUpload(file: File) {
    if (isUploading) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) { toast.error('Use JPEG, PNG, WebP, or GIF images'); return }
    if (file.size > 4 * 1024 * 1024) { toast.error('Image must be under 4 MB'); return }
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) { const data = await res.json().catch(() => ({})); toast.error(data.error || 'Upload failed'); return }
      const { url } = await res.json()
      setImageUrl(url); triggerSave({ imageUrl: url }); setShowImageInput(false)
    } catch { toast.error('Upload failed') } finally { setIsUploading(false) }
  }

  function handleDrop(e: React.DragEvent) { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleImageUpload(file) }
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = '' }

  /* ─── Bullet row: seamless editable text with marker ─── */
  function BulletRow({ value, index, onUpdate, onRemove, emojiIndex }: {
    value: string; index: number; onUpdate: (val: string) => void; onRemove: () => void; emojiIndex?: number
  }) {
    return (
      <div className="group/bullet flex items-start gap-5">
        {isFun && theme.emojiSet ? (
          <span className="shrink-0 pt-0.5 text-2xl">{theme.emojiSet[(emojiIndex ?? index) % theme.emojiSet.length]}</span>
        ) : (
          <span className="mt-2.5 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: theme.accentColor }} />
        )}
        <div className="min-w-0 flex-1">
          <EditableText
            value={value}
            onChange={onUpdate}
            className="text-xl leading-relaxed"
            placeholder="Type here..."
            singleLine
          />
        </div>
        <button
          onClick={onRemove}
          className="mt-1 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium opacity-0 transition-opacity hover:bg-black/10 group-hover/bullet:opacity-40"
          aria-label="Remove"
        >
          &times;
        </button>
      </div>
    )
  }

  return (
    <div
      className="relative h-[720px] w-[1280px] shrink-0 overflow-hidden"
      style={{
        backgroundColor: theme.bgColor,
        ...(theme.bgGradient ? { backgroundImage: theme.bgGradient } : {}),
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        borderRadius: theme.borderRadius,
      }}
    >
      {/* Mesh gradient overlays */}
      {theme.bgGradient && !isFun && (
        <>
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 80%, rgba(249,115,22,0.3) 0%, transparent 70%)' }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(14,165,233,0.2) 0%, transparent 70%)' }} />
        </>
      )}
      {isFun && theme.emojiSet && <FunEmojiBackground slidePosition={slide.position} emojiSet={theme.emojiSet} />}
      {!theme.bgGradient && !isFun && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(${theme.accentColor} 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }} />
      )}

      {/* Save indicator */}
      <span
        aria-live="polite"
        className={`absolute right-4 top-3 z-10 text-[11px] font-medium transition-opacity ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-50'}`}
      >
        {saveStatus === 'pending' && 'Saving...'}
        {saveStatus === 'saved' && 'Saved'}
      </span>

      {/* ─── Title layout ─── */}
      {slide.layout === 'title' && (
        <div className="flex h-full flex-col items-center justify-center px-24 py-16 text-center">
          <div className="mb-8 h-1 w-16 rounded-full" style={{ backgroundColor: theme.accentColor }} />
          <EditableText
            value={headline}
            onChange={updateHeadline}
            className="w-full text-center text-[3.5rem] font-bold leading-[1.15] tracking-tight"
            style={{ color: theme.headlineColor }}
            placeholder="Headline"
            singleLine
          />
          <EditableText
            value={body}
            onChange={updateBody}
            className="mt-8 max-w-2xl text-center text-xl leading-relaxed opacity-65"
            placeholder="Body text (optional)"
          />
        </div>
      )}

      {/* ─── Bullets layout ─── */}
      {slide.layout === 'bullets' && (
        <div className="flex h-full flex-col p-16 pr-20">
          {!isFun && (
            <div className="absolute bottom-16 left-16 top-16 w-1 rounded-full" style={{ backgroundColor: theme.accentColor, opacity: 0.2 }} />
          )}
          <EditableText
            value={headline}
            onChange={updateHeadline}
            className="pl-6 text-[2.75rem] font-bold leading-[1.2] tracking-tight"
            style={{ color: theme.headlineColor }}
            placeholder="Headline"
            singleLine
          />
          <div className="mt-10 flex-1 space-y-6 pl-6">
            {bullets.map((bullet, i) => (
              <BulletRow key={i} value={bullet} index={i} onUpdate={(val) => updateBullet(i, val)} onRemove={() => removeBullet(i)} />
            ))}
          </div>
          {bullets.length < 10 && (
            <button onClick={addBullet} className="mt-3 flex items-center gap-1.5 self-start rounded-md px-3 py-1.5 pl-6 text-sm opacity-30 transition-opacity hover:opacity-60">
              <Plus className="h-3.5 w-3.5" /> Add bullet
            </button>
          )}
        </div>
      )}

      {/* ─── Two-column layout ─── */}
      {slide.layout === 'two-column' && (
        <div className="flex h-full flex-col p-16">
          <EditableText
            value={headline}
            onChange={updateHeadline}
            className="text-[2.75rem] font-bold leading-[1.2] tracking-tight"
            style={{ color: theme.headlineColor }}
            placeholder="Headline"
            singleLine
          />
          <div className="relative mt-10 grid flex-1 grid-cols-2 gap-16">
            <div className="absolute left-1/2 top-0 h-[80%] w-px -translate-x-1/2" style={{ backgroundColor: theme.accentColor, opacity: 0.15 }} />
            {(['left', 'right'] as const).map((side) => {
              const items = side === 'left' ? leftColumn : rightColumn
              return (
                <div key={side}>
                  <div className="space-y-5">
                    {items.map((item, i) => (
                      <BulletRow
                        key={i}
                        value={item}
                        index={i}
                        emojiIndex={side === 'left' ? i : i + 5}
                        onUpdate={(val) => updateColumn(side, i, val)}
                        onRemove={() => removeColumnItem(side, i)}
                      />
                    ))}
                  </div>
                  {items.length < 10 && (
                    <button onClick={() => addColumnItem(side)} className="mt-3 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm opacity-30 transition-opacity hover:opacity-60">
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
        <div className="flex h-full flex-col items-center justify-center p-20 text-center">
          <div className="font-serif text-[120px] leading-none" style={{ color: theme.accentColor, opacity: 0.15 }}>&ldquo;</div>
          <EditableText
            value={quote}
            onChange={(val) => { setQuote(val); triggerSave({ quote: val || undefined }) }}
            className="-mt-8 max-w-3xl text-center text-[1.75rem] font-medium italic leading-relaxed"
            style={{ color: theme.headlineColor }}
            placeholder="Quote text"
          />
          <div className="mt-10 flex items-center gap-3">
            <div className="h-px w-8" style={{ backgroundColor: theme.accentColor, opacity: 0.4 }} />
            <EditableText
              value={attribution}
              onChange={(val) => { setAttribution(val); triggerSave({ attribution: val || undefined }) }}
              className="text-center text-sm font-medium uppercase tracking-wide opacity-60"
              placeholder="Attribution"
              singleLine
            />
            <div className="h-px w-8" style={{ backgroundColor: theme.accentColor, opacity: 0.4 }} />
          </div>
        </div>
      )}

      {/* ─── Image-text layout ─── */}
      {slide.layout === 'image-text' && (
        <div className="flex h-full">
          <div className="flex w-[55%] flex-col justify-center p-16 pr-12">
            <EditableText
              value={headline}
              onChange={updateHeadline}
              className="text-[2.75rem] font-bold leading-[1.2] tracking-tight"
              style={{ color: theme.headlineColor }}
              placeholder="Headline"
              singleLine
            />
            <EditableText
              value={body}
              onChange={updateBody}
              className="mt-6 text-xl leading-relaxed opacity-70"
              placeholder="Body text (optional)"
            />
            {bullets.length > 0 && (
              <div className="mt-6 space-y-3">
                {bullets.map((bullet, i) => (
                  <BulletRow key={i} value={bullet} index={i} emojiIndex={i + 2} onUpdate={(val) => updateBullet(i, val)} onRemove={() => removeBullet(i)} />
                ))}
              </div>
            )}
          </div>
          <div
            className={`group/img relative w-[45%] overflow-hidden transition-all ${isDragOver ? 'ring-4 ring-inset ring-brand-blue/50' : ''}`}
            style={{ backgroundColor: imageUrl ? undefined : theme.accentColor, opacity: imageUrl ? 1 : 0.15 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelect} />
            {isUploading ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                <span className="text-sm font-medium text-mid">Uploading...</span>
              </div>
            ) : imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 transition-opacity group-hover/img:opacity-100">
                  <button onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-black/50 p-2 text-white hover:bg-black/70" aria-label="Upload new image"><Upload className="h-4 w-4" /></button>
                  <button onClick={() => setShowImageInput(true)} className="rounded-lg bg-black/50 p-2 text-white hover:bg-black/70" aria-label="Change image URL"><Link2 className="h-4 w-4" /></button>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 opacity-60 transition-opacity hover:opacity-100">
                {isDragOver ? (
                  <><Upload className="h-10 w-10 text-brand-blue" /><span className="text-sm font-medium text-brand-blue">Drop image here</span></>
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-sm font-medium">Drag an image here</span>
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-black/10 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-black/20">Browse files</button>
                      <button onClick={() => setShowImageInput(true)} className="rounded-lg bg-black/10 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-black/20">Paste URL</button>
                    </div>
                  </>
                )}
              </div>
            )}
            {showImageInput && (
              <div className="absolute inset-x-4 bottom-4 z-20 rounded-xl bg-white p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0 text-grey" />
                  <input
                    autoFocus type="url" value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { triggerSave({ imageUrl: imageUrl || undefined }); setShowImageInput(false) }; if (e.key === 'Escape') setShowImageInput(false) }}
                    placeholder="Paste image URL..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-dark outline-none placeholder:text-grey/50"
                  />
                  <button onClick={() => { triggerSave({ imageUrl: imageUrl || undefined }); setShowImageInput(false) }} className="shrink-0 rounded-lg bg-brand-blue px-3 py-1 text-xs font-medium text-white hover:bg-brand-blue/90">Save</button>
                  {imageUrl && <button onClick={() => { setImageUrl(''); triggerSave({ imageUrl: undefined }); setShowImageInput(false) }} className="shrink-0 rounded-lg px-2 py-1 text-xs text-error hover:bg-red-50">Remove</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Chart layout ─── */}
      {slide.layout === 'chart' && (
        <div className="flex h-full flex-col p-12">
          <EditableText
            value={headline}
            onChange={updateHeadline}
            className="text-[2.25rem] font-bold leading-[1.2] tracking-tight"
            style={{ color: theme.headlineColor }}
            placeholder="Chart headline"
            singleLine
          />
          <div className="mt-4 flex-1 overflow-hidden">
            <ChartEditor chartData={chartDataState} theme={theme} onSave={(newData) => { setChartDataState(newData); triggerSave({ chartData: newData }) }} />
          </div>
        </div>
      )}

      {/* ─── Fallback ─── */}
      {!['title', 'bullets', 'two-column', 'quote', 'image-text', 'chart'].includes(slide.layout) && (
        <div className="flex h-full flex-col p-16">
          <EditableText value={headline} onChange={updateHeadline} className="text-5xl font-bold" style={{ color: theme.headlineColor }} placeholder="Headline" singleLine />
          <EditableText value={body} onChange={updateBody} className="mt-4 text-xl leading-relaxed opacity-80" placeholder="Body text" />
        </div>
      )}

      {/* Speaker notes */}
      <div className="absolute bottom-0 left-0 right-16 border-t px-6 py-2.5" style={{ borderColor: `${theme.textColor}15` }}>
        <EditableText
          value={speakerNotes}
          onChange={(val) => { setSpeakerNotes(val); triggerSave({ speakerNotes: val || undefined }) }}
          className="text-[11px] opacity-40"
          placeholder="Speaker notes..."
        />
      </div>

      {/* Slide number */}
      <span className="absolute bottom-3 right-6 text-[11px] font-medium opacity-30">
        {isFun ? `${slide.position}` : slide.position}
      </span>
    </div>
  )
}

/** Scattered emoji background for the Fun theme */
function FunEmojiBackground({ slidePosition, emojiSet }: { slidePosition: number; emojiSet: string[] }) {
  const positions = getEmojiPositions(slidePosition, emojiSet)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {positions.map((ep, i) => (
        <span key={i} className="absolute select-none" style={{ left: `${ep.x}%`, top: `${ep.y}%`, fontSize: `${ep.size}px`, opacity: ep.opacity, transform: `rotate(${ep.rotate}deg)` }}>
          {ep.emoji}
        </span>
      ))}
    </div>
  )
}

function getEmojiPositions(slidePosition: number, emojiSet: string[]) {
  const count = 12
  const positions: { x: number; y: number; size: number; opacity: number; rotate: number; emoji: string }[] = []
  let seed = slidePosition * 7919
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 2147483647 }
  for (let i = 0; i < count; i++) {
    positions.push({
      x: rand() * 90 + 2, y: rand() * 85 + 5, size: 28 + rand() * 24,
      opacity: 0.08 + rand() * 0.12, rotate: -30 + rand() * 60,
      emoji: emojiSet[Math.floor(rand() * emojiSet.length)] ?? '',
    })
  }
  return positions
}
