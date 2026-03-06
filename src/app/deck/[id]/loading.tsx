export default function DeckLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f6fa]">
      {/* Top bar skeleton */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/60 bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-5 w-px bg-gray-200" />
          <div className="h-5 w-40 animate-pulse rounded-md bg-gray-200/60" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-8 w-24 animate-pulse rounded-xl bg-brand-blue/10" />
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-56 shrink-0 border-r border-gray-200/80 bg-white p-2.5">
          <div className="mb-3 h-3 w-16 animate-pulse rounded bg-gray-100" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[16/9] w-full animate-pulse rounded-lg bg-gray-100"
                style={{ animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Main area skeleton */}
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="aspect-video w-full max-w-4xl animate-pulse rounded-xl bg-white shadow-lg" />
        </div>
      </div>
    </div>
  )
}
