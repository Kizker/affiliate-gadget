'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Heart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
  Edit2,
  Check,
} from 'lucide-react'
import type { LiveChatMessage } from '@/hooks/use-live-chat'

interface LiveChatPanelProps {
  messages: LiveChatMessage[]
  onSendMessage: (text: string, customUserName?: string) => boolean | void
  onSendLike: (count?: number) => void
  likeCount?: number
  isBroadcaster?: boolean
  currentUserName?: string
  isConnected?: boolean
  className?: string
}

export function LiveChatPanel({
  messages,
  onSendMessage,
  onSendLike,
  likeCount = 0,
  isBroadcaster = false,
  currentUserName,
  isConnected = true,
  className = '',
}: LiveChatPanelProps) {
  const [inputText, setInputText] = useState('')
  const [guestName, setGuestName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [floatingLikes, setFloatingLikes] = useState<
    { id: number; left: number }[]
  >([])

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const isAutoScrollRef = useRef(true)

  // Initialize guest name from localStorage if viewer is not logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('affiliate_gadget_guest_name')
      if (!saved) {
        saved = `Penonton #${Math.floor(100 + Math.random() * 900)}`
        localStorage.setItem('affiliate_gadget_guest_name', saved)
      }
      setGuestName(saved)
      setNameInput(saved)
    }
  }, [])

  // Auto-scroll to bottom on new message if user was already at the bottom
  useEffect(() => {
    if (isAutoScrollRef.current && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages])

  const handleScroll = () => {
    if (!chatScrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current
    isAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 80
  }

  const effectiveUserName = currentUserName || guestName || 'Penonton'

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = nameInput.trim()
    if (trimmed) {
      setGuestName(trimmed)
      if (typeof window !== 'undefined') {
        localStorage.setItem('affiliate_gadget_guest_name', trimmed)
      }
    }
    setIsEditingName(false)
  }

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return

    onSendMessage(trimmed, effectiveUserName)
    setInputText('')
  }

  const triggerLikeAnimation = () => {
    onSendLike(1)
    const newId = Date.now() + Math.random()
    const randomLeft = Math.floor(Math.random() * 50) + 30
    setFloatingLikes((prev) => [
      ...prev.slice(-15),
      { id: newId, left: randomLeft },
    ])

    setTimeout(() => {
      setFloatingLikes((prev) => prev.filter((item) => item.id !== newId))
    }, 1800)
  }

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Live Chat
          </h3>
          <span className="text-[11px] font-medium text-slate-400">
            ({messages.length})
          </span>
        </div>

        {/* Header Right: Total Likes */}
        <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
          <Heart className="h-3.5 w-3.5 animate-pulse fill-rose-500 text-rose-500" />
          <span>{likeCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Guest Name Notification / Edit Bar (Only for non-logged in viewers) */}
      {!isBroadcaster && !currentUserName && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-orange-50/60 px-3.5 py-1.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-orange-950/20 dark:text-slate-300">
          {isEditingName ? (
            <form
              onSubmit={handleSaveName}
              className="flex flex-1 items-center gap-1.5"
            >
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={30}
                placeholder="Nama Anda..."
                className="w-full rounded-md border border-orange-300 bg-white px-2 py-0.5 text-[11px] text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                autoFocus
              />
              <button
                type="submit"
                className="cursor-pointer rounded-md bg-orange-500 p-1 text-white hover:bg-orange-600"
                title="Simpan Nama"
              >
                <Check className="h-3 w-3" />
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-1.5 truncate">
                <User className="h-3 w-3 text-orange-500" />
                <span>
                  Mengirim sebagai:{' '}
                  <strong className="text-slate-800 dark:text-white">
                    {effectiveUserName}
                  </strong>
                </span>
              </div>
              <button
                onClick={() => setIsEditingName(true)}
                className="flex cursor-pointer items-center gap-1 font-semibold text-orange-600 hover:underline dark:text-orange-400"
              >
                <Edit2 className="h-2.5 w-2.5" />
                <span>Ganti</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={chatScrollRef}
        onScroll={handleScroll}
        className="scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 flex-1 space-y-2 overflow-y-auto p-4 text-xs"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center text-slate-400">
            <Sparkles className="mb-2 h-7 w-7 text-amber-500" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Belum ada obrolan
            </p>
            <p className="text-[11px] text-slate-400">
              Jadilah yang pertama menyapa siaran ini!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isHost =
              msg.userName?.toLowerCase().includes('admin') ||
              msg.userName?.toLowerCase().includes('toko') ||
              msg.userName?.toLowerCase().includes('host')

            return (
              <div
                key={msg.id || index}
                className="group flex flex-col items-start gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {isHost ? (
                    <span className="shadow-2xs inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      HOST
                    </span>
                  ) : (
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {msg.userName}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <p className="word-break select-text break-words text-[12px] leading-relaxed text-slate-800 dark:text-slate-200">
                  {msg.message}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* Floating Likes Animations (Local subtle preview) */}
      <div className="pointer-events-none absolute bottom-16 right-4 z-20 h-48 w-24 overflow-hidden">
        {floatingLikes.map((l) => (
          <div
            key={l.id}
            style={{ left: `${l.left}%` }}
            className="animate-float-heart absolute bottom-0 text-rose-500"
          >
            <Heart className="h-6 w-6 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isConnected
                ? isBroadcaster
                  ? 'Kirim pesan sebagai Host...'
                  : `Komentari sebagai ${effectiveUserName}...`
                : 'Koneksi terputus, mencoba lagi...'
            }
            disabled={!isConnected}
            maxLength={300}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className="shadow-xs cursor-pointer rounded-xl bg-blue-600 p-2.5 font-medium text-white transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            title="Kirim Komentar"
          >
            <Send className="h-4 w-4" />
          </button>

          {/* Like Heart Button */}
          <button
            type="button"
            onClick={triggerLikeAnimation}
            className="shadow-2xs cursor-pointer rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-500 transition-all hover:bg-rose-100 active:scale-90 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400"
            title="Kirim Suka"
          >
            <Heart className="h-4 w-4 fill-rose-500" />
          </button>
        </form>
      </div>
    </div>
  )
}
