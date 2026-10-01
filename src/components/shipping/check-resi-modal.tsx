'use client'

import React, { useState, useEffect } from 'react'
import {
  Search,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Package,
  RotateCcw,
  X,
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BiteshipLogo } from '@/components/shipping/biteship-logo'

interface CheckpointItem {
  id: string
  status: string
  description: string
  location: string
  timestamp: string
}

interface TrackingResult {
  success: boolean
  data?: {
    trackingNumber: string
    orderNumber?: string
    courierCode: string
    courierService: string
    status: string
    statusLabel: string
    estimatedDelivery?: string
    orderId?: string
    checkpoints: CheckpointItem[]
    driver?: {
      name: string
      phone: string
      plateNumber: string
      vehicleModel: string
    }
    originStore: { name: string; city: string }
    destinationCustomer: { name: string; city: string }
  }
  exception?: {
    type: string
    label: string
    description: string
    severity: string
    customerAction?: string
    showClaimButton: boolean
  } | null
  error?: string
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const STATUS_ICON: Record<string, string> = {
  DRIVER_ALLOCATED: '🏍️',
  MANIFEST_GENERATED: '📋',
  PICKED_UP: '📦',
  ON_TRANSIT: '🏭',
  ON_THE_WAY: '🏎️',
  WITH_COURIER: '🚚',
  DELIVERED: '✅',
  RETURNED_TO_SENDER: '↩️',
  EXCEPTION: '⚠️',
}

interface CheckResiModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export function CheckResiModal({
  isOpen,
  onClose,
  initialQuery = '',
}: CheckResiModalProps) {
  const [awbInput, setAwbInput] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [searched, setSearched] = useState(false)
  const [copiedAwb, setCopiedAwb] = useState(false)

  // Auto trigger search if initialQuery is provided when opening
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setAwbInput(initialQuery)
        executeSearch(initialQuery)
      } else {
        setResult(null)
        setSearched(false)
      }
    } else {
      setResult(null)
      setSearched(false)
      setAwbInput('')
    }
  }, [isOpen, initialQuery])

  const executeSearch = async (query: string) => {
    const clean = query.trim().toUpperCase().replace(/^#/, '')
    if (!clean) return

    setLoading(true)
    setSearched(true)
    setResult(null)

    try {
      const res = await fetch(
        `/api/shipping/tracking/awb-lookup?awb=${encodeURIComponent(clean)}`
      )
      const json: TrackingResult = await res.json()
      setResult(json)
    } catch {
      setResult({
        success: false,
        error: 'Gagal menghubungi server pelacakan. Silakan coba kembali.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    executeSearch(awbInput)
  }

  const handleCopyAwb = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAwb(true)
    setTimeout(() => setCopiedAwb(false), 2000)
  }

  const data = result?.data
  const exception = result?.exception

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-lg">
        {/* Modal Header */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-6 pr-14 dark:border-slate-800 dark:bg-slate-800/40 sm:px-7 sm:py-7">
          <div className="flex items-start gap-3.5">
            <div className="shadow-2xs flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200/80 bg-blue-100 text-blue-600 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-400">
              <Truck className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base font-bold leading-tight text-slate-900 dark:text-white sm:text-[17px]">
                  Cek Resi & Lacak Pengiriman
                </DialogTitle>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/80 bg-blue-50/90 px-2 py-0.5 text-[9.5px] font-bold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  Live
                </span>
              </div>
              <DialogDescription className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Lacak status ekspedisi real-time nomor resi kurir (AWB) atau
                nomor pesanan platform.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="no-scrollbar max-h-[calc(90vh-170px)] space-y-4 overflow-y-auto p-6">
          {/* Search Box Input Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={awbInput}
                  onChange={(e) => setAwbInput(e.target.value)}
                  placeholder="Masukkan No. Resi (AWB) atau No. Pesanan..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/90 py-2.5 pl-10 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-900 outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  autoFocus
                />
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                {awbInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setAwbInput('')
                      setResult(null)
                      setSearched(false)
                    }}
                    className="absolute right-3 top-2.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !awbInput.trim()}
                className="shadow-2xs flex shrink-0 items-center gap-1.5 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
                <span>Lacak</span>
              </button>
            </div>

            {/* Quick helper tip */}
            <p className="text-[11px] text-slate-400">
              Mendukung resi JNE, kurir instan Gojek, serta nomor order platform
              resmi (<span className="font-mono">#SPR-...</span>).
            </p>
          </form>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Menghubungkan ke Gateway Ekspedisi...
                </p>
                <p className="text-[11px] text-slate-400">
                  Sinkronisasi riwayat perjalanan paket secara real-time
                </p>
              </div>
            </div>
          )}

          {/* Error / Not Found state */}
          {!loading && searched && !result?.success && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/40">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Data Pelacakan Tidak Ditemukan
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  {result?.error ||
                    'Nomor resi atau pesanan belum terdaftar pada sistem ekspedisi. Pastikan nomor sudah sesuai atau coba beberapa saat lagi.'}
                </p>
              </div>
            </div>
          )}

          {/* Tracking Result Card */}
          {!loading && data && (
            <div className="space-y-4">
              {/* Header Overview Card */}
              <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-4 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                        Nomor Resi / AWB
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black tracking-wide text-white">
                          {data.trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAwb(data.trackingNumber)}
                          className="rounded-md bg-white/10 p-1 text-white transition hover:bg-white/20 active:scale-95"
                          title="Salin Resi"
                        >
                          {copiedAwb ? (
                            <Check className="h-3 w-3 text-emerald-300" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      {data.orderNumber && (
                        <p className="mt-1 text-[11px] text-blue-100">
                          Pesanan:{' '}
                          <span className="font-mono font-bold text-white">
                            #{data.orderNumber}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-blue-200">
                        Kurir & Layanan
                      </span>
                      <p className="text-xs font-bold text-white">
                        {data.courierCode === 'GOJEK'
                          ? '🏍️ Gojek Instant'
                          : '📦 JNE Express'}
                      </p>
                      {data.courierService && (
                        <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-white">
                          {data.courierService}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  {/* Status pill & Estimation */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Status:
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          data.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : data.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {data.statusLabel}
                      </span>
                    </div>

                    {data.estimatedDelivery && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        <span>Estimasi Tiba: {data.estimatedDelivery}</span>
                      </div>
                    )}
                  </div>

                  {/* Route Origin to Destination */}
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {data.originStore.name} ({data.originStore.city})
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">
                      ➔
                    </span>
                    <span className="truncate font-semibold text-slate-900 dark:text-white">
                      {data.destinationCustomer.name} (
                      {data.destinationCustomer.city})
                    </span>
                  </div>

                  {/* Driver info if Gojek */}
                  {data.driver && (
                    <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/70 p-2.5 text-xs dark:border-orange-950/50 dark:bg-orange-950/20">
                      <div>
                        <p className="text-[10px] font-black uppercase text-orange-700 dark:text-orange-400">
                          Driver Kurir Instan
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {data.driver.name}
                        </p>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          {data.driver.plateNumber} • {data.driver.vehicleModel}
                        </p>
                      </div>
                      {data.driver.phone && (
                        <a
                          href={`tel:${data.driver.phone}`}
                          className="shadow-2xs rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-orange-600 hover:bg-orange-50 dark:bg-slate-800 dark:text-orange-300"
                        >
                          Hubungi Driver
                        </a>
                      )}
                    </div>
                  )}

                  {/* Exception detector alert */}
                  {exception && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900/50 dark:bg-amber-950/30">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-amber-900 dark:text-amber-200">
                          Kendala Logistik: {exception.label}
                        </p>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300">
                          {exception.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkpoint Timeline */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h4 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Riwayat Perjalanan Paket
                </h4>

                {data.checkpoints && data.checkpoints.length > 0 ? (
                  <div className="space-y-0">
                    {[...data.checkpoints].reverse().map((cp, idx) => (
                      <div key={cp.id || idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                              idx === 0
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-400/40'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            }`}
                          >
                            {STATUS_ICON[cp.status] || '📍'}
                          </div>
                          {idx < data.checkpoints.length - 1 && (
                            <div className="my-1 min-h-[1.75rem] w-0.5 flex-1 bg-slate-200 dark:bg-slate-800" />
                          )}
                        </div>
                        <div className="min-w-0 pb-3.5">
                          <p
                            className={`text-xs font-bold ${
                              idx === 0
                                ? 'text-blue-700 dark:text-blue-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {cp.description}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-slate-400">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {cp.location} • {formatDate(cp.timestamp)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                    Belum ada riwayat checkpoint yang dicatat kurir.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-800/40 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">
                Powered by
              </span>
              <BiteshipLogo height={14} width={60} className="opacity-80" />
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link
              href="/resi"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              <span>Buka Halaman Publik Resi</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shadow-2xs rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
