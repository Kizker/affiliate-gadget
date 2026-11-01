'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Store,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePageGuard } from '@/hooks/use-page-guard'

interface StoreItem {
  id: string
  name: string
  slug: string
  city: string
  groupId?: string | null
}

interface AfterSalesUserItem {
  id: string
  name: string | null
  email: string
  phone: string | null
  managedGroup?: { id: string; name: string } | null
}

interface StoreGroupItem {
  id: string
  name: string
  description?: string | null
  createdAt: string
  afterSalesUserId?: string | null
  afterSalesUser?: {
    id: string
    name: string | null
    email: string
    phone: string | null
  } | null
  stores: StoreItem[]
}

export default function SuperAdminGroupsPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/groups'
  )
  const { data: session } = useSession()

  const [groups, setGroups] = useState<StoreGroupItem[]>([])
  const [afterSalesUsers, setAfterSalesUsers] = useState<AfterSalesUserItem[]>(
    []
  )
  const [allStores, setAllStores] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<StoreGroupItem | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [selectedAfterSalesUserId, setSelectedAfterSalesUserId] = useState('')
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/groups')
      const json = await res.json()
      if (res.ok && json.success) {
        setGroups(json.data || [])
        setAfterSalesUsers(json.afterSalesUsers || [])
        setAllStores(json.allStores || [])
      } else {
        toast.error(json.error || 'Gagal memuat data grup')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAllowed) {
      fetchData()
    }
  }, [isAllowed, fetchData])

  const openCreateModal = () => {
    setEditingGroup(null)
    setGroupName('')
    setGroupDescription('')
    setSelectedAfterSalesUserId('')
    setSelectedStoreIds([])
    setModalOpen(true)
  }

  const openEditModal = (group: StoreGroupItem) => {
    setEditingGroup(group)
    setGroupName(group.name)
    setGroupDescription(group.description || '')
    setSelectedAfterSalesUserId(group.afterSalesUserId || '')
    setSelectedStoreIds(group.stores.map((s) => s.id))
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) {
      toast.error('Nama grup wajib diisi')
      return
    }

    try {
      setSubmitting(true)
      const url = editingGroup
        ? `/api/admin/groups/${editingGroup.id}`
        : '/api/admin/groups'
      const method = editingGroup ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          afterSalesUserId: selectedAfterSalesUserId || null,
          storeIds: selectedStoreIds,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || 'Grup berhasil disimpan')
        setModalOpen(false)
        fetchData()
      } else {
        toast.error(json.error || 'Gagal menyimpan grup')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus grup ini?')) return
    try {
      setDeletingId(id)
      const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Grup berhasil dihapus')
        fetchData()
      } else {
        toast.error(json.error || 'Gagal menghapus grup')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId]
    )
  }

  const filteredGroups = groups.filter((g) => {
    const q = searchQuery.toLowerCase()
    return (
      g.name.toLowerCase().includes(q) ||
      g.afterSalesUser?.name?.toLowerCase().includes(q) ||
      g.stores.some((s) => s.name.toLowerCase().includes(q))
    )
  })

  const totalAssignedStores = groups.reduce(
    (acc, g) => acc + g.stores.length,
    0
  )
  const unassignedStores = allStores.filter((s) => !s.groupId)

  if (guardLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            <Layers className="h-6 w-6 text-orange-600" />
            Tata Kelola Grup &amp; After Sales
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Pusat kendali Superadmin untuk menggabungkan cabang toko dan
            menugaskan Admin After Sales.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Buat Grup Baru
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Grup Cabang</span>
            <Layers className="h-4 w-4 text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {groups.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Toko Tergabung dalam Grup</span>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalAssignedStores}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Toko Belum Masuk Grup</span>
            <Store className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {unassignedStores.length}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama grup, nama toko, atau admin after sales..."
          className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/30">
            <Layers className="h-8 w-8 text-orange-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
            Belum ada grup cabang
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Buat grup baru untuk menaungi beberapa toko cabang di bawah 1 meja
            After Sales.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
          >
            <Plus className="h-3.5 w-3.5" /> Buat Grup
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="hover:shadow-xs flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(group)}
                      title="Edit Grup"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      disabled={deletingId === group.id}
                      title="Hapus Grup"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                    >
                      {deletingId === group.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Penanggung Jawab After Sales */}
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <UserCheck className="h-4 w-4 text-orange-600" />
                    <span>Admin After Sales Terpusat:</span>
                  </div>
                  {group.afterSalesUser ? (
                    <div className="mt-1 pl-6">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {group.afterSalesUser.name || 'Tanpa Nama'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {group.afterSalesUser.email}
                        {group.afterSalesUser.phone &&
                          ` • ${group.afterSalesUser.phone}`}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 pl-6 text-xs italic text-amber-600 dark:text-amber-400">
                      Belum ditugaskan akun After Sales
                    </p>
                  )}
                </div>

                {/* Toko Cabang Tergabung */}
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Cabang Toko Tergabung ({group.stores.length}):
                  </p>
                  {group.stores.length === 0 ? (
                    <p className="mt-1 text-xs italic text-slate-400">
                      Belum ada cabang toko yang dimasukkan ke grup ini.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {group.stores.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                        >
                          <Store className="h-3 w-3" />
                          {s.name} ({s.city})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800">
                Dibuat pada{' '}
                {new Date(group.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGroup ? 'Edit Grup Cabang' : 'Buat Grup Cabang Baru'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Grup <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Contoh: Grup Jakarta Pusat & Barat"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Deskripsi Grup (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Keterangan singkat cakupan grup..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tugaskan Akun After Sales
                </label>
                <select
                  value={selectedAfterSalesUserId}
                  onChange={(e) => setSelectedAfterSalesUserId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-orange-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">
                    -- Pilih Akun After Sales (Opsional) --
                  </option>
                  {afterSalesUsers.map((u) => {
                    const isBusyWithOtherGroup =
                      u.managedGroup &&
                      (!editingGroup || u.managedGroup.id !== editingGroup.id)
                    return (
                      <option
                        key={u.id}
                        value={u.id}
                        disabled={Boolean(isBusyWithOtherGroup)}
                      >
                        {u.name || u.email} ({u.email})
                        {isBusyWithOtherGroup
                          ? ` - Sudah mengelola ${u.managedGroup?.name}`
                          : ''}
                      </option>
                    )
                  })}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  1 akun After Sales hanya menangani 1 grup cabang.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Cabang Toko yang Tergabung
                </label>
                <div className="mt-1 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-800">
                  {allStores.length === 0 ? (
                    <p className="p-2 text-xs text-slate-400">
                      Tidak ada toko tersedia
                    </p>
                  ) : (
                    allStores.map((store) => {
                      const isAssignedToOtherGroup =
                        store.groupId &&
                        (!editingGroup || store.groupId !== editingGroup.id)
                      const isSelected = selectedStoreIds.includes(store.id)

                      return (
                        <label
                          key={store.id}
                          className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                            isAssignedToOtherGroup
                              ? 'cursor-not-allowed bg-slate-50 opacity-40 dark:bg-slate-800/30'
                              : 'hover:bg-orange-50/60 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {store.name} ({store.city})
                            {isAssignedToOtherGroup && (
                              <span className="ml-1 text-[10px] text-amber-600">
                                (sudah di grup lain)
                              </span>
                            )}
                          </span>
                          <input
                            type="checkbox"
                            disabled={Boolean(isAssignedToOtherGroup)}
                            checked={isSelected}
                            onChange={() => toggleStoreSelection(store.id)}
                            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                          />
                        </label>
                      )
                    })
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  1 toko cabang hanya dapat bergabung ke 1 grup saja.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingGroup ? 'Simpan Perubahan' : 'Buat Grup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
