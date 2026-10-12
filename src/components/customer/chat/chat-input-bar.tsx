'use client'

import React from 'react'
import { Plus, Send, Loader2 } from 'lucide-react'

interface ChatInputBarProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  uploadingMedia: boolean
  messageInput: string
  setMessageInput: (val: string) => void
  onSendMessage: () => void
  sending: boolean
}

export function ChatInputBar({
  fileInputRef,
  uploadingMedia,
  messageInput,
  setMessageInput,
  onSendMessage,
  sending,
}: ChatInputBarProps) {
  return (
    <div className="shrink-0 border-t border-slate-200/80 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] dark:border-slate-800 dark:bg-slate-900 sm:p-3.5 sm:pb-3.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingMedia}
          aria-label="Kirim foto atau video"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          title="Kirim Foto / Video"
        >
          {uploadingMedia ? (
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>

        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSendMessage()
            }
          }}
          aria-label="Ketik pesan ke admin toko"
          placeholder="Ketik pesan ke admin toko..."
          className="flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />

        <button
          type="button"
          onClick={onSendMessage}
          disabled={!messageInput.trim() || sending}
          aria-label="Kirim pesan"
          className="shadow-xs flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-40 dark:bg-white dark:text-slate-950"
          title="Kirim Pesan"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}
