'use client'

import { memo } from 'react'
import type { ChartData, ChartType, Theme } from '@/types/deck'

interface ChartRendererProps {
  data: ChartData
  theme: Theme
  width?: number
  height?: number
  isThumb?: boolean
}

/** Generate a palette of harmonious colors from theme accent */
function generatePalette(accent: string, count: number): string[] {
  const base = [
    accent,
    '#009E91', // teal
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#EF4444', // red
    '#06B6D4', // cyan
    '#EC4899', // pink
    '#10B981', // emerald
    '#F97316', // orange
    '#6366F1', // indigo
  ]
  return Array.from({ length: count }, (_, i) => base[i % base.length]!)
}

function getDatasetColor(dataset: { color?: string }, index: number, palette: string[]): string {
  return dataset.color || palette[index % palette.length]!
}

/** Format numbers nicely: 1000 -> 1K, 1000000 -> 1M */
function formatValue(val: number, unit?: string): string {
  const u = unit || ''
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M${u}`
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}K${u}`
  return `${val}${u}`
}

export default memo(function ChartRenderer({
  data,
  theme,
  width = 580,
  height = 420,
  isThumb,
}: ChartRendererProps) {
  const palette = generatePalette(theme.accentColor, 10)
  const t = isThumb
  const fontSize = t ? 8 : 13
  const titleSize = t ? 10 : 15

  switch (data.type) {
    case 'bar':
      return <BarChart data={data} theme={theme} palette={palette} w={width} h={height} fontSize={fontSize} isThumb={t} />
    case 'horizontal-bar':
      return <HorizontalBarChart data={data} theme={theme} palette={palette} w={width} h={height} fontSize={fontSize} isThumb={t} />
    case 'pie':
      return <PieChart data={data} theme={theme} palette={palette} w={width} h={height} fontSize={fontSize} isThumb={t} donut={false} />
    case 'donut':
      return <PieChart data={data} theme={theme} palette={palette} w={width} h={height} fontSize={fontSize} isThumb={t} donut />
    case 'line':
      return <LineChart data={data} theme={theme} palette={palette} w={width} h={height} fontSize={fontSize} isThumb={t} fill={false} />
    case 'area':
      return <LineChart data={data} theme={theme} palette={palette} w={width} h={height} fontSize={fontSize} isThumb={t} fill />
    default:
      return <BarChart data={data} theme={theme} palette={palette} w={width} h={height} fontSize={fontSize} isThumb={t} />
  }
})

