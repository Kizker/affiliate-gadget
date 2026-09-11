'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  Clock,
  Mail,
  CheckCircle,
  Loader2,
  AlertTriangle,
  RotateCw,
  Edit3,
  Store,
  Building2,
  MapPin,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import StoreDataForm from '@/components/mitra/store-data-form'

interface ApplicationDetails {
  id?: string
  storeName?: string
  companyName?: string
  taxId?: string | null
  address?: string
  city?: string
  province?: string
  postalCode?: string | null
  phone?: string
  bankName?: string | null
  accountNumber?: string | null
  accountName?: string | null
  rejectionReason?: string | null
  submittedAt?: string
  updatedAt?: string
}

export default function MitraPendingPage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()

  const [mitraStatus, setMitraStatus] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [applicationDetails, setApplicationDetails] =
    useState<ApplicationDetails | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isEditingForm, setIsEditingForm] = useState(false)
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('')

  const isRedirectingRef = useRef(false)
  const isPollingRef = useRef(false)

  const fetchLiveStatus = useCallback(
    async (isManual = false) => {
      if (isRedirectingRef.current || isPollingRef.current) return
      isPollingRef.current = true
      if (isManual) setIsChecking(true)

      try {
        const res = await fetch('/api/mitra/status', {
          cache: 'no-store',
        })

        if (!res.ok) {
          if (isManual)
            toast.error('Gagal mengambil status pendaftaran terkini.')
          return
        }

        const data = await res.json()
        setMitraStatus(data.mitraStatus)
        setRejectionReason(data.rejectionReason)
        setApplicationDetails(data.applicationDetails)
        setLastCheckedTime(new Date().toLocaleTimeString('id-ID'))

        // If approved or upgraded to STORE_ADMIN, refresh session & redirect
        if (data.mitraStatus === 'APPROVED' || data.role === 'STORE_ADMIN') {
          if (!isRedirectingRef.current) {
            isRedirectingRef.current = true
            toast.success(
              'Pendaftaran toko berhasil disetujui! Mengalihkan ke Dashboard Toko...'
            )
            if (updateSession) {
              await updateSession()
            }
            setTimeout(() => {
              window.location.href = '/dashboard/admin'
            }, 800)
          }
          return
        }

        if (isManual) {
          if (data.mitraStatus === 'REJECTED') {
            toast.warning('Pengajuan pendaftaran memerlukan perbaikan data.')
          } else {
            toast.info(
              'Pemeriksaan selesai: Status masih menunggu review Superadmin.'
            )
          }
        }
      } catch (err) {
        console.error('Error checking status:', err)
        if (isManual) toast.error('Koneksi terganggu saat memeriksa status.')
      } finally {
        isPollingRef.current = false
        if (isManual) setIsChecking(false)
      }
    },
    [updateSession]
  )

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchLiveStatus(false)

      // Background periodic check every 25 seconds
      const interval = setInterval(() => {
        if (!isRedirectingRef.current) {
          fetchLiveStatus(false)
        }
      }, 25000)

      return () => clearInterval(interval)
    }
  }, [status, router, fetchLiveStatus])

  const handleManualRefresh = async () => {
    if (isChecking || isRedirectingRef.current) return
    await fetchLiveStatus(true)
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  const currentStatus =
    mitraStatus || (session?.user as any)?.mitraStatus || 'PENDING'

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-slate-50 p-4 text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[400px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-blue-100/40 via-orange-50/20 to-transparent blur-3xl dark:from-slate-800/30" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-6">
        <div className="w-full">
          {/* Main Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
            {/* Case 1: NEEDS_STORE_DATA (User registered but hasn't completed store profile) */}
            {currentStatus === 'NEEDS_STORE_DATA' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    <Store className="h-7 w-7" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Lengkapi Profil Cabang Toko
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Akun dasar Anda telah aktif. Lengkapi informasi toko dan
                    badan usaha untuk ditinjau oleh Superadmin.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:p-6">
                  <StoreDataForm
                    userId={session?.user?.id}
                    onSubmitSuccess={() => {
                      fetchLiveStatus(true)
                    }}
                    apiEndpoint="/api/auth/register/store-data"
                    httpMethod="POST"
                    submitButtonText="Kirim Data Toko untuk Ditinjau"
                  />
                </div>
              </div>
            )}

            {/* Case 2: REJECTED (Admin rejected application with note) */}
            {currentStatus === 'REJECTED' && !isEditingForm && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    <XCircle className="h-7 w-7" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                    Pendaftaran Perlu Perbaikan
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Superadmin telah meninjau pengajuan Anda dan memerlukan
                    klarifikasi atau perbaikan data berikut.
                  </p>
                </div>

                {/* Rejection Note Alert */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/40 sm:p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-rose-900 dark:text-rose-200">
                        Catatan dari Superadmin:
                      </h4>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-rose-800 dark:text-rose-300">
                        {rejectionReason ||
                          'Mohon lengkapi atau perbaiki kembali kelengkapan profil badan usaha cabang toko Anda.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Edit Button CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingForm(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Data Toko & Ajukan Ulang</span>
                  </button>
                </div>
              </div>
            )}

            {/* Case 2.1: Editing form when REJECTED */}
            {currentStatus === 'REJECTED' && isEditingForm && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-slate-950 dark:text-white">
                      Edit Data Toko & Ajukan Ulang
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Perbarui data sesuai arahan catatan superadmin
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingForm(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Batal
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:p-6">
                  <StoreDataForm
                    initialData={applicationDetails || {}}
                    userId={session?.user?.id}
                    onSubmitSuccess={() => {
                      setIsEditingForm(false)
                      fetchLiveStatus(true)
                    }}
                    apiEndpoint="/api/mitra/store-application"
                    httpMethod="PUT"
                    submitButtonText="Perbarui & Ajukan Ulang untuk Ditinjau"
                  />
                </div>
              </div>
            )}

            {/* Case 3: PENDING (Default waiting state) */}
            {currentStatus === 'PENDING' && (
              <div className="space-y-6">
                {/* Icon & Title */}
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/40" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                        <Clock className="h-8 w-8" />
                      </div>
                    </div>
                  </div>

                  <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Menunggu Verifikasi & Persetujuan
                  </h1>
                  <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                    Data toko Anda telah dikirim dan sedang dalam antrean review
                    oleh tim Superadmin. Status diperiksa secara real-time.
                  </p>
                </div>

                {/* Submitted Store Summary Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3 dark:border-slate-700/60">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {applicationDetails?.storeName ||
                          session?.user?.name ||
                          'Cabang Toko Mitra'}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {applicationDetails?.companyName
                          ? `Badan Hukum: ${applicationDetails.companyName}`
                          : session?.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-3 text-[11px]">
                    <div>
                      <span className="block text-slate-400">
                        Lokasi Cabang:
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {applicationDetails?.city
                          ? `${applicationDetails.city}, ${applicationDetails.province}`
                          : 'Sedang Diproses'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400">
                        Status Pengajuan:
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                        Menunggu Review
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stepper Status Visual */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Pendaftaran & Data Toko Terkirim
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Profil badan usaha dan rekening tersimpan aman
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full bg-amber-500 text-white">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Proses Review oleh Superadmin
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Verifikasi keabsahan data cabang toko
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-40">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Akses Dashboard Toko Aktif
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Otomatis diarahkan begitu disetujui
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auto check banner info */}
                <div className="flex items-center justify-between rounded-xl bg-blue-50/80 px-3.5 py-2.5 text-[11px] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  <div className="flex items-center gap-2">
                    <RotateCw
                      className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {isChecking
                        ? 'Memeriksa status pengajuan...'
                        : `Pemeriksaan otomatis aktif ${lastCheckedTime ? `(Terakhir: ${lastCheckedTime})` : ''}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="mt-6 flex flex-col gap-2.5 border-t border-slate-100 pt-2 dark:border-slate-800 sm:flex-row">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-1/3"
              >
                Keluar / Logout
              </button>

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isChecking}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`}
                />
                <span>
                  {isChecking ? 'Memeriksa...' : 'Refresh Status Sekarang'}
                </span>
              </button>
            </div>
          </div>

          {/* Help Contact Footer */}
          <p className="mt-5 text-center text-xs text-slate-400">
            Ada pertanyaan seputar kemitraan toko?{' '}
            <a
              href="mailto:support@affiliategadget.com"
              className="font-bold text-slate-700 hover:underline dark:text-slate-200"
            >
              support@affiliategadget.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
