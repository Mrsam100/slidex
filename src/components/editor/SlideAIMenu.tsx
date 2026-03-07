'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  Send,
  LayoutGrid,
  Pencil,
  SpellCheck,
  Languages,
  AlignLeft,
  AlignJustify,
  Lightbulb,
  Target,
  ImageIcon,
  BarChart3,
  Eye,
  ChevronLeft,
  ChevronDown,
  Plus,
  MoreVertical,
  Copy,
  Trash2,
  MoveUp,
  MoveDown,
  Type,
  List,
  Columns2,
  Quote,
} from 'lucide-react'
import type { Slide, SlideLayout, ChartData } from '@/types/deck'
import { SUPPORTED_LANGUAGES } from '@/lib/ai'

/* ── Public interfaces ── */

export interface SlideAIMenuProps {
  slide: Slide
  onAccept: (updates: Partial<Slide>) => void
  onLayoutChange?: (layout: SlideLayout) => void
  onDuplicate?: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  canDelete?: boolean
}

/* ── Internal types ── */

type AIState = 'menu' | 'translate' | 'loading' | 'preview'
type ActiveDropdown = 'none' | 'more' | 'layout' | 'ai'

interface RewriteResult {
  headline?: string
  body?: string
  bullets?: string[]
  leftColumn?: string[]
  rightColumn?: string[]
  quote?: string
  attribution?: string
  speakerNotes?: string
  chartData?: ChartData
}

