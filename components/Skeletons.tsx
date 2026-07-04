export function JobCardSkeleton() {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3 animate-pulse"
      style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg shrink-0" style={{ background: '#1a2235' }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded" style={{ background: '#1a2235', width: '40%' }} />
          <div className="h-4 rounded" style={{ background: '#1a2235', width: '80%' }} />
          <div className="h-3 rounded" style={{ background: '#1a2235', width: '60%' }} />
        </div>
        <div className="w-11 h-11 rounded-lg shrink-0" style={{ background: '#1a2235' }} />
      </div>
      <div className="h-3 rounded" style={{ background: '#1a2235', width: '90%' }} />
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid #1a2235' }}>
        <div className="h-3 rounded" style={{ background: '#1a2235', width: '30%' }} />
        <div className="h-8 rounded-lg" style={{ background: '#1a2235', width: '25%' }} />
      </div>
    </div>
  )
}

export function NewsCardSkeleton() {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3 animate-pulse"
      style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
      <div className="flex items-center justify-between">
        <div className="h-4 rounded-full" style={{ background: '#1a2235', width: '30%' }} />
        <div className="h-3 rounded" style={{ background: '#1a2235', width: '20%' }} />
      </div>
      <div className="space-y-2">
        <div className="h-4 rounded" style={{ background: '#1a2235', width: '100%' }} />
        <div className="h-4 rounded" style={{ background: '#1a2235', width: '75%' }} />
      </div>
      <div className="h-3 rounded" style={{ background: '#1a2235', width: '90%' }} />
      <div className="h-3 rounded" style={{ background: '#1a2235', width: '60%' }} />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 animate-pulse"
      style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded" style={{ background: '#1a2235' }} />
      </div>
      <div className="h-8 rounded mb-2" style={{ background: '#1a2235', width: '50%' }} />
      <div className="h-3 rounded mb-1" style={{ background: '#1a2235', width: '70%' }} />
      <div className="h-3 rounded" style={{ background: '#1a2235', width: '50%' }} />
    </div>
  )
}
