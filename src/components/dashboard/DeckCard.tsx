'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Copy, Trash2, Star, RotateCcw, XCircle } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import type { Slide, Theme } from '@/types/deck'
import SlideThumb from '@/components/slides/SlideThumb'

interface DeckCardProps {
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

export default function DeckCard({
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
}: DeckCardProps) {
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

  const isClickable = !isTrash && deck.status !== 'draft'

  function handleCardClick() {
    if (isRenaming || !isClickable) return
    router.push(`/deck/${deck.id}`)
  }

  return (
    <div className="group relative">
      <div
        role={isClickable ? 'link' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
        className={cn(
          'w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-300',
          isClickable
            ? 'cursor-pointer border-gray-100/80 hover:-translate-y-1 hover:border-brand-blue/20 hover:shadow-xl hover:shadow-brand-blue/5'
            : 'cursor-default border-gray-100/80',
        )}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50">
          {firstSlide ? (
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="origin-top-left"
                style={{
                  width: 1280,
                  height: 720,
                  transform: 'scale(0.25)',
                  transformOrigin: 'top left',
                }}
              >
                <div className="pointer-events-none">
                  <SlideThumb slide={firstSlide} theme={cardTheme} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-grey">
              No slides
            </div>
          )}

          {/* Status badges */}
          {deck.status === 'generating' && (
            <span className="absolute left-2 top-2 animate-pulse rounded-full bg-brand-teal/90 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm">
              Generating...
            </span>
          )}
          {deck.status === 'error' && (
            <span className="absolute left-2 top-2 rounded-full bg-error/90 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm">
              Error
            </span>
          )}

          {/* Slide count badge */}
          {deck.slideCount > 0 && (
            <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {deck.slideCount} slides
            </span>
          )}

          {/* Favorite star */}
          {!isTrash && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(deck.id)
              }}
              aria-label={deck.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'absolute right-2 top-2 rounded-full p-1.5 transition-all',
                deck.isFavorite
                  ? 'bg-yellow-400/90 text-white shadow-sm'
                  : 'bg-black/30 text-white/70 opacity-0 backdrop-blur-sm hover:bg-black/50 hover:text-white focus:opacity-100 group-hover:opacity-100',
              )}
            >
              <Star
                className="h-3.5 w-3.5"
                fill={deck.isFavorite ? 'currentColor' : 'none'}
              />
            </button>
          )}
        </div>

        {/* Info section */}
        <div className="flex items-start justify-between gap-2 px-4 py-3.5">
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
              <p className="truncate text-sm font-semibold text-dark">
                {deck.title}
              </p>
            )}
            <p className="mt-0.5 text-xs text-grey">
              {timeAgo(deck.createdAt)}
            </p>
          </div>

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
                className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-2xl shadow-black/10"
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
      </div>
    </div>
  )
}
