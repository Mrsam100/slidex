import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-light-bg px-4 text-center">
      <p className="text-8xl font-bold text-brand-blue/20">404</p>
      <h1 className="mt-4 text-2xl font-bold text-dark">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-grey">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-mid transition-colors hover:bg-gray-50"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
