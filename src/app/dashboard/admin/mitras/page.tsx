'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { usePageGuard } from '@/hooks/use-page-guard'
import {
  Mitra,
  Stats,
  ServiceMitra,
  ServiceStats,
  MitraPrimaryTabs,
  MitraKpiCards,
  MitraToolbar,
  StoreTable,
  ServiceMitraTable,
  ApproveStoreModal,
  RejectStoreModal,
  DeleteStoreModal,
  CreateServiceMitraModal,
  DeleteServiceMitraModal,
} from '@/components/admin/mitras'

export default function MitrasPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/mitras'
  )
  const router = useRouter()

  // Primary Section Switcher: Toko Offline vs Mitra Servis
  const [mainTab, setMainTab] = useState<'STORES' | 'SERVICES'>('STORES')

  // --- STORES STATE ---
  const [mitras, setMitras] = useState<Mitra[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    approved: 0,
    pending: 0,
    cities: 0,
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Approve Modal State (Store)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [approvingMitra, setApprovingMitra] = useState<Mitra | null>(null)

  // Reject Modal State (Store)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingMitra, setRejectingMitra] = useState<Mitra | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Delete Modal State (Store)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingStore, setDeletingStore] = useState<{
    id: string
    name: string
  } | null>(null)

  const [isProcessingAction, setIsProcessingAction] = useState(false)

  // Filters for Stores
  const [approvalFilter, setApprovalFilter] = useState<
    'ALL' | 'APPROVED' | 'PENDING'
  >('ALL')
  const [cityFilter, setCityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cities, setCities] = useState<string[]>([])

  // --- SERVICE MITRAS STATE (Role MITRA) ---
  const [serviceMitras, setServiceMitras] = useState<ServiceMitra[]>([])
  const [serviceStats, setServiceStats] = useState<ServiceStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalServices: 0,
    cities: 0,
  })
  const [serviceLoading, setServiceLoading] = useState(false)
  const [serviceStatusFilter, setServiceStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL')
  const [serviceSearchQuery, setServiceSearchQuery] = useState('')

  // Create Service Mitra Modal State
  const [createMitraModalOpen, setCreateMitraModalOpen] = useState(false)
  const [newMitraUsername, setNewMitraUsername] = useState('')
  const [newMitraEmail, setNewMitraEmail] = useState('')
  const [newMitraPassword, setNewMitraPassword] = useState('')
  const [showMitraPassword, setShowMitraPassword] = useState(false)
  const [isCreatingMitra, setIsCreatingMitra] = useState(false)

  // Delete Service Mitra Modal State
  const [deletingMitraUser, setDeletingMitraUser] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deleteMitraModalOpen, setDeleteMitraModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch Stores
  const fetchMitras = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        search: searchQuery,
      })

      if (cityFilter) params.append('city', cityFilter)
      if (approvalFilter !== 'ALL') {
        params.append(
          'approved',
          approvalFilter === 'APPROVED' ? 'true' : 'false'
        )
      }

      const res = await fetch(`/api/admin/mitras?${params}`)

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Sesi login tidak sah atau telah berakhir')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch mitras')
      }

      const data = await res.json()
      setMitras(data.mitras || [])
      setTotalPages(data.pagination?.totalPages || 1)

      if (data.stats) {
        setStats({
          total: data.stats.total,
          approved: data.stats.approved,
          pending: data.stats.pending,
          cities: data.stats.cities,
        })
      }

      const allCities = Array.from(
        new Set(
          (data.mitras || [])
            .map((m: Mitra) => m.city)
            .filter((c: string | null) => Boolean(c))
        )
      ).sort() as string[]
      setCities(allCities)
    } catch (error) {
      console.error('Error fetching mitras:', error)
      toast.error('Gagal memuat data toko')
    } finally {
      setLoading(false)
    }
  }, [page, approvalFilter, cityFilter, searchQuery, router])

  useEffect(() => {
    fetchMitras()
  }, [fetchMitras])

  // Fetch Service Mitras (Role MITRA)
  const fetchServiceMitras = useCallback(async () => {
    setServiceLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '50',
        search: serviceSearchQuery,
      })
      if (serviceStatusFilter !== 'ALL') {
        params.append('status', serviceStatusFilter)
      }

      const res = await fetch(`/api/admin/mitras/services?${params}`)
      if (!res.ok) {
        throw new Error('Gagal memuat data mitra servis')
      }
      const data = await res.json()
      setServiceMitras(data.mitras || [])
      if (data.stats) {
        setServiceStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching service mitras:', err)
      toast.error('Gagal memuat data mitra servis')
    } finally {
      setServiceLoading(false)
    }
  }, [serviceSearchQuery, serviceStatusFilter])

  // Auto-fetch service mitras when active tab is SERVICES or on mount for stats
  useEffect(() => {
    if (mainTab === 'SERVICES') {
      fetchServiceMitras()
    }
  }, [mainTab, fetchServiceMitras])

  useEffect(() => {
    // Quick prefetch of service stats on mount
    fetch('/api/admin/mitras/services?limit=1')
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setServiceStats(data.stats)
      })
      .catch(() => {})
  }, [])

  // Create Service Mitra Account Handler
  const handleCreateMitra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !newMitraUsername.trim() ||
      !newMitraEmail.trim() ||
      !newMitraPassword
    ) {
      toast.error('Mohon lengkapi username, email, dan password.')
      return
    }

    if (newMitraPassword.length < 6) {
      toast.error('Password minimal 6 karakter.')
      return
    }

    setIsCreatingMitra(true)
    try {
      const res = await fetch('/api/admin/mitras/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newMitraUsername.trim(),
          email: newMitraEmail.trim().toLowerCase(),
          password: newMitraPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat akun mitra.')
      }

      toast.success(
        data.message || `Akun mitra "${newMitraUsername}" berhasil dibuat!`
      )
      setCreateMitraModalOpen(false)
      setNewMitraUsername('')
      setNewMitraEmail('')
      setNewMitraPassword('')
      fetchServiceMitras()
    } catch (err) {
      console.error('Error creating mitra:', err)
      toast.error(
        err instanceof Error ? err.message : 'Gagal membuat akun mitra.'
      )
    } finally {
      setIsCreatingMitra(false)
    }
  }

  // Toggle Mitra User Active
  const handleToggleMitraStatus = async (
    userId: string,
    currentStatus: boolean,
    name: string
  ) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Gagal mengubah status mitra')
      }
      toast.success(
        `Akun "${name}" berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`
      )
      fetchServiceMitras()
    } catch (err) {
      console.error('Error toggling mitra status:', err)
      toast.error(
        err instanceof Error ? err.message : 'Gagal mengubah status mitra'
      )
    }
  }

  // Confirm Delete Mitra User
  const handleConfirmDeleteMitra = async () => {
    if (!deletingMitraUser) return
    setIsProcessingAction(true)
    try {
      const res = await fetch(`/api/admin/users/${deletingMitraUser.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Gagal menghapus akun mitra')
      }
      toast.success(`Akun mitra "${deletingMitraUser.name}" berhasil dihapus.`)
      setDeleteMitraModalOpen(false)
      setDeletingMitraUser(null)
      fetchServiceMitras()
    } catch (err) {
      console.error('Error deleting mitra:', err)
      toast.error(
        err instanceof Error ? err.message : 'Gagal menghapus akun mitra'
      )
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Store: Open Approve Modal
  const handleOpenApproveModal = (mitra: Mitra) => {
    setApprovingMitra(mitra)
    setApproveModalOpen(true)
  }

  // Store: Confirm Approve Applicant
  const handleConfirmApprove = async () => {
    if (!approvingMitra) return
    const storeName = approvingMitra.name || approvingMitra.businessName

    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/admin/mitras/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: approvingMitra.user?.id,
          id: approvingMitra.id,
          applicationId: approvingMitra.id.replace('applicant_', ''),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyetujui pendaftaran.')
      }

      toast.success(data.message || `Toko "${storeName}" berhasil disetujui!`)
      setApproveModalOpen(false)
      setApprovingMitra(null)
      fetchMitras()
    } catch (err) {
      console.error('Error approving applicant:', err)
      toast.error(
        err instanceof Error ? err.message : 'Gagal menyetujui pendaftaran.'
      )
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Store: Open Reject Modal
  const handleOpenRejectModal = (mitra: Mitra) => {
    setRejectingMitra(mitra)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  // Store: Submit Reject
  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingMitra || !rejectReason.trim()) {
      toast.error('Harap masukkan alasan penolakan atau instruksi perbaikan.')
      return
    }

    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/admin/mitras/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: rejectingMitra.user.id,
          reason: rejectReason.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menolak pendaftaran.')
      }

      toast.success('Pendaftaran berhasil ditolak dengan instruksi perbaikan.')
      setRejectModalOpen(false)
      setRejectingMitra(null)
      setRejectReason('')
      fetchMitras()
    } catch (err) {
      console.error('Error rejecting applicant:', err)
      toast.error(
        err instanceof Error ? err.message : 'Gagal menolak pendaftaran.'
      )
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Store: Open Delete Modal
  const handleOpenDeleteModal = (id: string, businessName: string) => {
    setDeletingStore({ id, name: businessName })
    setDeleteModalOpen(true)
  }

  // Store: Confirm Delete store
  const handleConfirmDelete = async () => {
    if (!deletingStore) return

    setIsProcessingAction(true)
    try {
      const res = await fetch(`/api/admin/mitras/${deletingStore.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal menghapus toko')
      }

      toast.success(`Toko "${deletingStore.name}" berhasil dihapus`)
      setDeleteModalOpen(false)
      setDeletingStore(null)
      await new Promise((resolve) => setTimeout(resolve, 300))
      fetchMitras()
    } catch (error) {
      console.error('Error deleting mitra:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus toko'
      )
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Store: Toggle approval
  const handleToggleApproval = async (
    id: string,
    currentStatus: boolean,
    businessName: string
  ) => {
    const applicant = mitras.find((m) => m.id === id)
    if (
      id.startsWith('applicant_') ||
      applicant?.source === 'pending_applicant' ||
      applicant?.user?.mitraStatus === 'PENDING'
    ) {
      if (applicant) {
        return handleOpenApproveModal(applicant)
      }
    }

    try {
      const res = await fetch(`/api/admin/mitras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Gagal mengubah status verifikasi')
      }

      const data = await res.json().catch(() => ({}))
      toast.success(
        data.message ||
          `Status ${businessName} berhasil ${!currentStatus ? 'disetujui & aktif' : 'ditangguhkan'}`
      )
      fetchMitras()
    } catch (error) {
      console.error('Error updating approval:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Gagal mengubah status verifikasi'
      )
    }
  }

  const handleResetStoreFilter = () => {
    setSearchQuery('')
    setCityFilter('')
    setApprovalFilter('ALL')
  }

  const handleResetServiceFilter = () => {
    setServiceSearchQuery('')
    setServiceStatusFilter('ALL')
  }

  return (
    <div
      className="mx-auto max-w-7xl space-y-6 pb-12 pt-1"
      suppressHydrationWarning
    >
      {/* 0. PRIMARY TABS (Toko Cabang vs Mitra Servis) */}
      <MitraPrimaryTabs
        mainTab={mainTab}
        setMainTab={setMainTab}
        stats={stats}
        serviceStats={serviceStats}
      />

      {/* 1. TOP KPI CARDS (Bento Metric Grid) */}
      <MitraKpiCards
        mainTab={mainTab}
        stats={stats}
        serviceStats={serviceStats}
      />

      {/* 2. TOOLBAR (Segmented Filter, Instant Search & Action Buttons) */}
      <MitraToolbar
        mainTab={mainTab}
        approvalFilter={approvalFilter}
        setApprovalFilter={setApprovalFilter}
        stats={stats}
        cities={cities}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        serviceStatusFilter={serviceStatusFilter}
        setServiceStatusFilter={setServiceStatusFilter}
        serviceStats={serviceStats}
        serviceSearchQuery={serviceSearchQuery}
        setServiceSearchQuery={setServiceSearchQuery}
        onOpenCreateMitraModal={() => setCreateMitraModalOpen(true)}
      />

      {/* 3. TABLE LIST (Displays either Stores or Service Mitras) */}
      <div className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        {mainTab === 'STORES' ? (
          <StoreTable
            mounted={mounted}
            loading={loading}
            mitras={mitras}
            approvalFilter={approvalFilter}
            searchQuery={searchQuery}
            cityFilter={cityFilter}
            onResetFilter={handleResetStoreFilter}
            isProcessingAction={isProcessingAction}
            onOpenApproveModal={handleOpenApproveModal}
            onOpenRejectModal={handleOpenRejectModal}
            onToggleApproval={handleToggleApproval}
            onOpenDeleteModal={handleOpenDeleteModal}
          />
        ) : (
          <ServiceMitraTable
            serviceLoading={serviceLoading}
            serviceMitras={serviceMitras}
            serviceSearchQuery={serviceSearchQuery}
            serviceStatusFilter={serviceStatusFilter}
            onResetFilter={handleResetServiceFilter}
            onOpenCreateMitraModal={() => setCreateMitraModalOpen(true)}
            onToggleMitraStatus={handleToggleMitraStatus}
            onOpenDeleteModal={(m) => {
              setDeletingMitraUser(m)
              setDeleteMitraModalOpen(true)
            }}
          />
        )}
      </div>

      {/* 4. MODALS */}
      <ApproveStoreModal
        open={approveModalOpen}
        mitra={approvingMitra}
        isProcessingAction={isProcessingAction}
        onClose={() => {
          if (!isProcessingAction) {
            setApproveModalOpen(false)
            setApprovingMitra(null)
          }
        }}
        onConfirm={handleConfirmApprove}
      />

      <RejectStoreModal
        open={rejectModalOpen}
        mitra={rejectingMitra}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        isProcessingAction={isProcessingAction}
        onClose={() => setRejectModalOpen(false)}
        onSubmit={handleSubmitReject}
      />

      <DeleteStoreModal
        open={deleteModalOpen}
        deletingStore={deletingStore}
        isProcessingAction={isProcessingAction}
        onClose={() => {
          if (!isProcessingAction) {
            setDeleteModalOpen(false)
            setDeletingStore(null)
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <CreateServiceMitraModal
        open={createMitraModalOpen}
        username={newMitraUsername}
        setUsername={setNewMitraUsername}
        email={newMitraEmail}
        setEmail={setNewMitraEmail}
        password={newMitraPassword}
        setPassword={setNewMitraPassword}
        showPassword={showMitraPassword}
        setShowPassword={setShowMitraPassword}
        isCreating={isCreatingMitra}
        onClose={() => {
          if (!isCreatingMitra) {
            setCreateMitraModalOpen(false)
            setNewMitraUsername('')
            setNewMitraEmail('')
            setNewMitraPassword('')
          }
        }}
        onSubmit={handleCreateMitra}
      />

      <DeleteServiceMitraModal
        open={deleteMitraModalOpen}
        deletingMitraUser={deletingMitraUser}
        isProcessingAction={isProcessingAction}
        onClose={() => {
          if (!isProcessingAction) {
            setDeleteMitraModalOpen(false)
            setDeletingMitraUser(null)
          }
        }}
        onConfirm={handleConfirmDeleteMitra}
      />
    </div>
  )
}
