'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { User, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsClientProps {
  user: {
    name: string
    email: string
    image?: string
  }
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
      <h1 className="text-2xl font-bold text-dark">Settings</h1>

      {/* Profile section */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-grey">
          Profile
        </h2>
        <div className="mt-4 flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-light-bg">
              <User className="h-8 w-8 text-grey" />
            </div>
          )}
          <div>
            <p className="font-semibold text-dark">{user.name}</p>
            <p className="text-sm text-grey">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mt-6 rounded-xl border border-error/30 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-error">
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
