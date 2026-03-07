'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Wand2, Loader2, Check, RotateCcw } from 'lucide-react'
import type { Slide } from '@/types/deck'

interface RewritePopoverProps {
  slide: Slide
  onAccept: (updates: Partial<Slide>) => void
}

type PopoverState = 'closed' | 'input' | 'loading' | 'preview'

const SUGGESTION_CHIPS = [
  'Make it shorter',
  'More professional',
  'Add a statistic',
  'Simplify the language',
  'Make it persuasive',
] as const

interface RewriteResult {
  headline?: string
  body?: string
  bullets?: string[]
  leftColumn?: string[]
  rightColumn?: string[]
  quote?: string
  attribution?: string
  speakerNotes?: string
}

export default function RewritePopover({ slide, onAccept }: RewritePopoverProps) {
  const [state, setState] = useState<PopoverState>('closed')
  const [instruction, setInstruction] = useState('')
  const [result, setResult] = useState<RewriteResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleClose = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState('closed')
    setInstruction('')
    setResult(null)
    setError(null)
  }, [])

  // Abort on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  // Close on click outside / Escape
  useEffect(() => {
    if (state === 'closed') return
    function handleMouseDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [state, handleClose])

  // Focus input when popover opens
  useEffect(() => {
    if (state === 'input') {
      inputRef.current?.focus()
    }
  }, [state])

  const handleOpen = useCallback(() => {
    setState('input')
    setInstruction('')
    setResult(null)
    setError(null)
  }, [])

  const handleRewrite = useCallback(async () => {
    if (!instruction.trim() || instruction.trim().length < 3) return
    setState('loading')
    setError(null)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`/api/slides/${slide.id}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: instruction.trim() }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error('Rewrite failed')
      }

      const data = (await res.json()) as RewriteResult
      setResult(data)
      setState('preview')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Rewrite failed. Try again.')
      setState('input')
    }
  }, [instruction, slide.id])

  const handleAccept = useCallback(() => {
    if (!result) return
    onAccept(result)
    handleClose()
  }, [result, onAccept, handleClose])

  if (state === 'closed') {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-lg bg-black/10 px-3 py-1.5 text-xs font-medium text-dark/70 backdrop-blur transition-colors hover:bg-black/20 hover:text-dark"
        title="AI Rewrite"
      >
        <Wand2 className="h-3.5 w-3.5" />
        Rewrite
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleClose}
        className="flex items-center gap-1.5 rounded-lg bg-brand-blue/20 px-3 py-1.5 text-xs font-medium text-brand-blue backdrop-blur transition-colors hover:bg-brand-blue/30"
      >
        <Wand2 className="h-3.5 w-3.5" />
        Rewrite
      </button>

      <div
        ref={popoverRef}
        className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xl shadow-black/10"
      >
        {state === 'input' && (
          <>
            <p className="mb-2 text-xs font-medium text-dark">
              How should I rewrite this?
            </p>
            <input
              ref={inputRef}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRewrite()
              }}
              placeholder="e.g. Make it more concise"
              maxLength={200}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setInstruction(chip)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-mid transition-colors hover:border-brand-blue/30 hover:bg-brand-blue/5 hover:text-brand-blue"
                >
                  {chip}
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-error">{error}</p>
            )}
            <button
              onClick={handleRewrite}
              disabled={instruction.trim().length < 3}
              className="mt-3 w-full rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-all hover:bg-brand-blue/90 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
            >
              Rewrite
            </button>
          </>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
            <p className="mt-2 text-sm text-grey">Rewriting...</p>
          </div>
        )}

        {state === 'preview' && result && (
          <>
            <p className="mb-2 text-xs font-medium text-dark">Preview</p>
            <div className="max-h-48 overflow-y-auto rounded-xl bg-gray-50 p-4 text-sm text-dark ring-1 ring-gray-100">
              {result.headline && (
                <p className="font-semibold">{result.headline}</p>
              )}
              {result.body && (
                <p className="mt-1 text-grey">{result.body}</p>
              )}
              {result.bullets && result.bullets.length > 0 && (
                <ul className="mt-1 list-disc pl-4 text-grey">
                  {result.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
              {result.quote && (
                <p className="mt-1 italic text-grey">&ldquo;{result.quote}&rdquo;</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleClose}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-mid transition-colors hover:bg-gray-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Revert
              </button>
              <button
                onClick={handleAccept}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-all hover:bg-brand-blue/90"
              >
                <Check className="h-3.5 w-3.5" />
                Accept
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
