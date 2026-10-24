'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { calculateNetRefundAmount } from '@/lib/returns/refund-calculator'

interface ReturnModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  totalAmount?: number
  subtotal?: number
  shippingCost?: number
  tax?: number
  insuranceFee?: number
  onSuccess?: () => void
}

const COMMON_REASONS = [
  {
    id: 'CACAT_FISIK',
    label: 'Cacat Fisik / Pecah',
    fullText: 'Unit cacat fisik atau layar retak saat unboxing',
  },
  {
    id: 'MATI_TOTAL',
    label: 'Mati Total (DOA)',
    fullText: 'Unit mati total dan tidak bisa menyala',
  },
  {
    id: 'SALAH_VARIAN',
    label: 'Salah Varian',
    fullText: 'Varian warna atau memori tidak sesuai pesanan',
  },
  {
    id: 'AKSESORIS_KURANG',
    label: 'Aksesoris Kurang',
    fullText: 'Aksesoris atau bonus tidak lengkap',
  },
  {
    id: 'LAINNYA',
    label: 'Kendala Lainnya',
    fullText: 'Ada kendala fungsi pada unit',
  },
]

const POPULAR_BANKS = [
  { id: 'BCA', name: 'BCA (Bank Central Asia)' },
  { id: 'Bank Mandiri', name: 'Bank Mandiri' },
  { id: 'BRI', name: 'BRI (Bank Rakyat Indonesia)' },
  { id: 'BNI', name: 'BNI (Bank Negara Indonesia)' },
  { id: 'BSI (Bank Syariah Indonesia)', name: 'BSI (Bank Syariah Indonesia)' },
  { id: 'CIMB Niaga', name: 'CIMB Niaga' },
  { id: 'Permata Bank', name: 'Permata Bank' },
  { id: 'Bank Jago', name: 'Bank Jago' },
  { id: 'SeaBank', name: 'SeaBank' },
]

