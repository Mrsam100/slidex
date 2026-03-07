import { useEffect } from 'react'

interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  handler: () => void
  /** Only fire when no input/textarea is focused */
  ignoreInputs?: boolean
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      for (const shortcut of shortcuts) {
        if (shortcut.ignoreInputs && isInput) continue
        if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue
        if (shortcut.ctrl && !(e.ctrlKey || e.metaKey)) continue
        if (!shortcut.ctrl && (e.ctrlKey || e.metaKey)) continue
        if (shortcut.shift && !e.shiftKey) continue
        if (!shortcut.shift && e.shiftKey) continue

        e.preventDefault()
        shortcut.handler()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}
