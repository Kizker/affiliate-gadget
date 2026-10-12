'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ShieldCheck, MapPin, Compass, ExternalLink, Clock } from 'lucide-react'
import type { MitraDetail } from '@/types/mitra-detail'

// Dynamic import for heavy Google Maps SDK components (Task 2.3)
const GoogleMapDisplay = dynamic(
  () => import('@/components/maps/google-map-display'),
  { ssr: false }
)
const GoogleMapsProvider = dynamic(
  () => import('@/components/maps/google-maps-provider'),
  { ssr: false }
)

interface MitraInfoProps {
  mitra: MitraDetail
  mapsUrl: string
  onBookingChat: (e?: React.MouseEvent) => void
}

export function MitraInfo({ mitra, mapsUrl, onBookingChat }: MitraInfoProps) {
  return (
    <section
      id="informasi-mitra"
      className="relative border-t border-neutral-100 px-4 py-8 dark:border-neutral-900 sm:px-6 md:flex md:h-screen md:snap-start md:flex-col md:justify-center md:overflow-hidden md:pt-16 lg:px-8"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-5 space-y-1.5 text-center sm:mb-6">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
            Informasi Workshop &amp; Lokasi Resmi
          </h2>
          <p className="text-xs text-neutral-500 sm:text-sm">
            Kunjungi langsung bengkel servis resmi atau pesan antar-jemput kurir
            instan terdekat.
          </p>
        </div>

        {/* Mobile Only: Dedicated Compact Store Hub Card */}
        <div className="block space-y-4 rounded-3xl border border-neutral-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 md:hidden">
          {/* Header: Status Mitra */}
          <div className="flex items-start gap-3 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                ✓ Mitra Servis Resmi Terdaftar
              </span>
              <h3 className="truncate text-sm font-bold text-neutral-950 dark:text-white">
                {mitra.businessName}
              </h3>
              <p className="text-[11px] text-neutral-500">
                {mitra.city}, {mitra.province || 'Indonesia'}
              </p>
            </div>
          </div>

          {/* Address & Google Maps */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900 dark:text-white" />
              <div>
                <p className="font-medium leading-relaxed text-neutral-900 dark:text-neutral-200">
                  {mitra.address}
                </p>
                <p className="text-neutral-500">
                  {mitra.city}, {mitra.province}
                </p>
              </div>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shadow-2xs flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-900 transition-all active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Petunjuk Arah Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Hours & Chat Action */}
          <div className="space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {mitra.weekdayHours || '09:00 - 20:00 WIB'}
                </span>
              </div>
              <button
                onClick={(e) => onBookingChat(e)}
                className="text-xs font-bold text-blue-600 underline underline-offset-4 dark:text-sky-400"
              >
                Chat Teknisi →
              </button>
            </div>

            {/* Mobile Contact Badges */}
            {(mitra.phone || mitra.email) && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                {mitra.phone && (
                  <a
                    href={`tel:${mitra.phone}`}
                    className="flex items-center gap-1 font-medium text-neutral-800 hover:underline dark:text-neutral-200"
                  >
                    <span>📞 {mitra.phone}</span>
                  </a>
                )}
                {mitra.email && (
                  <a
                    href={`mailto:${mitra.email}`}
                    className="flex items-center gap-1 truncate hover:underline"
                  >
                    <span>✉️ {mitra.email}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Only: 3 Columns Grid */}
        <div className="hidden gap-4 sm:gap-5 md:grid md:grid-cols-3">
          {/* 1. Kredibilitas & Sertifikasi */}
          <div className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-neutral-950 dark:text-white sm:text-sm">
              Kredibilitas &amp; Garansi Servis
            </h3>
            <div className="space-y-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              <p className="font-semibold text-neutral-900 dark:text-neutral-200">
                {mitra.businessName}
              </p>
              <p>Mitra Terverifikasi Platform Affiliate Gadget</p>
              {mitra.description && (
                <p className="line-clamp-2 pt-1 text-[11px] leading-relaxed text-neutral-500">
                  {mitra.description}
                </p>
              )}
              <p className="pt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                ✓ Garansi Pengerjaan &amp; Suku Cadang Teruji
              </p>
            </div>
          </div>

          {/* 2. Lokasi Fisik Workshop & Peta */}
          <div className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <MapPin className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-neutral-950 dark:text-white sm:text-sm">
              Alamat Fisik Workshop
            </h3>
            <div className="space-y-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              <p className="line-clamp-2 leading-relaxed">{mitra.address}</p>
              <p className="font-medium">
                {mitra.city}, {mitra.province}
              </p>
              <div className="pt-1">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-black underline underline-offset-4 hover:opacity-75 dark:text-white"
                >
                  Petunjuk Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* 3. Jam Operasional & Kontak Langsung */}
          <div className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-neutral-950 dark:text-white sm:text-sm">
              Jam Buka &amp; Kontak Resmi
            </h3>
            <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
              <p className="font-medium text-neutral-900 dark:text-neutral-200">
                {mitra.weekdayHours?.toLowerCase().includes('senin')
                  ? mitra.weekdayHours
                  : `Senin - Sabtu: ${mitra.weekdayHours || '09:00 - 20:00 WIB'}`}
              </p>
              {mitra.weekendHours && (
                <p className="text-neutral-500">
                  {mitra.weekendHours.toLowerCase().includes('minggu')
                    ? mitra.weekendHours
                    : `Minggu / Libur: ${mitra.weekendHours}`}
                </p>
              )}

              {/* Saluran Kontak Resmi yang diinputkan mitra */}
              <div className="space-y-1 border-t border-neutral-100 pt-2 text-[11px] dark:border-neutral-800">
                {mitra.phone && (
                  <p className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      Telp:
                    </span>
                    <a href={`tel:${mitra.phone}`} className="hover:underline">
                      {mitra.phone}
                    </a>
                  </p>
                )}
                {mitra.email && (
                  <p className="flex items-center gap-1.5 truncate text-neutral-700 dark:text-neutral-300">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      Email:
                    </span>
                    <a
                      href={`mailto:${mitra.email}`}
                      className="truncate hover:underline"
                    >
                      {mitra.email}
                    </a>
                  </p>
                )}
                {mitra.website && (
                  <p className="flex items-center gap-1.5 truncate text-neutral-700 dark:text-neutral-300">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      Web:
                    </span>
                    <a
                      href={
                        mitra.website.startsWith('http')
                          ? mitra.website
                          : `https://${mitra.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-blue-600 hover:underline dark:text-sky-400"
                    >
                      {mitra.website}
                    </a>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1.5">
                <button
                  onClick={(e) => onBookingChat(e)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-black underline underline-offset-4 dark:text-white"
                >
                  Buka Chat Teknisi →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Google Maps Container (Desktop & Tablet) */}
        {mitra.latitude && mitra.longitude && (
          <div className="mt-5 hidden overflow-hidden rounded-3xl border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 md:block">
            <div className="h-64 w-full lg:h-72">
              <GoogleMapsProvider>
                <GoogleMapDisplay
                  latitude={mitra.latitude}
                  longitude={mitra.longitude}
                  address={mitra.address}
                  businessName={mitra.businessName}
                />
              </GoogleMapsProvider>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
