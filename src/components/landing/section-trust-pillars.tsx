'use client'

import Link from 'next/link'
import { ShieldCheck, Gift, Building2, ArrowRight } from 'lucide-react'

export function SectionTrustPillars() {
  const pillars = [
    {
      title: 'Garansi 30 Hari Tukar Unit',
      badge: 'Bebas Khawatir',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      desc: 'Jika unit second mengalami kendala fungsional non-kelalaian, toko menyediakan unit pengganti teruji atau refund tanpa penundaan.',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      actionText: 'Ketentuan Garansi',
      href: '/garansi',
    },
    {
      title: 'Paket Bonus 3-in-1 (Rp 0)',
      badge: 'Senilai Rp 450.000',
      badgeColor: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
      desc: 'Otomatis siap pakai. Setiap pembelian unit second dilengkapi Charger Fast Charging, Antigores 9D, dan Case pelindung.',
      icon: Gift,
      iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
      actionText: 'Lihat Paket Gadget',
      href: '/gadget',
    },
    {
      title: 'Jaringan Toko Terverifikasi',
      badge: 'Badan Usaha Resmi PT',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      desc: 'Seluruh cabang toko fisik terdaftar legal di Jakarta, Surabaya, Bandung, Medan, dan Jogja dengan inventori unit second nyata.',
      icon: Building2,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      actionText: 'Kunjungi Toko',
      href: '/toko',
    },
  ]

  return (
    <section className="h-screen flex flex-col pt-16 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/80 overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-4 sm:mb-8 shrink-0">
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Keuntungan Belanja Gadget Second di Sini
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Jaminan unit second original 100% lolos uji teknisi, proteksi garansi toko fisik, dan paket aksesoris lengkap.
          </p>
        </div>

        {/* 3 Pillars 
            Mobile : vertikal stack (3 kartu atas-bawah), compact, fit layar
            Desktop: grid 3 kolom
        */}
        <div className="flex-1 min-h-0 flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="group flex flex-row md:flex-col items-center md:items-start justify-between rounded-2xl md:rounded-3xl border border-slate-200/80 bg-white px-4 py-3 md:p-7 transition-all duration-300 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 flex-1 min-h-0"
              >
                {/* Mobile: icon kiri, teks tengah, link kanan */}
                <div className="flex items-center gap-3 md:w-full md:flex-col md:items-start flex-1 min-w-0">
                  {/* Icon */}
                  <div className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl ${item.iconBg} shadow-2xs`}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>

                  {/* Title & Desc */}
                  <div className="flex-1 min-w-0 md:mt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm md:text-xl font-black text-slate-950 dark:text-white group-hover:text-orange-500 transition-colors tracking-tight">
                        {item.title}
                      </h3>
                    </div>
                    <span className={`hidden md:inline-block mt-2 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold tracking-wide uppercase ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <p className="mt-0.5 md:mt-4 text-[11px] md:text-[15px] leading-relaxed md:leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2 md:line-clamp-none">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={item.href}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:text-orange-500 dark:text-slate-200 dark:group-hover:text-orange-400 transition-colors cursor-pointer ml-3 md:ml-0 md:mt-4 md:pt-4 md:border-t md:border-slate-100 md:dark:border-slate-800/80 md:w-full"
                >
                  <span className="hidden md:inline">{item.actionText}</span>
                  <ArrowRight className="h-4 w-4 md:h-3.5 md:w-3.5 md:transition-transform md:duration-200 md:group-hover:translate-x-1" />
                </Link>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default SectionTrustPillars