export function ReturnModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmount,
  subtotal,
  shippingCost,
  tax,
  insuranceFee,
  onSuccess,
}: ReturnModalProps) {
  const [returnType, setReturnType] = useState<'REFUND' | 'REPLACEMENT'>(
    'REFUND'
  )
  const [selectedPreset, setSelectedPreset] = useState<string>('CACAT_FISIK')
  const [reasonLabel, setReasonLabel] = useState(COMMON_REASONS[0].label)
  const [description, setDescription] = useState(COMMON_REASONS[0].fullText)

  // Bank details for REFUND
  const [bankName, setBankName] = useState('BCA')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false)
  const bankDropdownRef = useRef<HTMLDivElement>(null)

  const [submitting, setSubmitting] = useState(false)

  // Estimasi pengembalian dana setelah dipotong biaya operasional (ongkir, pajak, QC)
  const refundCalc = totalAmount
    ? calculateNetRefundAmount({
        total: totalAmount,
        subtotal,
        shippingCost,
        tax,
        insuranceFee,
      })
    : null

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(e.target as Node)
      ) {
        setIsBankDropdownOpen(false)
      }
    }
    if (isBankDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isBankDropdownOpen])

  if (!isOpen) return null

  const handleSelectPreset = (preset: (typeof COMMON_REASONS)[0]) => {
    setSelectedPreset(preset.id)
    setReasonLabel(preset.label)
    setDescription(preset.fullText)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error(
        'Harap berikan penjelasan detail mengenai kendala unit yang dialami.'
      )
      return
    }

    if (returnType === 'REFUND') {
      if (
        !bankName.trim() ||
        !bankAccountNumber.trim() ||
        !bankAccountName.trim()
      ) {
        toast.error(
          'Harap lengkapi nama bank, nomor rekening, dan atas nama untuk pengembalian dana.'
        )
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          type: returnType,
          reason: selectedPreset,
          reasonLabel,
          description,
          bankName: returnType === 'REFUND' ? bankName : null,
          bankAccountNumber: returnType === 'REFUND' ? bankAccountNumber : null,
          bankAccountName: returnType === 'REFUND' ? bankAccountName : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error || 'Gagal mengirimkan pengajuan pengembalian'
        )
      }

      toast.success('Pengajuan pengembalian berhasil dikirim ke pihak toko!')
      if (onSuccess) onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan sistem')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 duration-200 animate-in fade-in">
      <div
        className="relative flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pengajuan Pengembalian
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              ID Pesanan:{' '}
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                #{orderNumber}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-16 text-xs">
            {/* 1. Solusi yang Diinginkan */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-800 dark:text-white">
                Solusi yang Diinginkan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReturnType('REFUND')}
                  className={`cursor-pointer whitespace-nowrap rounded-xl px-1 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                    returnType === 'REFUND'
                      ? 'border-2 border-orange-500 bg-white font-bold text-orange-500'
                      : 'border border-slate-200 bg-white font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Pengembalian Dana
                </button>
                <button
                  type="button"
                  onClick={() => setReturnType('REPLACEMENT')}
                  className={`cursor-pointer whitespace-nowrap rounded-xl px-1 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                    returnType === 'REPLACEMENT'
                      ? 'border-2 border-orange-500 bg-white font-bold text-orange-500'
                      : 'border border-slate-200 bg-white font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Tukar Unit
                </button>
              </div>
            </div>

            {/* 2. Kategori Alasan */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-800 dark:text-white">
                Kategori Alasan
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(COMMON_REASONS[0])}
                    className={`cursor-pointer whitespace-nowrap rounded-xl px-1 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                      selectedPreset === COMMON_REASONS[0].id
                        ? 'border-2 border-orange-500 bg-white font-bold text-orange-500'
                        : 'border border-slate-200 bg-white font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {COMMON_REASONS[0].label}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(COMMON_REASONS[1])}
                    className={`cursor-pointer whitespace-nowrap rounded-xl px-1 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                      selectedPreset === COMMON_REASONS[1].id
                        ? 'border-2 border-orange-500 bg-white font-bold text-orange-500'
                        : 'border border-slate-200 bg-white font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {COMMON_REASONS[1].label}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(COMMON_REASONS[2])}
                    className={`cursor-pointer whitespace-nowrap rounded-xl px-1 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                      selectedPreset === COMMON_REASONS[2].id
                        ? 'border-2 border-orange-500 bg-white font-bold text-orange-500'
                        : 'border border-slate-200 bg-white font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {COMMON_REASONS[2].label}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(COMMON_REASONS[3])}
                    className={`cursor-pointer whitespace-nowrap rounded-xl px-1 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                      selectedPreset === COMMON_REASONS[3].id
                        ? 'border-2 border-orange-500 bg-white font-bold text-orange-500'
                        : 'border border-slate-200 bg-white font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {COMMON_REASONS[3].label}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPreset(COMMON_REASONS[4])}
                  className={`w-full cursor-pointer whitespace-nowrap rounded-xl px-2 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                    selectedPreset === COMMON_REASONS[4].id
                      ? 'border-2 border-orange-500 bg-white font-bold text-orange-500'
                      : 'border border-slate-200 bg-white font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {COMMON_REASONS[4].label}
                </button>
              </div>
            </div>

            {/* 3. Rincian Penjelasan Kendala */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-800 dark:text-white">
                Rincian Penjelasan Kendala
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan singkat kendala pada unit..."
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 placeholder-slate-400 outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                required
              />
            </div>

            {/* 4. Rekening Tujuan Pengembalian (Only for REFUND) */}
            {returnType === 'REFUND' && (
              <div className="space-y-3">
                {/* Estimasi Potongan Biaya Operasional & Pengembalian Bersih */}
                {refundCalc && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-800 dark:text-white">
                      Rincian Estimasi Pengembalian Dana
                    </label>
                    <div className="space-y-2 rounded-2xl border border-orange-100 bg-orange-50/50 p-3.5 dark:border-orange-950/40 dark:bg-orange-950/20">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Total Pembayaran Pesanan</span>
                        <span className="font-mono">
                          Rp {refundCalc.originalTotal.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="space-y-1 border-y border-dashed border-orange-200/80 py-2 text-[11px] text-slate-600 dark:border-orange-900/40 dark:text-slate-400">
                        <div className="flex items-center justify-between">
                          <span>• Ongkos Kirim Kurir (Hangus):</span>
                          <span className="font-mono text-rose-600 dark:text-rose-400">
                            - Rp{' '}
                            {refundCalc.shippingCost.toLocaleString('id-ID')}
                          </span>
                        </div>
                        {refundCalc.taxDeduction > 0 && (
                          <div className="flex items-center justify-between">
                            <span>• Pajak PPN:</span>
                            <span className="font-mono text-rose-600 dark:text-rose-400">
                              - Rp{' '}
                              {refundCalc.taxDeduction.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                        {refundCalc.insuranceFee > 0 && (
                          <div className="flex items-center justify-between">
                            <span>• Premi Asuransi Kurir Terpakai:</span>
                            <span className="font-mono text-rose-600 dark:text-rose-400">
                              - Rp{' '}
                              {refundCalc.insuranceFee.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>• Biaya Operasional &amp; QC Retur:</span>
                          <span className="font-mono text-rose-600 dark:text-rose-400">
                            - Rp{' '}
                            {refundCalc.operationalFee.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5 text-xs">
                        <span className="font-black text-slate-900 dark:text-white">
                          Estimasi Dana Bersih Dikembalikan:
                        </span>
                        <span className="font-mono text-sm font-black text-orange-600 dark:text-orange-400">
                          Rp{' '}
                          {refundCalc.netRefundAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[10px] leading-tight text-slate-400">
                        *Pengembalian dana dipotong ongkos kirim asli, pajak,
                        serta biaya operasional pengujian teknis gerai cabang.
                      </p>
                    </div>
                  </div>
                )}

                <label className="mb-2 block text-xs font-bold text-slate-800 dark:text-white">
                  Rekening Tujuan Pengembalian
                </label>

                <div className="space-y-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  {/* Nama Bank */}
                  <div className="relative space-y-1" ref={bankDropdownRef}>
                    <label className="text-[11px] font-medium text-slate-500">
                      Nama Bank
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBankDropdownOpen((prev) => !prev)}
                      className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <span className="truncate">
                        {POPULAR_BANKS.find((b) => b.id === bankName)?.name ||
                          bankName}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                          isBankDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isBankDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        {POPULAR_BANKS.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setBankName(b.id)
                              setIsBankDropdownOpen(false)
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                              bankName === b.id
                                ? 'bg-orange-50 font-bold text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
                                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{b.name}</span>
                            {bankName === b.id && (
                              <Check className="h-3.5 w-3.5 text-orange-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nomor Rekening */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="1234567890"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  {/* Atas Nama Rekening */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500">
                      Atas Nama Rekening
                    </label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Sesuai buku tabungan"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 text-xs font-bold text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-xl bg-[#FF5500] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#e04a00] active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mengirim...
                </span>
              ) : (
                'Kirim Pengajuan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReturnModal
