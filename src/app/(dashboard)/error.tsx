'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-error/[0.07]">
        <AlertTriangle className="h-9 w-9 text-error" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-dark">
        Something went wrong
      </h2>
      <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-grey">
        We encountered an unexpected error loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-all hover:-translate-y-0.5 hover:bg-brand-blue/90 hover:shadow-lg"
      >
        <RotateCcw className="h-4 w-4" />
        Try again
      </button>
    </div>
  )
}
