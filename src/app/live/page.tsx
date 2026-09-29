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
  Sparkles,
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[11px] font-black text-white shadow-md shadow-red-600/30">
        <span className="h-2 w-2 animate-ping rounded-full bg-white" />
        LIVE
      </span>
    )
  }
  if (status === 'SCHEDULED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
        <Calendar className="h-3 w-3" />
        Segera Tayang
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      Selesai
    </span>
  )
}

function LiveCard({ stream }: { stream: LiveStream }) {
  const storeName =
    stream.store?.name?.replace('Affiliate Gadget - ', '') ||
    stream.store?.name ||
    'Toko Resmi'
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
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/10 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

        {/* Status badge */}
        <div className="absolute left-3 top-3 z-10">
          <StatusBadge status={stream.status} />
        </div>

        {/* Viewer count */}
        {isLive && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <Users className="h-3 w-3 text-red-400" />
            {stream.viewerCount.toLocaleString('id-ID')}
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="rounded-full bg-white/30 p-3.5 backdrop-blur-md transition group-hover:scale-110">
            <PlayCircle className="h-8 w-8 text-white drop-shadow-md" />
          </div>
        </div>

        {/* Bottom Store Pill on Thumbnail */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center gap-1.5 text-xs font-semibold text-white drop-shadow">
          <div className="relative h-4 w-4 overflow-hidden rounded-full bg-white/20">
            {stream.store?.logo ? (
              <Image
                src={stream.store.logo}
                alt={storeName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <Store className="h-3.5 w-3.5 p-0.5 text-white" />
            )}
          </div>
          <span className="truncate">{storeName}</span>
          {stream.store?.city && (
            <>
              <span className="text-white/60">•</span>
              <span className="truncate text-white/80">
                {stream.store.city}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Info Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
          {stream.title}
        </h3>

        {/* Scheduled or Started Timestamp */}
        {stream.status === 'SCHEDULED' && stream.scheduledAt && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <Clock className="h-3.5 w-3.5" />
            Tayang {formatScheduledTime(stream.scheduledAt)}
          </div>
        )}
        {isLive && stream.startedAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Sedang tayang dari toko cabang
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
          <span className="font-medium text-slate-600 dark:text-slate-400">
            {stream._count.comments} komentar interaktif
          </span>
          <span className="flex items-center gap-1 font-bold text-orange-600 transition-transform group-hover:translate-x-0.5">
            Tonton Live
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        {/* Hero Header */}
        <div className="mb-8 space-y-3 text-center sm:mb-10">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {liveStreams.length > 0 && (
              <span className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                <span className="h-2 w-2 animate-ping rounded-full bg-red-600" />
                {liveStreams.length} TOKO SEDANG SIARAN LANGSUNG
              </span>
            )}
            <span className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              Siaran Asli Admin Toko Cabang
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Live Shopping Cabang Toko
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Saksikan siaran langsung langsung dari admin toko cabang resmi
            se-Indonesia. Tanya jawab unit gadget, tawar langsung, klaim garansi
            30 hari, dan gratis bonus 3-in-1!
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {(
            [
              ['all', 'Semua Siaran', streams.length],
              ['LIVE', '🔴 Sedang Live', liveStreams.length],
              ['SCHEDULED', 'Segera Tayang', scheduledStreams.length],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`shadow-xs rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                filter === key
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="border-3 h-10 w-10 animate-spin rounded-full border-slate-200 border-t-orange-500" />
              <p className="text-sm font-medium text-slate-500">
                Memuat siaran live toko...
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Radio className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Belum Ada Admin Toko yang Sedang Siaran Langsung
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Saat ini belum ada toko cabang yang memulai sesi siaran langsung.
              Siaran langsung kamera toko akan otomatis tampil di sini dan di
              katalog ketika admin toko mengaktifkan siaran dari toko fisik
              mereka.
            </p>
            <div className="mt-5">
              <Link
                href="/gadget"
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
              >
                Jelajahi Katalog Smartphone
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Live Now Section */}
            {(filter === 'all' || filter === 'LIVE') &&
              liveStreams.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-ping rounded-full bg-red-600" />
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Sedang Live Sekarang ({liveStreams.length})
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-orange-600">
                      Bisa Ditonton & Ditawar Langsung
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {liveStreams.map((s) => (
                      <LiveCard key={s.id} stream={s} />
                    ))}
                  </div>
                </section>
              )}

            {/* Scheduled Section */}
            {(filter === 'all' || filter === 'SCHEDULED') &&
              scheduledStreams.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Jadwal Siaran Berikutnya ({scheduledStreams.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {scheduledStreams.map((s) => (
                      <LiveCard key={s.id} stream={s} />
                    ))}
                  </div>
                </section>
              )}

            {/* Ended / Archive Section */}
            {filter === 'all' && endedStreams.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-600 dark:text-slate-400">
                    Rekaman Siaran Sebelumnya
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 opacity-75 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {endedStreams.map((s) => (
                    <LiveCard key={s.id} stream={s} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
      <div className="block md:hidden">
        <MobileBottomNav activeTab="none" />
      </div>
    </div>
  )
}
