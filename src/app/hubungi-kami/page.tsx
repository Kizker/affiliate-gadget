'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Send,
  MessageCircle,
  CheckCircle2,
  Store,
  ShieldCheck,
  Truck,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export default function HubungiKamiPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    category: 'garansi',
    storeBranch: 'roxy',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  // Quick Help Topic Cards
  const quickTopics = [
    {
      icon: ShieldCheck,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400',
      title: 'Klaim Garansi 30 Hari',
      desc: 'Panduan syarat dan alur klaim tukar unit second di detail pesanan Anda.',
      href: '/dashboard/customer/orders',
      action: 'Buka Pesanan',
    },
    {
      icon: Truck,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
      title: 'Logistik & Proteksi',
      desc: 'Info asuransi pengiriman kurir JNE & Gojek Instant 100%.',
      href: '/gadget',
      action: 'Katalog Gadget',
    },
    {
      icon: Store,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
      title: 'Toko Offline Resmi',
      desc: 'Daftar alamat fisik toko, legalitas PT, dan jam buka.',
      href: '/toko',
      action: 'Daftar Toko',
    },
    {
      icon: MessageCircle,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
      title: 'Live Chat Toko',
      desc: 'Konsultasi cepat kondisi unit second & garansi.',
      href: '/dashboard/customer/chat',
      action: 'Buka Chat Toko',
      external: false,
    },
  ]

  // FAQ List
  const faqs = [
    {
      q: 'Bagaimana prosedur klaim Garansi 30 Hari Tukar Unit Gadget Second?',
      a: 'Jika smartphone second Anda mengalami kendala fungsional non-kelalaian dalam kurun 30 hari sejak barang diterima, Anda cukup memasukkan nomor pesanan di halaman Garansi atau langsung membawa unit ke counter toko terdekat untuk pemeriksaan teknisi kilat.',
    },
    {
      q: 'Apakah semua unit second sudah termasuk paket bonus 3-in-1?',
      a: 'Ya, setiap pembelian gadget second original di platform kami otomatis mendapatkan paket bundling aksesoris gratis senilai Rp 350.000 (Case Premium, Tempered Glass HD, dan Adaptor Fast Charging).',
    },
    {
      q: 'Apakah pengiriman ke luar kota tercover asuransi penuh?',
      a: 'Seluruh pesanan wajib diasuransikan 100% via kurir resmi rekanan kami (JNE Express & Gojek Instant). Jika paket hilang atau rusak selama perjalanan, unit diganti unit normal teruji atau dana dikembalikan penuh.',
    },
    {
      q: 'Bisakah saya datang langsung mengecek kondisi fisik barang di toko?',
      a: 'Tentu bisa. Anda dapat mengecek ketersediaan unit second di halaman Toko, lalu datang langsung ke cabang untuk melihat kondisi fisik, battery health, dan mencoba unit sebelum membeli.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      <Navbar variant="light" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Header Section (Modern, Clean & Proportional) */}
          <div className="mx-auto max-w-2xl text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              <span>Pusat Bantuan & Layanan Resmi</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Pusat Bantuan Pelanggan
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Temukan jawaban cepat seputar pesanan, garansi unit, atau kirimkan tiket bantuan resmi ke tim support kami.
            </p>
          </div>

          {/* Quick Topic Bento Cards (4-Column Bento) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {quickTopics.map((topic, idx) => {
              const Icon = topic.icon
              const isExternal = topic.external
              const CardContent = (
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${topic.color} shadow-2xs`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors dark:text-white">
                      {topic.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {topic.desc}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                    <span>{topic.action}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-orange-500" />
                  </div>
                </div>
              )

              return isExternal ? (
                <a
                  key={idx}
                  href={topic.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  {CardContent}
                </a>
              ) : (
                <Link
                  key={idx}
                  href={topic.href}
                  className="group rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  {CardContent}
                </Link>
              )
            })}
          </div>

          {/* Main 2-Column Bento Grid: FAQ (Left) & Kirim Pesan Form (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
            
            {/* Left Column: FAQ Accordion (6 cols) */}
            <div className="lg:col-span-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
                  Pertanyaan yang Sering Diajukan (FAQ)
                </h2>
              </div>

              <div className="space-y-2.5 pt-1">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/70 bg-slate-50/50 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-800/40 overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-4 text-left focus:outline-none"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white pr-4 leading-snug">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-slate-900 dark:text-white' : ''
                          }`}
                        />
                      </button>
                      
                      {isOpen && (
                        <div className="px-4 pb-4 pt-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60 pt-3 animate-in fade-in duration-150">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Contact Message Form Card (6 cols) */}
            <div className="lg:col-span-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                  Kirim Pesan Resmi ke Tim Support
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Punya pertanyaan khusus, klaim, atau pengadaan unit? Hubungi kami di sini.
                </p>
              </div>

              {submitted ? (
                <div className="rounded-2xl bg-emerald-50/80 p-8 text-center space-y-3 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                    Pesan Anda Telah Berhasil Terkirim!
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto">
                    Representatif tim kami akan merespons melalui WhatsApp atau email yang Anda cantumkan dalam 1x24 jam kerja.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        No. WhatsApp Aktif *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="081234567890"
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Topik Kategori *
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
                      >
                        <option value="garansi">Klaim Garansi 30 Hari</option>
                        <option value="produk">Pertanyaan Stok Produk & Varian</option>
                        <option value="pengiriman">Status Pengiriman & Asuransi</option>
                        <option value="kemitraan">Kemitraan Toko & B2B</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tujuan Cabang Toko *
                      </label>
                      <select
                        value={form.storeBranch}
                        onChange={(e) => setForm({ ...form, storeBranch: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
                      >
                        <option value="roxy">Roxy Mas (Jakarta Pusat)</option>
                        <option value="surabaya">WTC Surabaya</option>
                        <option value="bandung">BEC Bandung</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Rincian Pesan / Keterangan *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tuliskan kendala atau pertanyaan Anda secara jelas..."
                      className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 active:scale-[0.99] transition-all duration-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 w-full sm:w-auto"
                    >
                      <Send className="h-3.5 w-3.5" /> Kirim Pesan Bantuan
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
