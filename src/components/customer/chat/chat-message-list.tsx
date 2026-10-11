'use client'

import React from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { Message, ChatRoom, ActiveOrderContext } from './chat-types'
import { ChatMessageBubble } from './chat-message-bubble'

interface ChatMessageListProps {
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  messagesLoading: boolean
  messages: Message[]
  sessionUserId?: string
  selectedRoom: ChatRoom | null
  isStoreOnline: boolean
  activeStoreLogo: string | null
  activeStoreTitle: string
  activeOrderContext: ActiveOrderContext | null
  onOpenFullscreenMedia: (media: {
    url: string
    type: 'image' | 'video'
  }) => void
}

export function ChatMessageList({
  messagesContainerRef,
  messagesEndRef,
  messagesLoading,
  messages,
  sessionUserId,
  selectedRoom,
  isStoreOnline,
  activeStoreLogo,
  activeStoreTitle,
  activeOrderContext,
  onOpenFullscreenMedia,
}: ChatMessageListProps) {
  return (
    <div
      ref={messagesContainerRef}
      className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4 sm:p-5"
    >
      {messagesLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="shadow-2xs mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
            <MessageSquare className="h-6 w-6 text-orange-500" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Mulai Percakapan Langsung
          </h4>
          <p className="mt-0.5 max-w-xs text-[11px] text-slate-400">
            Tanyakan ketersediaan varian gadget, status resi, atau konsultasi
            servis teknisi.
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            msg={msg}
            sessionUserId={sessionUserId}
            selectedRoom={selectedRoom}
            isStoreOnline={isStoreOnline}
            activeStoreLogo={activeStoreLogo}
            activeStoreTitle={activeStoreTitle}
            activeOrderContext={activeOrderContext}
            onOpenFullscreenMedia={onOpenFullscreenMedia}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
