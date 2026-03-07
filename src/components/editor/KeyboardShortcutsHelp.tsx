'use client'

import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ['F'], label: 'Enter presentation mode' },
  { keys: ['Esc'], label: 'Exit presentation / close modal' },
  { keys: ['Ctrl', 'Z'], label: 'Undo last edit' },
  { keys: ['Ctrl', 'Shift', 'Z'], label: 'Redo last edit' },
  { keys: ['?'], label: 'Show keyboard shortcuts' },
] as const

export default function KeyboardShortcutsHelp({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-dark">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-grey transition-colors hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-2.5">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-sm text-mid">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-mid"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
