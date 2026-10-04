'use client'

import React from 'react'
import Link from 'next/link'
import {
  Store,
  Sparkles,
  ShieldCheck,
  Building2,
  Phone,
  CreditCard,
  Eye,
  Check,
  X,
  Edit,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { Mitra } from './types'

interface StoreTableProps {
  mounted: boolean
  loading: boolean
  mitras: Mitra[]
  approvalFilter: 'ALL' | 'APPROVED' | 'PENDING'
  searchQuery: string
  cityFilter: string
  onResetFilter: () => void
  isProcessingAction: boolean
  onOpenApproveModal: (mitra: Mitra) => void
  onOpenRejectModal: (mitra: Mitra) => void
  onToggleApproval: (
    id: string,
    currentStatus: boolean,
    businessName: string
  ) => void
  onOpenDeleteModal: (id: string, businessName: string) => void
}

export function StoreTable({
  mounted,
  loading,
  mitras,
  approvalFilter,
  searchQuery,
  cityFilter,
  onResetFilter,
  isProcessingAction,
  onOpenApproveModal,
  onOpenRejectModal,
  onToggleApproval,
  onOpenDeleteModal,
}: StoreTableProps) {
  if (!mounted || loading) {
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

  if (mitras.length === 0) {
    return (
      <div className="space-y-3 p-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/40">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {approvalFilter === 'PENDING'
              ? 'Tidak Ada Antrean Review'
              : 'Tidak ada toko atau pendaftar ditemukan'}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {approvalFilter === 'PENDING'
              ? 'Semua pendaftaran mitra telah diproses. Belum ada pengajuan toko baru yang menunggu verifikasi.'
              : searchQuery || cityFilter || approvalFilter !== 'ALL'
                ? 'Tidak ada data yang sesuai dengan filter pencarian.'
                : 'Belum ada cabang toko atau pendaftar baru.'}
          </p>
        </div>
        {(searchQuery || cityFilter || approvalFilter !== 'ALL') && (
          <button
            onClick={onResetFilter}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50/50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100/60 dark:border-orange-800/60 dark:bg-orange-950/30 dark:text-orange-300"
          >
            Reset Filter
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
              Toko & Badan Usaha PT
            </th>
            <th className="hidden min-w-[150px] px-3 py-3.5 md:table-cell">
              Alamat Fisik
            </th>
            <th className="hidden min-w-[140px] px-3 py-3.5 sm:table-cell">
              Kontak & PIC
            </th>
            <th className="hidden min-w-[150px] px-3 py-3.5 lg:table-cell">
              Rekening & Komisi
            </th>
            <th className="min-w-[130px] px-3 py-3.5">Status & Tipe</th>
            <th className="w-[280px] min-w-[260px] whitespace-nowrap px-4 py-3.5 text-right sm:px-5">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
          {mitras.map((mitra) => {
            const isApplicant = Boolean(
              mitra.source === 'pending_applicant' ||
              mitra.id?.startsWith('applicant_') ||
              mitra.user?.mitraStatus === 'PENDING'
            )
            const storeName = mitra.name || mitra.businessName || 'Toko Gadget'
            const initial = storeName.charAt(0).toUpperCase() || 'T'
            const primaryBank =
              mitra.bankAccounts?.find((b) => b.isPrimary) ||
              mitra.bankAccounts?.[0]
            const company =
              mitra.companyName || mitra.user?.name || 'Badan Usaha Terdaftar'

            return (
              <tr
                key={mitra.id}
                className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
              >
                {/* 1. Store Identity */}
                <td className="px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`shadow-2xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                        isApplicant
                          ? 'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'border-orange-200/80 bg-orange-50 text-orange-600 dark:border-orange-800/60 dark:bg-orange-950/50 dark:text-orange-400'
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-bold text-slate-950 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:text-sm">
                          {storeName}
                        </p>
                        {isApplicant && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            Baru
                          </span>
                        )}
                        {mitra.isOwnerStore && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-purple-200/80 bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/50 dark:text-purple-300">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Pusat
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="max-w-[130px] truncate font-medium text-slate-600 dark:text-slate-300 sm:max-w-[160px]">
                          {company}
                        </span>
                        <span>·</span>
                        <span className="max-w-[80px] shrink-0 truncate text-slate-400 dark:text-slate-500">
                          {mitra.city || 'Indonesia'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. Physical Address */}
                <td className="hidden px-3 py-3.5 md:table-cell">
                  <div className="min-w-0 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="block truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                        {mitra.address
                          ? mitra.address.split(',')[0].trim()
                          : mitra.city || 'Indonesia'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate pl-5 font-sans text-[11px] text-slate-400 dark:text-slate-500">
                      {mitra.city || '-'}
                      {mitra.province ? `, ${mitra.province}` : ', Indonesia'}
                    </p>
                  </div>
                </td>

                {/* 3. Contact & PIC */}
                <td className="hidden px-3 py-3.5 sm:table-cell">
                  <div className="min-w-0 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-medium">
                      <Phone className="h-3.5 w-3.5 shrink-0 font-sans text-slate-400" />
                      <span className="truncate">
                        {mitra.phone || mitra.whatsapp || '-'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate pl-5 text-[11px] text-slate-400 dark:text-slate-500">
                      {mitra.email || mitra.user?.email || '-'}
                    </p>
                  </div>
                </td>

                {/* 4. Bank Account & Commission */}
                <td className="hidden px-3 py-3.5 lg:table-cell">
                  <div className="min-w-0 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                      <CreditCard className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {primaryBank?.accountName
                          ? 'Rekening Toko'
                          : primaryBank?.bankName
                            ? 'Rekening PT'
                            : 'Rekening Toko'}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 pl-5 text-[10px] text-slate-400 dark:text-slate-500">
                      <span className="truncate font-medium">
                        {primaryBank?.bankName || 'Bank Mandiri'}
                        {primaryBank?.accountNumber
                          ? ` (•••${primaryBank.accountNumber.slice(-4)})`
                          : ''}
                      </span>
                      <span>·</span>
                      <span className="shrink-0 font-sans font-semibold text-orange-600 dark:text-orange-400">
                        {mitra.commissionRate || 2}% Komisi
                      </span>
                    </div>
                  </div>
                </td>

                {/* 5. Status Badge */}
                <td className="px-3 py-3.5">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        isApplicant
                          ? 'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300'
                          : mitra.isApproved
                            ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          isApplicant
                            ? 'bg-amber-500'
                            : mitra.isApproved
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                        }`}
                      />
                      {isApplicant
                        ? 'Pendaftar Baru'
                        : mitra.isApproved
                          ? 'Terverifikasi'
                          : 'Nonaktif'}
                    </span>
                  </div>
                </td>

                {/* 6. Action Buttons */}
                <td className="w-[280px] min-w-[260px] whitespace-nowrap px-4 py-3.5 text-right sm:px-5">
                  <div className="flex flex-nowrap items-center justify-end gap-1.5 whitespace-nowrap">
                    {/* 1. Detail (Universal untuk semua mitra & pendaftar) */}
                    <Link
                      href={`/dashboard/admin/mitras/${mitra.id}`}
                      className="shadow-2xs inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-800 dark:hover:text-orange-400"
                      title="Buka Halaman Detail Lengkap"
                    >
                      <Eye className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-orange-500" />
                      <span>Detail</span>
                    </Link>

                    {/* 2. Tombol Aksi Spesifik */}
                    {isApplicant ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenApproveModal(mitra)}
                          disabled={isProcessingAction}
                          className="shadow-2xs inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-3.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          title="Setujui pendaftaran mitra dan buat toko resmi"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>Setujui</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenRejectModal(mitra)}
                          disabled={isProcessingAction}
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-rose-200/80 bg-rose-50/80 px-3.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                          title="Tolak pendaftaran dengan instruksi perbaikan"
                        >
                          <X className="h-3.5 w-3.5 shrink-0" />
                          <span>Tolak</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onToggleApproval(
                              mitra.id,
                              mitra.isApproved,
                              storeName
                            )
                          }
                          className={`shadow-2xs inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${
                            mitra.isApproved
                              ? 'border-rose-200/80 bg-rose-50/60 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400'
                              : 'border-emerald-200/80 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400'
                          }`}
                          title={
                            mitra.isApproved
                              ? 'Tangguhkan toko ini'
                              : 'Setujui & aktifkan toko'
                          }
                        >
                          {mitra.isApproved ? 'Tangguhkan' : 'Aktifkan'}
                        </button>

                        <Link
                          href={`/dashboard/admin/mitras/${mitra.id}/edit`}
                          className="shadow-2xs inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-500 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-orange-400"
                          title="Ubah Profil Toko"
                        >
                          <Edit className="h-3.5 w-3.5 shrink-0" />
                        </Link>

                        <Link
                          href={`/toko/${mitra.slug || mitra.id}`}
                          target="_blank"
                          className="shadow-2xs hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white xl:inline-flex"
                          title="Buka halaman publik toko"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => onOpenDeleteModal(mitra.id, storeName)}
                          className="shadow-2xs inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          title="Hapus Toko"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        </button>
                      </>
                    )}
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
