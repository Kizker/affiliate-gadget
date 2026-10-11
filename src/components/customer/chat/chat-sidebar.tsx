'use client'

import React from 'react'
import { MessageSquare } from 'lucide-react'
import { ChatRoom } from './chat-types'
import { ChatRoomCard } from './chat-room-card'

interface ChatSidebarProps {
  rooms: ChatRoom[]
  unreadRoomsCount: number
  orderRoomsCount: number
  roomFilter: 'ALL' | 'UNREAD' | 'ORDER'
  setRoomFilter: (filter: 'ALL' | 'UNREAD' | 'ORDER') => void
  filteredRooms: ChatRoom[]
  selectedRoom: ChatRoom | null
  onSelectRoom: (room: ChatRoom) => void
}

export function ChatSidebar({
  rooms,
  unreadRoomsCount,
  orderRoomsCount,
  roomFilter,
  setRoomFilter,
  filteredRooms,
  selectedRoom,
  onSelectRoom,
}: ChatSidebarProps) {
  return (
    <>
      {/* Integrated Sidebar Header */}
      <div className="shrink-0 space-y-2.5 border-b border-slate-100 p-3 dark:border-slate-800 sm:p-3.5">
        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          {[
            { id: 'ALL', label: 'Semua', count: rooms.length },
            {
              id: 'UNREAD',
              label: 'Belum Dibaca',
              count: unreadRoomsCount,
            },
            { id: 'ORDER', label: 'Pesanan', count: orderRoomsCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoomFilter(tab.id as any)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-center text-[11px] font-bold transition-all ${
                roomFilter === tab.id
                  ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`py-0.2 rounded-full px-1.5 text-[9.5px] font-bold ${
                    roomFilter === tab.id
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200'
                      : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Room List Scrollable */}
      <div className="min-h-0 flex-1 divide-y divide-slate-50 overflow-y-auto dark:divide-slate-800/60">
        {filteredRooms.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 dark:bg-slate-800">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {roomFilter === 'UNREAD'
                ? 'Tidak Ada Pesan Belum Dibaca'
                : roomFilter === 'ORDER'
                  ? 'Belum Ada Chat Pesanan'
                  : 'Belum Ada Percakapan'}
            </p>
            <p className="mt-0.5 max-w-[200px] text-[11px] text-slate-400">
              {roomFilter === 'UNREAD'
                ? 'Semua pesan sudah dibaca.'
                : roomFilter === 'ORDER'
                  ? 'Chat khusus barang yang sudah dipesan akan tampil di sini. Tanya-tanya umum tidak masuk tab ini.'
                  : 'Mulai chat melalui rincian pesanan Anda.'}
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <ChatRoomCard
              key={room.id}
              room={room}
              isSelected={selectedRoom?.id === room.id}
              onSelectRoom={onSelectRoom}
            />
          ))
        )}
      </div>
    </>
  )
}
