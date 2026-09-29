'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'
import {
  Radio,
  Clock,
  Store,
  MapPin,
  Users,
  ChevronRight,
  Calendar,
  PlayCircle,
  Wifi,
} from 'lucide-react'

interface LiveStream {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  status: string
  viewerCount: number
  startedAt: string | null
  scheduledAt: string | null
  _count: { comments: number }
  store: {
    id: string
    name: string
    companyName: string
    slug: string
    logo: string | null
    city: string
  } | null
  host: { id: string; name: string | null; image: string | null } | null
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'LIVE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        LIVE
      </span>
    )
  }
  if (status === 'SCHEDULED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
        <Calendar className="h-2.5 w-2.5" />
        Segera
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/80 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
      Selesai
    </span>
  )
}

function LiveCard({ stream }: { stream: LiveStream }) {
  const storeName =
    stream.store?.name?.replace('Affiliate Gadget - ', '') || 'Affiliate Gadget'
  const isLive = stream.status === 'LIVE'

  const formatScheduledTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Link
      href={`/live/${stream.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-slate-600 hover:shadow-2xl hover:shadow-black/40"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
        <Image
          src={
            stream.coverImage ||
            stream.store?.logo ||
            '/images/banners/samsung-campaign-banner.jpg'
          }
          alt={stream.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute left-2.5 top-2.5 z-10">
          <StatusBadge status={stream.status} />
        </div>

        {/* Viewer count */}
        {isLive && (
          <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <Users className="h-2.5 w-2.5" />
            {stream.viewerCount || 0}
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
            <PlayCircle className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white transition-colors group-hover:text-orange-400">
          {stream.title}
        </h3>

        {/* Store */}
        {stream.store && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <div className="relative h-4 w-4 overflow-hidden rounded-full bg-slate-700">
              {stream.store.logo ? (
                <Image
                  src={stream.store.logo}
                  alt={storeName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <Store className="h-4 w-4 p-0.5 text-slate-500" />
              )}
            </div>
            <span className="truncate font-medium">{storeName}</span>
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span>{stream.store.city}</span>
          </div>
        )}

        {/* Scheduled time or started time */}
        {stream.status === 'SCHEDULED' && stream.scheduledAt && (
          <div className="flex items-center gap-1 text-[10px] text-blue-400">
            <Clock className="h-3 w-3" />
            {formatScheduledTime(stream.scheduledAt)}
          </div>
        )}
        {isLive && stream.startedAt && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock className="h-3 w-3" />
            Mulai{' '}
            {new Date(stream.startedAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-700/60 pt-2 text-[10px] text-slate-500">
          <span>{stream._count.comments} komentar</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  )
}

export default function LiveHubPage() {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'LIVE' | 'SCHEDULED'>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/live-streams')
        const data = await res.json()
        if (data.success) setStreams(data.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()

    // Refresh live list every 30s
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const liveStreams = streams.filter((s) => s.status === 'LIVE')
  const scheduledStreams = streams.filter((s) => s.status === 'SCHEDULED')
  const endedStreams = streams.filter((s) => s.status === 'ENDED')

  const filtered =
    filter === 'LIVE'
      ? liveStreams
      : filter === 'SCHEDULED'
        ? scheduledStreams
        : streams

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-orange-500 selection:text-white">
      <Navbar variant="dark" />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        {/* Hero Header */}
        <div className="mb-8 space-y-3 text-center sm:mb-10">
          <div className="flex items-center justify-center gap-2">
            {liveStreams.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                {liveStreams.length} LIVE SEKARANG
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
              <Wifi className="h-3 w-3 text-green-400" />
              Real-time Live
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Live Shopping Hub
          </h1>
          <p className="text-sm text-slate-400">
            Saksikan promo eksklusif & tanya langsung ke admin toko favoritmu
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center gap-2">
          {(
            [
              ['all', 'Semua', streams.length],
              ['LIVE', '🔴 Sedang Live', liveStreams.length],
              ['SCHEDULED', 'Segera Tayang', scheduledStreams.length],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                filter === key
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                    filter === key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Radio className="h-12 w-12 animate-pulse text-slate-700" />
            <p className="text-slate-400">
              {filter === 'LIVE'
                ? 'Tidak ada toko yang sedang live saat ini'
                : filter === 'SCHEDULED'
                  ? 'Tidak ada jadwal live yang akan datang'
                  : 'Belum ada live streaming'}
            </p>
            <Link
              href="/gadget"
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              Lihat Katalog Gadget
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* LIVE NOW section */}
            {(filter === 'all' || filter === 'LIVE') &&
              liveStreams.length > 0 && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-red-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                    Sedang Live Sekarang
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {liveStreams.map((s) => (
                      <LiveCard key={s.id} stream={s} />
                    ))}
                  </div>
                </section>
              )}

            {/* SCHEDULED section */}
            {(filter === 'all' || filter === 'SCHEDULED') &&
              scheduledStreams.length > 0 && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-blue-400">
                    <Calendar className="h-4 w-4" />
                    Jadwal Live Mendatang
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {scheduledStreams.map((s) => (
                      <LiveCard key={s.id} stream={s} />
                    ))}
                  </div>
                </section>
              )}

            {/* ENDED section */}
            {filter === 'all' && endedStreams.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Clock className="h-4 w-4" />
                  Siaran Selesai (24 Jam Terakhir)
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {endedStreams.map((s) => (
                    <LiveCard key={s.id} stream={s} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer variant="dark" />
      <div className="block md:hidden">
        <MobileBottomNav activeTab="none" />
      </div>
    </div>
  )
}