const LAYOUT_OPTIONS: { id: SlideLayout; label: string; icon: React.ReactNode }[] = [
  { id: 'title', label: 'Title', icon: <Type className="h-3.5 w-3.5" /> },
  { id: 'bullets', label: 'Bullets', icon: <List className="h-3.5 w-3.5" /> },
  { id: 'two-column', label: 'Two Column', icon: <Columns2 className="h-3.5 w-3.5" /> },
  { id: 'quote', label: 'Quote', icon: <Quote className="h-3.5 w-3.5" /> },
  { id: 'image-text', label: 'Image + Text', icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { id: 'chart', label: 'Chart', icon: <BarChart3 className="h-3.5 w-3.5" /> },
]

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* MAIN COMPONENT — Gamma-style 3-button toolbar   */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function SlideAIMenu({
  slide,
  onAccept,
  onLayoutChange,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  canDelete,
}: SlideAIMenuProps) {
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>('none')
  const [aiState, setAiState] = useState<AIState>('menu')
  const [instruction, setInstruction] = useState('')
  const [result, setResult] = useState<RewriteResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionLabel, setActionLabel] = useState('')
  const toolbarRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const closeAll = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setActiveDropdown('none')
    setAiState('menu')
    setInstruction('')
    setResult(null)
    setError(null)
    setActionLabel('')
  }, [])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  // Close on outside click / Escape
  useEffect(() => {
    if (activeDropdown === 'none') return
    function handleMouseDown(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) closeAll()
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAll()
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [activeDropdown, closeAll])

  // Auto-focus textarea when AI menu opens
  useEffect(() => {
    if (activeDropdown === 'ai' && aiState === 'menu') {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [activeDropdown, aiState])

  function toggleDropdown(dd: ActiveDropdown) {
    if (activeDropdown === dd) {
      closeAll()
    } else {
      closeAll()
      setActiveDropdown(dd)
      if (dd === 'ai') setAiState('menu')
    }
  }

  /* ─── AI Rewrite ─── */
  async function handleRewrite(instr: string, label?: string) {
    if (!instr.trim() || instr.trim().length < 3) return
    setAiState('loading')
    setError(null)
    setActionLabel(label || instr)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`/api/slides/${slide.id}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: instr.trim() }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error('Rewrite failed')
      const data = (await res.json()) as RewriteResult
      setResult(data)
      setAiState('preview')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Failed. Try again.')
      setAiState('menu')
    }
  }

  function handleAccept() {
    if (!result) return
    onAccept(result)
    closeAll()
  }

  function handleTryNewLayout() {
    if (!onLayoutChange) return
    const others = LAYOUT_OPTIONS.filter((l) => l.id !== slide.layout)
    const pick = others[Math.floor(Math.random() * others.length)]!
    onLayoutChange(pick.id)
    closeAll()
  }

  /* ─── Shared trigger button style ─── */
  const btnBase =
    'flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[11px] font-medium transition-all backdrop-blur-sm'
  const btnIdle = `${btnBase} bg-white/90 text-dark/60 shadow-sm ring-1 ring-black/[0.08] hover:bg-white hover:text-dark hover:shadow-md`
  const btnActive = `${btnBase} bg-brand-blue/10 text-brand-blue shadow-sm ring-1 ring-brand-blue/20`

  return (
    <div ref={toolbarRef} className="relative flex items-center gap-1">
      {/* ─── Button 1: More (⋮) ─── */}
      <button
        onClick={() => toggleDropdown('more')}
        className={activeDropdown === 'more' ? btnActive : btnIdle}
        title="More options"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {/* ─── Button 2: Layout (⊘ ∨) ─── */}
      <button
        onClick={() => toggleDropdown('layout')}
        className={activeDropdown === 'layout' ? btnActive : btnIdle}
        title="Change layout"
      >
        <LayoutGrid className="h-3 w-3" />
        <ChevronDown className="h-2.5 w-2.5 opacity-50" />
      </button>

      {/* ─── Button 3: AI (✦ ∨) ─── */}
      <button
        onClick={() => toggleDropdown('ai')}
        className={activeDropdown === 'ai' ? btnActive : btnIdle}
        title="Edit with AI"
      >
        <Sparkles className="h-3 w-3" />
        <ChevronDown className="h-2.5 w-2.5 opacity-50" />
      </button>

      {/* ━━━ Dropdown: More Options ━━━ */}
      {activeDropdown === 'more' && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-2xl shadow-black/10">
          {canMoveUp && onMoveUp && (
            <DropdownItem icon={<MoveUp className="h-3.5 w-3.5" />} label="Move up" onClick={() => { onMoveUp(); closeAll() }} />
          )}
          {canMoveDown && onMoveDown && (
            <DropdownItem icon={<MoveDown className="h-3.5 w-3.5" />} label="Move down" onClick={() => { onMoveDown(); closeAll() }} />
          )}
          {onDuplicate && (
            <DropdownItem icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate" onClick={() => { onDuplicate(); closeAll() }} />
          )}
          {canDelete && onDelete && (
            <DropdownItem icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" onClick={() => { onDelete(); closeAll() }} danger />
          )}
        </div>
      )}

      {/* ━━━ Dropdown: Layout Picker ━━━ */}
      {activeDropdown === 'layout' && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-2xl shadow-black/10">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onLayoutChange?.(opt.id); closeAll() }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                opt.id === slide.layout
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

      {/* ━━━ Dropdown: AI Edit Menu (Gamma-style) ━━━ */}
      {activeDropdown === 'ai' && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[360px] rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-black/10">
          {/* ─ Main Menu ─ */}
          {aiState === 'menu' && (
            <div className="p-4 pb-3">
              <p className="mb-2.5 text-[13px] font-semibold text-dark">Edit this card</p>

              {/* Custom instruction input — Gamma style with + and send */}
              <div className="relative rounded-xl border-2 border-brand-blue/40 bg-white transition-colors focus-within:border-brand-blue">
                <textarea
                  ref={textareaRef}
                  className="w-full resize-none bg-transparent px-3.5 pb-9 pt-2.5 text-[13px] text-dark outline-none placeholder:text-grey/40"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (instruction.trim().length >= 3) handleRewrite(instruction, 'Custom edit')
                    }
                  }}
                  placeholder="How would you like to edit this card?"
                  rows={2}
                  maxLength={300}
                />
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
                  <button
                    className="rounded-full p-1 text-grey/40 transition-colors hover:bg-gray-100 hover:text-grey"
                    title="Add context"
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (instruction.trim().length >= 3) handleRewrite(instruction, 'Custom edit')
                    }}
                    disabled={instruction.trim().length < 3}
                    className="rounded-full bg-brand-blue p-1.5 text-white shadow-sm transition-all hover:bg-brand-blue/90 disabled:bg-gray-200 disabled:text-grey/40 disabled:shadow-none"
                    aria-label="Send"
                    type="button"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {error && <p className="mt-1.5 text-xs text-error">{error}</p>}

              {/* Quick Actions */}
              <div className="mt-3.5 space-y-3">
                {/* Try new layout */}
                {onLayoutChange && (
                  <button
                    onClick={handleTryNewLayout}
                    className="flex items-center gap-2 text-[12.5px] font-medium text-mid transition-colors hover:text-brand-blue"
                    type="button"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Try new layout
                  </button>
                )}

                {/* Writing */}
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-dark/40">Writing</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill icon={<Pencil className="h-3 w-3" />} label="Improve writing" onClick={() => handleRewrite('Improve the writing quality. Make it more engaging, vivid, and professional. Fix any awkward phrasing.', 'Improve writing')} />
                    <Pill icon={<SpellCheck className="h-3 w-3" />} label="Fix spelling & grammar" onClick={() => handleRewrite('Fix all spelling and grammar errors. Keep the meaning and tone exactly the same.', 'Fix spelling & grammar')} />
                    <Pill icon={<Languages className="h-3 w-3" />} label="Translate" onClick={() => setAiState('translate')} />
                    <Pill icon={<AlignJustify className="h-3 w-3" />} label="Make longer" onClick={() => handleRewrite('Expand the content. Add more detail, examples, and supporting points. Make bullet points more descriptive. Add body text if missing.', 'Make longer')} />
                    <Pill icon={<AlignLeft className="h-3 w-3" />} label="Make shorter" onClick={() => handleRewrite('Make all content more concise. Cut unnecessary words. Shorten bullet points to under 10 words each. Remove filler.', 'Make shorter')} />
                    <Pill icon={<Lightbulb className="h-3 w-3" />} label="Simplify language" onClick={() => handleRewrite('Simplify all language to an 8th-grade reading level. Replace jargon with plain words. Keep the same meaning.', 'Simplify language')} />
                    <Pill icon={<Target className="h-3 w-3" />} label="Be more specific" onClick={() => handleRewrite('Replace vague statements with specific examples, real numbers, concrete data points, and named references. Make every claim verifiable.', 'Be more specific')} />
                  </div>
                </div>

                {/* Image */}
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-dark/40">Image</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill icon={<Eye className="h-3 w-3" />} label="Make this more visual" onClick={() => handleRewrite('Rewrite this content to be more visual and descriptive. Use vivid imagery and metaphors. Add an imageQuery field with 2-3 specific keywords for a relevant photo.', 'Make more visual')} />
                    <Pill icon={<ImageIcon className="h-3 w-3" />} label="Add an image" onClick={() => { onLayoutChange?.('image-text'); closeAll() }} />
                    <Pill icon={<BarChart3 className="h-3 w-3" />} label="Add a chart" onClick={() => { onLayoutChange?.('chart'); closeAll() }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─ Translate picker ─ */}
          {aiState === 'translate' && (
            <div className="p-4">
              <button onClick={() => setAiState('menu')} className="mb-2 flex items-center gap-1 text-[11px] font-medium text-grey transition-colors hover:text-dark" type="button">
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <p className="mb-3 text-xs font-semibold text-dark">Translate to</p>
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-2 gap-0.5">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleRewrite(
                        `Translate ALL content (headline, body, bullets, quotes, speaker notes) to ${lang.name}. Keep JSON keys in English. Preserve the meaning and tone exactly.`,
                        `Translate to ${lang.name}`,
                      )}
                      className="rounded-lg px-3 py-2 text-left text-xs font-medium text-mid transition-colors hover:bg-brand-blue/5 hover:text-brand-blue"
                      type="button"
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─ Loading ─ */}
          {aiState === 'loading' && (
            <div className="flex flex-col items-center px-4 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10">
                <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
              </div>
              <p className="mt-3 text-sm font-medium text-dark">{actionLabel}</p>
              <p className="mt-1 text-xs text-grey">Working on it...</p>
            </div>
          )}

          {/* ─ Preview ─ */}
          {aiState === 'preview' && result && (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-dark">Preview</p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  {actionLabel}
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl bg-gray-50 p-4 text-sm ring-1 ring-gray-100">
                {result.headline && <p className="font-semibold text-dark">{result.headline}</p>}
                {result.body && <p className="mt-1.5 text-grey">{result.body}</p>}
                {result.bullets && result.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-4">
                    {result.bullets.map((b, i) => <li key={i} className="list-disc text-grey">{b}</li>)}
                  </ul>
                )}
                {result.leftColumn && result.leftColumn.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-grey">Left</p>
                    <ul className="mt-0.5 space-y-0.5 pl-4">
                      {result.leftColumn.map((item, i) => <li key={i} className="list-disc text-grey">{item}</li>)}
                    </ul>
                  </div>
                )}
                {result.rightColumn && result.rightColumn.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-grey">Right</p>
                    <ul className="mt-0.5 space-y-0.5 pl-4">
                      {result.rightColumn.map((item, i) => <li key={i} className="list-disc text-grey">{item}</li>)}
                    </ul>
                  </div>
                )}
                {result.quote && <p className="mt-2 italic text-grey">&ldquo;{result.quote}&rdquo;</p>}
                {result.attribution && <p className="mt-0.5 text-[11px] text-grey/60">&mdash; {result.attribution}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={closeAll}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-mid transition-colors hover:bg-gray-50"
                  type="button"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Discard
                </button>
                <button
                  onClick={handleAccept}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-all hover:bg-brand-blue/90"
                  type="button"
                >
                  <Check className="h-3.5 w-3.5" />
                  Accept
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Dropdown menu item ─── */
function DropdownItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
        danger ? 'text-error hover:bg-red-50' : 'text-mid hover:bg-gray-50 hover:text-dark'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

/* ─── Pill button (action chip) ─── */
function Pill({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-mid transition-colors hover:border-brand-blue/30 hover:bg-brand-blue/5 hover:text-brand-blue"
    >
      {icon}
      {label}
    </button>
  )
}
