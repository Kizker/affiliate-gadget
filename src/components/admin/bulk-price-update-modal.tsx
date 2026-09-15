'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

interface BulkPriceUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UpdateResult {
  success: boolean
  message: string
  totalRows: number
  updatedCount: number
  unchangedCount?: number
  createdCount?: number
  deletedCount?: number
  skippedCount: number
  errors: Array<{ row: number; sku?: string; reason: string }>
}

export function BulkPriceUpdateModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkPriceUpdateModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mirrorMode, setMirrorMode] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [result, setResult] = useState<UpdateResult | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const res = await fetch('/api/admin/products/export-excel')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Gagal mengunduh file template Excel.')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.download = `mass_update_sales_info_${nowStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Template & data katalog format Shopee berhasil diunduh!')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunduh file Excel.')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleFileChange = (file: File | null) => {
    if (!file) return
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Format berkas harus berupa spreadsheet Excel (.xlsx / .xls)')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran file maksimal adalah 15 MB.')
      return
    }
    setSelectedFile(file)
    setResult(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Silakan pilih file Excel terlebih dahulu.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mirrorMode', String(mirrorMode))

      const res = await fetch('/api/admin/products/import-excel', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses pembaruan massal.')
      }

      setResult(data)
      toast.success(data.message || 'Pembaruan massal berhasil diterapkan!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memproses file Excel.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleModalClose = () => {
    if (loading) return
    handleReset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-xl rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-7">
        <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-slate-950 dark:text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <span>Update & Migrasi Katalog via Excel (Format Shopee)</span>
        </DialogTitle>

        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
          Perbarui harga jual, stok inventori, atau migrasi produk dari Shopee
          secara massal menggunakan template spreadsheet 14 kolom standar.
        </DialogDescription>

        {!result ? (
          <div className="mt-4 space-y-5">
            {/* Download Template Shortcut Banner */}
            <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 dark:border-orange-900/40 dark:bg-orange-950/30 sm:flex-row sm:items-center">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-orange-950 dark:text-orange-200">
                  1. Unduh Data & Template Excel Shopee
                </span>
                <p className="text-[11px] leading-relaxed text-orange-700/80 dark:text-orange-300/70">
                  Ekspor data katalog platform dalam struktur 14 kolom resmi
                  Shopee (Kode Produk, Nama, Kode Variasi, SKU, Harga, Stok).
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-600/25 transition hover:bg-orange-700 active:scale-95 disabled:opacity-60"
              >
                {downloadingTemplate ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengunduh...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Template Shopee</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 2: Upload Edited File */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                2. Unggah Berkas Spreadsheet Shopee (.xlsx)
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
                id="excel-file-upload"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="shadow-xs mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-slate-800">
                    <UploadCloud className="h-6 w-6 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Tarik & lepaskan file Excel (.xlsx) di sini
                  </span>
                  <p className="mt-1 text-[11px] text-slate-400">
                    atau klik untuk memilih file dari komputer Anda (Maks. 15
                    MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-800"
                    title="Hapus file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Mirroring Sync Toggle */}
            <div className="flex items-start gap-3 rounded-2xl border border-orange-200/80 bg-orange-50/50 p-3.5 dark:border-orange-900/40 dark:bg-orange-950/20">
              <input
                type="checkbox"
                id="mirror-mode-checkbox"
                checked={mirrorMode}
                onChange={(e) => setMirrorMode(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
              />
              <label
                htmlFor="mirror-mode-checkbox"
                className="cursor-pointer select-none space-y-0.5"
              >
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Sinkronisasi Total (Mirroring Katalog)
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  Produk & variasi di website yang{' '}
                  <strong>tidak ada di file Excel ini</strong> akan otomatis
                  dihapus/dinonaktifkan agar katalog website persis sama dengan
                  berkas Excel.
                </p>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={loading}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedFile || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Memproses Database...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Terapkan Pembaruan Massal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 3: Result Summary Screen */
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold">{result.message}</span>
              </div>
            </div>

            <div
              className={`grid ${
                (result.createdCount ?? 0) > 0 && (result.deletedCount ?? 0) > 0
                  ? 'grid-cols-2 sm:grid-cols-6'
                  : (result.createdCount ?? 0) > 0 ||
                      (result.deletedCount ?? 0) > 0
                    ? 'grid-cols-2 sm:grid-cols-5'
                    : 'grid-cols-2 sm:grid-cols-4'
              } gap-2.5 text-center`}
            >
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="block text-[10px] text-slate-400">
                  Total Baris
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {result.totalRows}
                </span>
              </div>
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-3 dark:border-blue-900/40 dark:bg-blue-950/30">
                <span className="block text-[10px] text-blue-600 dark:text-blue-400">
                  Diperbarui
                </span>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {result.updatedCount}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-100/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  Tidak Berubah
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {result.unchangedCount ?? 0}
                </span>
              </div>
              {result.createdCount !== undefined && result.createdCount > 0 && (
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                    Baru Dibuat
                  </span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {result.createdCount}
                  </span>
                </div>
              )}
              {result.deletedCount !== undefined && result.deletedCount > 0 && (
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-3 dark:border-rose-900/40 dark:bg-rose-950/30">
                  <span className="block text-[10px] text-rose-600 dark:text-rose-400">
                    Dihapus dari Web
                  </span>
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
                    {result.deletedCount}
                  </span>
                </div>
              )}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                  Dilewati / Gagal
                </span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {result.skippedCount}
                </span>
              </div>
            </div>

            {/* Error / Warning Details if any */}
            {result.errors && result.errors.length > 0 && (
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>
                    Rincian Baris yang Dilewati ({result.errors.length}):
                  </span>
                </div>
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 border-t border-slate-200/50 pt-1 text-[10px] text-slate-600 dark:border-slate-800 dark:text-slate-400"
                  >
                    <span>
                      Baris {err.row} (SKU: {err.sku || '-'}):
                    </span>
                    <span className="truncate text-right font-medium text-rose-600 dark:text-rose-400">
                      {err.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleModalClose}
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
