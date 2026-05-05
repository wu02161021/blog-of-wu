export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />
  )
}

export function ChessboardSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-white/10">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-300/30 border-t-sky-400/80" />
      <Skeleton className="h-24 w-3/4" />
      <div className="flex gap-3">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function ModuleSkeleton() {
  return (
    <div className="space-y-3 p-2">
      <Skeleton className="h-5 w-24" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  )
}
