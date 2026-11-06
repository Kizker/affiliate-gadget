'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { CustomSelect } from '@/components/ui/custom-select'
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
  Store,
  Building2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface BulkPriceUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  stores?: Array<{ id: string; name: string; city?: string }>
  isSuperAdmin?: boolean
  userStoreId?: string
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

interface MassUpdateTaskItem {
  id: string
  type: 'DOWNLOAD' | 'UPLOAD'
  templateType: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  fileName: string
  totalCount: number
  processedCount: number
  successCount: number
  failedCount: number
  summaryMessage?: string | null
  createdAt: string
  store?: { name: string; city?: string } | null
}

export function BulkPriceUpdateModal({
  isOpen,
  onClose,
  onSuccess,
  stores: initialStores = [],
  isSuperAdmin: propIsSuperAdmin,
  userStoreId: propUserStoreId,
}: BulkPriceUpdateModalProps) {
  const { data: session } = useSession()
  const isSuperAdmin =
    propIsSuperAdmin !== undefined
      ? propIsSuperAdmin
      : session?.user?.role === 'SUPER_ADMIN'
  const isStoreAdmin = session?.user?.role === 'STORE_ADMIN'
  const userStoreId = propUserStoreId || session?.user?.storeId

  // Tab: 'download' | 'upload'
  const [modalTab, setModalTab] = useState<'download' | 'upload'>('download')

  const [stores, setStores] = useState(initialStores)
  const [selectedTargetStore, setSelectedTargetStore] = useState<string>('ALL')
  const [templateType, setTemplateType] = useState<string>('SALES_INFO')
  const [brandFilter, setBrandFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mirrorMode, setMirrorMode] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [result, setResult] = useState<UpdateResult | null>(null)

  // Document history tasks
  const [tasks, setTasks] = useState<MassUpdateTaskItem[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialStores && initialStores.length > 0) {
      setStores(initialStores)
      if (isStoreAdmin) {
        setSelectedTargetStore(userStoreId || initialStores[0]?.id || '')
      }
    }
  }, [initialStores, isStoreAdmin, userStoreId])

  // Fetch document history tasks
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true)
    try {
      const res = await fetch(
        `/api/admin/products/mass-update/tasks?type=${modalTab.toUpperCase()}&_t=${Date.now()}`
      )
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setTasks(json.data)
      }
    } catch (e) {
      console.error('Failed to load tasks:', e)
    } finally {
      setLoadingTasks(false)
    }
  }, [modalTab])

  useEffect(() => {
    if (isOpen) {
      fetchTasks()
    }
  }, [isOpen, modalTab, fetchTasks])

  // Handle template download (Shopee Spec)
  const handleDownloadTemplate = async () => {
    if (
      isSuperAdmin &&
      (!selectedTargetStore || selectedTargetStore === 'ALL')
    ) {
      toast.error(
        'Pilih salah satu cabang toko terlebih dahulu sebelum mengunduh template Excel format Shopee.'
      )
      return
    }

    setDownloadingTemplate(true)
    try {
      let url = '/api/admin/products/export-excel?'
      if (
        isSuperAdmin &&
        selectedTargetStore &&
        selectedTargetStore !== 'ALL'
      ) {
        url += `storeId=${encodeURIComponent(selectedTargetStore)}&`
      } else if (isStoreAdmin && userStoreId) {
        url += `storeId=${encodeURIComponent(userStoreId)}&`
      }
      if (brandFilter !== 'ALL') {
        url += `brand=${encodeURIComponent(brandFilter)}&`
      }

      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Gagal mengunduh file template Excel.')
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const targetStoreObj = stores.find((s) => s.id === selectedTargetStore)
      const slug = targetStoreObj
        ? targetStoreObj.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
        : 'catalog'
      a.download = `mass_update_${templateType.toLowerCase()}_${slug}_${nowStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast.success(
        'Template 6-baris header resmi Shopee berhasil dibuat & diunduh!'
      )
      fetchTasks()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunduh file Excel.')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  // Handle file select
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

  // Handle file submit
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

      const effectiveStoreId = isStoreAdmin
        ? userStoreId || stores[0]?.id || ''
        : selectedTargetStore

      if (effectiveStoreId && effectiveStoreId !== 'ALL') {
        formData.append('storeId', effectiveStoreId)
      }

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
      fetchTasks()
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
      <DialogContent className="max-h-[90vh] w-[96vw] max-w-3xl overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-slate-950 dark:text-white sm:text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <span>Update Massal Katalog Gadget (Shopee Flow)</span>
        </DialogTitle>

        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
          Kelola harga, stok, dan SKU secara massal menggunakan template resmi
          format 6-baris header Shopee dengan proteksi integritas HPP.
        </DialogDescription>

        {/* Shopee-Style 2 Tabs Switcher */}
        <div className="mt-4 flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setModalTab('download')
              handleReset()
            }}
            className={`flex min-h-[44px] items-center gap-2 border-b-2 px-5 py-2.5 text-xs font-bold transition ${
              modalTab === 'download'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalTab('upload')
              handleReset()
            }}
            className={`flex min-h-[44px] items-center gap-2 border-b-2 px-5 py-2.5 text-xs font-bold transition ${
              modalTab === 'upload'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload</span>
          </button>
        </div>

        {/* TAB 1: DOWNLOAD */}
        {modalTab === 'download' && (
          <div className="mt-4 space-y-4">
            {/* Filter Selection Panel */}
            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pilih Parameter Template Shopee
              </span>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Jenis Template */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                    Jenis Template:
                  </label>
                  <CustomSelect
                    value={templateType}
                    onChange={(v) => setTemplateType(v)}
                    options={[
                      {
                        value: 'SALES_INFO',
                        label: 'Informasi Penjualan (Harga, HPP, Stok)',
                      },
                      {
                        value: 'BASIC_INFO',
                        label: 'Informasi Dasar (Nama, Kategori, Model)',
                      },
                    ]}
                    size="sm"
                  />
                </div>

                {/* Cabang Toko (Superadmin) */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                    Cabang Toko:
                  </label>
                  {isSuperAdmin ? (
                    <CustomSelect
                      value={selectedTargetStore}
                      onChange={(v) => setSelectedTargetStore(v)}
                      options={[
                        { value: 'ALL', label: 'Pilih cabang toko target...' },
                        ...stores.map((s) => ({
                          value: s.id,
                          label: `${s.name}${s.city ? ` (${s.city})` : ''}`,
                        })),
                      ]}
                      size="sm"
                    />
                  ) : (
                    <div className="flex min-h-[36px] items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {stores[0]?.name || 'Toko Cabang Anda'}
                    </div>
                  )}
                </div>

                {/* Filter Merek */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                    Filter Merek:
                  </label>
                  <CustomSelect
                    value={brandFilter}
                    onChange={(v) => setBrandFilter(v)}
                    options={[
                      { value: 'ALL', label: 'Semua Merek' },
                      { value: 'Apple', label: 'Apple' },
                      { value: 'Samsung', label: 'Samsung' },
                      { value: 'Xiaomi', label: 'Xiaomi' },
                      { value: 'ASUS', label: 'ASUS' },
                      { value: 'Vivo', label: 'Vivo' },
                      { value: 'Oppo', label: 'Oppo' },
                    ]}
                    size="sm"
                  />
                </div>

                {/* Action button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={downloadingTemplate}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 disabled:opacity-60"
                  >
                    {downloadingTemplate ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Membuat File Shopee...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Buat &amp; Unduh File Excel</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Riwayat Dokumen Download */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Riwayat Dokumen Template
              </span>

              {loadingTasks ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-orange-500" />
                </div>
              ) : tasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  Belum ada dokumen yang dibuat. Pilih parameter di atas lalu
                  klik &quot;Buat &amp; Unduh File Excel&quot;.
                </p>
              ) : (
                <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                          {task.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {task.store?.name || 'Toko Cabang'} •{' '}
                          {new Date(task.createdAt).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          ✓ Selesai ({task.totalCount} item)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD */}
        {modalTab === 'upload' && (
          <div className="mt-4 space-y-4">
            {!result ? (
              <>
                {/* Upload Zone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) =>
                    handleFileChange(e.target.files?.[0] || null)
                  }
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
                      isDragging
                        ? 'border-orange-500 bg-orange-50/40'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="shadow-xs mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-400 dark:bg-slate-800">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Tarik &amp; lepaskan berkas Excel Shopee (.xlsx) di sini
                    </span>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Sistem mencocokkan baris berdasarkan Kode Produk dan Kode
                      Variasi (Maks. 15 MB)
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Mirroring Sync Toggle */}
                <div className="flex items-start gap-3 rounded-2xl border border-orange-200/70 bg-orange-50/40 p-3.5 dark:border-orange-950/40 dark:bg-orange-950/20">
                  <input
                    type="checkbox"
                    id="mirror-mode-cb"
                    checked={mirrorMode}
                    onChange={(e) => setMirrorMode(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label
                    htmlFor="mirror-mode-cb"
                    className="cursor-pointer select-none space-y-0.5 text-xs"
                  >
                    <span className="block font-bold text-slate-900 dark:text-white">
                      Sinkronisasi Total (Mirroring Katalog)
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Item yang tidak ada di berkas Excel ini akan otomatis
                      dihapus/dinonaktifkan agar data website persis sama dengan
                      file.
                    </p>
                  </label>
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!selectedFile || loading}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Memproses Validasi Shopee...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Unggah &amp; Terapkan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tabel Dokumen Riwayat Upload */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Riwayat Unggahan Dokumen
                  </span>

                  {loadingTasks ? (
                    <div className="py-4 text-center">
                      <Loader2 className="mx-auto h-4 w-4 animate-spin text-orange-500" />
                    </div>
                  ) : tasks.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-[11px] text-slate-400">
                      Belum ada dokumen yang diunggah.
                    </p>
                  ) : (
                    <div className="max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200/80 bg-white text-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2.5"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                              {task.fileName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(task.createdAt).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              task.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {task.processedCount} / {task.totalCount} Sukses
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Upload Result Screen */
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-950/40 dark:bg-emerald-950/20">
                  <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    {result.message}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                    <div className="shadow-2xs rounded-xl bg-white p-2 dark:bg-slate-800">
                      <span className="block text-[10px] text-slate-400">
                        Total Baris
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {result.totalRows}
                      </span>
                    </div>
                    <div className="shadow-2xs rounded-xl bg-white p-2 dark:bg-slate-800">
                      <span className="block text-[10px] text-slate-400">
                        Diperbarui
                      </span>
                      <span className="font-bold text-emerald-600">
                        {result.updatedCount}
                      </span>
                    </div>
                    <div className="shadow-2xs rounded-xl bg-white p-2 dark:bg-slate-800">
                      <span className="block text-[10px] text-slate-400">
                        Sama
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {result.unchangedCount ?? 0}
                      </span>
                    </div>
                    <div className="shadow-2xs rounded-xl bg-white p-2 dark:bg-slate-800">
                      <span className="block text-[10px] text-slate-400">
                        Dilewati/Gagal
                      </span>
                      <span className="font-bold text-rose-600">
                        {result.skippedCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error Log per Baris bila ada */}
                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-1.5 rounded-2xl border border-rose-200 bg-rose-50/60 p-3.5 dark:border-rose-950/40 dark:bg-rose-950/20">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                      Rincian Alasan Kegagalan Baris ({result.errors.length}):
                    </span>
                    <div className="max-h-36 space-y-1 overflow-y-auto">
                      {result.errors.map((err, i) => (
                        <p
                          key={i}
                          className="text-[11px] text-rose-700 dark:text-rose-400"
                        >
                          • Baris {err.row} ({err.sku}): {err.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="shadow-xs min-h-[44px] rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
                  >
                    Unggah Berkas Lain
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
