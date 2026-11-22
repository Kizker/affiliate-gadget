'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Send,
  Smartphone,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePageGuard } from '@/hooks/use-page-guard'

interface WhatsAppStatusData {
  success: boolean
  gateway: string
  status: string // 'connected' | 'qr_ready' | 'starting' | 'offline'
  phone?: string | null
  pushName?: string | null
  sessionId?: string | null
  qrCode?: string | null
  error?: string | null
}

export default function WhatsAppGatewayPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/whatsapp'
  )

  const [data, setData] = useState<WhatsAppStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Test form state
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState(
    'Halo! Ini adalah pesan uji coba verifikasi otomatis dari Affiliate Gadget. Gateway WhatsApp aktif!'
  )
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  const handleRestartSession = async () => {
    setIsRestarting(true)
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' }),
      })
      if (res.ok) {
        toast.success('Sesi WhatsApp dimuat ulang! Menyiapkan QR Code...')
        setTimeout(() => fetchStatus(false), 2000)
      } else {
        toast.error('Gagal memuat ulang sesi WhatsApp')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setIsRestarting(false)
    }
  }

  const fetchStatus = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true)
      const res = await fetch('/api/admin/whatsapp', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        setData({
          success: false,
          gateway: 'OPENWA',
          status: 'offline',
          error: json.error,
        })
      }
    } catch {
      setData({
        success: false,
        gateway: 'OPENWA',
        status: 'offline',
        error: 'Gagal terhubung ke service gateway',
      })
    } finally {
      setLoading(false)
      if (!isSilent) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isAllowed) {
      fetchStatus()
    }
  }, [isAllowed, fetchStatus])

  // Polling saat status qr_ready agar otomatis terdeteksi saat di-scan
  useEffect(() => {
    if (!isAllowed) return
    const interval = setInterval(() => {
      if (data?.status === 'qr_ready' || data?.status === 'starting') {
        fetchStatus(true)
      }
    }, 3500)
    return () => clearInterval(interval)
  }, [isAllowed, data?.status, fetchStatus])

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone.trim()) {
      toast.error('Masukkan nomor WhatsApp tujuan')
      return
    }

    setIsSendingTest(true)
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPhone: testPhone.trim(),
          message: testMessage.trim(),
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(
          `Pesan berhasil dikirim via ${json.provider}! Periksa WhatsApp penerima.`
        )
      } else {
        toast.error(json.error || 'Gagal mengirim pesan WhatsApp')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan saat mengirim pesan')
    } finally {
      setIsSendingTest(false)
    }
  }

  if (guardLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  const isConnected = data?.status === 'connected'
  const isQrReady = data?.status === 'qr_ready' && Boolean(data?.qrCode)

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            WhatsApp Gateway (OpenWA)
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Pusat server pengiriman pesan &amp; OTP WhatsApp otomatis tanpa
            biaya (Rp 0)
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchStatus()}
          disabled={refreshing}
          className="shadow-2xs inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
          />
          <span>Perbarui Status</span>
        </button>
      </div>

      {/* Status Banner */}
      <div
        className={`flex items-center justify-between gap-4 rounded-3xl border p-5 sm:p-6 ${
          isConnected
            ? 'border-emerald-200/90 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
            : isQrReady
              ? 'border-amber-200/90 bg-amber-50/70 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
              : 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              isConnected
                ? 'bg-emerald-600 text-white'
                : isQrReady
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : isQrReady ? (
              <QrCode className="h-6 w-6" />
            ) : (
              <AlertCircle className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black">
                {isConnected
                  ? 'WhatsApp Terhubung & Aktif'
                  : isQrReady
                    ? 'Menunggu Scan QR Code'
                    : 'Gateway Sedang Memuat'}
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected
                    ? 'animate-pulse bg-emerald-500'
                    : isQrReady
                      ? 'animate-ping bg-amber-500'
                      : 'bg-slate-400'
                }`}
              />
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {isConnected
                ? `Nomor Pengirim: ${data?.phone || 'Terhubung'} (${data?.pushName || 'Affiliate Gadget Bot'})`
                : isQrReady
                  ? 'Silakan scan kode QR di bawah menggunakan WhatsApp di smartphone Anda'
                  : data?.error ||
                    'Sedang menghubungkan ke service OpenWA di port 2785...'}
            </p>
          </div>
        </div>

        <div className="hidden font-mono text-[11px] text-slate-500 sm:block">
          Provider:{' '}
          <strong className="font-bold text-slate-800 dark:text-slate-200">
            OpenWA Engine
          </strong>
        </div>
      </div>

      {/* Main Grid: QR Code Scanner on Left, Instruction / Test on Right */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Box 1: QR Code Scanner */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <QrCode className="h-4 w-4 text-emerald-600" />
            <span>Pindai Kode QR WhatsApp</span>
          </h2>

          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/30">
            {isConnected ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                  WhatsApp Sudah Tertaut!
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Semua pesan verifikasi OTP akan dikirim otomatis dari nomor
                  ini.
                </p>
              </div>
            ) : isQrReady && data?.qrCode ? (
              <div className="flex flex-col items-center space-y-3">
                <img
                  src={data.qrCode}
                  alt="WhatsApp QR Code"
                  className="h-64 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-md dark:border-slate-700"
                />
                <div className="flex items-center gap-2">
                  <p className="text-center text-[11px] font-semibold text-slate-500">
                    QR Code siap dipindai
                  </p>
                  <button
                    type="button"
                    onClick={handleRestartSession}
                    disabled={isRestarting}
                    className="text-[11px] font-bold text-orange-600 hover:underline"
                    title="Buat QR Code baru jika kedaluwarsa"
                  >
                    (Ganti QR Baru)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Sedang menyiapkan sesi WhatsApp...
                </p>
                <button
                  type="button"
                  onClick={handleRestartSession}
                  disabled={isRestarting}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isRestarting ? 'animate-spin' : ''}`}
                  />
                  <span>Muat Ulang Sesi &amp; QR Code</span>
                </button>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Langkah Menghubungkan:
            </p>
            <ol className="list-inside list-decimal space-y-1 text-[11px]">
              <li>Buka WhatsApp di smartphone Anda</li>
              <li>
                Ketuk <strong>Menu (⋮)</strong> atau <strong>Pengaturan</strong>
              </li>
              <li>
                Pilih <strong>Perangkat Tertaut (Linked Devices)</strong>
              </li>
              <li>Arahkan kamera HP ke QR Code di atas</li>
            </ol>
          </div>
        </div>

        {/* Box 2: Uji Coba Pengiriman Langsung */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Send className="h-4 w-4 text-orange-600" />
            <span>Uji Coba Pengiriman Pesan</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Tes kirim pesan langsung dari server ke nomor WhatsApp untuk
            memastikan pengiriman berjalan lancar
          </p>

          <form onSubmit={handleSendTestMessage} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nomor WhatsApp Tujuan:
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="0831... atau 628..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pesan WhatsApp:
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingTest || !testPhone.trim()}
              className="shadow-xs inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3 text-xs font-bold text-white transition hover:bg-orange-700 active:scale-95 disabled:opacity-50"
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirim Pesan...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Kirim Pesan WhatsApp Sekarang</span>
                </>
              )}
            </button>
          </form>

          {/* Keuntungan OpenWA */}
          <div className="mt-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 text-xs text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            <div className="flex items-center gap-1.5 font-bold">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              <span>Gratis &amp; Unlimited:</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-800 dark:text-emerald-400">
              OpenWA berjalan langsung di server VPS Anda. Tidak ada biaya pulsa
              atau masa aktif paket seperti Zenziva, dan pesan terkirim
              menggunakan nomor resmi Anda sendiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
