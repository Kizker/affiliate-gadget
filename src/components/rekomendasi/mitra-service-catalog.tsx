'use client'

import React from 'react'
import { Wrench, MessageSquare } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { ServiceItem } from '@/types/mitra-detail'
import { formatServicePrice } from '@/lib/mitra-utils'

interface MitraServiceCatalogProps {
  services: ServiceItem[]
  businessName: string
  onBookingChat: (e?: React.MouseEvent, serviceName?: string) => void
  initialIsMobile?: boolean
}

export function MitraServiceCatalog({
  services,
  businessName,
  onBookingChat,
  initialIsMobile,
}: MitraServiceCatalogProps) {
  const isMobile = useIsMobile(768, initialIsMobile)

  return (
    <section
      id="katalog-layanan"
      suppressHydrationWarning
      className="relative border-y border-neutral-100 bg-[#F8F9FA] px-4 py-8 dark:border-neutral-900 dark:bg-neutral-950/70 sm:px-6 md:flex md:h-screen md:snap-start md:scroll-mt-24 md:flex-col md:justify-center md:overflow-hidden md:py-10 lg:px-8"
      style={!isMobile ? { minHeight: '100vh', height: '100vh' } : undefined}
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* Section Header */}
        <div className="space-y-1.5 pb-5 text-center sm:pb-6">
          <h2 className="text-2xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-3xl lg:text-4xl">
            Pilihan Servis &amp; Estimasi Biaya
          </h2>
          <p className="mx-auto max-w-lg text-xs text-neutral-500 sm:text-sm">
            Semua estimasi biaya terbuka secara transparan. Klik layanan yang
            dibutuhkan untuk langsung terhubung dengan teknisi di {businessName}
            .
          </p>
        </div>

        {/* Elevated Service Cards Grid */}
        {services && services.length > 0 ? (
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 ${
              services.length <= 3
                ? 'md:grid-cols-3'
                : 'md:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {services.map((service) => (
              <div
                key={service.id || service.name}
                className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-neutral-300 hover:shadow-[0_20px_35px_rgba(0,0,0,0.1)] active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-3xl sm:p-6"
              >
                <div className="space-y-3">
                  {/* Icon */}
                  <div className="flex items-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                      {service.icon ? (
                        <span className="text-xl">{service.icon}</span>
                      ) : (
                        <Wrench className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                      )}
                    </div>
                  </div>

                  {/* Service Name & Description */}
                  <div>
                    <h3 className="line-clamp-2 text-sm font-bold tracking-tight text-neutral-900 transition-colors group-hover:text-black dark:text-white dark:group-hover:text-neutral-100 sm:text-base">
                      {service.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                      {service.description ||
                        `Layanan perbaikan dan pergantian komponen presisi untuk ${service.name}.`}
                    </p>
                  </div>
                </div>

                {/* Price & Action Button */}
                <div className="mt-5 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Estimasi Mulai
                    </span>
                    <span className="text-sm font-black tabular-nums text-neutral-950 dark:text-white sm:text-base">
                      {formatServicePrice(service.price)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => onBookingChat(e, service.name)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-neutral-900 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black active:scale-95 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Booking Layanan Ini</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-300 py-16 text-center text-xs text-neutral-400 dark:border-neutral-800">
            Belum ada daftar layanan yang ditampilkan. Silakan hubungi langsung
            mitra via WhatsApp atau Live Chat.
          </div>
        )}
      </div>
    </section>
  )
}
