export default function DashboardLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-7 w-28 animate-pulse rounded-lg bg-gray-200/70" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded-md bg-gray-100" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-xl bg-brand-blue/10" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-16 animate-pulse rounded-full bg-gray-100" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-100 p-0.5">
          <div className="h-7 w-7 animate-pulse rounded-md bg-gray-100" />
          <div className="h-7 w-7 animate-pulse rounded-md bg-gray-100" />
        </div>
      </div>

      {/* Card grid skeleton — staggered animation */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-sm"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className="aspect-[16/9] w-full animate-pulse bg-gradient-to-br from-gray-50 to-gray-100/80" />
            <div className="p-4">
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-gray-200/60" />
              <div className="mt-2.5 h-3 w-1/3 animate-pulse rounded-md bg-gray-100/80" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
