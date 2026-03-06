import Link from 'next/link'
import { Presentation } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-light-bg px-4 text-center">
      <div className="relative">
        <p className="select-none text-[10rem] font-bold leading-none text-brand-blue/[0.07]">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-blue/10">
            <Presentation className="h-10 w-10 text-brand-blue" />
          </div>
        </div>
      </div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-dark">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-grey">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-mid shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-all hover:-translate-y-0.5 hover:bg-brand-blue/90 hover:shadow-lg"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
