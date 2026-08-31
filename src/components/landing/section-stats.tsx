'use client'

import { Building2, ShieldCheck, Truck, Gift } from 'lucide-react'

export function SectionStats() {
  const stats = [
    {
      value: 'Toko Resmi Terdaftar',
      label: 'Jaringan Toko Offline Fisik',
      desc: 'Jakarta, Surabaya, Bandung & kota lainnya',
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      value: '30 Hari Penuh',
      label: 'Garansi Toko Tukar Unit',
      desc: 'Unit second teruji & klaim mudah',
      icon: ShieldCheck,
      color: 'text-emerald-600',
    },
    {
      value: '100% Terproteksi',
      label: 'Asuransi Pengiriman Wajib',
      desc: 'Kurir resmi JNE & Gojek Instant',
      icon: Truck,
      color: 'text-indigo-600',
    },
    {
      value: 'Rp 0 Paket 3-in-1',
      label: 'Bonus Aksesoris Bawaan',
      desc: 'Charger 20W + Antigores + Case',
      icon: Gift,
      color: 'text-orange-500',
    },
  ]

  return (
    <section className="py-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-slate-800">
            {stats.map((s, idx) => {
              const Icon = s.icon
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-start ${idx > 0 ? 'pt-4 sm:pt-0 lg:pl-6' : ''}`}
                >
                  <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs dark:bg-slate-900 ${s.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tabular-nums tracking-tight">
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {s.desc}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionStats
