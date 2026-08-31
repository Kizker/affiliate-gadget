'use client'

import { useState, useRef } from 'react'
import {
  X,
  Upload,
  Loader2,
  RotateCcw,
  RefreshCw,
  CreditCard,
  Building2,
  CheckCircle2,
  Play,
  Trash2,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface ReturnModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  totalAmount?: number
  onSuccess?: () => void
}

const isVideoUrl = (url?: string | null) => {
  if (!url) return false
  return /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(url)
}

const COMMON_REASONS = [
  {
    id: 'PRODUK_RUSAK',
    label: 'Cacat Fisik / Pecah',
    fullText: 'Unit memiliki cacat fisik, baret dalam, atau layar retak saat kemasan pertama kali dibuka',
  },
  {
    id: 'MATI_TOTAL_DOA',
    label: 'Mati Total (DOA)',
    fullText: 'Unit mati total, bootloop, atau tidak merespons daya pengisian saat dinyalakan',
  },
  {
    id: 'SALAH_VARIAN',
    label: 'Salah Varian / Warna',
    fullText: 'Varian kapasitas memori internal, RAM, atau warna tidak sesuai dengan invoice pesanan',
  },
  {
    id: 'BONUS_KURANG',
    label: 'Aksesoris / Bonus Kurang',
    fullText: 'Paket bonus 3-in-1 (Charger / Case / Antigores) atau kelengkapan aksesoris tidak ada di dalam paket',
  },
  {
    id: 'LAINNYA',
    label: 'Kendala Fungsional Lainnya',
    fullText: 'Fitur kamera, speaker, mic, sensor, atau sinyal seluler tidak berfungsi dengan normal',
  },
]

const POPULAR_BANKS = [
  'BCA',
  'Bank Mandiri',
  'BRI',
  'BNI',
  'BSI (Bank Syariah Indonesia)',
  'CIMB Niaga',
  'Permata Bank',
  'Bank Jago',
  'SeaBank',
]

