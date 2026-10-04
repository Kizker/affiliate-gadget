'use client'

import React from 'react'
import { Wrench, Plus, Building2, Phone, Layers, Trash2 } from 'lucide-react'
import { ServiceMitra } from './types'

interface ServiceMitraTableProps {
  serviceLoading: boolean
  serviceMitras: ServiceMitra[]
  serviceSearchQuery: string
  serviceStatusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'
  onResetFilter: () => void
  onOpenCreateMitraModal: () => void
  onToggleMitraStatus: (
    userId: string,
    currentStatus: boolean,
    name: string
  ) => void
  onOpenDeleteModal: (mitra: { id: string; name: string }) => void
}

export function ServiceMitraTable({
  serviceLoading,
  serviceMitras,
  serviceSearchQuery,
  serviceStatusFilter,
  onResetFilter,
  onOpenCreateMitraModal,
  onToggleMitraStatus,
  onOpenDeleteModal,
}: ServiceMitraTableProps) {
  if (serviceLoading) {
    return (
      <div className="space-y-4 p-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex animate-pulse items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            </div>
            <div className="hidden h-4 w-48 rounded bg-slate-100 dark:bg-slate-800 md:block" />
            <div className="hidden h-4 w-28 rounded bg-slate-100 dark:bg-slate-800 sm:block" />
            <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    )
  }

  if (serviceMitras.length === 0) {
    return (
      <div className="space-y-3 p-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/40">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Belum Ada Mitra Servis Terdaftar
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {serviceSearchQuery || serviceStatusFilter !== 'ALL'
              ? 'Tidak ada mitra servis yang sesuai dengan filter pencarian.'
              : 'Tambahkan akun mitra servis baru untuk mengaktifkan modul Servis LCD dan Lab Reparasi.'}
          </p>
        </div>
        {serviceSearchQuery || serviceStatusFilter !== 'ALL' ? (
          <button
            onClick={onResetFilter}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50/50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100/60 dark:border-orange-800/60 dark:bg-orange-950/30 dark:text-orange-300"
          >
            Reset Filter
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenCreateMitraModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Tambah Mitra Pertama</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500">
            <th className="min-w-[220px] px-4 py-3.5 sm:px-5">
              Mitra & Akun Login
            </th>
            <th className="hidden min-w-[150px] px-3 py-3.5 md:table-cell">
              Workshop & Lokasi
            </th>
            <th className="hidden min-w-[140px] px-3 py-3.5 sm:table-cell">
              Kontak
            </th>
            <th className="hidden min-w-[150px] px-3 py-3.5 lg:table-cell">
              Layanan Reparasi
            </th>
            <th className="min-w-[130px] px-3 py-3.5">Status & Tipe</th>
            <th className="w-[280px] min-w-[260px] whitespace-nowrap px-4 py-3.5 text-right sm:px-5">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
          {serviceMitras.map((sm) => {
            const initial =
              (sm.username || sm.name || 'M').charAt(0).toUpperCase() || 'M'
            const workshopName =
              sm.mitra?.businessName || sm.username || 'Bengkel Servis'

            return (
              <tr
                key={sm.id}
                className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
              >
                {/* 1. Mitra Identity */}
                <td className="px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="shadow-2xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50 text-xs font-bold text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-300">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-bold text-slate-950 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:text-sm">
                          {sm.username}
                        </p>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-blue-200/80 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-300">
                          Role MITRA
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="max-w-[130px] truncate font-medium text-slate-600 dark:text-slate-300 sm:max-w-[160px]">
                          @{sm.username}
                        </span>
                        <span>·</span>
                        <span className="max-w-[80px] shrink-0 truncate text-slate-400 dark:text-slate-500">
                          {sm.mitra?.city || 'Indonesia'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. Workshop & Lokasi */}
                <td className="hidden px-3 py-3.5 md:table-cell">
                  <div className="min-w-0 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="block truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                        {sm.mitra?.address
                          ? sm.mitra.address.split(',')[0].trim()
                          : workshopName}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate pl-5 font-sans text-[11px] text-slate-400 dark:text-slate-500">
                      {sm.mitra?.city || '-'}
                      {sm.mitra?.province
                        ? `, ${sm.mitra.province}`
                        : ', Indonesia'}
                    </p>
                  </div>
                </td>

                {/* 3. Kontak */}
                <td className="hidden px-3 py-3.5 sm:table-cell">
                  <div className="min-w-0 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-medium">
                      <Phone className="h-3.5 w-3.5 shrink-0 font-sans text-slate-400" />
                      <span className="truncate">
                        {sm.phone || sm.mitra?.phone || '-'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate pl-5 text-[11px] text-slate-400 dark:text-slate-500">
                      {sm.email || '-'}
                    </p>
                  </div>
                </td>

                {/* 4. Layanan Reparasi */}
                <td className="hidden px-3 py-3.5 lg:table-cell">
                  <div className="min-w-0 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                      <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {sm.mitra?.servicesCount || 0} Layanan Terdaftar
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 pl-5 text-[10px] text-slate-400 dark:text-slate-500">
                      <span className="shrink-0 font-sans font-semibold text-amber-600 dark:text-amber-400">
                        ★{' '}
                        {sm.mitra?.rating
                          ? Number(sm.mitra.rating).toFixed(1)
                          : '5.0'}
                      </span>
                      <span>·</span>
                      <span className="truncate font-medium">
                        {sm.mitra?.totalReview || 0} Ulasan
                      </span>
                    </div>
                  </div>
                </td>

                {/* 5. Status & Tipe */}
                <td className="px-3 py-3.5">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        sm.isActive
                          ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          sm.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {sm.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </td>

                {/* 6. Action Buttons */}
                <td className="w-[280px] min-w-[260px] whitespace-nowrap px-4 py-3.5 text-right sm:px-5">
                  <div className="flex flex-nowrap items-center justify-end gap-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleMitraStatus(sm.id, sm.isActive, sm.username)
                      }
                      className={`shadow-2xs inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${
                        sm.isActive
                          ? 'border-rose-200/80 bg-rose-50/60 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400'
                          : 'border-emerald-200/80 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400'
                      }`}
                      title={
                        sm.isActive
                          ? 'Nonaktifkan Akun Mitra'
                          : 'Aktifkan Akun Mitra'
                      }
                    >
                      {sm.isActive ? 'Tangguhkan' : 'Aktifkan'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenDeleteModal({
                          id: sm.id,
                          name: sm.username,
                        })
                      }
                      className="shadow-2xs inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      title="Hapus Akun Mitra"
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
