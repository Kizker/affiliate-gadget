'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface MitraChatPopupProps {
  businessName: string
  heroImageSrc: string
  onBookingChat: (e?: React.MouseEvent) => void
}

export function MitraChatPopup({
  businessName,
  heroImageSrc,
  onBookingChat,
}: MitraChatPopupProps) {
  const [showChatPopup, setShowChatPopup] = useState(true)

  if (!showChatPopup) return null

  return (
    <aside
      aria-label="Konsultasi Teknisi Servis"
      className="fixed bottom-6 right-6 z-40 hidden items-center gap-3 duration-500 animate-in fade-in slide-in-from-bottom-4 md:flex"
    >
      {/* Tooltip Chat Bubble */}
      <div className="relative max-w-xs rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <button
          onClick={() => setShowChatPopup(false)}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400"
          title="Tutup Pesan"
        >
          <X className="h-3 w-3" />
        </button>
        <p className="text-[11px] font-medium leading-relaxed text-neutral-700 dark:text-neutral-300">
          Ada kendala layar, baterai, atau mesin pada HP Anda? Konsultasikan
          kerusakan gratis ke teknisi <strong>{businessName}</strong>!
        </p>
        <div className="mt-2">
          <button
            onClick={(e) => onBookingChat(e)}
            className="text-[11px] font-bold text-sky-600 hover:underline dark:text-sky-400"
          >
            Mulai Chat Langsung →
          </button>
        </div>
      </div>

      {/* Avatar Specialist Button */}
      <button
        onClick={(e) => onBookingChat(e)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500 bg-white p-0.5 shadow-2xl transition hover:scale-105 dark:bg-neutral-900"
        title="Chat dengan Teknisi Mitra"
      >
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <ImageWithFallback
            src={heroImageSrc}
            alt="Teknisi Mitra"
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        {/* Active Green Dot */}
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
      </button>
    </aside>
  )
}
