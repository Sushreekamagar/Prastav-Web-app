export function CardSkeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-200 ${className}`} />
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-md">
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
    </div>
  )
}

export function BookCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-md">
      <div className="h-40 bg-gray-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="h-6 w-20 rounded bg-gray-200" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl bg-gray-100 p-4">
          <div className="h-4 w-full rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 p-8">
        <div className="h-6 w-48 rounded bg-white/50" />
        <div className="mt-2 h-4 w-64 rounded bg-white/40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
