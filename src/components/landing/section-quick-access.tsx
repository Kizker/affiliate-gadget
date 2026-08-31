'use client'

import Link from 'next/link'
import {
  ShieldCheck,
  Building2,
  Gift,
  MessageCircle,
  ArrowRight,
} from 'lucide-react'

export function SectionQuickAccess() {
  const cards = [
    {
      title: 'Garansi 30 Hari Ganti Baru',
      desc: 'Perlindungan penggantian unit rusak fungsional.',
      icon: ShieldCheck,
      href: '/garansi',
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40',
      badge: 'Bebas Khawatir',
    },
    {
      title: 'Jaringan Toko Resmi',
      desc: 'Jaringan toko fisik terpercaya dengan layanan profesional.',
      icon: Building2,
      href: '/toko',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
      badge: 'Resmi & Terverifikasi',
    },
    {
      title: 'Paket Bonus 3-in-1 Lengkap',
      desc: 'Charger 20W + Antigores 9D + Case gratis Rp 0 di web.',
      icon: Gift,
      href: '/gadget',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
      badge: 'Senilai Rp 450rb',
    },
    {
      title: 'Live Chat Toko',
      desc: 'Konsultasi ketersediaan unit asli via chat internal toko.',
      icon: MessageCircle,
      href: '/dashboard/customer/chat',
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
      badge: 'Respon Kilat',
    },
  ]

  return (
    <section className="py-8 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, idx) => {
            const Icon = card.icon
            return (
              <Link
                key={idx}
                href={card.href}
                className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <span>Lihat Selengkapnya</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default SectionQuickAccess
