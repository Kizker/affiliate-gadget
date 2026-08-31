'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import Link from 'next/link'
import {
  MessageSquare,
  Search,
  Send,
  ChevronLeft,
  Loader2,
  RotateCcw,
  Plus,
  X,
  ZoomIn,
  Maximize2,
  Play,
  Check,
  ExternalLink,
  MessageCircle,
  Package,
  Store,
  CheckCheck,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'

interface ChatRoom {
  id: string
  customerId?: string
  orderId?: string | null
  lastMessageAt: string
  type: 'admin' | 'technician'
  order?: {
    id: string
    orderNumber: string
    status: string
    total?: number
    store?: {
      id: string
      name: string
      companyName?: string
      phone?: string | null
      city?: string
    } | null
    items?: Array<{
      product?: { name: string; brand?: string; images?: string[] } | null
      rentalItem?: { name: string; images?: string[] } | null
      service?: { name: string } | null
      price?: number
      quantity?: number
    }>
  } | null
  store?: {
    id: string
    name: string
    phone?: string | null
    city?: string
  } | null
  technician?: {
    user: {
      name: string | null
      image: string | null
      phone?: string | null
    }
  }
  customer?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  messages?: {
    content: string
    createdAt?: string
    senderId?: string
  }[]
  _count?: {
    messages: number
  }
}

interface Message {
  id: string
  content: string
  messageType?: string
  mediaUrl: string | null
  mediaType?: string | null
  createdAt: string
  isRead?: boolean
  sender: {
    id: string
    name: string | null
    role: string
    image?: string | null
  }
}

const isVideoMedia = (url?: string | null, mediaType?: string | null, messageType?: string | null) => {
  if (messageType === 'video') return true
  if (mediaType?.startsWith('video/')) return true
  if (url && /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(url)) return true
  return false
}

const isImageMedia = (url?: string | null, mediaType?: string | null, messageType?: string | null) => {
  if (messageType === 'image') return true
  if (mediaType?.startsWith('image/')) return true
  if (url && /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(url)) return true
  return !!url && !isVideoMedia(url, mediaType, messageType)
}

export default function CustomerChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'UNREAD' | 'ORDER'>('ALL')

  // Photo & Video Media upload & Fullscreen Modal
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const selectedRoomRef = useRef<ChatRoom | null>(null)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcut listener (ESC to close lightbox)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenMedia) return
      if (e.key === 'Escape') setFullscreenMedia(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreenMedia])

  // Keep selectedRoomRef synced with state
  useEffect(() => {
    selectedRoomRef.current = selectedRoom
  }, [selectedRoom])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/customer/chat')
    }
  }, [status, router])

  // Fetch all chat rooms
  const fetchRooms = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true)
      const [adminRes, techRes] = await Promise.all([
        fetch('/api/customer/chat/all-rooms'),
        fetch('/api/chat/rooms'),
      ])

      const allRooms: ChatRoom[] = []

      if (adminRes.ok) {
        const data = await adminRes.json()
        const adminRooms = (data.rooms || []).map((room: any) => ({
          ...room,
          type: 'admin' as const,
        }))
        allRooms.push(...adminRooms)
      }

      if (techRes.ok) {
        const data = await techRes.json()
        const techRooms = (data.rooms || []).map((room: any) => ({
          ...room,
          type: 'technician' as const,
        }))
        allRooms.push(...techRooms)
      }

      // Sort by latest activity
      allRooms.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      )

      // Clear unread count for the active room so badge stays cleared while room is open
      const mappedRooms = allRooms.map((r) =>
        selectedRoomRef.current?.id === r.id ? { ...r, _count: { messages: 0 } } : r
      )

      setRooms((prev) => {
        if (prev.length !== mappedRooms.length) return mappedRooms
        const hasDiff = mappedRooms.some((r, i) => {
          const p = prev[i]
          return !p || r.id !== p.id || r.lastMessageAt !== p.lastMessageAt || (r._count?.messages || 0) !== (p._count?.messages || 0)
        })
        return hasDiff ? mappedRooms : prev
      })

      // Auto select first room if none selected on desktop (keep reference to avoid re-triggering effects)
      setSelectedRoom((currentSelected) => {
        if (currentSelected) {
          return currentSelected
        }
        if (typeof window !== 'undefined' && window.innerWidth >= 1024 && mappedRooms.length > 0) {
          return mappedRooms[0]
        }
        return null
      })
    } catch (error) {
      if (!isPolling) {
        console.error('Error fetching rooms:', error)
      }
    } finally {
      if (!isPolling) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRooms(false)
    }
  }, [status, fetchRooms])

  // Fetch messages for selected room
  const fetchMessages = useCallback(
    async (room: ChatRoom, isPolling = false) => {
      try {
        let res
        if (room.type === 'admin') {
          res = await fetch(`/api/customer/chat/messages?roomId=${room.id}`)
        } else {
          res = await fetch(`/api/chat/rooms/${room.id}/messages`)
        }

        if (res.ok) {
          const data = await res.json()
          const newMsgs = data.messages || []
          
          setMessages((prev) => {
            if (prev.length !== newMsgs.length) {
              if (!isPolling) setShouldScrollToBottom(true)
              return newMsgs
            }
            const hasDiff = newMsgs.some(
              (m: any, idx: number) =>
                m.id !== prev[idx]?.id ||
                m.content !== prev[idx]?.content ||
                m.isRead !== prev[idx]?.isRead
            )
            if (hasDiff) {
              if (!isPolling) setShouldScrollToBottom(true)
              return newMsgs
            }
            return prev
          })
        }
      } catch (error) {
        if (!isPolling) {
          console.error('Error fetching messages:', error)
        }
      } finally {
        if (!isPolling) setMessagesLoading(false)
      }
    },
    []
  )

  // Trigger fetch messages when selectedRoom changes
  useEffect(() => {
    if (selectedRoom?.id) {
      setMessagesLoading(true)
      fetchMessages(selectedRoom, false)
    } else {
      setMessages([])
      setMessagesLoading(false)
    }
  }, [selectedRoom?.id, fetchMessages])

  // Polling for new messages in active room (1.5s interval for real-time responsiveness)
  useEffect(() => {
    if (selectedRoom?.id) {
      pollingRef.current = setInterval(() => {
        if (selectedRoomRef.current) {
          fetchMessages(selectedRoomRef.current, true)
        }
      }, 1500)
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [selectedRoom?.id, fetchMessages])

  // Background rooms list polling (3.5s interval)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRooms(true)
    }, 3500)
    return () => clearInterval(interval)
  }, [fetchRooms])

  // Auto scroll to bottom
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement
      if (container) {
        container.scrollTop = container.scrollHeight
      }
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom])

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room)
    setShowChatOnMobile(true)
    setShouldScrollToBottom(true)
    // Instantly clear unread badge in state
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, _count: { messages: 0 } } : r))
    )
    fetchMessages(room)
  }

  const handleBackToList = () => {
    setShowChatOnMobile(false)
  }

  // Send message with optimistic instant feedback
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom) return

    const content = messageInput.trim()
    setMessageInput('')
    setSending(true)

    // Optimistic message append
    const tempId = `temp-${Date.now()}`
    const optimisticMsg: Message = {
      id: tempId,
      content,
      messageType: 'text',
      mediaUrl: null,
      createdAt: new Date().toISOString(),
      sender: {
        id: session?.user?.id || 'me',
        name: session?.user?.name || 'Saya',
        role: 'CUSTOMER',
      },
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setShouldScrollToBottom(true)

    try {
      let res
      if (selectedRoom.type === 'admin') {
        res = await fetch('/api/customer/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoom.id,
            content,
          }),
        })
      } else {
        res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
          }),
        })
      }

      if (!res.ok) throw new Error('Gagal mengirim pesan')

      const data = await res.json()
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m))
      )
      setShouldScrollToBottom(true)
      fetchRooms()
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Gagal mengirim pesan')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setMessageInput(content)
    } finally {
      setSending(false)
    }
  }

  // Media (Photo & Video) upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoom) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error('Hanya file foto (JPG, PNG, WebP) dan video (MP4, WebM, MOV) yang diperbolehkan.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const messageType = isVideo ? 'video' : 'image'
    const defaultText = isVideo ? '🎥 Video' : '📷 Foto'

    setUploadingMedia(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Upload gagal')
      }
      const uploadData = await uploadRes.json()

      let res
      if (selectedRoom.type === 'admin') {
        res = await fetch('/api/customer/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoom.id,
            content: defaultText,
            messageType,
            mediaUrl: uploadData.url,
          }),
        })
      } else {
        res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: defaultText,
            messageType,
            mediaUrl: uploadData.url,
            mediaType: file.type,
            mediaSize: file.size,
            mediaName: file.name,
          }),
        })
      }

      if (!res.ok) throw new Error('Gagal mengirim media')

      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setShouldScrollToBottom(true)
      toast.success(isVideo ? 'Video berhasil dikirim' : 'Foto berhasil dikirim')
    } catch (error: any) {
      console.error('Error uploading media:', error)
      toast.error(error.message || 'Gagal mengupload file')
    } finally {
      setUploadingMedia(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const filteredRooms = rooms.filter((room) => {
    const orderNumber = room.order?.orderNumber || ''
    const storeName = room.order?.store?.name || room.store?.name || ''
    const itemName =
      room.order?.items?.[0]?.product?.name ||
      room.order?.items?.[0]?.rentalItem?.name ||
      room.technician?.user?.name ||
      ''

    const matchQuery =
      searchQuery === '' ||
      orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemName.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchQuery) return false

    if (roomFilter === 'UNREAD') {
      return (room._count?.messages || 0) > 0
    }
    if (roomFilter === 'ORDER') {
      return !!room.order
    }
    return true
  })

  const formatTime = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 0) {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (diffDays === 1) {
      return 'Kemarin'
    } else {
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      })
    }
  }

  // Format message preview for sidebar
  const formatMessagePreview = (message?: {
    content: string
    messageType?: string
    mediaUrl?: string | null
    mediaType?: string | null
  }) => {
    if (!message) return 'Mulai percakapan...'
    if (isVideoMedia(message.content, message.mediaUrl, message.messageType)) return '🎥 Lampiran Video'
    if (isImageMedia(message.content, message.mediaUrl, message.messageType)) return '📷 Lampiran Foto'
    if (
      message.messageType === 'product' ||
      (message.content?.trim().startsWith('{') && message.content.includes('"name"') && message.content.includes('"price"'))
    ) {
      return '📦 Rekomendasi Gadget'
    }
    if (
      message.messageType === 'order' ||
      (message.content?.trim().startsWith('{') && message.content.includes('"orderNumber"'))
    ) {
      return '📋 Rincian Pesanan'
    }
    if (message.messageType === 'rental') return '🔄 Rekomendasi Sewa'
    if (message.messageType === 'service') return '🔧 Rekomendasi Servis'
    return message.content
  }

  // Active Store / CS Phone for WhatsApp direct action
  const activeStore = selectedRoom?.order?.store || selectedRoom?.store
  const activeStorePhone = (
    activeStore?.phone ||
    selectedRoom?.technician?.user?.phone ||
    '6281299887766'
  ).replace(/\D/g, '')

  const activeStoreTitle =
    activeStore?.name ||
    selectedRoom?.order?.items?.[0]?.product?.name ||
    selectedRoom?.technician?.user?.name ||
    'CS Toko'

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
        <Navbar variant="light" />
        <div className="flex flex-1 items-center justify-center pt-24">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
      <Navbar variant="light" />

      {/* Hidden file input for Photo & Video */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Luxury Fullscreen Portal Lightbox Modal (Escape stacking context & covers 100% viewport) */}
      {mounted && fullscreenMedia && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-white/45 backdrop-blur-xl p-4 sm:p-6 select-none cursor-pointer"
            onClick={() => setFullscreenMedia(null)}
          >
            {/* Top spacing spacer */}
            <div className="h-2 sm:h-4" />

            {/* Middle Main Media (Image/Video) Stage */}
            <div className="relative flex-1 w-full flex items-center justify-center my-auto px-2 sm:px-14">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-h-[68vh] sm:max-h-[72vh] max-w-[90vw] sm:max-w-[80vw] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 bg-white/60 flex items-center justify-center cursor-default ring-1 ring-black/5"
                >
                  {fullscreenMedia.type === 'video' ? (
                    <video
                      src={fullscreenMedia.url}
                      controls
                      autoPlay
                      playsInline
                      className="max-h-[68vh] sm:max-h-[72vh] w-auto max-w-full rounded-2xl sm:rounded-3xl object-contain shadow-2xl bg-black"
                    />
                  ) : (
                    <img
                      src={fullscreenMedia.url}
                      alt="Pratinjau Foto Lampiran"
                      className="max-h-[68vh] sm:max-h-[72vh] w-auto max-w-full object-contain rounded-2xl sm:rounded-3xl select-none"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Bar: Instructions / Keyboard shortcuts */}
            <div
              className="w-full max-w-sm flex items-center justify-center gap-3 z-20 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-lg text-[11px] font-bold text-slate-700">
                <span>Klik di luar area atau tekan <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-[10px]">ESC</kbd> untuk menutup</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      <main className="flex-1 pt-24 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Single-Surface Bento Chat Hub Container */}
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden h-[calc(100vh-10.5rem)] min-h-[450px] max-h-[calc(100vh-10.5rem)] grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Pane: Integrated Control & Conversation List (4 Cols) */}
            <div
              className={`lg:col-span-4 xl:col-span-4 border-r border-slate-100 dark:border-slate-800 flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-slate-900 ${
                showChatOnMobile ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Integrated Sidebar Header */}
              <div className="shrink-0 p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
                {/* Search Capsule */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari toko, no. pesanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Segmented Filter Pills */}
                <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl dark:bg-slate-800/80">
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'UNREAD', label: 'Belum Dibaca' },
                    { id: 'ORDER', label: 'Pesanan' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRoomFilter(tab.id as any)}
                      className={`flex-1 rounded-lg py-1 text-[11px] font-bold transition-all text-center ${
                        roomFilter === tab.id
                          ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                          : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room List Scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
                {filteredRooms.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 mb-2">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Percakapan</p>
                    <p className="mt-0.5 text-[11px] text-slate-400 max-w-[180px]">
                      Mulai chat melalui rincian pesanan Anda.
                    </p>
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id
                    const storeObj = room.order?.store || room.store
                    const firstProduct = room.order?.items?.[0]?.product?.name
                    const title =
                      storeObj?.name ||
                      firstProduct ||
                      room.technician?.user?.name ||
                      'CS Toko'
                    const orderNumber = room.order?.orderNumber
                    const lastMsg = formatMessagePreview(room.messages?.[0])

                    return (
                      <button
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className={`w-full p-3.5 text-left transition-all flex items-start gap-3 relative ${
                          isSelected
                            ? 'bg-slate-50/90 dark:bg-slate-800/90'
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Minimalist Left Accent Pill (No harsh bounding border) */}
                        {isSelected && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-slate-950 dark:bg-orange-500" />
                        )}

                        {/* Avatar Squircle */}
                        <div className="relative shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 font-bold text-xs dark:bg-slate-800 dark:text-white border border-slate-200/60 dark:border-slate-700">
                            {title.charAt(0).toUpperCase()}
                          </div>
                          {(room._count?.messages || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white shadow-2xs">
                              {room._count?.messages}
                            </span>
                          )}
                        </div>

                        {/* Room Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                              {title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {formatTime(room.lastMessageAt)}
                            </span>
                          </div>

                          {orderNumber && (
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                #{orderNumber}
                              </span>
                              {room.order?.status && (
                                <span className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.2 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                                  {room.order.status}
                                </span>
                              )}
                            </div>
                          )}

                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate font-normal">
                            {lastMsg}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

            </div>

            {/* Right Pane: Active Conversation Window (8 Cols) */}
            <div
              className={`lg:col-span-8 xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden bg-slate-50/40 dark:bg-slate-950/40 ${
                !showChatOnMobile ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {selectedRoom ? (
                <>
                  {/* Chat Top Header */}
                  <div className="shrink-0 p-3 sm:p-3.5 border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={handleBackToList}
                        className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 font-bold text-xs dark:bg-slate-800 dark:text-white border border-slate-200/60 dark:border-slate-700">
                        {activeStoreTitle.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {activeStoreTitle}
                          </h3>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {selectedRoom.order ? `Pesanan #${selectedRoom.order.orderNumber}` : 'Customer Support & Sales Toko'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contextual Order Banner (If order linked) */}
                  {selectedRoom.order && (
                    <div className="shrink-0 px-4 py-2 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100/70 dark:border-blue-900/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-mono font-bold text-blue-950 dark:text-blue-200 truncate">
                          Order #{selectedRoom.order.orderNumber}
                        </span>
                        {selectedRoom.order.status && (
                          <span className="rounded bg-blue-100/80 dark:bg-blue-900/60 px-1.5 py-0.2 text-[9.5px] font-bold text-blue-800 dark:text-blue-300">
                            {selectedRoom.order.status}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/dashboard/customer/orders/${selectedRoom.order.id}`}
                        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 text-[11px] shrink-0 transition hover:underline"
                      >
                        <span>Lihat Rincian</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  {/* Messages Bubble Canvas */}
                  <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4 sm:p-5">
                    {messagesLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-2xs border border-slate-100 dark:bg-slate-900 dark:border-slate-800 mb-2">
                          <MessageSquare className="h-6 w-6 text-orange-500" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Mulai Percakapan Langsung
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                          Tanyakan ketersediaan varian gadget, status resi, atau konsultasi servis teknisi.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender.id === session?.user?.id
                        const isVideo = isVideoMedia(msg.mediaUrl, msg.mediaType, msg.messageType)
                        const isImage = isImageMedia(msg.mediaUrl, msg.mediaType, msg.messageType)
                        const isMedia = isVideo || isImage

                        const formattedTime = new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            {isMedia ? (
                              /* Full-Bleed Modern Media Bubble (Apple/Telegram Style) */
                              <div className="relative group max-w-[85%] sm:max-w-[70%] rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800 bg-black">
                                {isVideo ? (
                                  <div className="relative">
                                    <video
                                      src={msg.mediaUrl!}
                                      controls
                                      controlsList="nofullscreen nodownload noremoteplayback noplaybackrate"
                                      disablePictureInPicture
                                      disableRemotePlayback
                                      playsInline
                                      preload="metadata"
                                      className="max-h-[300px] sm:max-h-[360px] w-full max-w-[280px] sm:max-w-[340px] rounded-2xl object-cover bg-black block clean-video-player"
                                    />
                                    {/* Floating Theater Mode Button */}
                                    <button
                                      type="button"
                                      onClick={() => setFullscreenMedia({ url: msg.mediaUrl!, type: 'video' })}
                                      title="Perbesar Layar Penuh"
                                      className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all hover:scale-105 shadow-xs cursor-pointer"
                                    >
                                      <Maximize2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => setFullscreenMedia({ url: msg.mediaUrl!, type: 'image' })}
                                    className="relative cursor-pointer"
                                  >
                                    <img
                                      src={msg.mediaUrl!}
                                      alt="Foto Lampiran"
                                      className="max-h-[280px] sm:max-h-[340px] max-w-[280px] sm:max-w-[340px] rounded-2xl object-cover block group-hover:scale-102 transition-transform duration-200"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md">
                                        <ZoomIn className="h-4 w-4" />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Floating Glassmorphic Timestamp Pill */}
                                <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-medium text-white/95 backdrop-blur-md shadow-xs">
                                  <span>{formattedTime}</span>
                                  {isMe && <CheckCheck className="h-3 w-3 text-blue-400 inline" />}
                                </div>
                              </div>
                            ) : (
                              /* Standard Text Bubble */
                              <div
                                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl text-xs px-4 py-2.5 shadow-2xs ${
                                  isMe
                                    ? 'bg-slate-950 text-white dark:bg-blue-600 rounded-tr-xs'
                                    : 'bg-white text-slate-900 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-tl-xs'
                                }`}
                              >
                                {!isMe && (
                                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                    {msg.sender.role === 'ADMIN' || msg.sender.role === 'SUPER_ADMIN' || msg.sender.role === 'STORE_ADMIN'
                                      ? 'Admin Toko'
                                      : msg.sender.name || 'CS Toko'}
                                  </p>
                                )}

                                {(() => {
                                  const contentTrimmed = msg.content?.trim() || ''
                                  const isOrder =
                                    msg.messageType === 'order' ||
                                    (contentTrimmed.startsWith('{') && contentTrimmed.includes('"orderNumber"'))
                                  const isProduct =
                                    msg.messageType === 'product' ||
                                    (contentTrimmed.startsWith('{') && contentTrimmed.includes('"name"') && contentTrimmed.includes('"price"'))

                                  if (isOrder) {
                                    try {
                                      const orderData = JSON.parse(msg.content)
                                      return (
                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white max-w-sm space-y-2.5">
                                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                              <span className="font-mono text-xs font-bold truncate">#{orderData.orderNumber}</span>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                              {orderData.status || 'Pesanan'}
                                            </span>
                                          </div>

                                          {orderData.items && orderData.items.length > 0 && (
                                            <div className="space-y-2">
                                              {orderData.items.map((it: any, idx: number) => {
                                                const name = it.product?.name || it.rentalItem?.name || it.service?.name || it.name || 'Unit Gadget'
                                                const img = it.product?.images?.[0] || it.rentalItem?.images?.[0] || it.image
                                                return (
                                                  <div key={idx} className="flex items-center gap-2.5">
                                                    {img && (
                                                      <img src={img} alt="" className="h-10 w-10 rounded-xl object-contain bg-slate-50 border p-1 shrink-0" />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                      <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">{name}</p>
                                                      <p className="text-[10px] text-slate-400 font-mono">
                                                        {it.quantity || 1}x • Rp {(it.price || 0).toLocaleString('id-ID')}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}

                                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                                            <span className="text-slate-500 text-[11px]">Total Pesanan:</span>
                                            <span className="font-black font-mono text-orange-600 dark:text-orange-400 text-xs sm:text-sm">
                                              Rp {orderData.total?.toLocaleString('id-ID')}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    } catch {
                                      return (
                                        <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-[13px]">
                                          {msg.content}
                                        </p>
                                      )
                                    }
                                  }

                                  if (isProduct) {
                                    try {
                                      const p = JSON.parse(msg.content)
                                      return (
                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white max-w-xs space-y-2.5">
                                          <div className="flex gap-3">
                                            {p.image ? (
                                              <img
                                                src={p.image}
                                                alt={p.name}
                                                className="h-12 w-12 rounded-xl object-contain bg-slate-50 border p-1 shrink-0"
                                              />
                                            ) : (
                                              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <Package className="h-5 w-5 text-slate-400" />
                                              </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                              {p.brand && (
                                                <span className="text-[9.5px] font-black uppercase text-orange-600 dark:text-orange-400">
                                                  {p.brand}
                                                </span>
                                              )}
                                              <p className="truncate text-xs font-bold">{p.name}</p>
                                              <p className="mt-0.5 text-xs sm:text-sm font-black font-mono text-orange-600 dark:text-orange-400">
                                                Rp {p.price?.toLocaleString('id-ID')}
                                              </p>
                                              {p.stock !== undefined && (
                                                <p className="text-[10px] text-slate-400">Stok Toko: {p.stock} Unit</p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-[10px]">
                                            <span className="font-semibold text-orange-600 flex items-center gap-1">
                                              <Package className="h-3 w-3" /> Rekomendasi Unit Toko
                                            </span>
                                            {p.id && (
                                              <a
                                                href={`/gadget/${p.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                              >
                                                Lihat <ExternalLink className="h-2.5 w-2.5" />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    } catch {
                                      return (
                                        <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-[13px]">
                                          {msg.content}
                                        </p>
                                      )
                                    }
                                  }

                                  return (
                                    <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-[13px]">
                                      {msg.content}
                                    </p>
                                  )
                                })()}

                                <div
                                  className={`mt-1.5 flex items-center justify-end gap-1 text-[9.5px] font-medium ${
                                    isMe ? 'text-slate-400 dark:text-blue-200' : 'text-slate-400'
                                  }`}
                                >
                                  <span>{formattedTime}</span>
                                  {isMe && <CheckCheck className="h-3 w-3 text-blue-400 inline" />}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Bottom Message Input Bar */}
                  <div className="shrink-0 border-t border-slate-200/80 bg-white p-3 sm:p-3.5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingMedia}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
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
                            handleSendMessage()
                          }
                        }}
                        placeholder="Ketik pesan ke admin toko..."
                        className="flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || sending}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-xs hover:bg-slate-800 active:scale-95 disabled:opacity-40 transition dark:bg-white dark:text-slate-950"
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
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-2xs border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 mb-3">
                    <MessageSquare className="h-7 w-7 text-orange-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pilih Percakapan Toko
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    Pilih percakapan dari daftar di sebelah kiri untuk mulai berkirim pesan dengan toko.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