/* ──────────────────────────────────────────────── */
/*  BAR CHART                                       */
/* ──────────────────────────────────────────────── */
function BarChart({
  data, theme, palette, w, h, fontSize, isThumb,
}: { data: ChartData; theme: Theme; palette: string[]; w: number; h: number; fontSize: number; isThumb?: boolean }) {
  const pad = { top: 30, right: 20, bottom: 50, left: 60 }
  const cw = w - pad.left - pad.right
  const ch = h - pad.top - pad.bottom

  const allValues = data.datasets.flatMap((d) => d.values)
  const maxVal = Math.max(...allValues, 1)
  const minVal = Math.min(0, ...allValues)
  const range = maxVal - minVal || 1

  const groupCount = data.labels.length
  const barSets = data.datasets.length
  const groupWidth = cw / groupCount
  const barWidth = Math.min(groupWidth * 0.7 / barSets, 60)
  const groupPad = (groupWidth - barWidth * barSets) / 2

  // Grid lines
  const gridLines = 5
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => minVal + (range * i) / gridLines)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {gridValues.map((val, i) => {
        const y = pad.top + ch - ((val - minVal) / range) * ch
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke={theme.textColor} strokeOpacity={0.08} strokeDasharray="4 3" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fill={theme.textColor} fillOpacity={0.4} fontSize={fontSize - 2} fontFamily={theme.fontFamily}>
              {formatValue(val, data.unit)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.labels.map((label, li) => (
        <g key={li}>
          {data.datasets.map((ds, di) => {
            const val = ds.values[li] ?? 0
            const barH = Math.abs(((val - minVal) / range) * ch)
            const x = pad.left + li * groupWidth + groupPad + di * barWidth
            const y = pad.top + ch - barH
            const color = getDatasetColor(ds, di, palette)
            return (
              <g key={di}>
                <rect x={x} y={y} width={barWidth - 2} height={barH} rx={3} fill={color} fillOpacity={0.85}>
                  {!isThumb && <animate attributeName="height" from="0" to={String(barH)} dur="0.5s" fill="freeze" />}
                  {!isThumb && <animate attributeName="y" from={String(pad.top + ch)} to={String(y)} dur="0.5s" fill="freeze" />}
                </rect>
                {data.showValues && !isThumb && (
                  <text x={x + (barWidth - 2) / 2} y={y - 6} textAnchor="middle" fill={theme.textColor} fillOpacity={0.6} fontSize={fontSize - 2} fontFamily={theme.fontFamily}>
                    {formatValue(val, data.unit)}
                  </text>
                )}
              </g>
            )
          })}
          {/* X-axis labels */}
          <text
            x={pad.left + li * groupWidth + groupWidth / 2}
            y={h - pad.bottom + 20}
            textAnchor="middle"
            fill={theme.textColor}
            fillOpacity={0.5}
            fontSize={fontSize - 1}
            fontFamily={theme.fontFamily}
          >
            {label.length > 12 ? label.slice(0, 11) + '...' : label}
          </text>
        </g>
      ))}

      {/* Legend */}
      {data.showLegend !== false && barSets > 1 && (
        <Legend datasets={data.datasets} palette={palette} x={pad.left} y={8} fontSize={fontSize} theme={theme} />
      )}
    </svg>
  )
}

/* ──────────────────────────────────────────────── */
/*  HORIZONTAL BAR CHART                            */
/* ──────────────────────────────────────────────── */
function HorizontalBarChart({
  data, theme, palette, w, h, fontSize, isThumb,
}: { data: ChartData; theme: Theme; palette: string[]; w: number; h: number; fontSize: number; isThumb?: boolean }) {
  const pad = { top: 30, right: 30, bottom: 20, left: 120 }
  const cw = w - pad.left - pad.right
  const ch = h - pad.top - pad.bottom

  const allValues = data.datasets.flatMap((d) => d.values)
  const maxVal = Math.max(...allValues, 1)

  const rowCount = data.labels.length
  const barSets = data.datasets.length
  const rowHeight = ch / rowCount
  const barHeight = Math.min(rowHeight * 0.7 / barSets, 30)
  const rowPad = (rowHeight - barHeight * barSets) / 2

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.labels.map((label, li) => (
        <g key={li}>
          {/* Y-axis label */}
          <text
            x={pad.left - 10}
            y={pad.top + li * rowHeight + rowHeight / 2 + 4}
            textAnchor="end"
            fill={theme.textColor}
            fillOpacity={0.5}
            fontSize={fontSize - 1}
            fontFamily={theme.fontFamily}
          >
            {label.length > 15 ? label.slice(0, 14) + '...' : label}
          </text>

          {data.datasets.map((ds, di) => {
            const val = ds.values[li] ?? 0
            const barW = (val / maxVal) * cw
            const y = pad.top + li * rowHeight + rowPad + di * barHeight
            const color = getDatasetColor(ds, di, palette)
            return (
              <g key={di}>
                <rect x={pad.left} y={y} width={barW} height={barHeight - 2} rx={3} fill={color} fillOpacity={0.85}>
                  {!isThumb && <animate attributeName="width" from="0" to={String(barW)} dur="0.5s" fill="freeze" />}
                </rect>
                {data.showValues && !isThumb && (
                  <text x={pad.left + barW + 8} y={y + (barHeight - 2) / 2 + 4} fill={theme.textColor} fillOpacity={0.6} fontSize={fontSize - 2} fontFamily={theme.fontFamily}>
                    {formatValue(val, data.unit)}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      ))}

      {data.showLegend !== false && barSets > 1 && (
        <Legend datasets={data.datasets} palette={palette} x={pad.left} y={8} fontSize={fontSize} theme={theme} />
      )}
    </svg>
  )
}

/* ──────────────────────────────────────────────── */
/*  PIE / DONUT CHART                               */
/* ──────────────────────────────────────────────── */
function PieChart({
  data, theme, palette, w, h, fontSize, isThumb, donut,
}: { data: ChartData; theme: Theme; palette: string[]; w: number; h: number; fontSize: number; isThumb?: boolean; donut: boolean }) {
  const cx = w / 2
  const cy = h / 2 + 10
  const r = Math.min(w, h) * 0.35
  const innerR = donut ? r * 0.55 : 0

  // Use first dataset values
  const values = data.datasets[0]?.values ?? []
  const total = values.reduce((s, v) => s + Math.max(v, 0), 0) || 1

  let currentAngle = -Math.PI / 2

  const slices = values.map((val, i) => {
    const pct = Math.max(val, 0) / total
    const startAngle = currentAngle
    const endAngle = currentAngle + pct * 2 * Math.PI
    currentAngle = endAngle
    return { val, pct, startAngle, endAngle, label: data.labels[i] ?? '', color: palette[i % palette.length]! }
  })

  function arcPath(startAngle: number, endAngle: number, outerR: number, innerRadius: number): string {
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    const sx = cx + outerR * Math.cos(startAngle)
    const sy = cy + outerR * Math.sin(startAngle)
    const ex = cx + outerR * Math.cos(endAngle)
    const ey = cy + outerR * Math.sin(endAngle)

    if (innerRadius === 0) {
      return `M ${cx} ${cy} L ${sx} ${sy} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ex} ${ey} Z`
    }

    const isx = cx + innerRadius * Math.cos(startAngle)
    const isy = cy + innerRadius * Math.sin(startAngle)
    const iex = cx + innerRadius * Math.cos(endAngle)
    const iey = cy + innerRadius * Math.sin(endAngle)

    return `M ${sx} ${sy} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ex} ${ey} L ${iex} ${iey} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${isx} ${isy} Z`
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {slices.map((s, i) => {
        if (s.pct < 0.001) return null
        const midAngle = (s.startAngle + s.endAngle) / 2
        const labelR = r + 20
        const lx = cx + labelR * Math.cos(midAngle)
        const ly = cy + labelR * Math.sin(midAngle)
        return (
          <g key={i}>
            <path d={arcPath(s.startAngle, s.endAngle, r, innerR)} fill={s.color} fillOpacity={0.85} stroke={theme.bgColor} strokeWidth={2} />
            {!isThumb && s.pct > 0.05 && (
              <text
                x={lx}
                y={ly + 4}
                textAnchor={lx > cx ? 'start' : 'end'}
                fill={theme.textColor}
                fillOpacity={0.5}
                fontSize={fontSize - 2}
                fontFamily={theme.fontFamily}
              >
                {s.label} ({Math.round(s.pct * 100)}%)
              </text>
            )}
          </g>
        )
      })}

      {/* Donut center label */}
      {donut && !isThumb && (
        <text x={cx} y={cy + 6} textAnchor="middle" fill={theme.headlineColor} fontSize={fontSize + 6} fontWeight={700} fontFamily={theme.fontFamily}>
          {formatValue(total, data.unit)}
        </text>
      )}
    </svg>
  )
}

/* ──────────────────────────────────────────────── */
/*  LINE / AREA CHART                               */
/* ──────────────────────────────────────────────── */
function LineChart({
  data, theme, palette, w, h, fontSize, isThumb, fill,
}: { data: ChartData; theme: Theme; palette: string[]; w: number; h: number; fontSize: number; isThumb?: boolean; fill: boolean }) {
  const pad = { top: 30, right: 20, bottom: 50, left: 60 }
  const cw = w - pad.left - pad.right
  const ch = h - pad.top - pad.bottom

  const allValues = data.datasets.flatMap((d) => d.values)
  const maxVal = Math.max(...allValues, 1)
  const minVal = Math.min(0, ...allValues)
  const range = maxVal - minVal || 1

  const pointCount = data.labels.length
  const xStep = pointCount > 1 ? cw / (pointCount - 1) : cw / 2

  // Grid lines
  const gridLines = 5
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => minVal + (range * i) / gridLines)

  function getPoints(values: number[]): string {
    return values
      .map((v, i) => {
        const x = pad.left + i * xStep
        const y = pad.top + ch - ((v - minVal) / range) * ch
        return `${x},${y}`
      })
      .join(' ')
  }

  function getAreaPath(values: number[]): string {
    const pts = values.map((v, i) => ({
      x: pad.left + i * xStep,
      y: pad.top + ch - ((v - minVal) / range) * ch,
    }))
    const baseline = pad.top + ch
    let d = `M ${pts[0]?.x ?? pad.left} ${baseline}`
    pts.forEach((p) => { d += ` L ${p.x} ${p.y}` })
    d += ` L ${pts[pts.length - 1]?.x ?? pad.left + cw} ${baseline} Z`
    return d
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Grid */}
      {gridValues.map((val, i) => {
        const y = pad.top + ch - ((val - minVal) / range) * ch
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke={theme.textColor} strokeOpacity={0.08} strokeDasharray="4 3" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fill={theme.textColor} fillOpacity={0.4} fontSize={fontSize - 2} fontFamily={theme.fontFamily}>
              {formatValue(val, data.unit)}
            </text>
          </g>
        )
      })}

      {/* X-axis labels */}
      {data.labels.map((label, i) => (
        <text
          key={i}
          x={pad.left + i * xStep}
          y={h - pad.bottom + 20}
          textAnchor="middle"
          fill={theme.textColor}
          fillOpacity={0.5}
          fontSize={fontSize - 1}
          fontFamily={theme.fontFamily}
        >
          {label.length > 10 ? label.slice(0, 9) + '...' : label}
        </text>
      ))}

      {/* Lines/Areas */}
      {data.datasets.map((ds, di) => {
        const color = getDatasetColor(ds, di, palette)
        const points = getPoints(ds.values)
        return (
          <g key={di}>
            {fill && (
              <path d={getAreaPath(ds.values)} fill={color} fillOpacity={0.12} />
            )}
            <polyline points={points} fill="none" stroke={color} strokeWidth={isThumb ? 1.5 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
            {/* Data points */}
            {!isThumb && ds.values.map((v, i) => {
              const x = pad.left + i * xStep
              const y = pad.top + ch - ((v - minVal) / range) * ch
              return <circle key={i} cx={x} cy={y} r={4} fill={theme.bgColor} stroke={color} strokeWidth={2.5} />
            })}
          </g>
        )
      })}

      {data.showLegend !== false && data.datasets.length > 1 && (
        <Legend datasets={data.datasets} palette={palette} x={pad.left} y={8} fontSize={fontSize} theme={theme} />
      )}
    </svg>
  )
}

/* ──────────────────────────────────────────────── */
/*  LEGEND                                          */
/* ──────────────────────────────────────────────── */
function Legend({
  datasets, palette, x, y, fontSize, theme,
}: { datasets: ChartData['datasets']; palette: string[]; x: number; y: number; fontSize: number; theme: Theme }) {
  return (
    <g>
      {datasets.map((ds, i) => {
        const color = getDatasetColor(ds, i, palette)
        const offsetX = x + i * 120
        return (
          <g key={i}>
            <rect x={offsetX} y={y} width={12} height={12} rx={3} fill={color} fillOpacity={0.85} />
            <text x={offsetX + 18} y={y + 10} fill={theme.textColor} fillOpacity={0.5} fontSize={fontSize - 1} fontFamily={theme.fontFamily}>
              {ds.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Available chart types for the picker UI */
export const CHART_TYPES: { type: ChartType; label: string; icon: string }[] = [
  { type: 'bar', label: 'Bar', icon: 'M4 20V10M10 20V4M16 20V14' },
  { type: 'horizontal-bar', label: 'H-Bar', icon: 'M4 6H14M4 12H20M4 18H10' },
  { type: 'line', label: 'Line', icon: 'M4 18L10 10L16 14L22 6' },
  { type: 'area', label: 'Area', icon: 'M4 18L10 10L16 14L22 6V18H4Z' },
  { type: 'pie', label: 'Pie', icon: '' },
  { type: 'donut', label: 'Donut', icon: '' },
]

/** Default chart data for new chart slides */
export function createDefaultChartData(accentColor: string): ChartData {
  return {
    type: 'bar',
    labels: ['Category A', 'Category B', 'Category C', 'Category D'],
    datasets: [
      { label: 'Series 1', values: [40, 65, 45, 80], color: accentColor },
    ],
    showLegend: true,
    showValues: false,
  }
}
