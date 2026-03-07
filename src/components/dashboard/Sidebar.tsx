'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  LayoutTemplate,
  Search,
  Share2,
  Settings,
  LogOut,
  Trash2,
  FolderClosed,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'
import { useSearch } from './SearchContext'

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  disabled?: boolean
  badge?: string
  onClick?: () => void
}

function useIsMac() {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    setIsMac(/mac/i.test(navigator.userAgent))
  }, [])
  return isMac
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { openSearch } = useSearch()
  const isMac = useIsMac()

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mobileOpen])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const mainNav: NavItem[] = [
    { href: '/dashboard', label: 'My Decks', icon: LayoutDashboard },
    {
      href: '#',
      label: 'Search',
      icon: Search,
      badge: isMac ? '⌘K' : 'Ctrl+K',
      onClick: () => {
        openSearch()
        setMobileOpen(false)
      },
    },
  ]

  const secondaryNav: NavItem[] = [
    { href: '#', label: 'Shared with me', icon: Share2, disabled: true, badge: 'Soon' },
    { href: '/templates', label: 'Templates', icon: LayoutTemplate },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = useCallback(
    (href: string) => {
      if (href === '/dashboard') {
        return pathname === '/dashboard' && searchParams.get('filter') !== 'trash'
      }
      if (href === '/settings') {
        return pathname === '/settings'
      }
      return pathname.startsWith(href)
    },
    [pathname, searchParams],
  )

  const isTrashActive = pathname === '/dashboard' && searchParams.get('filter') === 'trash'

  function renderNavItem(item: NavItem) {
    const Icon = item.icon
    const active = !item.disabled && !item.onClick && isActive(item.href)

    if (item.disabled) {
      return (
        <span
          key={item.label}
          aria-disabled="true"
          className="mb-0.5 flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-grey/40"
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {item.label}
          {item.badge && (
            <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-grey">
              {item.badge}
            </span>
          )}
        </span>
      )
    }

    if (item.onClick) {
      return (
        <button
          key={item.label}
          onClick={item.onClick}
          className="mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-mid transition-colors hover:bg-gray-50 hover:text-dark"
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {item.label}
          {item.badge && (
            <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-grey">
              {item.badge}
            </span>
          )}
        </button>
      )
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          'mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-brand-blue/5 text-brand-blue'
            : 'text-mid hover:bg-gray-50 hover:text-dark',
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {item.label}
      </Link>
    )
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-brand-blue">
          SlideX
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1 text-grey hover:bg-gray-100 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-1">
        {mainNav.map(renderNavItem)}

        <div className="my-3 border-t border-gray-100" />

        {secondaryNav.map(renderNavItem)}

        {/* Folders section */}
        <div className="my-3 border-t border-gray-100" />
        <div className="mb-1 flex items-center gap-2 px-3 py-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-grey/60">
            Folders
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-grey">
            Soon
          </span>
        </div>
        <span className="flex cursor-not-allowed items-center gap-3 px-3 py-2 text-sm font-medium text-grey/30">
          <FolderClosed className="h-[18px] w-[18px] shrink-0" />
          Create a folder
        </span>

        {/* Trash */}
        <div className="my-3 border-t border-gray-100" />
        <Link
          href="/dashboard?filter=trash"
          className={cn(
            'mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isTrashActive
              ? 'bg-brand-blue/5 text-brand-blue'
              : 'text-mid hover:bg-gray-50 hover:text-dark',
          )}
        >
          <Trash2 className="h-[18px] w-[18px] shrink-0" />
          Trash
        </Link>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={32}
              height={32}
              className="rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-semibold text-brand-blue">
              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-dark">
              {user.name ?? 'User'}
            </p>
            <p className="truncate text-xs text-grey">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-grey transition-colors hover:bg-gray-50 hover:text-dark"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-lg border border-gray-200 bg-white p-2 shadow-sm lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5 text-dark" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-gray-100 bg-white transition-transform duration-200',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
