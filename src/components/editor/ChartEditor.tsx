'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Hash,
  Palette,
  GripVertical,
} from 'lucide-react'
import type { ChartData, ChartType, ChartDataset, Theme } from '@/types/deck'
import ChartRenderer, { CHART_TYPES, createDefaultChartData } from '@/components/slides/ChartRenderer'

interface ChartEditorProps {
  chartData: ChartData | undefined
  theme: Theme
  onSave: (data: ChartData) => void
}

const PRESET_COLORS = [
  '#0047E0', '#009E91', '#F59E0B', '#8B5CF6', '#EF4444',
  '#06B6D4', '#EC4899', '#10B981', '#F97316', '#6366F1',
  '#84CC16', '#14B8A6', '#A855F7', '#F43F5E', '#0EA5E9',
]

export default function ChartEditor({ chartData, theme, onSave }: ChartEditorProps) {
  const [data, setData] = useState<ChartData>(
    () => chartData ?? createDefaultChartData(theme.accentColor),
  )

  // Sync when external chartData changes (e.g. AI rewrite)
  useEffect(() => {
    if (chartData) setData(chartData)
  }, [chartData])

  const update = useCallback(
    (next: ChartData) => {
      setData(next)
      onSave(next)
    },
    [onSave],
  )

  return (
    <div className="flex h-full flex-col">
      {/* Live preview */}
      <div className="flex items-center justify-center rounded-xl border border-dashed border-black/10 bg-white/50 p-4"
        style={{ minHeight: 280 }}
      >
        <ChartRenderer data={data} theme={theme} width={520} height={260} />
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4 overflow-y-auto">
        <ChartTypePicker current={data.type} onSelect={(type) => update({ ...data, type })} />
        <DataGrid data={data} onUpdate={update} />
        <OptionsRow data={data} onUpdate={update} />
      </div>
    </div>
  )
}

