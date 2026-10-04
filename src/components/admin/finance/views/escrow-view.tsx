'use client'

import React from 'react'
import { CourierBreakdown } from '../types'

interface EscrowViewProps {
  courierBreakdown: CourierBreakdown
}

export function EscrowView({ courierBreakdown }: EscrowViewProps) {
  return (
    <div className="space-y-5 duration-200 animate-in fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Shipped */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
              Dalam Pengiriman Kurir
            </span>
            <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-black text-blue-800">
              SHIPPED
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-blue-950 dark:text-blue-200">
            {courierBreakdown.shippedCount}
          </p>
          <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300">
            Kurir JNE / Gojek sedang menuju alamat pembeli
          </p>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
              Sedang Dipacking Toko
            </span>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-800">
              IN_PROGRESS
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-amber-950 dark:text-amber-200">
            {courierBreakdown.inProgressCount}
          </p>
          <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
            Menunggu kurir Biteship melakukan pickup
          </p>
        </div>

        {/* Paid */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
              Pembayaran Terverifikasi
            </span>
            <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-800">
              PAID
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-emerald-950 dark:text-emerald-200">
            {courierBreakdown.paidCount}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
            Dana aman tersimpan di Rekening Escrow Midtrans
          </p>
        </div>

        {/* Complained */}
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
              Ditahan Komplain Retur
            </span>
            <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-black text-rose-800">
              COMPLAINED
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-rose-950 dark:text-rose-200">
            {courierBreakdown.complainedCount}
          </p>
          <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300">
            Dana ditahan hingga investigasi retur garansi selesai
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Prinsip Keamanan Rekening Escrow Midtrans & Perlindungan Saldo
        </h3>
        <div className="mt-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            1. <strong>Pelepasan Otomatis:</strong> Dana penjualan ditahan
            secara aman di Rekening Escrow resmi Midtrans dan otomatis
            dilepaskan ke <strong>Saldo Siap Cair</strong> saat pesanan
            berstatus{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              COMPLETED
            </span>{' '}
            (pembeli mengonfirmasi pesanan diterima atau 3 hari pasca tiba
            kurir).
          </p>
          <p className="leading-relaxed">
            2. <strong>Perlindungan Beban Pengembalian:</strong> Jika terjadi
            klaim garansi 30 hari atau retur ganti unit baru, saldo escrow
            pesanan tersebut diproteksi hingga toko menyelesaikan
            servis/pengiriman unit pengganti kurir Biteship.
          </p>
          <p className="leading-relaxed">
            3. <strong>Pencairan Mandiri:</strong> Saldo yang telah selesai
            dapat langsung dicairkan kapan saja ke Rekening Bank Mandiri PT
            resmi cabang toko menggunakan verifikasi OTP 2FA WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}
