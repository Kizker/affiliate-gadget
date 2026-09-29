'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Radio, Users, MapPin, PlayCircle } from 'lucide-react'

export interface LiveBannerData {
  id: string
  title: string
  coverImage: string | null
  viewerCount: number
  status: 'LIVE' | 'SCHEDULED'
  store: {
    name: string
    slug: string
    logo: string | null
    city: string
  } | null
}

interface LiveBannerCardProps {
  stream: LiveBannerData
  className?: string
}

export function LiveBannerCard({
  stream,
  className = '',
}: LiveBannerCardProps) {
  const storeName =
    stream.store?.name?.replace('Affiliate Gadget - ', '') ||
    stream.store?.name ||
    'Affiliate Gadget'
  const isLive = stream.status === 'LIVE'
  const coverSrc =
    stream.coverImage ||
    stream.store?.logo ||
    '/images/banners/samsung-campaign-banner.jpg'

  return (
    <Link
      href={`/live/${stream.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl ${
        isLive
          ? 'border-red-500/60 hover:border-red-400 hover:shadow-red-500/20'
          : 'border-blue-500/40 hover:border-blue-400 hover:shadow-blue-500/20'
      } ${className}`}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        <Image
          src={coverSrc}
          alt={stream.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* LIVE badge top-left */}
        <div className="absolute left-2.5 top-2.5 z-10">
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white shadow-lg shadow-red-600/40">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              <Radio className="h-2.5 w-2.5" />
              Segera
            </span>
          )}
        </div>

        {/* Viewer count top-right */}
        {isLive && stream.viewerCount > 0 && (
          <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <Users className="h-2.5 w-2.5" />
            {stream.viewerCount.toLocaleString('id-ID')}
          </div>
        )}

        {/* Play button center hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-full bg-white/25 p-3 backdrop-blur-sm">
            <PlayCircle className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Bottom: store + location */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5">
          <p className="line-clamp-1 text-[11px] font-bold leading-tight text-white drop-shadow-md">
            {stream.title}
          </p>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/75 drop-shadow-sm">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">
              {storeName} · {stream.store?.city}
            </span>
          </div>
        </div>
      </div>

      {/* Advertisement label */}
      <div className="px-3 pb-2 pt-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
          Live Shopping
        </span>
      </div>
    </Link>
  )
}
