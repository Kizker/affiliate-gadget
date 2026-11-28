'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePageGuard } from '@/hooks/use-page-guard'
import { toast } from 'sonner'
import {
  Scale,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Landmark,
  ShieldCheck,
  Building2,
  Receipt,
  ExternalLink,
  Loader2,
  Clock,
  ArrowRight,
  Info,
  X,
} from 'lucide-react'
import {
  IndonesianTaxConfig,
  TaxRemittanceRecord,
} from '@/lib/tax/tax-config-store'

interface TaxApiResponse {
  success: boolean
  canManageConfig: boolean
  role: string
  taxes: Array<
    IndonesianTaxConfig & {
      stats: {
        settledAmount: number
        escrowAmount: number
        txCount: number
      }
    }
  >
  summary: {
    activeTaxCount: number
    totalCollectedSettled: number
    totalInEscrowTax: number
    totalRemittedToDjp: number
    remainingTaxPoolToRemit: number
  }
  taxLedger: Array<{
    id: string
    orderId: string
    orderNumber: string
    storeName: string
    companyName: string
    npwp: string
    customerName: string
    orderStatus: string
    subtotalAfterDiscount: number
    totalTaxDeducted: number
    taxItems: Array<{
      id: string
      shortName: string
      amount: number
      ebillingKapKjs: string
    }>
    date: string
  }>
  remittances: TaxRemittanceRecord[]
  updatedAt: string
}

