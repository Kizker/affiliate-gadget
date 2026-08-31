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
    <section className="py-16 sm:py-20 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Streamlined Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Keuntungan Belanja Gadget Second di Sini
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Jaminan unit second original 100% lolos uji teknisi, proteksi garansi toko fisik, dan paket aksesoris lengkap.
          </p>
        </div>

        {/* 3 Pillars Bento Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="space-y-4">
                  {/* Top: Icon & Value Chip */}
                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg} shadow-2xs`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wide uppercase ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2 pt-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white group-hover:text-orange-500 transition-colors tracking-tight">
                      {item.title}
                    </h3>
                    
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom CTA Action Link */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-orange-500 dark:text-slate-200 dark:group-hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default SectionTrustPillars