/* ── Chart Type Picker ── */
function ChartTypePicker({ current, onSelect }: { current: ChartType; onSelect: (t: ChartType) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CHART_TYPES.map((ct) => (
        <button
          key={ct.type}
          onClick={() => onSelect(ct.type)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            ct.type === current
              ? 'bg-brand-blue text-white shadow-sm'
              : 'bg-gray-100 text-mid hover:bg-gray-200 hover:text-dark'
          }`}
        >
          {ct.icon ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={ct.icon} />
            </svg>
          ) : (
            <span className="text-[10px]">{ct.type === 'pie' ? '\u25CF' : '\u25CE'}</span>
          )}
          {ct.label}
        </button>
      ))}
    </div>
  )
}

/* ── Data Grid (spreadsheet-like editing) ── */
function DataGrid({ data, onUpdate }: { data: ChartData; onUpdate: (d: ChartData) => void }) {
  const isPieType = data.type === 'pie' || data.type === 'donut'

  function updateLabel(index: number, value: string) {
    const labels = [...data.labels]
    labels[index] = value
    onUpdate({ ...data, labels })
  }

  function updateValue(datasetIndex: number, labelIndex: number, raw: string) {
    const num = parseFloat(raw)
    const datasets = data.datasets.map((ds, di) => {
      if (di !== datasetIndex) return ds
      const values = [...ds.values]
      values[labelIndex] = isNaN(num) ? 0 : num
      return { ...ds, values }
    })
    onUpdate({ ...data, datasets })
  }

  function updateDatasetLabel(index: number, label: string) {
    const datasets = data.datasets.map((ds, di) =>
      di === index ? { ...ds, label } : ds,
    )
    onUpdate({ ...data, datasets })
  }

  function updateDatasetColor(index: number, color: string) {
    const datasets = data.datasets.map((ds, di) =>
      di === index ? { ...ds, color } : ds,
    )
    onUpdate({ ...data, datasets })
  }

  function addLabel() {
    const labels = [...data.labels, `Item ${data.labels.length + 1}`]
    const datasets = data.datasets.map((ds) => ({
      ...ds,
      values: [...ds.values, 0],
    }))
    onUpdate({ ...data, labels, datasets })
  }

  function removeLabel(index: number) {
    if (data.labels.length <= 1) return
    const labels = data.labels.filter((_, i) => i !== index)
    const datasets = data.datasets.map((ds) => ({
      ...ds,
      values: ds.values.filter((_, i) => i !== index),
    }))
    onUpdate({ ...data, labels, datasets })
  }

  function addDataset() {
    const newDs: ChartDataset = {
      label: `Series ${data.datasets.length + 1}`,
      values: data.labels.map(() => Math.floor(Math.random() * 80 + 10)),
      color: PRESET_COLORS[data.datasets.length % PRESET_COLORS.length],
    }
    onUpdate({ ...data, datasets: [...data.datasets, newDs] })
  }

  function removeDataset(index: number) {
    if (data.datasets.length <= 1) return
    onUpdate({ ...data, datasets: data.datasets.filter((_, i) => i !== index) })
  }

  const cellClass =
    'w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-dark outline-none transition-colors focus:border-brand-blue/40 focus:bg-white hover:bg-gray-50'
  const numClass =
    'w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-dark tabular-nums outline-none transition-colors focus:border-brand-blue/40 focus:bg-white hover:bg-gray-50 text-center'

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Dataset headers + color pickers */}
      <div className="flex items-center border-b border-gray-100 px-2 py-1.5">
        <div className="w-28 shrink-0 px-2 text-[10px] font-semibold uppercase tracking-wider text-grey">
          Labels
        </div>
        {data.datasets.map((ds, di) => (
          <div key={di} className="flex min-w-[100px] flex-1 items-center gap-1 px-1">
            <ColorPicker
              color={ds.color || PRESET_COLORS[di % PRESET_COLORS.length]!}
              onChange={(c) => updateDatasetColor(di, c)}
            />
            <input
              className={`${cellClass} flex-1 font-medium`}
              value={ds.label}
              onChange={(e) => updateDatasetLabel(di, e.target.value)}
              placeholder="Series name"
            />
            {data.datasets.length > 1 && (
              <button
                onClick={() => removeDataset(di)}
                className="shrink-0 rounded p-0.5 text-grey/50 transition-colors hover:bg-red-50 hover:text-error"
                aria-label="Remove dataset"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {!isPieType && (
          <button
            onClick={addDataset}
            className="ml-1 shrink-0 rounded-lg p-1 text-grey/50 transition-colors hover:bg-gray-100 hover:text-brand-blue"
            aria-label="Add dataset"
            title="Add series"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Data rows */}
      <div className="max-h-48 overflow-y-auto">
        {data.labels.map((label, li) => (
          <div
            key={li}
            className="group flex items-center border-b border-gray-50 px-2 py-0.5 transition-colors hover:bg-gray-50/50"
          >
            <div className="w-28 shrink-0">
              <input
                className={cellClass}
                value={label}
                onChange={(e) => updateLabel(li, e.target.value)}
                placeholder={`Label ${li + 1}`}
              />
            </div>
            {data.datasets.map((ds, di) => (
              <div key={di} className="min-w-[100px] flex-1 px-1">
                <input
                  className={numClass}
                  type="number"
                  step="any"
                  value={ds.values[li] ?? 0}
                  onChange={(e) => updateValue(di, li, e.target.value)}
                />
              </div>
            ))}
            <button
              onClick={() => removeLabel(li)}
              className={`shrink-0 rounded p-0.5 text-grey/30 transition-all hover:bg-red-50 hover:text-error ${
                data.labels.length <= 1 ? 'invisible' : 'opacity-0 group-hover:opacity-100'
              }`}
              aria-label="Remove row"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add row */}
      <div className="border-t border-gray-100 px-2 py-1.5">
        <button
          onClick={addLabel}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium text-grey transition-colors hover:bg-gray-50 hover:text-brand-blue"
        >
          <Plus className="h-3 w-3" /> Add data point
        </button>
      </div>
    </div>
  )
}

/* ── Options Row (legend, values, unit) ── */
function OptionsRow({ data, onUpdate }: { data: ChartData; onUpdate: (d: ChartData) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => onUpdate({ ...data, showLegend: !data.showLegend })}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
          data.showLegend
            ? 'bg-brand-teal/10 text-brand-teal'
            : 'bg-gray-100 text-grey hover:bg-gray-200'
        }`}
      >
        {data.showLegend ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        Legend
      </button>
      <button
        onClick={() => onUpdate({ ...data, showValues: !data.showValues })}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
          data.showValues
            ? 'bg-brand-teal/10 text-brand-teal'
            : 'bg-gray-100 text-grey hover:bg-gray-200'
        }`}
      >
        <Hash className="h-3 w-3" />
        Values
      </button>
      <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-grey">Unit</span>
        <input
          className="w-16 bg-transparent text-xs text-dark outline-none placeholder:text-grey/40"
          value={data.unit ?? ''}
          onChange={(e) => onUpdate({ ...data, unit: e.target.value || undefined })}
          placeholder="e.g. %"
          maxLength={10}
        />
      </div>
    </div>
  )
}

/* ── Compact Color Picker ── */
function ColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-5 w-5 shrink-0 rounded-md border border-gray-200 transition-shadow hover:shadow-md"
        style={{ backgroundColor: color }}
        aria-label="Pick color"
      />
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
          <div className="grid grid-cols-5 gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false) }}
                className={`h-6 w-6 rounded-md border-2 transition-transform hover:scale-110 ${
                  c === color ? 'border-dark shadow-sm' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 border-t border-gray-100 pt-2">
            <Palette className="h-3 w-3 text-grey" />
            <input
              type="text"
              value={color}
              onChange={(e) => {
                const val = e.target.value
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) onChange(val)
              }}
              className="w-20 rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-dark outline-none focus:ring-1 focus:ring-brand-blue/30"
              maxLength={7}
            />
          </div>
        </div>
      )}
    </div>
  )
}