export default function AdminTaxManagementPage() {
  usePageGuard('/dashboard/admin/tax')
  const { data: session } = useSession()

  const [activeTab, setActiveTab] = useState<
    'CONFIG' | 'LEDGER' | 'REMITTANCE'
  >('CONFIG')
  const [data, setData] = useState<TaxApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingTaxId, setUpdatingTaxId] = useState<string | null>(null)

  // Modal Catat Setoran NTPN
  const [showRemitModal, setShowRemitModal] = useState(false)
  const [remitPeriod, setRemitPeriod] = useState('')
  const [remitNtpn, setRemitNtpn] = useState('')
  const [remitBillingCode, setRemitBillingCode] = useState('')
  const [remitAmount, setRemitAmount] = useState('')
  const [remitNotes, setRemitNotes] = useState('')
  const [submittingRemit, setSubmittingRemit] = useState(false)

  const fetchTaxData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/tax')
      const json = await res.json()
      if (res.ok && json.success) {
        setData(json)
      } else {
        toast.error(json.error || 'Gagal memuat data perpajakan')
      }
    } catch {
      toast.error('Gagal terhubung ke server perpajakan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTaxData()
  }, [fetchTaxData])

  const handleToggleTax = async (tax: IndonesianTaxConfig) => {
    if (!data?.canManageConfig) {
      toast.error(
        'Hanya Superadmin yang memiliki izin mengubah kebijakan perpajakan'
      )
      return
    }

    try {
      setUpdatingTaxId(tax.id)
      const newStatus = !tax.isEnabled
      const updatedTaxes = data.taxes.map((t) =>
        t.id === tax.id ? { ...t, isEnabled: newStatus } : t
      )

      const res = await fetch('/api/admin/tax', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxes: updatedTaxes.map((t) => ({
            id: t.id,
            isEnabled: t.isEnabled,
            rate: t.rate,
          })),
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(
          `${tax.shortName} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`
        )
        fetchTaxData()
      } else {
        toast.error(json.error || 'Gagal memperbarui status pajak')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan pengaturan pajak')
    } finally {
      setUpdatingTaxId(null)
    }
  }

  const handleRecordRemittance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!remitNtpn.trim() || !remitAmount || Number(remitAmount) <= 0) {
      toast.error('Nomor NTPN dan nominal setoran wajib diisi')
      return
    }

    try {
      setSubmittingRemit(true)
      const res = await fetch('/api/admin/tax', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_REMITTANCE',
          periodLabel: remitPeriod.trim() || 'Masa Pajak Berjalan',
          ntpnNumber: remitNtpn.trim().toUpperCase(),
          billingCode: remitBillingCode.trim() || '-',
          amount: Number(remitAmount),
          notes: remitNotes.trim(),
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Bukti setoran kas Negara (NTPN) berhasil dicatat!')
        setShowRemitModal(false)
        setRemitPeriod('')
        setRemitNtpn('')
        setRemitBillingCode('')
        setRemitAmount('')
        setRemitNotes('')
        fetchTaxData()
      } else {
        toast.error(json.error || 'Gagal mencatat setoran pajak')
      }
    } catch {
      toast.error('Terjadi kesalahan saat mencatat setoran')
    } finally {
      setSubmittingRemit(false)
    }
  }

  const formatRupiah = (val: number) =>
    `Rp ${Number(val || 0).toLocaleString('id-ID')}`

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Utama */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Scale className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                Manajemen &amp; Transparansi Pajak Negara
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Sistem kepatuhan perpajakan Indonesia (UU HPP &amp; PMK DJP) —
                Pemotongan, Kas Penampungan, dan Penyetoran e-Billing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTaxData}
            disabled={loading}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Segarkan</span>
          </button>

          {data?.canManageConfig && (
            <button
              onClick={() => {
                setRemitAmount(
                  String(data.summary.remainingTaxPoolToRemit || '')
                )
                setShowRemitModal(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Catat Bukti Setor NTPN</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Kartu KPI Bento Atas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Kas Siap Setor */}
        <div className="shadow-xs rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Kas Penampungan Pajak
            </span>
            <span className="rounded-lg bg-orange-500/10 p-2 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Landmark className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {formatRupiah(data?.summary.remainingTaxPoolToRemit || 0)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
            <span>Siap disetor via e-Billing DJP</span>
          </div>
        </div>

        {/* Card 2: Pajak Tertahan Escrow */}
        <div className="shadow-xs rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pajak Tertahan (Escrow)
            </span>
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {formatRupiah(data?.summary.totalInEscrowTax || 0)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            <span>Pesanan sedang diproses / dikirim</span>
          </div>
        </div>

        {/* Card 3: Telah Disetor ke Kas Negara */}
        <div className="shadow-xs rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Telah Disetor ke Negara
            </span>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {formatRupiah(data?.summary.totalRemittedToDjp || 0)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>{data?.remittances.length || 0} bukti NTPN tercatat</span>
          </div>
        </div>

        {/* Card 4: Kebijakan Pajak Aktif */}
        <div className="shadow-xs rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Status Kebijakan UU
            </span>
            <span className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {data?.summary.activeTaxCount || 0} / {data?.taxes.length || 6}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
            <span>Jenis pajak diaktifkan</span>
          </div>
        </div>
      </div>

      {/* Navigasi Tab */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('CONFIG')}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'CONFIG'
              ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          Konfigurasi &amp; Dasar Hukum UU ({data?.taxes.length || 6})
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'LEDGER'
              ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          Buku Kas / Jurnal Pemotongan Pajak ({data?.taxLedger.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('REMITTANCE')}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'REMITTANCE'
              ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          Bukti Setor Kas Negara NTPN ({data?.remittances.length || 0})
        </button>
      </div>

      {/* TAB 1: KONFIGURASI & DASAR HUKUM UU */}
      {activeTab === 'CONFIG' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-bold">
                  Informasi Kepatuhan Pajak Platform Affiliate Gadget
                </p>
                <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                  Seluruh pemotongan pajak dirancang transparan berdasarkan
                  Undang-Undang Republik Indonesia. Dana potongan pajak tidak
                  diakui sebagai laba marketplace, melainkan ditampung sementara
                  di rekening khusus (Tax Escrow) sebelum disetorkan ke Kas
                  Negara via sistem e-Billing Direktorat Jenderal Pajak (DJP)
                  setiap masa pajak.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data?.taxes.map((tax) => {
              const isUpdating = updatingTaxId === tax.id
              return (
                <div
                  key={tax.id}
                  className={`relative flex flex-col justify-between rounded-3xl border p-5 transition ${
                    tax.isEnabled
                      ? 'shadow-xs border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                      : 'border-slate-200 bg-slate-50/80 opacity-75 dark:border-slate-800 dark:bg-slate-950/40'
                  }`}
                >
                  <div>
                    {/* Header Kartu Pajak */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white dark:bg-white dark:text-slate-900">
                            {tax.code}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              tax.isEnabled
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {tax.isEnabled ? '● Aktif Dikenakan' : '○ Nonaktif'}
                          </span>
                        </div>
                        <h3 className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                          {tax.name}
                        </h3>
                        <p className="mt-0.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                          {tax.basisLabel}
                        </p>
                      </div>

                      {/* Toggle Button (Superadmin Only) */}
                      {data.canManageConfig && (
                        <button
                          type="button"
                          onClick={() => handleToggleTax(tax)}
                          disabled={isUpdating}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            tax.isEnabled
                              ? 'bg-orange-500'
                              : 'bg-slate-300 dark:bg-slate-700'
                          } ${isUpdating ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              tax.isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Rincian Edukasi Perpajakan */}
                    <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          ⚖️ Dasar Hukum:
                        </span>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                          {tax.legalBasis}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          🎯 Tujuan &amp; Penjelasan:
                        </span>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                          {tax.purposeExplanation}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          🔄 Alur Uang:
                        </span>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                          {tax.moneyFlowExplanation}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-100/70 p-2.5 text-[11px] dark:bg-slate-800/50">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          🏦 Kode e-Billing DJP:
                        </span>
                        <p className="mt-0.5 font-mono font-bold text-slate-900 dark:text-white">
                          {tax.ebillingKapKjs}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Statistik Pemotongan Real-Time */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                    <span className="text-slate-500">
                      Terkumpul Siap Setor:
                    </span>
                    <strong className="font-mono text-sm font-black text-slate-950 dark:text-white">
                      {formatRupiah(tax.stats.settledAmount)}
                    </strong>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BUKU KAS / JURNAL PEMOTONGAN PAJAK */}
      {activeTab === 'LEDGER' && (
        <div className="shadow-xs rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                Buku Jurnal Pemotongan Pajak Toko
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan otomatis pemotongan pajak negara dari setiap pesanan
                pelanggan
              </p>
            </div>
            <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {data?.taxLedger.length || 0} Transaksi
            </span>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : !data?.taxLedger || data.taxLedger.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              Belum ada data pemotongan pajak pada pesanan yang selesai.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="pb-3">Pesanan &amp; Tanggal</th>
                    <th className="pb-3">Toko Cabang / PT</th>
                    <th className="pb-3">NPWP Wajib Pajak</th>
                    <th className="pb-3">Nilai Transaksi</th>
                    <th className="pb-3">Rincian Potongan Pajak</th>
                    <th className="pb-3 text-right">Total Pajak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.taxLedger.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-3 pr-3">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          #{row.orderNumber}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(row.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {row.storeName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {row.companyName}
                        </p>
                      </td>
                      <td className="py-3 pr-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {row.npwp}
                      </td>
                      <td className="py-3 pr-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(row.subtotalAfterDiscount)}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {row.taxItems.map((item, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                            >
                              {item.shortName}: {formatRupiah(item.amount)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        -{formatRupiah(row.totalTaxDeducted)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RIWAYAT SETORAN KAS NEGARA (NTPN) */}
      {activeTab === 'REMITTANCE' && (
        <div className="shadow-xs rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                Bukti Penerimaan Negara (BPN) &amp; NTPN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Riwayat penyetoran kas pajak marketplace ke Kas Negara via
                e-Billing DJP
              </p>
            </div>
            {data?.canManageConfig && (
              <button
                onClick={() => {
                  setRemitAmount(
                    String(data.summary.remainingTaxPoolToRemit || '')
                  )
                  setShowRemitModal(true)
                }}
                className="shadow-xs inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-orange-600"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Catat NTPN Baru</span>
              </button>
            )}
          </div>

          {!data?.remittances || data.remittances.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              Belum ada riwayat bukti setoran NTPN yang dicatat.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {data.remittances.map((remit) => (
                <div
                  key={remit.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black tracking-wider text-white">
                        NTPN: {remit.ntpnNumber}
                      </span>
                      <span className="text-[10.5px] font-bold text-slate-500">
                        {remit.periodLabel}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300">
                      Kode Billing:{' '}
                      <code className="font-mono font-bold">
                        {remit.billingCode}
                      </code>{' '}
                      • Disetor oleh: <strong>{remit.remittedBy}</strong> pada{' '}
                      {new Date(remit.remittedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    {remit.notes && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {remit.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                      Nominal Disetor
                    </p>
                    <p className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(remit.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL CATAT BUKTI SETOR NTPN */}
      {showRemitModal && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-orange-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Catat Bukti Setoran NTPN (e-Billing DJP)
                </h3>
              </div>
              <button
                onClick={() => setShowRemitModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleRecordRemittance}
              className="mt-4 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Masa Pajak / Periode:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Masa Pajak November 2026"
                  value={remitPeriod}
                  onChange={(e) => setRemitPeriod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nomor Transaksi Penerimaan Negara (NTPN):{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="16 Digit NTPN Resmi dari Bank / Kantor Pos"
                  value={remitNtpn}
                  onChange={(e) => setRemitNtpn(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs uppercase text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kode Billing (ID Billing DJP):
                </label>
                <input
                  type="text"
                  placeholder="Kode e-Billing 15 Digit"
                  value={remitBillingCode}
                  onChange={(e) => setRemitBillingCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nominal Setoran Pajak (Rp):{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Nominal yang disetorkan ke Kas Negara"
                  value={remitAmount}
                  onChange={(e) => setRemitAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan / Bukti Bayar:
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan transfer bank / bukti penerimaan negara..."
                  value={remitNotes}
                  onChange={(e) => setRemitNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRemitModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRemit}
                  className="shadow-xs inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {submittingRemit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Bukti NTPN</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
