'use client'

import React from 'react'

interface MitraFeaturesProps {
  features?: string[] | null
  businessName: string
}

interface FeatureVisualMeta {
  dotClass: string
  hoverBorder: string
}

// Helper untuk memetakan tema aksen warna secara cerdas dari kata kunci inputan mitra
function getFeatureVisual(featureText: string): FeatureVisualMeta {
  const lower = featureText.toLowerCase()

  // 1. Garansi / Jaminan
  if (lower.includes('garansi') || lower.includes('jaminan')) {
    return {
      dotClass: 'bg-emerald-500',
      hoverBorder: 'hover:border-emerald-400/60 hover:shadow-emerald-500/5',
    }
  }

  // 2. Teknisi / Sertifikasi / Ahli
  if (
    lower.includes('teknisi') ||
    lower.includes('sertifikat') ||
    lower.includes('level') ||
    lower.includes('ahli')
  ) {
    return {
      dotClass: 'bg-blue-500',
      hoverBorder: 'hover:border-blue-400/60 hover:shadow-blue-500/5',
    }
  }

  // 3. Spare Part / Suku Cadang / Original / OEM / Layar
  if (
    lower.includes('spare') ||
    lower.includes('part') ||
    lower.includes('suku cadang') ||
    lower.includes('original') ||
    lower.includes('lcd') ||
    lower.includes('oled')
  ) {
    return {
      dotClass: 'bg-indigo-500',
      hoverBorder: 'hover:border-indigo-400/60 hover:shadow-indigo-500/5',
    }
  }

  // 4. Gratis / Free / Konsultasi / Cek Fisik
  if (
    lower.includes('konsultasi') ||
    lower.includes('gratis') ||
    lower.includes('free') ||
    lower.includes('cek') ||
    lower.includes('diagnos')
  ) {
    return {
      dotClass: 'bg-teal-500',
      hoverBorder: 'hover:border-teal-400/60 hover:shadow-teal-500/5',
    }
  }

  // 5. Express / Kilat / Jam / Cepat
  if (
    lower.includes('express') ||
    lower.includes('kilat') ||
    lower.includes('jam') ||
    lower.includes('cepat') ||
    lower.includes('menit')
  ) {
    return {
      dotClass: 'bg-amber-500',
      hoverBorder: 'hover:border-amber-400/60 hover:shadow-amber-500/5',
    }
  }

  // 6. Home Service
  if (lower.includes('home') || lower.includes('rumah')) {
    return {
      dotClass: 'bg-sky-500',
      hoverBorder: 'hover:border-sky-400/60 hover:shadow-sky-500/5',
    }
  }

  // 7. Pickup / Delivery / Antar / Kurir
  if (
    lower.includes('pickup') ||
    lower.includes('delivery') ||
    lower.includes('antar') ||
    lower.includes('jemput') ||
    lower.includes('kurir') ||
    lower.includes('gojek') ||
    lower.includes('grab')
  ) {
    return {
      dotClass: 'bg-purple-500',
      hoverBorder: 'hover:border-purple-400/60 hover:shadow-purple-500/5',
    }
  }

  // 8. Buka Setiap Hari / Operasional
  if (lower.includes('buka') || lower.includes('hari') || lower.includes('operasional')) {
    return {
      dotClass: 'bg-rose-500',
      hoverBorder: 'hover:border-rose-400/60 hover:shadow-rose-500/5',
    }
  }

  // 9. Cicilan / Pembayaran
  if (lower.includes('cicilan') || lower.includes('bayar') || lower.includes('payment')) {
    return {
      dotClass: 'bg-violet-500',
      hoverBorder: 'hover:border-violet-400/60 hover:shadow-violet-500/5',
    }
  }

  // Fallback untuk custom input mitra
  return {
    dotClass: 'bg-[#0070F3]',
    hoverBorder: 'hover:border-blue-400/60 hover:shadow-blue-500/5',
  }
}

export function MitraFeatures({ features, businessName }: MitraFeaturesProps) {
  if (!features || features.length === 0) return null

  // Ambil maksimal 5 keunggulan sesuai input profil mitra
  const activeFeatures = features.slice(0, 5)

  return (
    <section id="keunggulan" className="px-4 py-8 sm:px-6 md:py-10 lg:px-8 scroll-mt-20 md:scroll-mt-24">
      <div className="mx-auto w-full max-w-7xl">
        {/* Section Header: Bersih, Rapi, Tanpa Ikon */}
        <div className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
          <h2 className="text-2xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
            Standar Layanan {businessName}
          </h2>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
            Fasilitas dan komitmen keunggulan resmi yang aktif disediakan oleh workshop ini.
          </p>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RESPONSIVE CARD GRID: Tanpa Horizontal Scroll / Scrollbar
            Semua keunggulan langsung tampil rapi di layar mobile & desktop
        ───────────────────────────────────────────────────────────── */}
        <div
          className={`grid gap-3 sm:gap-4 lg:gap-5 ${
            activeFeatures.length === 1
              ? 'grid-cols-1 max-w-md mx-auto'
              : activeFeatures.length === 2
                ? 'grid-cols-2 max-w-2xl mx-auto'
                : activeFeatures.length === 3
                  ? 'grid-cols-2 sm:grid-cols-3 max-w-4xl mx-auto'
                  : activeFeatures.length === 4
                    ? 'grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto'
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
          }`}
        >
          {activeFeatures.map((feat, idx) => {
            const visual = getFeatureVisual(feat)
            const isOddLastOnMobile =
              (activeFeatures.length === 3 && idx === 2) ||
              (activeFeatures.length === 5 && idx === 4)

            return (
              <div
                key={idx}
                className={`group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-900/90 ${visual.hoverBorder} ${
                  isOddLastOnMobile ? 'col-span-2 sm:col-span-1' : ''
                }`}
              >
                {/* Top Row: Nomor Urut Monospace Saja */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="inline-flex items-center justify-center h-6.5 w-6.5 sm:h-7 sm:w-7 rounded-lg bg-neutral-100 font-mono text-[11px] sm:text-xs font-bold text-neutral-600 transition-colors group-hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:group-hover:bg-neutral-700">
                    0{idx + 1}
                  </span>
                </div>

                {/* Content: Teks Murni Inputan Mitra */}
                <div className="my-auto py-1 sm:py-1.5">
                  <h3 className="text-xs sm:text-sm lg:text-base font-bold text-neutral-950 dark:text-white leading-snug">
                    {feat}
                  </h3>
                </div>

                {/* Footer: Indikator Fasilitas Toko */}
                <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${visual.dotClass}`} />
                    <span>Fasilitas Toko</span>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[10px] tracking-wide uppercase">
                    Aktif
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


