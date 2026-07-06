export function JobCardSkeleton() {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg shrink-0 skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded skeleton" style={{ width: '40%' }} />
          <div className="h-4 rounded skeleton" style={{ width: '80%' }} />
          <div className="h-3 rounded skeleton" style={{ width: '60%' }} />
        </div>
        <div className="w-11 h-11 rounded-lg shrink-0 skeleton" />
      </div>
      <div className="h-3 rounded skeleton" style={{ width: '90%' }} />
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid #1a2235' }}>
        <div className="h-3 rounded skeleton" style={{ width: '30%' }} />
        <div className="h-8 rounded-lg skeleton" style={{ width: '28%' }} />
      </div>
    </div>
  )
}

export function NewsCardSkeleton() {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
      <div className="flex items-center justify-between">
        <div className="h-4 rounded-full skeleton" style={{ width: '30%' }} />
        <div className="h-3 rounded skeleton" style={{ width: '20%' }} />
      </div>
      <div className="space-y-2">
        <div className="h-4 rounded skeleton" style={{ width: '100%' }} />
        <div className="h-4 rounded skeleton" style={{ width: '75%' }} />
      </div>
      <div className="h-3 rounded skeleton" style={{ width: '90%' }} />
      <div className="h-3 rounded skeleton" style={{ width: '60%' }} />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-5"
      style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded skeleton" />
      </div>
      <div className="h-8 rounded mb-2 skeleton" style={{ width: '50%' }} />
      <div className="h-3 rounded mb-1 skeleton" style={{ width: '70%' }} />
      <div className="h-3 rounded skeleton" style={{ width: '50%' }} />
    </div>
  )
}

export function JobGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  )
}

