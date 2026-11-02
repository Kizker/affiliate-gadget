'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X,
  ChevronDown,
  Check,
  Loader2,
  Upload,
  Play,
  Trash2,
  Image as ImageIcon,
  ShieldCheck,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { processMediaUploadFile } from '@/lib/media-upload-client'
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
    label: 'Cacat Fisik / Layar Pecah',
    fullText:
      'Unit mengalami cacat fisik, baret dalam, atau layar retak saat unboxing',
  },
  {
    id: 'MATI_TOTAL',
    label: 'Mati Total (DOA)',
    fullText:
      'Unit mati total dan tidak bisa dinyalakan atau tidak mengisi daya',
  },
  {
    id: 'SALAH_VARIAN',
    label: 'Salah Varian / Warna / Memori',
    fullText:
      'Varian warna, kapasitas RAM, atau memori penyimpanan tidak sesuai pesanan',
  },
  {
    id: 'FUNGSI_RUSAK',
    label: 'Kerusakan Komponen / Fungsi',
    fullText:
      'Kendala fungsi kamera, speaker, wifi, sinyal, atau touchscreen error',
  },
  {
    id: 'AKSESORIS_KURANG',
    label: 'Aksesoris / Bonus Kurang',
    fullText: 'Aksesoris kelengkapan atau paket bonus 3-in-1 tidak lengkap',
  },
  {
    id: 'LAINNYA',
    label: 'Kendala Lainnya',
    fullText: 'Ada kendala spesifik lainnya pada unit gadget yang diterima',
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

  // Media proof state (Photos & Video)
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Handle media file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const totalAllowed = 5
    if (images.length + files.length > totalAllowed) {
      toast.error(`Maksimal ${totalAllowed} foto bukti yang dapat diunggah.`)
      return
    }

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isVideo =
          file.type.startsWith('video/') ||
          file.name.toLowerCase().endsWith('.mp4')

        // Validasi dan kompresi otomatis
        let fileToUpload = file
        try {
          fileToUpload = await processMediaUploadFile(file)
          if (!isVideo && file.size > 2 * 1024 * 1024) {
            toast.info(
              `Foto "${file.name}" otomatis dikompres ke ukuran optimal (< 2 MB).`
            )
          }
        } catch (validationErr: any) {
          toast.error(
            validationErr.message || `File "${file.name}" tidak valid`
          )
          continue
        }

        const formData = new FormData()
        formData.append('file', fileToUpload)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload gagal')
        }

        const data = await res.json()
        if (isVideo) {
          setVideoUrl(data.url)
          toast.success('Video unboxing berhasil diunggah')
        } else {
          setImages((prev) => [...prev, data.url])
          toast.success('Foto bukti cacat berhasil diunggah')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal upload media bukti')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeVideo = () => {
    setVideoUrl(null)
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
          images,
          videoUrl,
          bankName: returnType === 'REFUND' ? bankName : null,
          bankAccountNumber: returnType === 'REFUND' ? bankAccountNumber : null,
          bankAccountName: returnType === 'REFUND' ? bankAccountName : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error || 'Gagal mengirimkan pengajuan komplain & klaim garansi'
        )
      }

      toast.success(
        'Pengajuan komplain & klaim garansi berhasil dikirim ke Admin After Sales Terpusat!'
      )
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
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ajukan Komplain / Klaim Garansi
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              ID Pesanan:{' '}
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                #{orderNumber}
              </span>{' '}
              • Garansi 30 Hari
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
            {/* 1. Bentuk Resolusi Akhir */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-800 dark:text-white">
                Bentuk Resolusi Garansi yang Diinginkan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReturnType('REFUND')}
                  className={`cursor-pointer rounded-xl p-2.5 text-left text-[11px] font-semibold transition sm:text-xs ${
                    returnType === 'REFUND'
                      ? 'border-2 border-orange-500 bg-orange-50/40 font-bold text-orange-600 dark:bg-orange-950/20 dark:text-orange-400'
                      : 'border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <p className="font-bold">1. Retur &amp; Refund</p>
                  <p className="mt-0.5 text-[10px] font-normal text-slate-500">
                    Pengembalian dana ke rekening bank
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setReturnType('REPLACEMENT')}
                  className={`cursor-pointer rounded-xl p-2.5 text-left text-[11px] font-semibold transition sm:text-xs ${
                    returnType === 'REPLACEMENT'
                      ? 'border-2 border-orange-500 bg-orange-50/40 font-bold text-orange-600 dark:bg-orange-950/20 dark:text-orange-400'
                      : 'border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <p className="font-bold">2. Tukar Unit Baru</p>
                  <p className="mt-0.5 text-[10px] font-normal text-slate-500">
                    Pengiriman unit gadget pengganti
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Kategori Alasan */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-800 dark:text-white">
                Kategori Kendala Unit
              </label>
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {COMMON_REASONS.slice(0, 4).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`cursor-pointer rounded-xl px-2.5 py-2 text-center text-[11px] font-semibold transition ${
                        selectedPreset === preset.id
                          ? 'border-2 border-orange-500 bg-orange-50 font-bold text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                          : 'border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {COMMON_REASONS.slice(4).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`cursor-pointer rounded-xl px-2.5 py-2 text-center text-[11px] font-semibold transition ${
                        selectedPreset === preset.id
                          ? 'border-2 border-orange-500 bg-orange-50 font-bold text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                          : 'border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Rincian Penjelasan */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800 dark:text-white">
                Penjelasan Detail Kendala
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara rinci kendala unit cacat fisik, layar, atau fungsi yang terjadi..."
                className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            {/* 4. Unggah Bukti Cacat Produk (Foto & Video) */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-white">
                  Unggah Bukti Cacat Produk (Foto/Video)
                </label>
                <span className="text-[10px] text-slate-400">
                  Maks. 5 Foto &bull; 1 Video
                </span>
              </div>

              {/* Upload Trigger Button */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,video/mp4"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={uploading || images.length >= 5}
                  onClick={() => fileInputRef.current?.click()}
                  className="active:scale-98 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 py-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-100/60 disabled:opacity-50 dark:border-orange-500/30 dark:bg-orange-950/20 dark:text-orange-400"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mengunggah bukti cacat...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Pilih Foto atau Video Bukti Unboxing</span>
                    </>
                  )}
                </button>

                {/* Media Previews Grid */}
                {(images.length > 0 || videoUrl) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {/* Images Previews */}
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <img
                          src={imgUrl}
                          alt={`Bukti ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-slate-900/80 text-white transition hover:bg-rose-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Video Preview */}
                    {videoUrl && (
                      <div className="group relative flex h-16 w-24 items-center justify-center overflow-hidden rounded-xl border border-orange-300 bg-slate-900 text-white">
                        <Video className="h-5 w-5 text-orange-400" />
                        <span className="absolute bottom-1 left-1.5 font-mono text-[9px] text-slate-300">
                          MP4 Video
                        </span>
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-slate-900/80 text-white transition hover:bg-rose-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 5. Rekening Refund (Jika REFUND) */}
            {returnType === 'REFUND' && (
              <div className="pt-1">
                {refundCalc && (
                  <div className="mb-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="font-bold text-slate-800 dark:text-white">
                      Estimasi Pengembalian Dana:
                    </p>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-500">
                        Total Dana Bersih (Escrow):
                      </span>
                      <p className="font-mono text-sm font-bold text-orange-600">
                        Rp{' '}
                        {Math.round(refundCalc.netRefundAmount).toLocaleString(
                          'id-ID'
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <label className="mb-2 block text-xs font-bold text-slate-800 dark:text-white">
                  Rekening Tujuan Pengembalian Dana
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
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
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
                      placeholder="Contoh: 1234567890"
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
                      placeholder="Sesuai nama di buku tabungan"
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
              disabled={submitting || uploading}
              className="cursor-pointer rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-orange-700 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mengirim Pengajuan...
                </span>
              ) : (
                'Kirim Pengajuan Klaim Garansi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReturnModal
