'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Heart, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react'
import type { LiveChatMessage } from '@/hooks/use-live-chat'

interface LiveChatPanelProps {
  messages: LiveChatMessage[]
  onSendMessage: (text: string) => boolean | void
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
  const [showNameModal, setShowNameModal] = useState(false)
  const [floatingLikes, setFloatingLikes] = useState<
    { id: number; left: number }[]
  >([])

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const isAutoScrollRef = useRef(true)

  // Auto-scroll to bottom on new message if user was already at the bottom
  useEffect(() => {
    if (isAutoScrollRef.current && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages])

  const handleScroll = () => {
    if (!chatScrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current
    // User is near bottom if within 80px
    isAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 80
  }

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return

    if (!currentUserName && !guestName) {
      setShowNameModal(true)
      return
    }

    onSendMessage(trimmed)
    setInputText('')
  }

  const triggerLikeAnimation = () => {
    onSendLike(1)
    const newId = Date.now() + Math.random()
    const randomLeft = Math.floor(Math.random() * 60) + 20
    setFloatingLikes((prev) => [
      ...prev.slice(-15),
      { id: newId, left: randomLeft },
    ])

    setTimeout(() => {
      setFloatingLikes((prev) => prev.filter((item) => item.id !== newId))
    }, 1500)
  }

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-md ${className}`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-300" />
          <h3 className="text-sm font-semibold text-white">Live Chat</h3>
          <span className="text-[11px] text-slate-400">
            ({messages.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
          <Heart className="h-3.5 w-3.5 animate-pulse fill-rose-500 text-rose-500" />
          <span>{likeCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatScrollRef}
        onScroll={handleScroll}
        className="scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex-1 space-y-2.5 overflow-y-auto p-4 text-xs"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center text-slate-400">
            <Sparkles className="mb-2 h-8 w-8 animate-bounce text-amber-400/60" />
            <p className="font-medium text-slate-300">Belum ada obrolan</p>
            <p className="text-[11px] text-slate-500">
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
                className="group flex flex-col items-start gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-white/5"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {isHost ? (
                    <span className="shadow-xs inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <ShieldCheck className="h-3 w-3" />
                      HOST
                    </span>
                  ) : (
                    <span className="font-bold text-slate-300 transition-colors hover:text-white">
                      {msg.userName}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <p className="word-break select-text break-words text-[12px] leading-relaxed text-slate-200">
                  {msg.message}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* Floating Likes Animations */}
      <div className="pointer-events-none absolute bottom-16 right-4 z-20 h-48 w-24 overflow-hidden">
        {floatingLikes.map((l) => (
          <div
            key={l.id}
            style={{ left: `${l.left}%` }}
            className="animate-float-fade absolute bottom-0 text-rose-500"
          >
            <Heart className="h-6 w-6 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-white/10 bg-slate-950/60 p-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isConnected
                ? isBroadcaster
                  ? 'Kirim pesan sebagai Host...'
                  : 'Ketik komentar publik...'
                : 'Koneksi terputus, mencoba lagi...'
            }
            disabled={!isConnected}
            maxLength={300}
            className="focus:outline-hidden flex-1 rounded-xl border border-white/10 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 transition-colors focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className="cursor-pointer rounded-xl bg-blue-600 p-2.5 font-medium text-white shadow-md transition-all hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </button>

          {/* Like Heart Button */}
          <button
            type="button"
            onClick={triggerLikeAnimation}
            className="shadow-xs cursor-pointer rounded-xl border border-rose-500/30 bg-rose-500/20 p-2.5 text-rose-400 transition-all hover:bg-rose-500/30 active:scale-90"
            title="Kirim Suka"
          >
            <Heart className="h-4 w-4 fill-rose-500" />
          </button>
        </form>
      </div>
    </div>
  )
}
