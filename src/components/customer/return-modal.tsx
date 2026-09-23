'use client'

import { useState, useRef, useEffect } from 'react'
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
  ChevronDown,
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
    fullText:
      'Unit memiliki cacat fisik, baret dalam, atau layar retak saat kemasan pertama kali dibuka',
  },
  {
    id: 'MATI_TOTAL_DOA',
    label: 'Mati Total (DOA)',
    fullText:
      'Unit mati total, bootloop, atau tidak merespons daya pengisian saat dinyalakan',
  },
  {
    id: 'SALAH_VARIAN',
    label: 'Salah Varian / Warna',
    fullText:
      'Varian kapasitas memori internal, RAM, atau warna tidak sesuai dengan invoice pesanan',
  },
  {
    id: 'BONUS_KURANG',
    label: 'Aksesoris / Bonus Kurang',
    fullText:
      'Paket bonus 3-in-1 (Charger / Case / Antigores) atau kelengkapan aksesoris tidak ada di dalam paket',
  },
  {
    id: 'LAINNYA',
    label: 'Kendala Fungsional Lainnya',
    fullText:
      'Fitur kamera, speaker, mic, sensor, atau sinyal seluler tidak berfungsi dengan normal',
  },
]

const POPULAR_BANKS = [
  {
    id: 'BCA',
    name: 'BCA (Bank Central Asia)',
    code: 'BCA',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    id: 'Bank Mandiri',
    name: 'Bank Mandiri',
    code: 'MDR',
    badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  },
  {
    id: 'BRI',
    name: 'BRI (Bank Rakyat Indonesia)',
    code: 'BRI',
    badgeColor:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
  {
    id: 'BNI',
    name: 'BNI (Bank Negara Indonesia)',
    code: 'BNI',
    badgeColor:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    id: 'BSI (Bank Syariah Indonesia)',
    name: 'BSI (Bank Syariah)',
    code: 'BSI',
    badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  },
  {
    id: 'CIMB Niaga',
    name: 'CIMB Niaga',
    code: 'CIMB',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
  {
    id: 'Permata Bank',
    name: 'Permata Bank',
    code: 'PRM',
    badgeColor:
      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  },
  {
    id: 'Bank Jago',
    name: 'Bank Jago',
    code: 'JAGO',
    badgeColor:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    id: 'SeaBank',
    name: 'SeaBank',
    code: 'SEA',
    badgeColor:
      'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  },
]

export function ReturnModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmount,
  onSuccess,
}: ReturnModalProps) {
  const [returnType, setReturnType] = useState<'REFUND' | 'REPLACEMENT'>(
    'REFUND'
  )
  const [selectedPreset, setSelectedPreset] = useState<string>('PRODUK_RUSAK')
  const [reasonLabel, setReasonLabel] = useState(COMMON_REASONS[0].label)
  const [description, setDescription] = useState(COMMON_REASONS[0].fullText)

  // Bank details for REFUND
  const [bankName, setBankName] = useState('BCA')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false)
  const bankDropdownRef = useRef<HTMLDivElement>(null)

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

  // Media uploads
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleSelectPreset = (preset: (typeof COMMON_REASONS)[0]) => {
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
          toast.error(
            `File ${file.name} bukan format foto atau video yang didukung.`
          )
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

  const formatPrice = (price?: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'Rp 0'
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md duration-200 animate-in fade-in sm:p-6">
      <div
        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
                Pengajuan Pengembalian
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Pesanan</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  #{orderNumber}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Tutup Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-6 py-5 text-xs sm:px-8">
            {/* 1. Solution Type Selector (Refund vs Replacement) */}
            <div className="space-y-2.5">
              <span className="block text-xs font-bold text-slate-900 dark:text-white">
                Solusi yang Diinginkan
              </span>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Option: REFUND */}
                <button
                  type="button"
                  onClick={() => setReturnType('REFUND')}
                  className={`relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 ${
                    returnType === 'REFUND'
                      ? 'shadow-xs border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20 dark:bg-orange-950/30'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                      returnType === 'REFUND'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="pr-4">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white">
                        Pengembalian Dana
                      </h4>
                      <span className="py-0.2 rounded-md bg-orange-100 px-1.5 text-[10px] font-black text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                        100%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Uang kembali penuh ke rekening bank setelah unit
                      diverifikasi.
                    </p>
                  </div>
                  {returnType === 'REFUND' && (
                    <div className="absolute right-3.5 top-3.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Option: REPLACEMENT */}
                <button
                  type="button"
                  onClick={() => setReturnType('REPLACEMENT')}
                  className={`relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 ${
                    returnType === 'REPLACEMENT'
                      ? 'shadow-xs border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20 dark:bg-orange-950/30'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                      returnType === 'REPLACEMENT'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div className="pr-4">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white">
                        Tukar Unit Pengganti
                      </h4>
                      <span className="py-0.2 rounded-md bg-emerald-100 px-1.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Unit Teruji
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Toko mengirimkan unit second pengganti normal, teruji
                      fungsi 100%, dan bergaransi.
                    </p>
                  </div>
                  {returnType === 'REPLACEMENT' && (
                    <div className="absolute right-3.5 top-3.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Reason Category Presets */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-900 dark:text-white">
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
                      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                        isSelected
                          ? 'shadow-xs border border-orange-500 bg-orange-50/80 font-bold text-orange-600 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-400'
                          : 'border border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
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
              <span className="block text-xs font-bold text-slate-900 dark:text-white">
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
              <div className="space-y-3 rounded-2xl border border-orange-200/70 bg-orange-50/30 p-4 dark:border-orange-950/60 dark:bg-orange-950/20 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Building2 className="h-4 w-4 text-orange-500" />
                  <span>Rekening Tujuan Pengembalian Dana</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Bank Name */}
                  <div className="relative space-y-1" ref={bankDropdownRef}>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Nama Bank
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBankDropdownOpen((prev) => !prev)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs font-semibold transition-all duration-150 dark:bg-slate-800 ${
                        isBankDropdownOpen
                          ? 'shadow-xs border-orange-500 ring-2 ring-orange-500/20'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200'
                      }`}
                      aria-haspopup="listbox"
                      aria-expanded={isBankDropdownOpen}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-black text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          {POPULAR_BANKS.find((b) => b.id === bankName)?.code ||
                            'BANK'}
                        </span>
                        <span className="truncate text-slate-900 dark:text-white">
                          {POPULAR_BANKS.find((b) => b.id === bankName)?.name ||
                            bankName}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                          isBankDropdownOpen ? 'rotate-180 text-orange-500' : ''
                        }`}
                      />
                    </button>

                    {/* Custom Dropdown Menu Popover */}
                    {isBankDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-52 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl backdrop-blur-md duration-150 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
                        <div className="space-y-0.5">
                          {POPULAR_BANKS.map((b) => {
                            const isSelected = bankName === b.id
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  setBankName(b.id)
                                  setIsBankDropdownOpen(false)
                                }}
                                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                                  isSelected
                                    ? 'shadow-xs bg-orange-500 font-bold text-white'
                                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[9px] font-black tracking-tight ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : b.badgeColor
                                    }`}
                                  >
                                    {b.code}
                                  </span>
                                  <span className="truncate">{b.name}</span>
                                </div>
                                {isSelected && (
                                  <Check className="h-3.5 w-3.5 shrink-0 stroke-[3] text-white" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="1234567890"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-medium outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>

                  {/* Account Holder Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Atas Nama Rekening
                    </label>
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
                  <div className="flex items-center justify-between border-t border-orange-200/60 pt-2.5 text-xs dark:border-orange-900/60">
                    <span className="text-slate-500">
                      Total Nominal Refund:
                    </span>
                    <span className="font-mono text-sm font-black text-orange-600 dark:text-orange-400">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 5. Proof of Issue (Photos & Videos) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Bukti Foto & Video Unboxing
                </span>
                <span className="text-[11px] text-slate-400">
                  {images.length}/5 file
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {/* Media Thumbnails */}
                {images.map((url, idx) => {
                  const isVideo = isVideoUrl(url)
                  return (
                    <div
                      key={idx}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                    >
                      {isVideo ? (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                          <Play className="h-6 w-6 text-orange-400" />
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt="Bukti"
                          className="h-full w-full object-cover"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeMedia(idx)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/75 text-white opacity-0 transition group-hover:opacity-100"
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
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 text-slate-400 transition hover:border-orange-400 hover:text-orange-500 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                    ) : (
                      <>
                        <Upload className="mb-1 h-5 w-5" />
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
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-500 accent-orange-500 focus:ring-orange-500"
              />
              <span className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                Saya menyatakan unit gadget dikembalikan lengkap dengan kotak
                kemasan resmi, adaptor pengisi daya, dan paket aksesoris bonus
                3-in-1.
              </span>
            </label>
          </div>

          {/* Sticky Footer Action Bar */}
          <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 bg-white px-5 py-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900 sm:gap-3 sm:px-8 sm:py-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 active:scale-95 disabled:opacity-50 sm:px-6"
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
