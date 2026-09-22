'use client'

import { useState, useEffect } from 'react'
import {
  Truck,
  Phone,
  MessageCircle,
  Copy,
  Check,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  RefreshCw,
  User,
} from 'lucide-react'
import { ShippingBookingRecord } from '@/lib/shipping/biteship-client'

interface LiveCourierTrackerProps {
  orderId: string
  initialData?: ShippingBookingRecord | null
}

export function LiveCourierTracker({
  orderId,
  initialData,
}: LiveCourierTrackerProps) {
  const [data, setData] = useState<ShippingBookingRecord | null>(
    initialData || null
  )
  const [loading, setLoading] = useState(!initialData)
  const [copiedResi, setCopiedResi] = useState(false)

  const fetchTracking = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/shipping/tracking/${orderId}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setData(json.data)
        }
      }
    } catch (err) {
      console.error('Error fetching live tracking:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialData) {
      fetchTracking()
    }
  }, [orderId, initialData])

  const handleCopyResi = (resi: string) => {
    navigator.clipboard.writeText(resi)
    setCopiedResi(true)
    setTimeout(() => setCopiedResi(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-slate-400">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-orange-500" />
        <span>Memuat data pelacakan kurir real-time...</span>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const isGojek = data.courierCode === 'GOJEK'

  return (
    <div className="shadow-2xs overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              isGojek
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
            }`}
          >
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-sm">
                {isGojek ? 'Gojek Instant Kurir' : 'JNE Express Terproteksi'}
              </h4>
              <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {data.courierService}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {data.statusLabel} • Estimasi:{' '}
              {data.estimatedDelivery || '1-2 Jam'}
            </p>
          </div>
        </div>

        {/* Resi Badge */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
            {data.trackingNumber}
          </span>
          <button
            onClick={() => handleCopyResi(data.trackingNumber)}
            title="Salin Resi"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            {copiedResi ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Gojek Specific: Driver Card */}
        {isGojek && data.driver && (
          <div className="mb-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex flex-col justify-between gap-3.5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3.5">
                <div className="shadow-xs flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <User className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {data.driver.name}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      Driver Gojek
                    </span>
                  </div>
                  <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {data.driver.plateNumber}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {data.driver.vehicleModel}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Phone & WA */}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${data.driver.phone}`}
                  className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Phone className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Telepon</span>
                </a>
                <a
                  href={`https://wa.me/${data.driver.phone.replace(/[^0-9]/g, '')}?text=Halo%20Pak%20${encodeURIComponent(data.driver.name)},%20saya%20penerima%20pesanan%20%23${data.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shadow-xs inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Chat WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Stepper Checkpoints */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <span>Riwayat Status Pengiriman Real-Time</span>
          </div>

          <div className="mt-2 space-y-0">
            {data.checkpoints.map((cp, idx) => {
              const isFirst = idx === 0
              const isLast = idx === data.checkpoints.length - 1
              return (
                <div key={cp.id || idx} className="flex items-start gap-3.5">
                  {/* Timeline Dot & Connector Line */}
                  <div className="flex flex-col items-center self-stretch">
                    <div
                      className={`shadow-xs flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 ${
                        isFirst
                          ? 'bg-orange-500 text-white ring-4 ring-orange-500/20'
                          : 'bg-slate-300 text-transparent dark:bg-slate-700'
                      }`}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    {!isLast && (
                      <div className="my-1.5 min-h-[28px] w-[2px] grow bg-slate-200 dark:bg-slate-800" />
                    )}
                  </div>

                  {/* Description & Details */}
                  <div
                    className={`min-w-0 flex-1 space-y-1 ${
                      !isLast ? 'pb-4' : 'pb-1'
                    }`}
                  >
                    <p
                      className={`text-xs leading-relaxed ${
                        isFirst
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cp.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <MapPin className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        {cp.location}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">
                        •
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        {new Date(cp.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mandatory Insurance Footer Notice */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold leading-tight">
            Paket ini diproteksi 100% asuransi kehilangan & kerusakan fisik
            selama pengiriman.
          </span>
        </div>
      </div>
    </div>
  )
}
