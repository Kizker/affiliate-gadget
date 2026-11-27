'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus, Send, Loader2, Camera, Package } from 'lucide-react'
import { AutoSuggestInput } from '@/components/chat/auto-suggest-input'
import { DEFAULT_CHAT_SUGGESTIONS } from '@/components/chat/chat-template-modal'

interface ChatInputBarProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  uploadingMedia: boolean
  messageInput: string
  setMessageInput: (val: string) => void
  onSendMessage: () => void
  sending: boolean
  placeholder?: string
  onOpenOrderPicker?: () => void
  suggestions?: string[]
}

export function ChatInputBar({
  fileInputRef,
  uploadingMedia,
  messageInput,
  setMessageInput,
  onSendMessage,
  sending,
  placeholder = 'Ketik pesan...',
  onOpenOrderPicker,
  suggestions = DEFAULT_CHAT_SUGGESTIONS,
}: ChatInputBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Menutup menu pop-up saat pengguna menekan di luar
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div className="w-full shrink-0 border-t border-slate-200/80 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] dark:border-slate-800 dark:bg-slate-900 sm:p-3.5 sm:pb-3.5">
      <div className="flex w-full items-center gap-2">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              if (onOpenOrderPicker) {
                setMenuOpen(!menuOpen)
              } else {
                fileInputRef.current?.click()
              }
            }}
            disabled={uploadingMedia}
            aria-label="Kirim lampiran atau bagikan pesanan"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Tambah Lampiran / Pesanan"
          >
            {uploadingMedia ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            ) : (
              <Plus
                className={`h-4 w-4 transition-transform ${
                  menuOpen ? 'rotate-45' : ''
                }`}
              />
            )}
          </button>

          {/* Action Pop-up Menu */}
          {menuOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2.5 w-48 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl duration-150 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  fileInputRef.current?.click()
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Camera className="h-4 w-4 text-orange-500" />
                <span>Foto &amp; Video</span>
              </button>

              {onOpenOrderPicker && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onOpenOrderPicker()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Package className="h-4 w-4 text-blue-500" />
                  <span>Bagikan Pesanan</span>
                </button>
              )}
            </div>
          )}
        </div>

        <AutoSuggestInput
          value={messageInput}
          onChange={(val) => setMessageInput(val)}
          onSubmit={onSendMessage}
          suggestions={suggestions}
          placeholder={placeholder}
          ariaLabel={placeholder}
          className="min-w-0 flex-1"
          inputClassName="bg-slate-50/80 focus:bg-white dark:bg-slate-800"
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
