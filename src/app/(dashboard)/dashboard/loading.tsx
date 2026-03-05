export default function DashboardLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-8 w-16 animate-pulse rounded-full bg-gray-200" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-gray-200" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-gray-100 bg-white"
          >
            <div className="aspect-[16/9.5] w-full animate-pulse bg-gray-100" />
            <div className="p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
