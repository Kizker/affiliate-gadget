'use client'

import Link from 'next/link'
import { ShieldCheck, Gift, Building2, ArrowRight } from 'lucide-react'

export function SectionTrustPillars() {
  const pillars = [
    {
      title: 'Garansi 30 Hari Tukar Unit',
      badge: 'Bebas Khawatir',
      badgeColor:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      icon: ShieldCheck,
      iconBg:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      actionText: 'Ketentuan Garansi',
      href: '/garansi',
    },
    {
      title: 'Paket Bonus 3-in-1 (Rp 0)',
      badge: 'Senilai Rp 450.000',
      badgeColor:
        'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
      icon: Gift,
      iconBg:
        'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
      actionText: 'Lihat Paket Gadget',
      href: '/gadget',
    },
    {
      title: 'Jaringan Toko Terverifikasi',
      badge: 'Badan Usaha Resmi PT',
      badgeColor:
        'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      icon: Building2,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      actionText: 'Kunjungi Toko',
      href: '/toko',
    },
  ]

  return (
    <section className="border-y border-slate-100 bg-slate-50/50 py-10 dark:border-slate-800/80 dark:bg-slate-900/30 sm:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-8 max-w-xl text-center sm:mb-10">
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Keuntungan Belanja Gadget Second di Sini
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Jaminan unit second original 100% lolos uji teknisi, proteksi
            garansi toko fisik, dan paket aksesoris lengkap.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 md:rounded-3xl md:p-6"
              >
                <div>
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-12 md:w-12 md:rounded-2xl ${item.iconBg} shadow-2xs`}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>

                  {/* Title & Badge */}
                  <div className="mt-4">
                    <h3 className="text-base font-black tracking-tight text-slate-950 transition-colors group-hover:text-orange-500 dark:text-white md:text-lg">
                      {item.title}
                    </h3>
                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-5 border-t border-slate-100 pt-3.5 dark:border-slate-800/80">
                  <Link
                    href={item.href}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-slate-900 transition-colors group-hover:text-orange-500 dark:text-slate-200 dark:group-hover:text-orange-400"
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
