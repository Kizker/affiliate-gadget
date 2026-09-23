'use client'

import { useState } from 'react'
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
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

export default function CekResiPage() {
  const [awbInput, setAwbInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    const awb = awbInput.trim().toUpperCase()
    if (!awb) return

    setLoading(true)
    setSearched(true)
    setResult(null)

    try {
      // Try find via AWB param on a sentinel orderId
      const res = await fetch(
        `/api/shipping/tracking/awb-lookup?awb=${encodeURIComponent(awb)}`
      )
      const json: TrackingResult = await res.json()
      setResult(json)
    } catch {
      setResult({
        success: false,
        error: 'Gagal mengambil data tracking. Coba lagi.',
      })
    } finally {
      setLoading(false)
    }
  }

  const data = result?.data
  const exception = result?.exception

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <div className="shadow-xs border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-[#1E3A8A]"
            >
              <Package className="h-5 w-5 text-[#F97316]" />
              <span>Affiliate Gadget</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold text-slate-500">
              Lacak Paket
            </span>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="text-[11px] font-medium text-slate-400">
              Powered by
            </span>
            <BiteshipLogo height={16} width={68} className="opacity-90" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-10">
        {/* Title */}
        <div className="space-y-2 text-center">
          <div className="shadow-xs inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-4 py-1.5 text-xs font-bold text-violet-900">
            <BiteshipLogo iconOnly width={16} height={16} />
            <span>Integrasi Resmi Biteship Gateway</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Lacak Status Pengiriman
          </h1>
          <p className="text-sm text-slate-500">
            Masukkan nomor resi untuk melacak posisi paket Anda secara real-time
          </p>
        </div>

        {/* Search Box */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Contoh: JNE260923123456 atau GK-260923123456"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 font-mono text-sm font-semibold outline-none transition focus:border-[#2563EB] focus:bg-white"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !awbInput.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-[#1E3A8A] active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Lacak</span>
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            JNE Express (format: JNExxxxxxxx) · Gojek Instant (format:
            GK-xxxxxxxx)
          </p>
        </div>

        {/* Exception Alert */}
        {exception && (
          <div
            className={`rounded-2xl border p-4 ${
              exception.severity === 'CRITICAL' || exception.severity === 'HIGH'
                ? 'border-red-200 bg-red-50'
                : 'border-orange-200 bg-orange-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  exception.severity === 'CRITICAL'
                    ? 'text-red-500'
                    : 'text-orange-500'
                }`}
              />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  {exception.label}
                </p>
                <p className="text-xs text-slate-600">
                  {exception.description}
                </p>
                {exception.customerAction && (
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    💡 {exception.customerAction}
                  </p>
                )}
                {exception.showClaimButton && (
                  <Link
                    href="/garansi"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Ajukan Klaim Asuransi
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Result */}
        {searched && !loading && result && !result.success && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              {result.error || 'Nomor resi tidak ditemukan'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Pastikan format resi benar atau coba beberapa saat lagi
            </p>
          </div>
        )}

        {/* Result Card */}
        {data && (
          <div className="space-y-4">
            {/* Header Card */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                      Nomor Resi
                    </p>
                    <p className="font-mono text-lg font-black text-white">
                      {data.trackingNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-blue-200">
                      Kurir
                    </p>
                    <p className="text-sm font-bold text-white">
                      {data.courierCode === 'GOJEK'
                        ? '🏍️ Gojek Instant'
                        : '📦 JNE Express'}
                    </p>
                    {data.courierService && (
                      <p className="text-[11px] text-blue-200">
                        {data.courierService}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 px-5 py-4">
                {/* Status pill */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Status Terkini
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      data.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : data.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {data.statusLabel}
                  </span>
                </div>

                {data.estimatedDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Estimasi Tiba
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-800">
                      <Clock className="h-3.5 w-3.5 text-orange-500" />
                      {data.estimatedDelivery}
                    </span>
                  </div>
                )}

                {/* Route */}
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate text-xs text-slate-600">
                    {data.originStore.name}, {data.originStore.city}
                  </span>
                  <span className="text-slate-300">→</span>
                  <span className="truncate text-xs font-semibold text-slate-800">
                    {data.destinationCustomer.city}
                  </span>
                </div>

                {/* Driver info for Gojek */}
                {data.driver && (
                  <div className="rounded-xl border border-orange-100 bg-orange-50/70 px-3 py-2">
                    <p className="mb-1 text-[11px] font-bold text-orange-700">
                      Driver Gojek
                    </p>
                    <p className="text-xs font-semibold text-slate-800">
                      {data.driver.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {data.driver.plateNumber} · {data.driver.vehicleModel}
                    </p>
                  </div>
                )}

                {data.orderId && (
                  <Link
                    href={`/dashboard/customer/orders/${data.orderId}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Lihat Detail Pesanan
                  </Link>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-slate-900">
                Perjalanan Paket
              </h2>
              <div className="relative space-y-0">
                {[...data.checkpoints].reverse().map((cp, i) => (
                  <div key={cp.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                          i === 0
                            ? 'bg-[#2563EB] text-white shadow-md shadow-blue-400/30'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {STATUS_ICON[cp.status] || '📍'}
                      </div>
                      {i < data.checkpoints.length - 1 && (
                        <div className="my-1 min-h-[2rem] w-0.5 flex-1 bg-slate-200" />
                      )}
                    </div>
                    <div className="min-w-0 pb-4">
                      <p
                        className={`text-xs font-bold ${i === 0 ? 'text-[#1E3A8A]' : 'text-slate-700'}`}
                      >
                        {cp.description}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {cp.location} · {formatDate(cp.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info footer */}
        <div className="flex flex-col items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Pelacakan paket resmi via</span>
            <BiteshipLogo height={15} width={64} className="opacity-75" />
          </div>
          <p>
            Terintegrasi langsung armada JNE & Gojek · Asuransi pengiriman 100%
            terlindungi
          </p>
        </div>
      </div>
    </div>
  )
}