export function ReturnModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmount,
  onSuccess,
}: ReturnModalProps) {
  const [returnType, setReturnType] = useState<'REFUND' | 'REPLACEMENT'>('REFUND')
  const [selectedPreset, setSelectedPreset] = useState<string>('PRODUK_RUSAK')
  const [reasonLabel, setReasonLabel] = useState(COMMON_REASONS[0].label)
  const [description, setDescription] = useState(COMMON_REASONS[0].fullText)

  // Bank details for REFUND
  const [bankName, setBankName] = useState('BCA')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')

  // Media uploads
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleSelectPreset = (preset: typeof COMMON_REASONS[0]) => {
    setSelectedPreset(preset.id)
    setReasonLabel(preset.label)
    setDescription(preset.fullText)
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > 5) {
      toast.error('Maksimal 5 file bukti (foto / video) unboxing')
      return
    }

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')

        if (!isImage && !isVideo) {
          toast.error(`File ${file.name} bukan format foto atau video yang didukung.`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload gagal')
        }

        const data = await res.json()
        setImages((prev) => [...prev, data.url])
      }
      toast.success('Bukti unboxing berhasil diunggah')
    } catch (error: any) {
      toast.error(error.message || 'Gagal upload media bukti')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeMedia = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error('Harap berikan penjelasan detail mengenai kendala unit yang dialami.')
      return
    }

    if (returnType === 'REFUND') {
      if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
        toast.error('Harap lengkapi nama bank, nomor rekening, dan atas nama untuk pengembalian dana.')
        return
      }
    }

    if (!agreedTerms) {
      toast.error('Harap centang konfirmasi kelengkapan unit & aksesoris.')
      return
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
          images,
          bankName: returnType === 'REFUND' ? bankName : null,
          bankAccountNumber: returnType === 'REFUND' ? bankAccountNumber : null,
          bankAccountName: returnType === 'REFUND' ? bankAccountName : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirimkan pengajuan pengembalian')
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

  const formatPrice = (price?: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'Rp 0'
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white">
                Pengajuan Pengembalian
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-slate-400">Pesanan</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  #{orderNumber}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-6 text-xs no-scrollbar">
            
            {/* 1. Solution Type Selector (Refund vs Replacement) */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Solusi yang Diinginkan
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option: REFUND */}
                <button
                  type="button"
                  onClick={() => setReturnType('REFUND')}
                  className={`relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    returnType === 'REFUND'
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60'
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                    returnType === 'REFUND'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="pr-4">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-950 dark:text-white text-xs">
                        Pengembalian Dana
                      </h4>
                      <span className="rounded-md bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 px-1.5 py-0.2 text-[10px] font-black">
                        100%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Uang kembali penuh ke rekening bank setelah unit diverifikasi.
                    </p>
                  </div>
                  {returnType === 'REFUND' && (
                    <div className="absolute top-3.5 right-3.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Option: REPLACEMENT */}
                <button
                  type="button"
                  onClick={() => setReturnType('REPLACEMENT')}
                  className={`relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    returnType === 'REPLACEMENT'
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60'
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                    returnType === 'REPLACEMENT'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div className="pr-4">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-950 dark:text-white text-xs">
                        Tukar Unit Pengganti
                      </h4>
                      <span className="rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-black">
                        Unit Teruji
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Toko mengirimkan unit second pengganti normal, teruji fungsi 100%, dan bergaransi.
                    </p>
                  </div>
                  {returnType === 'REPLACEMENT' && (
                    <div className="absolute top-3.5 right-3.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Reason Category Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Kategori Alasan
              </span>
              <div className="flex flex-wrap gap-2">
                {COMMON_REASONS.map((preset) => {
                  const isSelected = selectedPreset === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Description Textarea */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Rincian Penjelasan Kendala
              </span>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan detail kendala yang dialami pada unit gadget..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs leading-relaxed outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:bg-slate-800"
                required
              />
            </div>

            {/* 4. Bank Information (Only for REFUND) */}
            {returnType === 'REFUND' && (
              <div className="rounded-2xl border border-orange-200/70 bg-orange-50/30 p-4 sm:p-5 space-y-3 dark:border-orange-950/60 dark:bg-orange-950/20">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <Building2 className="h-4 w-4 text-orange-500" />
                  <span>Rekening Tujuan Pengembalian Dana</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Bank Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Nama Bank</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Nomor Rekening</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="1234567890"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono font-medium outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>

                  {/* Account Holder Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Atas Nama Rekening</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Sesuai buku tabungan"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>
                </div>

                {totalAmount && (
                  <div className="pt-2.5 flex items-center justify-between text-xs border-t border-orange-200/60 dark:border-orange-900/60">
                    <span className="text-slate-500">Total Nominal Refund:</span>
                    <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 5. Proof of Issue (Photos & Videos) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Bukti Foto & Video Unboxing
                </span>
                <span className="text-[11px] text-slate-400">
                  {images.length}/5 file
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {/* Media Thumbnails */}
                {images.map((url, idx) => {
                  const isVideo = isVideoUrl(url)
                  return (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                    >
                      {isVideo ? (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                          <Play className="h-6 w-6 text-orange-400" />
                        </div>
                      ) : (
                        <img src={url} alt="Bukti" className="h-full w-full object-cover" />
                      )}

                      <button
                        type="button"
                        onClick={() => removeMedia(idx)}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Hapus Bukti"
                      >
                        <Trash2 className="h-3 w-3 text-rose-300" />
                      </button>
                    </div>
                  )
                })}

                {/* Upload Trigger Tile */}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-400 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 text-slate-400 hover:text-orange-500 transition cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-bold">Unggah</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                className="hidden"
              />
            </div>

            {/* 6. Terms & Agreement */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 accent-orange-500"
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Saya menyatakan unit gadget dikembalikan lengkap dengan kotak kemasan resmi, adaptor pengisi daya, dan paket aksesoris bonus 3-in-1.
              </span>
            </label>

          </div>

          {/* Sticky Footer Action Bar */}
          <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-6 py-2.5 text-xs font-bold shadow-sm shadow-orange-500/25 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Kirim Pengajuan</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default ReturnModal
