'use client'

import React from 'react'
import { isStoreOperational } from '@/lib/chat-status'
import { ChatRoom, formatTime, formatMessagePreview } from './chat-types'

interface ChatRoomCardProps {
  room: ChatRoom
  isSelected: boolean
  onSelectRoom: (room: ChatRoom) => void
}

export function ChatRoomCard({
  room,
  isSelected,
  onSelectRoom,
}: ChatRoomCardProps) {
  const storeObj = room.order?.store || room.store
  const roomIsOnline = isStoreOperational(storeObj, room.technician)
  const storeLogo =
    room.claimedBy?.image ||
    storeObj?.logo ||
    room.order?.claimedBy?.image ||
    null
  const firstProduct = room.order?.items?.[0]?.product?.name
  const isCsRoom =
    (storeObj as any)?.isCs ||
    (room.type === 'admin' && !room.storeId && !room.technician)
  const title = isCsRoom
    ? 'Customer Service (Superadmin)'
    : storeObj?.name || firstProduct || room.technician?.user?.name || 'CS Toko'
  const orderNumber = room.order?.orderNumber
  const lastMsg = formatMessagePreview(room.messages?.[0])

  return (
    <button
      key={room.id}
      onClick={() => onSelectRoom(room)}
      aria-label={`Buka percakapan dengan ${title}`}
      className={`relative flex w-full items-start gap-3 p-3.5 text-left transition-all ${
        isSelected
          ? 'bg-slate-50/90 dark:bg-slate-800/90'
          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
      }`}
    >
      {/* Minimalist Left Accent Pill */}
      {isSelected && (
        <div className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-slate-950 dark:bg-orange-500" />
      )}

      {/* Avatar Squircle */}
      <div className="relative shrink-0">
        {storeLogo ? (
          <img
            src={storeLogo}
            alt={title}
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="shadow-2xs h-10 w-10 rounded-2xl border border-slate-200/60 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-100 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Store Online / Offline Status Dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
            roomIsOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
          aria-label={roomIsOnline ? 'Toko Online' : 'Toko Offline'}
          title={roomIsOnline ? 'Toko Online' : 'Toko Offline'}
        />
        {(room._count?.messages || 0) > 0 && (
          <span className="shadow-2xs absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
            {room._count?.messages}
          </span>
        )}
      </div>

      {/* Room Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
            {title}
          </span>
          <span className="shrink-0 text-[10px] font-medium text-slate-400">
            {formatTime(room.lastMessageAt)}
          </span>
        </div>

        {orderNumber && (
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              #{orderNumber}
            </span>
            {room.order?.status && (
              <span className="py-0.2 rounded bg-slate-100 px-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {room.order.status}
              </span>
            )}
          </div>
        )}

        {isCsRoom && (
          <div className="mt-0.5 flex items-center gap-1">
            <span className="rounded bg-blue-50 px-1 text-[9px] font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              CS Superadmin
            </span>
          </div>
        )}

        {!isCsRoom && !orderNumber && room.claimedBy?.name && (
          <div className="mt-0.5 flex items-center gap-1">
            <span
              className={`truncate text-[10px] font-semibold ${
                (room.claimedBy as any)?.role === 'MITRA'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              •{' '}
              {(room.claimedBy as any)?.role === 'MITRA'
                ? 'Mitra Servis'
                : 'Admin'}
              : {room.claimedBy.name}
            </span>
          </div>
        )}

        <p className="mt-1 truncate text-[11px] font-normal text-slate-500 dark:text-slate-400">
          {lastMsg}
        </p>
      </div>
    </button>
  )
}
