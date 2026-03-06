'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { User, AlertTriangle, Crown, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsClientProps {
  user: {
    name: string
    email: string
    image?: string
  }
  plan: 'free' | 'pro' | 'cancelled'
  decksThisMonth: number
}

export default function SettingsClient({ user, plan, decksThisMonth }: SettingsClientProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isFree = plan === 'free' || plan === 'cancelled'
  const maxFreeDecks = 5

  async function handleDeleteAccount() {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' })
      if (res.status === 409) {
        const data = await res.json() as { error?: string }
        toast.error(data.error ?? 'Cannot delete account while generating. Try again shortly.')
        setIsDeleting(false)
        return
      }
      if (!res.ok) throw new Error()
      toast.success('Account deleted')
      await signOut({ callbackUrl: '/' })
    } catch {
      toast.error('Failed to delete account')
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-dark">Settings</h1>
      <p className="mt-1 text-sm text-grey">Manage your account and subscription</p>

      {/* Profile section */}
      <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-grey/70">
          Profile
        </h2>
        <div className="mt-5 flex items-center gap-5">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={64}
              height={64}
              className="rounded-2xl ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 ring-2 ring-brand-blue/10">
              <User className="h-8 w-8 text-brand-blue/60" />
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-dark">{user.name}</p>
            <p className="mt-0.5 text-sm text-grey">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Plan & Usage section */}
      <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-grey/70">
          Plan & Usage
        </h2>
        <div className="mt-4 flex items-center gap-3">
          {isFree ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-mid">
              Free plan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal/10 px-3 py-1 text-sm font-semibold text-brand-teal">
              <Crown className="h-3.5 w-3.5" />
              Pro plan
            </span>
          )}
        </div>

        {isFree && (
          <>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-mid">
                  {decksThisMonth} of {maxFreeDecks} free decks used this month
                </span>
                <span className="font-medium tabular-nums text-dark">
                  {decksThisMonth}/{maxFreeDecks}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-brand-blue transition-all"
                  style={{ width: `${Math.min((decksThisMonth / maxFreeDecks) * 100, 100)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                // TODO: Phase 4B — wire to /api/stripe/checkout
                toast('Stripe checkout coming soon')
              }}
              className="mt-5 flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-all hover:-translate-y-0.5 hover:bg-brand-blue/90 hover:shadow-lg"
            >
              <Zap className="h-4 w-4" />
              Upgrade to Pro — $8/month
            </button>
          </>
        )}

        {!isFree && (
          <button
            onClick={() => {
              // TODO: Phase 4B — wire to /api/stripe/portal
              toast('Stripe portal coming soon')
            }}
            className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-mid transition-colors hover:bg-gray-50"
          >
            Manage subscription
          </button>
        )}
      </section>

      {/* Danger Zone */}
      <section className="mt-5 rounded-2xl border border-error/20 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-error/70">
          Danger Zone
        </h2>
        <p className="mt-2 text-sm text-grey">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-4 rounded-lg border border-error/30 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/5"
          >
            Delete account
          </button>
        ) : (
          <div className="mt-4 rounded-lg border border-error/20 bg-error/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
              <div>
                <p className="font-medium text-dark">
                  Are you sure you want to delete your account?
                </p>
                <p className="mt-1 text-sm text-grey">
                  All your decks and data will be permanently deleted.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-mid transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-error/90 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
