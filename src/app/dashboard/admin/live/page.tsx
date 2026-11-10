'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const LiveStreamBroadcaster = dynamic(
  () =>
    import('@/components/live/live-stream-broadcaster').then(
      (m) => m.LiveStreamBroadcaster
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-xs">Memuat Studio Siaran Langsung...</span>
        </div>
      </div>
    ),
  }
)

export default function AdminLiveStreamingPage() {
  return (
    <div className="space-y-6">
      <LiveStreamBroadcaster />
    </div>
  )
}
