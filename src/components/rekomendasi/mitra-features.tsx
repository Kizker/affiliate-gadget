'use client'

import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-is-mobile'

interface MitraFeaturesProps {
  features?: string[] | null
  businessName: string
}

export function MitraFeatures({ features, businessName }: MitraFeaturesProps) {
  const isMobile = useIsMobile(768)

  if (!features || features.length === 0) return null

  return (
    <section
      id="keunggulan"
      className="px-4 py-8 sm:px-6 md:flex md:h-screen md:snap-start md:flex-col md:justify-center md:overflow-hidden md:pt-16 lg:px-8"
      style={!isMobile ? { minHeight: '100vh', height: '100vh' } : undefined}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 space-y-1.5 text-center sm:mb-8">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0070F3] dark:text-sky-400">
            Standar Kualitas
          </span>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
            Keunggulan Layanan {businessName}
          </h2>
          <p className="text-xs text-neutral-500 sm:text-sm">
            Fasilitas dan komitmen kerja teknisi untuk kepuasan reparasi
            pelanggan.
          </p>
        </div>

        {/* Mobile: 1 Baris Horizontal Scrollable, Desktop: 5-Col Grid (Maksimal 5 Elemen) */}
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {features.slice(0, 5).map((feature, idx) => (
            <div
              key={idx}
              className="flex min-w-[140px] flex-1 shrink-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-neutral-200/80 bg-white p-4 text-center shadow-sm transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 sm:min-w-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 sm:text-sm">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
