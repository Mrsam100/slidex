'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function DeckError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fc] px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
        <AlertTriangle className="h-8 w-8 text-error" />
      </div>
      <h1 className="text-xl font-bold text-dark">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-grey">
        We couldn&apos;t load this deck. It may have been deleted or there was a server error.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-mid transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>
      </div>
    </div>
  )
}
