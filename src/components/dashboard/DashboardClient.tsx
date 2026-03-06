'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Presentation,
  AlertTriangle,
  Sparkles,
  LayoutGrid,
  List,
  Star,
  Clock,
  Trash2,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Slide, Theme } from '@/types/deck'
import { THEMES } from '@/lib/themes'
import DeckCard from './DeckCard'
import DeckListItem from './DeckListItem'
import { useSearch } from './SearchContext'

/* ─── Types ─── */
interface DeckRow {
  id: string
  title: string
  status: string
  slideCount: number
  theme: string
  isFavorite: boolean
  createdAt: string
  firstSlide: Slide | null
}

interface DashboardClientProps {
  decks: DeckRow[]
  isTrash?: boolean
}

type FilterTab = 'all' | 'recent' | 'favorites'
type ViewMode = 'grid' | 'list'

/* ─── Confirm Modal ─── */
function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isLoading,
}: {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
          <AlertTriangle className="h-6 w-6 text-error" />
        </div>
        <h3 id="confirm-title" className="text-lg font-bold text-dark">
          {title}
        </h3>
        <p className="mt-2 text-sm text-grey">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-mid transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-error px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-error/90 disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : (confirmLabel ?? 'Delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Search Modal ─── */
function SearchModal({
  decks,
  onClose,
}: {
  decks: DeckRow[]
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    inputRef.current?.focus()
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filtered = query.trim().length > 0
    ? decks.filter((d) =>
        d.title.toLowerCase().includes(query.toLowerCase()),
      )
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-grey" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your decks..."
            className="flex-1 bg-transparent text-sm text-dark outline-none placeholder:text-grey"
          />
          <button
            onClick={onClose}
            className="rounded-md p-1 text-grey hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {query.trim().length > 0 ? (
          <div className="max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-grey">
                No decks match &ldquo;{query}&rdquo;
              </p>
            ) : (
              filtered.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => {
                    onClose()
                    router.push(`/deck/${deck.id}`)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
                >
                  <Presentation className="h-4 w-4 shrink-0 text-grey" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-dark">{deck.title}</p>
                    <p className="text-xs text-grey">{deck.slideCount} slides</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-grey">
            Start typing to search your decks
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Filter Tabs ─── */
const FILTER_TABS: { id: FilterTab; label: string; icon: typeof Star }[] = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'favorites', label: 'Favorites', icon: Star },
]

/* ─── Main ─── */
const DEFAULT_THEME = THEMES[0]!

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem('slidex-view-mode')
    if (stored === 'list' || stored === 'grid') return stored
  } catch {
    // localStorage unavailable (Safari private mode, etc.)
  }
  return 'grid'
}

function storeViewMode(mode: ViewMode) {
  try {
    localStorage.setItem('slidex-view-mode', mode)
  } catch {
    // localStorage unavailable
  }
}

export default function DashboardClient({
  decks: initialDecks,
  isTrash,
}: DashboardClientProps) {
  const router = useRouter()
  const [decks, setDecks] = useState(initialDecks)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const { searchOpen, openSearch, closeSearch } = useSearch()

  // Ref-based guard for delete operations to prevent double-fire
  const deletingRef = useRef(false)
  // Ref-based guard for restore
  const restoringRef = useRef<Set<string>>(new Set())
  // Ref-based guard for favorite toggle
  const togglingFavRef = useRef<Set<string>>(new Set())

  // Load view mode preference
  useEffect(() => {
    setViewMode(getStoredViewMode())
  }, [])

  // Sync decks when server data changes
  useEffect(() => {
    setDecks(initialDecks)
  }, [initialDecks])

  // Ctrl+K / Cmd+K shortcut (toggle)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (searchOpen) closeSearch()
        else openSearch()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [openSearch, closeSearch, searchOpen])

  function getTheme(themeId: string): Theme {
    return THEMES.find((t) => t.id === themeId) ?? DEFAULT_THEME
  }

  function toggleViewMode(mode: ViewMode) {
    setViewMode(mode)
    storeViewMode(mode)
  }

  // Filter decks (memoized)
  const filteredDecks = useMemo(() => {
    if (isTrash) return decks
    switch (activeTab) {
      case 'favorites':
        return decks.filter((d) => d.isFavorite)
      case 'recent': {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        return decks.filter((d) => new Date(d.createdAt).getTime() >= sevenDaysAgo)
      }
      default:
        return decks
    }
  }, [decks, activeTab, isTrash])

  /* ─── CRUD handlers ─── */
  const handleDelete = useCallback(
    async (id: string) => {
      if (deletingRef.current) return
      deletingRef.current = true
      setIsDeleting(true)
      try {
        const res = await fetch(`/api/decks/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        setDecks((prev) => prev.filter((d) => d.id !== id))
        toast.success('Deck moved to trash')
      } catch {
        toast.error('Failed to delete deck')
      }
      deletingRef.current = false
      setIsDeleting(false)
      setDeleteId(null)
    },
    [],
  )

  const handlePermanentDelete = useCallback(
    async (id: string) => {
      if (deletingRef.current) return
      deletingRef.current = true
      setIsDeleting(true)
      try {
        const res = await fetch(`/api/decks/${id}/permanent`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: true }),
        })
        if (!res.ok) throw new Error()
        setDecks((prev) => prev.filter((d) => d.id !== id))
        toast.success('Deck permanently deleted')
      } catch {
        toast.error('Failed to delete deck')
      }
      deletingRef.current = false
      setIsDeleting(false)
      setPermanentDeleteId(null)
    },
    [],
  )

  async function handleRestore(id: string) {
    if (restoringRef.current.has(id)) return
    restoringRef.current.add(id)
    try {
      const res = await fetch(`/api/decks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      })
      if (!res.ok) throw new Error()
      setDecks((prev) => prev.filter((d) => d.id !== id))
      toast.success('Deck restored')
    } catch {
      toast.error('Failed to restore deck')
    }
    restoringRef.current.delete(id)
  }

  async function handleDuplicate(id: string) {
    const loadingToast = toast.loading('Duplicating deck...')
    try {
      const res = await fetch(`/api/decks/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Deck duplicated', { id: loadingToast })
      router.refresh()
    } catch {
      toast.error('Failed to duplicate deck', { id: loadingToast })
    }
  }

  async function handleRename(id: string, newTitle: string) {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    const oldTitle = decks.find((d) => d.id === id)?.title
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title: trimmed } : d)),
    )
    try {
      const res = await fetch(`/api/decks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!res.ok) throw new Error()
    } catch {
      if (oldTitle !== undefined) {
        setDecks((prev) =>
          prev.map((d) => (d.id === id ? { ...d, title: oldTitle } : d)),
        )
      }
      toast.error('Failed to rename deck')
    }
  }

  async function handleToggleFavorite(id: string) {
    if (togglingFavRef.current.has(id)) return
    const deck = decks.find((d) => d.id === id)
    if (!deck) return
    const newVal = !deck.isFavorite
    togglingFavRef.current.add(id)
    // Optimistic update
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isFavorite: newVal } : d)),
    )
    try {
      const res = await fetch(`/api/decks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newVal }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setDecks((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isFavorite: !newVal } : d)),
      )
      toast.error('Failed to update favorite')
    }
    togglingFavRef.current.delete(id)
  }

  /* ─── Shared card/list props ─── */
  function deckItemProps(deck: DeckRow) {
    return {
      deck,
      firstSlide: deck.firstSlide,
      cardTheme: getTheme(deck.theme),
      isTrash,
      onDelete: (id: string) => setDeleteId(id),
      onDuplicate: handleDuplicate,
      onRename: handleRename,
      onToggleFavorite: handleToggleFavorite,
      onRestore: handleRestore,
      onPermanentDelete: (id: string) => setPermanentDeleteId(id),
    }
  }

  return (
    <>
      {/* Delete confirmation modals */}
      {deleteId && (
        <ConfirmModal
          title="Delete this deck?"
          message="This deck will be moved to trash. You can restore it later."
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => {
            if (!isDeleting) setDeleteId(null)
          }}
          isLoading={isDeleting}
        />
      )}
      {permanentDeleteId && (
        <ConfirmModal
          title="Delete forever?"
          message="This deck and all its slides will be permanently deleted. This cannot be undone."
          confirmLabel="Delete forever"
          onConfirm={() => handlePermanentDelete(permanentDeleteId)}
          onCancel={() => {
            if (!isDeleting) setPermanentDeleteId(null)
          }}
          isLoading={isDeleting}
        />
      )}

      {/* Search modal */}
      {searchOpen && (
        <SearchModal decks={decks} onClose={closeSearch} />
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">
            {isTrash ? 'Trash' : 'My Decks'}
          </h1>
          {!isTrash && (
            <p className="mt-1 text-sm text-grey">
              {decks.length} {decks.length === 1 ? 'presentation' : 'presentations'}
            </p>
          )}
        </div>
        {!isTrash && (
          <Link
            href="/generate"
            className="flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-blue/90 hover:shadow-lg hover:shadow-brand-blue/25"
          >
            <Sparkles className="h-4 w-4" />
            Create new
          </Link>
        )}
      </div>

      {/* Filter tabs + view toggle (not shown in trash) */}
      {!isTrash && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5">
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-brand-blue/10 text-brand-blue shadow-sm'
                      : 'text-grey hover:bg-gray-100 hover:text-mid',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => toggleViewMode('grid')}
              aria-label="Grid view"
              className={cn(
                'rounded-md p-1.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-brand-blue/10 text-brand-blue'
                  : 'text-grey hover:text-mid',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleViewMode('list')}
              aria-label="List view"
              className={cn(
                'rounded-md p-1.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-brand-blue/10 text-brand-blue'
                  : 'text-grey hover:text-mid',
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredDecks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center md:py-36">
          <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/5 to-brand-blue/10">
            {isTrash ? (
              <Trash2 className="h-10 w-10 text-grey/50" />
            ) : activeTab === 'favorites' ? (
              <Star className="h-10 w-10 text-grey/50" />
            ) : (
              <Presentation className="h-10 w-10 text-brand-blue" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-dark">
            {isTrash
              ? 'Trash is empty'
              : activeTab === 'favorites'
                ? 'No favorites yet'
                : activeTab === 'recent'
                  ? 'Nothing recent'
                  : 'Create your first deck'}
          </h2>
          <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-grey">
            {isTrash
              ? 'Deleted decks will appear here.'
              : activeTab === 'favorites'
                ? 'Star your favorite decks to find them quickly.'
                : activeTab === 'recent'
                  ? 'No decks created in the last 7 days.'
                  : 'Type a topic, pick your options, and let AI build your slides.'}
          </p>
          {!isTrash && activeTab === 'all' && (
            <Link
              href="/generate"
              className="mt-8 flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              New Deck
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' || isTrash ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDecks.map((deck) => (
            <DeckCard key={deck.id} {...deckItemProps(deck)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredDecks.map((deck) => (
            <DeckListItem key={deck.id} {...deckItemProps(deck)} />
          ))}
        </div>
      )}
    </>
  )
}
