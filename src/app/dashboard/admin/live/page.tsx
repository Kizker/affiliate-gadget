'use client'

import Link from 'next/link'
import { Radio, ExternalLink } from 'lucide-react'
import { LiveStreamBroadcaster } from '@/components/live/live-stream-broadcaster'

export default function AdminLiveStreamingPage() {
  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                Siaran Langsung Toko (Live Shopping)
              </h1>
              <p className="text-xs text-slate-500">
                Studio siaran langsung kamera fisik toko cabang resmi Affiliate
                Gadget
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            href="/live"
            target="_blank"
            className="shadow-2xs inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <span>Halaman Live Publik</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Broadcaster Studio Component */}
      <LiveStreamBroadcaster />
    </div>
  )
}
