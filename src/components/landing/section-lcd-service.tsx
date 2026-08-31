'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wrench, Clock, ShieldCheck, ArrowRight, CheckCircle2, PhoneCall, Sparkles } from 'lucide-react'

export function SectionLcdService() {
  const [selectedBrand, setSelectedBrand] = useState('Apple')
  const [selectedModel, setSelectedModel] = useState('iPhone 15 Pro')
  const [selectedQuality, setSelectedQuality] = useState('Original OLED')

  const estimates: Record<string, Record<string, Record<string, number>>> = {
    Apple: {
      'iPhone 15 Pro': {
        'Original OLED': 3450000,
        'Premium High Copy': 2100000,
      },
      'iPhone 14': {
        'Original OLED': 2450000,
        'Premium High Copy': 1550000,
      },
      'iPhone 13': {
        'Original OLED': 1950000,
        'Premium High Copy': 1250000,
      },
    },
    Samsung: {
      'Galaxy S24 Ultra': {
        'Original Dynamic AMOLED': 3750000,
        'OEM Screen': 2450000,
      },
      'Galaxy S23': {
        'Original Dynamic AMOLED': 2200000,
        'OEM Screen': 1450000,
      },
    },
  }

  const models = Object.keys(estimates[selectedBrand] || {})
  const qualities = Object.keys(estimates[selectedBrand]?.[selectedModel] || { 'Original OLED': 1950000 })
  const price = estimates[selectedBrand]?.[selectedModel]?.[selectedQuality] || 1950000

  return (
    <section className="py-16 bg-slate-50/50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-center">
          {/* Left Info (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" /> LAYANAN SERVIS LCD KILAT 2 JAM
            </span>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl dark:text-white leading-tight">
              Ganti Layar LCD HP 2 Jam Selesai Bergaransi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Layar ponsel Anda pecah atau tidak responsif? Dapatkan panel layar Original OLED berkualitas tinggi dengan pemasangan presisi oleh teknisi toko resmi.
            </p>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Pengerjaan ditunggu 1-2 jam langsung selesai di toko</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Garansi 30 Hari penuh jika ada kendala touchscreen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Bisa datang langsung atau jemput via kurir Gojek</span>
              </div>
            </div>
          </div>

          {/* Right Calculator Card (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Kalkulator Estimasi Biaya LCD
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600">
                  Termasuk Jasa Pasang
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
                    Merek
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value)
                      setSelectedModel(Object.keys(estimates[e.target.value] || {})[0] || '')
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {Object.keys(estimates).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
                    Kualitas Panel
                  </label>
                  <select
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {qualities.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Output & CTA */}
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Estimasi Biaya Penggantian:</span>
                  <div className="text-2xl font-black text-blue-700 dark:text-blue-400">
                    Rp {price.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">✓ Garansi Toko 30 Hari</span>
                </div>

                <Link
                  href="/servis-lcd"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-orange-600 transition"
                >
                  Booking Jadwal Servis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionLcdService
