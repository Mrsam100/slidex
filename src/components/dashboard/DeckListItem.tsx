'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Copy, Trash2, Star, RotateCcw, XCircle } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import type { Slide, Theme } from '@/types/deck'
import SlideThumb from '@/components/slides/SlideThumb'

interface DeckListItemProps {
  deck: {
    id: string
    title: string
    status: string
    slideCount: number
    theme: string
    isFavorite: boolean
    createdAt: string
  }
  firstSlide: Slide | null
  cardTheme: Theme
  isTrash?: boolean
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRename: (id: string, title: string) => void
  onToggleFavorite: (id: string) => void
  onRestore?: (id: string) => void
  onPermanentDelete?: (id: string) => void
}

export default function DeckListItem({
  deck,
  firstSlide,
  cardTheme,
  isTrash,
  onDelete,
  onDuplicate,
  onRename,
  onToggleFavorite,
  onRestore,
  onPermanentDelete,
}: DeckListItemProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(deck.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTitle(deck.title)
  }, [deck.title])

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus()
  }, [isRenaming])

  function handleRenameSubmit() {
    if (!isRenaming) return
    const trimmed = title.trim()
    if (trimmed && trimmed !== deck.title) {
      onRename(deck.id, trimmed)
    } else {
      setTitle(deck.title)
    }
    setIsRenaming(false)
  }

  function handleRowClick() {
    if (isRenaming || isTrash || deck.status !== 'done') return
    router.push(`/deck/${deck.id}`)
  }

  return (
    <div
      role={deck.status === 'done' && !isTrash ? 'link' : undefined}
      tabIndex={deck.status === 'done' && !isTrash ? 0 : undefined}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleRowClick()
        }
      }}
      className={cn(
        'group flex items-center gap-4 rounded-xl border bg-white px-4 py-3 transition-all duration-150',
        deck.status === 'done' && !isTrash
          ? 'cursor-pointer border-gray-100 hover:border-brand-blue/20 hover:bg-gray-50/50 hover:shadow-sm'
          : 'cursor-default border-gray-100',
      )}
    >
      {/* Small thumbnail */}
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        {firstSlide ? (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="origin-top-left"
              style={{
                width: 1280,
                height: 720,
                transform: 'scale(0.075)',
                transformOrigin: 'top left',
              }}
            >
              <div className="pointer-events-none">
                <SlideThumb slide={firstSlide} theme={cardTheme} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-grey">
            No slides
          </div>
        )}
      </div>

      {/* Title + metadata */}
      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <input
            ref={inputRef}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') {
                setTitle(deck.title)
                setIsRenaming(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full truncate border-b border-brand-blue bg-transparent text-sm font-semibold text-dark outline-none"
          />
        ) : (
          <p className="truncate text-sm font-semibold text-dark">{deck.title}</p>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-xs text-grey">
          <span>{deck.slideCount} slides</span>
          <span>&middot;</span>
          <span>{timeAgo(deck.createdAt)}</span>
          {deck.status === 'generating' && (
            <>
              <span>&middot;</span>
              <span className="animate-pulse text-brand-teal">Generating...</span>
            </>
          )}
          {deck.status === 'error' && (
            <>
              <span>&middot;</span>
              <span className="text-error">Error</span>
            </>
          )}
        </div>
      </div>

      {/* Favorite star */}
      {!isTrash && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(deck.id)
          }}
          aria-label={deck.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={cn(
            'shrink-0 rounded-full p-1.5 transition-all',
            deck.isFavorite
              ? 'text-yellow-500'
              : 'text-gray-300 opacity-0 hover:text-yellow-500 focus:opacity-100 group-hover:opacity-100',
          )}
        >
          <Star
            className="h-4 w-4"
            fill={deck.isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      )}

      {/* Three-dot menu */}
      <div ref={menuRef} className="relative shrink-0">
        <button
          aria-haspopup="true"
          aria-expanded={menuOpen}
          aria-label="Deck actions"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className={cn(
            'rounded-lg p-1.5 text-grey transition-all hover:bg-gray-100',
            menuOpen ? 'opacity-100' : 'opacity-0 focus:opacity-100 group-hover:opacity-100',
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
          >
            {isTrash ? (
              <>
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onRestore?.(deck.id)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-mid hover:bg-gray-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </button>
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onPermanentDelete?.(deck.id)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Delete forever
                </button>
              </>
            ) : (
              <>
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    setIsRenaming(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-mid hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rename
                </button>
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDuplicate(deck.id)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-mid hover:bg-gray-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete(deck.id)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
