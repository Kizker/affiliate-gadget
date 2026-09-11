'use client'

import { useState } from 'react'
import {
  Store,
  Building2,
  MapPin,
  Phone,
  CreditCard,
  FileText,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { StoreDataInput } from '@/lib/validations/auth'

interface StoreDataFormProps {
  initialData?: {
    userId?: string | null
    storeName?: string | null
    companyName?: string | null
    taxId?: string | null
    address?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    phone?: string | null
    bankName?: string | null
    accountNumber?: string | null
    accountName?: string | null
  }
  userId?: string
  onSubmitSuccess?: (data: any) => void
  isEditMode?: boolean
  apiEndpoint?: string
  httpMethod?: 'POST' | 'PUT'
  submitButtonText?: string
}

export default function StoreDataForm({
  initialData,
  userId,
  onSubmitSuccess,
  isEditMode = false,
  apiEndpoint = '/api/auth/register/store-data',
  httpMethod = 'POST',
  submitButtonText = 'Kirim Data Toko untuk Ditinjau',
}: StoreDataFormProps) {
  const [formData, setFormData] = useState<StoreDataInput>({
    userId: userId || initialData?.userId || '',
    storeName: initialData?.storeName || '',
    companyName: initialData?.companyName || '',
    taxId: initialData?.taxId || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    province: initialData?.province || '',
    postalCode: initialData?.postalCode || '',
    phone: initialData?.phone || '',
    bankName: initialData?.bankName || '',
    accountNumber: initialData?.accountNumber || '',
    accountName: initialData?.accountName || '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    // Basic validation
    if (formData.storeName.trim().length < 3) {
      setError('Nama toko minimal 3 karakter.')
      setIsLoading(false)
      return
    }
    if (formData.companyName.trim().length < 3) {
      setError('Nama PT / Badan Usaha minimal 3 karakter.')
      setIsLoading(false)
      return
    }
    if (formData.address.trim().length < 10) {
      setError('Alamat fisik toko minimal 10 karakter.')
      setIsLoading(false)
      return
    }
    if (!formData.city.trim() || !formData.province.trim()) {
      setError('Kota dan Provinsi wajib diisi.')
      setIsLoading(false)
      return
    }
    if (formData.phone.trim().length < 8) {
      setError('Nomor telepon toko minimal 8 karakter.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: userId || formData.userId || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan data toko.')
      }

      setSuccessMessage(data.message || 'Data toko berhasil disimpan.')
      if (onSubmitSuccess) {
        onSubmitSuccess(data)
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat menyimpan data.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 duration-150 animate-in fade-in dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 duration-150 animate-in fade-in dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Section 1: Identitas Toko & Legalitas */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <Store className="h-4 w-4 text-orange-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Identitas Toko & Legalitas
          </h3>
        </div>

        {/* Nama Toko */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Nama Cabang Toko <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) =>
                setFormData({ ...formData, storeName: e.target.value })
              }
              placeholder="Contoh: Affiliate Gadget Bandung BEC"
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <Store className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Nama PT / Badan Usaha */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Nama PT / Badan Usaha <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              placeholder="Contoh: PT Digital Niaga Prima"
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <Building2 className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* NPWP & Telepon Toko */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              NPWP Badan Usaha{' '}
              <span className="text-[10px] font-normal text-slate-400">
                (Opsional)
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={formData.taxId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, taxId: e.target.value })
                }
                placeholder="00.000.000.0-000.000"
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <FileText className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Telepon Toko <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="022-1234567 atau 081234..."
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <Phone className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Lokasi Fisik Cabang */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <MapPin className="h-4 w-4 text-blue-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Lokasi Fisik Toko
          </h3>
        </div>

        {/* Alamat Lengkap */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Alamat Fisik Lengkap <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Gedung / Mall, Lantai, Blok Toko, Nama Jalan lengkap"
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Kota & Provinsi */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Kota / Kabupaten <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="Contoh: Bandung"
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Provinsi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.province}
              onChange={(e) =>
                setFormData({ ...formData, province: e.target.value })
              }
              placeholder="Contoh: Jawa Barat"
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Kode Pos */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Kode Pos{' '}
            <span className="text-[10px] font-normal text-slate-400">
              (Opsional)
            </span>
          </label>
          <input
            type="text"
            value={formData.postalCode || ''}
            onChange={(e) =>
              setFormData({ ...formData, postalCode: e.target.value })
            }
            placeholder="Contoh: 40117"
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Section 3: Rekening Pencairan Penjualan (Opsional) */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <CreditCard className="h-4 w-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Rekening Bank Pencairan{' '}
            <span className="text-[10px] font-normal text-slate-400">
              (Bisa Ditambahkan Nanti)
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Nama Bank
            </label>
            <input
              type="text"
              value={formData.bankName || ''}
              onChange={(e) =>
                setFormData({ ...formData, bankName: e.target.value })
              }
              placeholder="BCA / Mandiri / BRI"
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Nomor Rekening
            </label>
            <input
              type="text"
              value={formData.accountNumber || ''}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
              placeholder="1234567890"
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Atas Nama Rekening
            </label>
            <input
              type="text"
              value={formData.accountName || ''}
              onChange={(e) =>
                setFormData({ ...formData, accountName: e.target.value })
              }
              placeholder="Nama PT / Pemilik"
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-3">
        <button
          type="submit"
          disabled={isLoading}
          className="active:scale-98 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Menyimpan Informasi Toko...</span>
            </>
          ) : (
            <>
              <span>{submitButtonText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>Data badan hukum & rekening dilindungi enkripsi sistem</span>
      </div>
    </form>
  )
}
