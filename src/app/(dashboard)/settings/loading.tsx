export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-200/70" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded-md bg-gray-100" />

      {/* Profile skeleton */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
        <div className="mt-5 flex items-center gap-5">
          <div className="h-16 w-16 animate-pulse rounded-2xl bg-gray-100" />
          <div>
            <div className="h-5 w-32 animate-pulse rounded-md bg-gray-200/60" />
            <div className="mt-2 h-4 w-48 animate-pulse rounded-md bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Plan skeleton */}
      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-7 w-24 animate-pulse rounded-full bg-gray-100" />
        <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-gray-100" />
        <div className="mt-5 h-10 w-52 animate-pulse rounded-xl bg-brand-blue/10" />
      </div>

      {/* Danger zone skeleton */}
      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        <div className="mt-3 h-4 w-3/4 animate-pulse rounded-md bg-gray-100" />
        <div className="mt-4 h-9 w-32 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  )
}
