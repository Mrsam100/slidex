'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { Theme } from '@/types/deck'
import SlideCanvas from './SlideCanvas'
import type { Slide } from '@/types/deck'

const STORAGE_KEY = 'slidex-custom-themes'

const PREVIEW_SLIDE: Slide = {
  id: 'preview',
  deckId: 'preview',
  position: 1,
  layout: 'bullets',
  headline: 'Custom Theme Preview',
  bullets: ['First bullet point', 'Second bullet point', 'Third bullet point'],
  createdAt: new Date(),
}

const DEFAULT_CUSTOM: Omit<Theme, 'id' | 'name'> = {
  bgColor: '#FFFFFF',
  textColor: '#444444',
  headlineColor: '#0A0A0A',
  accentColor: '#0047E0',
  fontFamily: 'DM Sans',
  borderRadius: '8px',
}

const FONT_OPTIONS = [
  'DM Sans',
  'Georgia, serif',
  'Courier New, monospace',
  'Impact, sans-serif',
  'Trebuchet MS, sans-serif',
]

const RADIUS_OPTIONS = [
  { label: 'None', value: '0px' },
  { label: 'Small', value: '4px' },
  { label: 'Medium', value: '8px' },
  { label: 'Large', value: '16px' },
  { label: 'XL', value: '20px' },
]

export function loadCustomThemes(): Theme[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Theme[]) : []
  } catch {
    return []
  }
}

function saveCustomThemes(themes: Theme[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes))
  } catch {
    /* storage full or unavailable */
  }
}

interface Props {
  onClose: () => void
  onThemeSaved: () => void
  editTheme?: Theme | null
}

export default function CustomThemeEditor({ onClose, onThemeSaved, editTheme }: Props) {
  const [name, setName] = useState(editTheme?.name ?? '')
  const [theme, setTheme] = useState<Omit<Theme, 'id' | 'name'>>(
    editTheme ? { ...editTheme } : { ...DEFAULT_CUSTOM },
  )

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Enter a theme name')
      return
    }
    const customs = loadCustomThemes()
    const id = editTheme?.id ?? `custom-${Date.now()}`
    const newTheme: Theme = { id, name: trimmed, ...theme }

    if (editTheme) {
      const idx = customs.findIndex((t) => t.id === editTheme.id)
      if (idx >= 0) customs[idx] = newTheme
      else customs.push(newTheme)
    } else {
      customs.push(newTheme)
    }
    saveCustomThemes(customs)
    onThemeSaved()
    onClose()
    toast.success(editTheme ? 'Theme updated' : 'Custom theme created')
  }

  function updateField<K extends keyof Omit<Theme, 'id' | 'name'>>(key: K, val: Theme[K]) {
    setTheme((prev) => ({ ...prev, [key]: val }))
  }

  const previewTheme: Theme = { id: 'preview', name: 'Preview', ...theme }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-bold text-dark">
            {editTheme ? 'Edit Custom Theme' : 'Create Custom Theme'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-grey transition-colors hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Controls */}
          <div className="w-64 shrink-0 space-y-4 overflow-y-auto border-r border-gray-100 p-5">
            {/* Name */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-grey">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Theme"
                maxLength={30}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-dark outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10"
              />
            </div>

            {/* Colors */}
            {([
              ['bgColor', 'Background'],
              ['textColor', 'Body Text'],
              ['headlineColor', 'Headline'],
              ['accentColor', 'Accent'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-grey">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-gray-200"
                  />
                  <input
                    value={theme[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs font-mono text-mid outline-none focus:border-brand-blue"
                    maxLength={7}
                  />
                </div>
              </div>
            ))}

            {/* Font */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-grey">Font</label>
              <select
                value={theme.fontFamily}
                onChange={(e) => updateField('fontFamily', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-dark outline-none focus:border-brand-blue"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f.split(',')[0]}</option>
                ))}
              </select>
            </div>

            {/* Border radius */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-grey">Corners</label>
              <div className="flex flex-wrap gap-1.5">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => updateField('borderRadius', r.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                      theme.borderRadius === r.value
                        ? 'bg-brand-blue text-white'
                        : 'bg-gray-100 text-mid hover:bg-gray-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
            <div className="w-full overflow-hidden rounded-lg shadow-lg" style={{ maxWidth: 480 }}>
              <div className="origin-top-left" style={{ transform: 'scale(0.375)', width: 1280, height: 720 }}>
                <SlideCanvas slide={PREVIEW_SLIDE} theme={previewTheme} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-mid transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-all hover:bg-brand-blue/90 disabled:opacity-50 disabled:shadow-none"
          >
            <Save className="h-3.5 w-3.5" />
            {editTheme ? 'Update Theme' : 'Save Theme'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Manage custom themes list with delete capability */
export function CustomThemeManager({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [customs, setCustoms] = useState<Theme[]>([])

  useEffect(() => {
    setCustoms(loadCustomThemes())
  }, [])

  function handleDelete(id: string) {
    const updated = customs.filter((t) => t.id !== id)
    saveCustomThemes(updated)
    setCustoms(updated)
    onChanged()
    toast.success('Custom theme deleted')
  }

  if (customs.length === 0) return null

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-grey">Custom Themes</p>
      <div className="space-y-1.5">
        {customs.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded" style={{ backgroundColor: t.bgColor, border: '1px solid rgba(0,0,0,0.1)' }} />
              <div className="h-5 w-5 rounded" style={{ backgroundColor: t.accentColor }} />
              <span className="text-xs font-medium text-mid">{t.name}</span>
            </div>
            <button
              onClick={() => handleDelete(t.id)}
              className="rounded-md p-1 text-grey/40 transition-colors hover:bg-red-50 hover:text-error"
              aria-label={`Delete ${t.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
