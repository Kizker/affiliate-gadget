'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Download,
} from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { CustomPaymentMethod } from '@/lib/midtrans'

export interface CustomPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  totalAmount: number
  onPaymentSuccess?: () => void
}

interface PaymentChargeResult {
  type: CustomPaymentMethod
  orderNumber: string
  midtransOrderId?: string
  grossAmount: number
  expiryTime?: string
  qrCodeUrl?: string
  qrString?: string
  vaNumber?: string
  bank?: string
  billKey?: string
  billerCode?: string
  deepLinkUrl?: string
}

export function CustomPaymentModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmount,
  onPaymentSuccess,
}: CustomPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<CustomPaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)
  const [chargeData, setChargeData] = useState<PaymentChargeResult | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(900) // default 15 minutes countdown
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [generatingQr, setGeneratingQr] = useState<boolean>(false)

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Polling payment status
  const checkStatus = useCallback(
    async (manual: boolean = false) => {
      if (!orderNumber || isSuccess) return
      if (manual) setCheckingStatus(true)
      try {
        const query = new URLSearchParams({ orderNumber })
        if (chargeData?.midtransOrderId) {
          query.set('midtransOrderId', chargeData.midtransOrderId)
        }
        const res = await fetch(`/api/payment/status?${query.toString()}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.isPaid || data.paymentStatus === 'SUCCESS') {
          setIsSuccess(true)
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          toast.success('Pembayaran berhasil dikonfirmasi!')
          if (onPaymentSuccess) onPaymentSuccess()
        } else if (manual) {
          toast.info('Menunggu pembayaran diselesaikan...')
        }
      } catch (err) {
        console.error('Status check error:', err)
      } finally {
        if (manual) setCheckingStatus(false)
      }
    },
    [orderNumber, chargeData, isSuccess, onPaymentSuccess]
  )

  // Generate high-res base64 QR Code directly from qrString or qrCodeUrl
  useEffect(() => {
    if (chargeData?.type === 'qris') {
      if (chargeData.qrString) {
        setGeneratingQr(true)
        QRCode.toDataURL(chargeData.qrString, {
          width: 360,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        })
          .then((url) => {
            setQrDataUrl(url)
          })
          .catch((err) => {
            console.error('[QRIS] Local QR generation error:', err)
            setQrDataUrl(chargeData.qrCodeUrl || null)
          })
          .finally(() => {
            setGeneratingQr(false)
          })
      } else if (chargeData.qrCodeUrl) {
        setQrDataUrl(chargeData.qrCodeUrl)
      }
    } else {
      setQrDataUrl(null)
    }
  }, [chargeData])

  // Auto poll every 3.5 seconds when charge data is visible
  useEffect(() => {
    if (isOpen && chargeData && !isSuccess) {
      pollTimerRef.current = setInterval(() => {
        checkStatus(false)
      }, 3500)
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [isOpen, chargeData, isSuccess, checkStatus])

  // Countdown timer
  useEffect(() => {
    if (!chargeData || isSuccess) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [chargeData, isSuccess])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedMethod(null)
      setChargeData(null)
      setQrDataUrl(null)
      setIsSuccess(false)
      setCopiedText(null)
      setTimeLeft(900)
    }
  }, [isOpen])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    const originalOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.overscrollBehavior = originalOverscroll
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectPayment = async (method: CustomPaymentMethod) => {
    setSelectedMethod(method)
    setLoading(true)
    try {
      const res = await fetch('/api/payment/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId || orderNumber,
          paymentType: method,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.data) {
        throw new Error(json.error || 'Gagal membuat tagihan pembayaran')
      }

      setChargeData(json.data)
      setTimeLeft(method === 'qris' ? 900 : 86400) // 15 mins for QRIS, 24h for VA
    } catch (err: any) {
      console.error('Charge error:', err)
      toast.error(err.message || 'Gagal memproses pembayaran')
      setSelectedMethod(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    toast.success(`${label} berhasil disalin`)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const paymentOptions = [
    {
      id: 'qris' as CustomPaymentMethod,
      name: 'QRIS Instan (Semua Pembayaran)',
      desc: 'BCA Mobile, Livin, GoPay, OVO, Dana, ShopeePay',
      badge: 'Rekomendasi',
      badgeColor: 'bg-emerald-500 text-white',
      icon: <QrCode className="h-6 w-6 text-orange-500" />,
    },
    {
      id: 'bca_va' as CustomPaymentMethod,
      name: 'BCA Virtual Account',
      desc: 'Konfirmasi otomatis 24 jam via m-BCA / ATM',
      icon: <Building2 className="h-6 w-6 text-blue-600" />,
    },
    {
      id: 'mandiri_va' as CustomPaymentMethod,
      name: 'Mandiri Bill Payment',
      desc: 'Livin by Mandiri & ATM Mandiri',
      icon: <Building2 className="h-6 w-6 text-amber-600" />,
    },
    {
      id: 'bni_va' as CustomPaymentMethod,
      name: 'BNI Virtual Account',
      desc: 'BNI Mobile Banking, SMS Banking & ATM',
      icon: <Building2 className="h-6 w-6 text-teal-600" />,
    },
    {
      id: 'bri_va' as CustomPaymentMethod,
      name: 'BRI Virtual Account (BRIVA)',
      desc: 'BRImo & ATM Bank BRI',
      icon: <Building2 className="h-6 w-6 text-blue-700" />,
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center overscroll-none bg-slate-950/70 p-3 backdrop-blur-sm animate-in fade-in sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/40 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            {chargeData && !isSuccess ? (
              <button
                type="button"
                onClick={() => setChargeData(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                title="Ganti Metode"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white">
                <CreditCard className="h-4 w-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isSuccess
                  ? 'Pembayaran Berhasil'
                  : chargeData
                    ? 'Selesaikan Pembayaran'
                    : 'Pilih Metode Pembayaran'}
              </h3>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {orderNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 touch-pan-y overflow-y-auto overscroll-contain p-4 sm:p-6">
          {isSuccess ? (
            /* Success State */
            <div className="space-y-5 py-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pembayaran Terkonfirmasi!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pesanan Anda sudah lunas dan langsung diteruskan ke toko resmi
                  untuk dipersiapkan.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex justify-between py-1 text-slate-500">
                  <span>Nomor Pesanan</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {orderNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-500">
                  <span>Total Dibayar</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-500">
                  <span>Status</span>
                  <span className="font-bold text-emerald-600">LUNAS</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700"
              >
                Tutup & Lihat Pesanan
              </button>
            </div>
          ) : chargeData ? (
            /* Charge View: QRIS or Virtual Account */
            <div className="space-y-5">
              {/* Total & Countdown Banner */}
              <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/50 p-4 dark:border-orange-950/40 dark:bg-orange-950/20">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Total Pembayaran
                  </span>
                  <p className="text-lg font-bold text-slate-950 dark:text-white">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-orange-600 dark:border-orange-800 dark:bg-slate-900">
                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                  <span>{formatCountdown(timeLeft)}</span>
                </div>
              </div>

              {chargeData.type === 'qris' ? (
                /* QRIS Mode */
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex w-full max-w-[280px] flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-white">
                    {generatingQr || (!qrDataUrl && !chargeData.qrCodeUrl) ? (
                      <div className="flex h-56 w-56 flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        <span className="text-xs text-slate-400">
                          Menyiapkan QRIS...
                        </span>
                      </div>
                    ) : (
                      <img
                        src={qrDataUrl || chargeData.qrCodeUrl}
                        alt="QRIS Standar Nasional"
                        className="shadow-xs h-56 w-56 rounded-2xl object-contain"
                      />
                    )}
                    <div className="mt-3 flex w-full items-center justify-center border-t border-slate-100 pt-2.5">
                      <span className="text-[11px] font-black tracking-widest text-slate-900">
                        QRIS STANDAR NASIONAL
                      </span>
                    </div>
                  </div>

                  {/* Actions: Download QRIS */}
                  {qrDataUrl && (
                    <div className="flex justify-center">
                      <a
                        href={qrDataUrl}
                        download={`QRIS-${orderNumber}.png`}
                        className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Download className="h-3.5 w-3.5 text-orange-500" />
                        <span>Unduh Gambar QR</span>
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Scan QRIS di atas dengan m-Banking (BCA, Mandiri, BRI, BNI)
                    atau E-Wallet (GoPay, OVO, Dana, ShopeePay).
                  </p>
                </div>
              ) : chargeData.vaNumber ? (
                /* Bank Virtual Account Mode */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Nomor Virtual Account (
                        {chargeData.bank || 'Bank Transfer'})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(chargeData.vaNumber!, 'Nomor VA')
                        }
                        className="shadow-2xs inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {copiedText === 'Nomor VA' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-orange-500" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-2.5 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-900/60">
                      <span className="block select-all break-all font-mono text-base font-bold tracking-wider text-slate-900 dark:text-white sm:text-lg">
                        {chargeData.vaNumber}
                      </span>
                    </div>
                  </div>

                  {/* Transfer Guide */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
                    <h5 className="font-bold text-slate-900 dark:text-white">
                      Petunjuk Pembayaran:
                    </h5>
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-500 dark:text-slate-400">
                      <li>Buka aplikasi Mobile Banking atau ATM bank Anda.</li>
                      <li>
                        Pilih menu{' '}
                        <strong>Transfer &gt; Virtual Account</strong>.
                      </li>
                      <li>Masukkan Nomor Virtual Account di atas.</li>
                      <li>
                        Periksa nominal tagihan yang tertera harus sesuai.
                      </li>
                      <li>Konfirmasi pembayaran dan simpan bukti transaksi.</li>
                    </ol>
                  </div>
                </div>
              ) : chargeData.billKey ? (
                /* Mandiri Bill Payment */
                <div className="space-y-4">
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Kode Perusahaan (Biller Code)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              chargeData.billerCode || '70012',
                              'Kode Perusahaan'
                            )
                          }
                          className="shadow-2xs inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {copiedText === 'Kode Perusahaan' ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-orange-500" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="mt-1.5 rounded-xl border border-slate-200/70 bg-white p-2.5 dark:border-slate-700/60 dark:bg-slate-900/60">
                        <span className="block select-all break-all font-mono text-base font-bold text-slate-900 dark:text-white">
                          {chargeData.billerCode || '70012'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/60 pt-3 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Nomor Tagihan (Bill Key)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(chargeData.billKey!, 'Bill Key')
                          }
                          className="shadow-2xs inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {copiedText === 'Bill Key' ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-orange-500" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="mt-1.5 rounded-xl border border-slate-200/70 bg-white p-2.5 dark:border-slate-700/60 dark:bg-slate-900/60">
                        <span className="block select-all break-all font-mono text-base font-bold tracking-wider text-slate-900 dark:text-white sm:text-lg">
                          {chargeData.billKey}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Status Polling Bar */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-2 w-2 animate-ping rounded-full bg-orange-500" />
                  <span>Mengecek status pembayaran otomatis...</span>
                </div>

                <button
                  type="button"
                  onClick={() => checkStatus(true)}
                  disabled={checkingStatus}
                  className="inline-flex items-center gap-1 font-bold text-orange-600 transition hover:text-orange-700 disabled:opacity-50 dark:text-orange-400"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${checkingStatus ? 'animate-spin' : ''}`}
                  />
                  <span>Cek Sekarang</span>
                </button>
              </div>
            </div>
          ) : (
            /* Select Payment Method View */
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div>
                  <span className="text-xs text-slate-400">
                    Total yang harus dibayar:
                  </span>
                  <p className="text-lg font-bold text-slate-950 dark:text-white">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Aman & Terproteksi</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pilih Kanal Pembayaran
                </span>

                <div className="space-y-2">
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectPayment(opt.id)}
                      disabled={loading}
                      className="hover:shadow-xs group flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left transition hover:border-orange-500 active:scale-[0.99] disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 group-hover:bg-orange-50/50 dark:border-slate-800 dark:bg-slate-800">
                          {opt.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {opt.name}
                            </span>
                            {opt.badge && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${opt.badgeColor}`}
                              >
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {opt.desc}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-orange-500" />
                    </button>
                  ))}
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-orange-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghubungi sistem pembayaran...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
