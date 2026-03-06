'use client'

import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
        <AlertTriangle className="h-8 w-8 text-error" />
      </div>
      <h2 className="text-xl font-bold text-dark">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-grey">
        We encountered an unexpected error. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
      >
        Try again
      </button>
    </div>
  )
}
