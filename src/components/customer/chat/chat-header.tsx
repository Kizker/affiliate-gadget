'use client'

import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { ChatRoom, ActiveOrderContext } from './chat-types'

interface ChatHeaderProps {
  onBackToList: () => void
  activeStoreLogo: string | null
  activeStoreTitle: string
  isStoreOnline: boolean
  activeOrderContext: ActiveOrderContext | null
  isCsActive: boolean
  selectedRoom: ChatRoom
}

export function ChatHeader({
  onBackToList,
  activeStoreLogo,
  activeStoreTitle,
  isStoreOnline,
  activeOrderContext,
  isCsActive,
  selectedRoom,
}: ChatHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onBackToList}
          className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {activeStoreLogo ? (
          <img
            src={activeStoreLogo}
            alt={activeStoreTitle}
            className="shadow-2xs h-10 w-10 shrink-0 rounded-2xl border border-slate-200/60 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-100 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {activeStoreTitle.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
              {activeStoreTitle}
            </h3>
            {isStoreOnline ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Offline
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-slate-400">
            {activeOrderContext?.orderNumber ? (
              `Pesanan #${activeOrderContext.orderNumber}`
            ) : isCsActive ? (
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Pusat Layanan & Bantuan CS Superadmin Platform
              </span>
            ) : (selectedRoom.claimedBy as any)?.role === 'MITRA' ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Mitra Servis Resmi:{' '}
                {selectedRoom.store?.name || selectedRoom.claimedBy?.name}
              </span>
            ) : selectedRoom.claimedBy?.name ? (
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {(selectedRoom.claimedBy as any)?.role === 'SUPER_ADMIN'
                  ? `CS Superadmin: ${selectedRoom.claimedBy.name}`
                  : `Admin Toko: ${selectedRoom.claimedBy.name}`}
              </span>
            ) : (
              selectedRoom.store?.companyName || 'Customer Support & Sales Toko'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
