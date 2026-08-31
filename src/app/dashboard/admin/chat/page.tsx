'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Search,
  Send,
  ShoppingBag,
  Package,
  Check,
  CheckCheck,
  X,
  ChevronLeft,
  Loader2,
  RotateCcw,
  Wrench,
  Users,
  Star,
  Hammer,
  Phone,
  Store,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  ZoomIn,
  Maximize2,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'
import { DateSeparator } from '@/components/chat/date-separator'
import { isSameDay } from '@/utils/chat-helpers'

interface ChatRoom {
  id: string
  customerId: string
  orderId: string | null
  claimedById: string | null
  claimedAt: string | null
  lastMessageAt: string
  customer: {
    id: string
    name: string | null
    email: string
    image: string | null
    phone: string | null
  }
  claimedBy: {
    id: string
    name: string | null
    image: string | null
  } | null
  order: {
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt?: string
    store?: {
      id: string
      name: string
      companyName?: string
      city?: string
    } | null
    items: Array<{
      type?: string
      quantity: number
      product?: { name: string } | null
      rentalItem?: { name: string } | null
      service?: { name: string } | null
      price?: number
    }>
  } | null
  messages: Array<{
    content: string
    createdAt: string
    senderId: string
    messageType?: string
  }>
  _count?: {
    messages: number
  }
}

interface Message {
  id: string
  roomId: string
  senderId: string
  content: string
  messageType: string
  attachmentId: string | null
  mediaUrl: string | null
  mediaType: string | null
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string | null
    image: string | null
    role: string
  }
}

interface CatalogItem {
  id: string
  name: string
  brand?: string | null
  model?: string | null
  category?: string
  price: number
  originalPrice?: number | null
  stock?: number
  images: string[]
  type: string
  storeName?: string
  storeCity?: string
}

interface OrderReference {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items?: Array<{
    name?: string
    qty?: number
    quantity?: number
    product?: { name: string } | null
    rentalItem?: { name: string } | null
    service?: { name: string } | null
    price: number
  }>
}

interface TechnicianItem {
  id: string
  user: {
    id: string
    name: string
    phone: string
    avatar?: string
  }
  skills: string[]
  rating: number
  completedJobs: number
}

interface MitraItem {
  id: string
  user: {
    id: string
    name: string
    phone: string
    avatar?: string
  }
  businessName: string
  serviceType: string
  rating: number
  city: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Belum Bayar', color: 'bg-amber-50 text-amber-700' },
  PAID: { label: 'Dibayar', color: 'bg-blue-50 text-blue-700' },
  PROCESSING: { label: 'Diproses', color: 'bg-purple-50 text-purple-700' },
  SHIPPED: { label: 'Dikirim', color: 'bg-indigo-50 text-indigo-700' },
  DELIVERED: { label: 'Terkirim', color: 'bg-teal-50 text-teal-700' },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-rose-50 text-rose-700' },
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

export default function AdminChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'UNREAD' | 'ORDER'>('ALL')
  const [stats, setStats] = useState({ totalRooms: 0, unreadRooms: 0 })
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)

  // Catalog Modal States
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogTab, setCatalogTab] = useState<'sparepart' | 'sewa' | 'teknisi' | 'mitra'>('sparepart')

  // Order Modal States
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')

  // Technician & Mitra States
  const [technicianItems, setTechnicianItems] = useState<TechnicianItem[]>([])
  const [mitraItems, setMitraItems] = useState<MitraItem[]>([])
  const [, setPeopleLoading] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesPollingRef = useRef<NodeJS.Timeout | null>(null)
  const roomsPollingRef = useRef<NodeJS.Timeout | null>(null)
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

  // Auto scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Fetch all chat rooms
  const fetchRooms = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true)
      const res = await fetch('/api/admin/chat/rooms')
      if (!res.ok) throw new Error('Failed to fetch rooms')
      const data = await res.json()

      const rawRooms: ChatRoom[] = data.rooms || []
      // Clear unread count for currently active room so badge stays cleared while room is open
      const mappedRooms = rawRooms.map((r) =>
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
      const unreadCount = mappedRooms.filter((r) => (r._count?.messages || 0) > 0).length
      setStats({
        totalRooms: data.stats?.totalRooms ?? mappedRooms.length,
        unreadRooms: unreadCount,
      })

      // Auto select first room if none selected on desktop (keep reference to avoid re-triggering effects)
      setSelectedRoom((curr) => {
        if (curr) {
          return curr
        }
        if (typeof window !== 'undefined' && window.innerWidth >= 1024 && mappedRooms.length > 0) {
          return mappedRooms[0]
        }
        return null
      })
    } catch (error) {
      if (!isPolling) {
        console.error('Error fetching rooms:', error)
        toast.error('Gagal memuat daftar pesan')
      }
    } finally {
      if (!isPolling) setLoading(false)
    }
  }, [])

  // Initial rooms fetch
  useEffect(() => {
    fetchRooms(false)
  }, [fetchRooms])

  // Background rooms polling every 3.5s for live conversation updates
  useEffect(() => {
    roomsPollingRef.current = setInterval(() => {
      fetchRooms(true)
    }, 3500)
    return () => {
      if (roomsPollingRef.current) clearInterval(roomsPollingRef.current)
    }
  }, [fetchRooms])

  // Fetch messages for selected room
  const fetchMessages = useCallback(async (roomId: string, isPolling = false) => {
    try {
      const res = await fetch(`/api/admin/chat/rooms/${roomId}/messages`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      const data = await res.json()
      
      setMessages((prev) => {
        const newMsgs = data.messages || []
        if (prev.length !== newMsgs.length) return newMsgs
        const hasDiff = newMsgs.some(
          (m: any, idx: number) =>
            m.id !== prev[idx]?.id ||
            m.content !== prev[idx]?.content ||
            m.isRead !== prev[idx]?.isRead
        )
        return hasDiff ? newMsgs : prev
      })
    } catch (error) {
      if (!isPolling) {
        console.error('Error fetching messages:', error)
      }
    } finally {
      if (!isPolling) setMessagesLoading(false)
    }
  }, [])

  // Fetch messages on selected room change
  useEffect(() => {
    if (selectedRoom?.id) {
      setMessagesLoading(true)
      fetchMessages(selectedRoom.id, false)
    } else {
      setMessages([])
      setMessagesLoading(false)
    }
  }, [selectedRoom?.id, fetchMessages])

  // Real-time live polling for messages (every 1.5s)
  useEffect(() => {
    if (selectedRoom?.id) {
      messagesPollingRef.current = setInterval(() => {
        if (selectedRoomRef.current?.id) {
          fetchMessages(selectedRoomRef.current.id, true)
        }
      }, 1500)
    }
    return () => {
      if (messagesPollingRef.current) clearInterval(messagesPollingRef.current)
    }
  }, [selectedRoom?.id, fetchMessages])

  // Select a room
  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room)
    setShowChatOnMobile(true)
    // Instantly clear unread badge in state
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, _count: { messages: 0 } } : r))
    )
    if (room._count?.messages && room._count.messages > 0) {
      setStats((prev) => ({
        ...prev,
        unreadRooms: Math.max(0, prev.unreadRooms - 1),
      }))
    }
    fetchMessages(room.id)
  }

  // Back to room list on mobile
  const handleBackToList = () => {
    setShowChatOnMobile(false)
  }

  // Send message with optimistic update
  const handleSendMessage = async (
    type: string = 'text',
    attachmentId: string | null = null,
    extraData: any = null
  ) => {
    if (!selectedRoom) return
    if (type === 'text' && !messageInput.trim()) return

    const contentToSend = type !== 'text' && extraData ? JSON.stringify(extraData) : messageInput.trim()
    if (type === 'text') setMessageInput('')
    setSending(true)

    // Optimistic message
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      roomId: selectedRoom.id,
      senderId: 'me',
      content: contentToSend,
      messageType: type,
      attachmentId,
      mediaUrl: null,
      mediaType: null,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: 'me',
        name: 'Admin',
        image: null,
        role: 'STORE_ADMIN',
      },
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const res = await fetch(
        `/api/admin/chat/rooms/${selectedRoom.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: contentToSend,
            messageType: type,
            attachmentId,
          }),
        }
      )

      if (!res.ok) throw new Error('Failed to send message')
      const data = await res.json()

      // Replace optimistic message with actual
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? data.message : m))
      )
      fetchRooms(true)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Gagal mengirim pesan')
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      if (type === 'text') setMessageInput(contentToSend)
    } finally {
      setSending(false)
      setShowCatalogModal(false)
      setShowOrderModal(false)
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
    const defaultContent = isVideo ? '🎥 Video' : '📷 Foto'

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

      const res = await fetch(
        `/api/admin/chat/rooms/${selectedRoom.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: defaultContent,
            messageType,
            mediaUrl: uploadData.url,
            mediaType: file.type,
          }),
        }
      )

      if (!res.ok) throw new Error('Gagal mengirim media')
      const data = await res.json()

      setMessages((prev) => [...prev, data.message])
      scrollToBottom()
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

  // Fetch catalog items for recommendation
  const fetchCatalogItems = async (search: string = '') => {
    try {
      setCatalogLoading(true)
      const storeId = selectedRoom?.order?.store?.id || ''
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (storeId) params.append('storeId', storeId)
      params.append('limit', '100')

      const res = await fetch(`/api/admin/chat/catalog?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch catalog')
      const data = await res.json()
      setCatalogItems(data.items || data.products || [])
    } catch (error) {
      console.error('Error fetching catalog:', error)
      toast.error('Gagal memuat katalog produk')
    } finally {
      setCatalogLoading(false)
    }
  }

  // Fetch orders for customer
  const fetchCustomerOrders = async (customerId?: string, search: string = '') => {
    try {
      setOrderLoading(true)
      const params = new URLSearchParams()
      if (customerId) params.append('customerId', customerId)
      if (search) params.append('search', search)

      const res = await fetch(`/api/admin/chat/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrderItems(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Gagal memuat daftar pesanan')
    } finally {
      setOrderLoading(false)
    }
  }

  // Fetch technicians & partners
  const fetchPeople = async (search: string = '') => {
    try {
      setPeopleLoading(true)
      const res = await fetch(
        `/api/admin/chat/people?search=${encodeURIComponent(search)}`
      )
      if (!res.ok) throw new Error('Failed to fetch people')
      const data = await res.json()
      setTechnicianItems(data.technicians || [])
      setMitraItems(data.mitras || [])
    } catch (error) {
      console.error('Error fetching people:', error)
    } finally {
      setPeopleLoading(false)
    }
  }

  const openCatalogModal = () => {
    setShowCatalogModal(true)
    fetchCatalogItems()
    fetchPeople()
  }

  const openOrderModal = () => {
    setShowOrderModal(true)
    fetchCustomerOrders(selectedRoom?.customerId)
  }

  // Format time
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

  // Format message preview
  const formatMessagePreview = (message?: {
    content: string
    messageType?: string
  }) => {
    if (!message) return 'Belum ada pesan'
    switch (message.messageType) {
      case 'product':
        return '📦 Rekomendasi Gadget'
      case 'rental':
        return '🔄 Rekomendasi Sewa'
      case 'service':
        return '🔧 Rekomendasi Servis'
      case 'technician':
        return '👨‍🔧 Kontak Teknisi'
      case 'mitra':
        return '🏢 Rekomendasi Mitra'
      case 'order':
        return '📋 Rincian Pesanan'
      case 'image':
        return '📷 Lampiran Foto'
      case 'video':
        return '🎥 Lampiran Video'
      default:
        if (isVideoMedia(message.content, undefined, message.messageType)) return '🎥 Lampiran Video'
        if (isImageMedia(message.content, undefined, message.messageType)) return '📷 Lampiran Foto'
        if (
          message.content?.trim().startsWith('{') &&
          message.content.includes('"name"') &&
          message.content.includes('"price"')
        ) {
          return '📦 Rekomendasi Gadget'
        }
        if (
          message.content?.trim().startsWith('{') &&
          message.content.includes('"orderNumber"')
        ) {
          return '📋 Rincian Pesanan'
        }
        return message.content
    }
  }

  // Render message content for text/catalog/order
  const renderMessageContent = (message: Message, isAdmin: boolean) => {
    const contentTrimmed = message.content?.trim() || ''
    const isOrder =
      message.messageType === 'order' ||
      (contentTrimmed.startsWith('{') && contentTrimmed.includes('"orderNumber"'))
    const isProduct =
      message.messageType === 'product' ||
      message.messageType === 'rental' ||
      (contentTrimmed.startsWith('{') && contentTrimmed.includes('"name"') && contentTrimmed.includes('"price"'))

    if (isProduct) {
      try {
        const data = JSON.parse(message.content)
        return (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white max-w-xs space-y-2">
            <div className="flex gap-3">
              {data.image ? (
                <img
                  src={data.image}
                  alt={data.name}
                  className="h-12 w-12 rounded-xl object-contain bg-slate-50 border p-1 shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-slate-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {data.brand && (
                  <span className="text-[9.5px] font-black uppercase text-orange-600 dark:text-orange-400">
                    {data.brand}
                  </span>
                )}
                <p className="truncate text-xs font-bold">{data.name}</p>
                <p className="mt-0.5 text-xs font-black font-mono text-orange-600 dark:text-orange-400">
                  Rp {data.price?.toLocaleString('id-ID')}
                </p>
                {data.stock !== undefined && (
                  <p className="text-[10px] text-slate-400">Stok Cabang: {data.stock} Unit</p>
                )}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-[10px] font-semibold text-slate-500">
              <Package className="h-3 w-3 text-orange-500" />
              <span>Rekomendasi Unit Toko</span>
            </div>
          </div>
        )
      } catch {
        return <p className="text-xs text-slate-400">Rekomendasi Produk</p>
      }
    }

    if (isOrder) {
      try {
        const data = JSON.parse(message.content)
        return (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white max-w-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-mono text-xs font-bold truncate">#{data.orderNumber}</span>
              </div>
              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                {data.status || 'Pesanan'}
              </span>
            </div>

            {data.items && data.items.length > 0 && (
              <div className="space-y-2">
                {data.items.map((it: any, idx: number) => {
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
                Rp {data.total?.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )
      } catch {
        return <p className="text-xs text-slate-400">Info Pesanan</p>
      }
    }

    return (
      <p className="whitespace-pre-wrap text-xs sm:text-[13px] leading-relaxed">
        {message.content}
      </p>
    )
  }

  // Filtered rooms based on search and status
  const filteredRooms = rooms.filter((room) => {
    const matchSearch =
      searchQuery === '' ||
      (room.customer.name &&
        room.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (room.customer.phone && room.customer.phone.includes(searchQuery)) ||
      (room.order &&
        room.order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchSearch) return false

    if (roomFilter === 'UNREAD') {
      return (room._count?.messages || 0) > 0
    }
    if (roomFilter === 'ORDER') {
      return !!room.order
    }
    return true
  })

  return (
    <div className="w-full h-full max-h-full flex flex-col font-sans">
      
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

      {/* Single-Surface Unified Bento Chat Hub Container */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden h-full flex-1 max-h-full min-h-0 grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Pane: Integrated Control & Customer Chat Rooms List (4 Cols) */}
        <div
          className={`lg:col-span-4 xl:col-span-4 border-r border-slate-100 dark:border-slate-800 flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-slate-900 ${
            showChatOnMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Integrated Sidebar Header */}
          <div className="p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            {/* Search Capsule */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari customer, no. order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl dark:bg-slate-800/80">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'UNREAD', label: `Belum Dibaca (${stats.unreadRooms})` },
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

          {/* Rooms Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <p className="text-xs font-medium">Memuat percakapan...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum ada percakapan</p>
                <p className="text-[11px] text-slate-400">Pesan dari customer toko akan otomatis masuk ke panel ini.</p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id
                const customerName = room.customer.name || room.customer.email.split('@')[0]
                const status = room.order ? statusConfig[room.order.status] : null
                const unreadCount = room._count?.messages || 0

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
                    {/* Minimalist Left Accent Pill */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-slate-950 dark:bg-orange-500" />
                    )}

                    {/* Customer Avatar */}
                    <div className="relative shrink-0">
                      {room.customer.image ? (
                        <img
                          src={room.customer.image}
                          alt={customerName}
                          className="h-10 w-10 rounded-2xl object-cover border border-slate-200/60 shadow-2xs"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 font-bold text-xs dark:bg-slate-800 dark:text-white border border-slate-200/60 dark:border-slate-700">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white shadow-2xs">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {customerName}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {formatTime(room.lastMessageAt)}
                        </span>
                      </div>

                      {/* Order Tag */}
                      {room.order && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                          <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                            #{room.order.orderNumber}
                          </span>
                          {status && (
                            <span className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.2 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                              {status.label}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Message Preview */}
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate font-normal">
                        {formatMessagePreview(room.messages[0])}
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
              {/* Active Room Header */}
              <div className="shrink-0 p-3 sm:p-3.5 border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={handleBackToList}
                    className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="relative shrink-0">
                    {selectedRoom.customer.image ? (
                      <img
                        src={selectedRoom.customer.image}
                        alt=""
                        className="h-10 w-10 rounded-2xl object-cover border border-slate-200/60 shadow-2xs"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 font-bold text-xs dark:bg-slate-800 dark:text-white border border-slate-200/60 dark:border-slate-700">
                        {(selectedRoom.customer.name || selectedRoom.customer.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                        {selectedRoom.customer.name || selectedRoom.customer.email}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Customer
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {selectedRoom.customer.phone || selectedRoom.customer.email}
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
                    <span className="text-slate-400 hidden sm:inline">•</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium hidden sm:inline">
                      Rp {selectedRoom.order.total.toLocaleString('id-ID')}
                    </span>
                    {statusConfig[selectedRoom.order.status] && (
                      <span className="rounded bg-blue-100/80 dark:bg-blue-900/60 px-1.5 py-0.2 text-[9.5px] font-bold text-blue-800 dark:text-blue-300">
                        {statusConfig[selectedRoom.order.status].label}
                      </span>
                    )}
                  </div>

                  <a
                    href={`/dashboard/admin/orders?search=${selectedRoom.order.orderNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 text-[11px] shrink-0 transition hover:underline"
                  >
                    <span>Lihat Rincian</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Chat Canvas (Messages Bubble Area) */}
              <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
                {messagesLoading && messages.length === 0 ? (
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
                      Balas pertanyaan customer atau kirimkan rekomendasi gadget cabang.
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const currentDate = new Date(message.createdAt)
                    const previousDate = index > 0 ? new Date(messages[index - 1].createdAt) : null
                    const showDateSeparator = !previousDate || !isSameDay(currentDate, previousDate)
                    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STORE_ADMIN'].includes(message.sender.role) || message.senderId === 'me'
                    const isVideo = isVideoMedia(message.mediaUrl, message.mediaType, message.messageType)
                    const isImage = isImageMedia(message.mediaUrl, message.mediaType, message.messageType)
                    const isMedia = isVideo || isImage

                    const formattedTime = new Date(message.createdAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && <DateSeparator date={currentDate} />}

                        <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          {isMedia ? (
                            /* Full-Bleed Modern Media Bubble (Apple/Telegram Style) */
                            <div className="relative group max-w-[85%] sm:max-w-[70%] rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800 bg-black">
                              {isVideo ? (
                                <div className="relative">
                                  <video
                                    src={message.mediaUrl!}
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
                                    onClick={() => setFullscreenMedia({ url: message.mediaUrl!, type: 'video' })}
                                    title="Perbesar Layar Penuh"
                                    className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all hover:scale-105 shadow-xs cursor-pointer"
                                  >
                                    <Maximize2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => setFullscreenMedia({ url: message.mediaUrl!, type: 'image' })}
                                  className="relative cursor-pointer"
                                >
                                  <img
                                    src={message.mediaUrl!}
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
                                {isAdmin && (
                                  <span>
                                    {message.isRead ? (
                                      <CheckCheck className="h-3 w-3 text-blue-400 inline" />
                                    ) : (
                                      <Check className="h-3 w-3 text-slate-300 inline" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Standard Text / Card Bubble */
                            <div
                              className={`max-w-[80%] sm:max-w-[70%] rounded-2xl text-xs px-4 py-2.5 shadow-2xs ${
                                isAdmin
                                  ? 'bg-slate-950 text-white dark:bg-blue-600 rounded-tr-xs'
                                  : 'bg-white text-slate-900 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-tl-xs'
                              }`}
                            >
                              {!isAdmin && (
                                <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                  {message.sender.name || 'Customer'}
                                </p>
                              )}

                              {renderMessageContent(message, isAdmin)}

                              {/* Timestamp & Read Status */}
                              <div
                                className={`mt-1.5 flex items-center justify-end gap-1 text-[9.5px] font-medium ${
                                  isAdmin ? 'text-slate-400 dark:text-blue-200' : 'text-slate-400'
                                }`}
                              >
                                <span>{formattedTime}</span>
                                {isAdmin && (
                                  <span>
                                    {message.isRead ? (
                                      <CheckCheck className="h-3 w-3 text-blue-400 inline" />
                                    ) : (
                                      <Check className="h-3 w-3 text-slate-400 inline" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    )
                  })
                )}
              </div>

              {/* Bottom Message Input Bar */}
              <div className="shrink-0 border-t border-slate-200/80 bg-white p-3 sm:p-3.5 dark:border-slate-800 dark:bg-slate-900 space-y-2">
                
                {/* Action Shortcuts */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={openCatalogModal}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Package className="h-3 w-3 text-orange-500" />
                    <span>Rekomendasikan Gadget</span>
                  </button>

                  <button
                    onClick={openOrderModal}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <ShoppingBag className="h-3 w-3 text-blue-500" />
                    <span>Bagikan Order</span>
                  </button>
                </div>

                {/* Input & Send Button */}
                <div className="flex items-center gap-2">
                  {/* Hidden File Input for Photo & Video Upload */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    className="hidden"
                  />

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
                        handleSendMessage('text')
                      }
                    }}
                    placeholder="Tulis balasan untuk customer..."
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <button
                    onClick={() => handleSendMessage('text')}
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
                Pilih Percakapan Customer
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Pilih percakapan dari daftar di sebelah kiri untuk mulai merespon customer toko.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 3. Catalog Recommendation Modal (Portal-based Bento Card) */}
      {mounted && showCatalogModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Katalog & Rekomendasi Unit Toko
                  </h3>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                    {catalogItems.length} Produk
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih gadget dari inventori toko untuk dibagikan langsung ke customer
                </p>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari merek, model gadget (misal: iPhone 15, Galaxy S24)..."
                  value={catalogSearch}
                  onChange={(e) => {
                    setCatalogSearch(e.target.value)
                    fetchCatalogItems(e.target.value)
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                />
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[240px] max-h-[420px]">
              {catalogLoading ? (
                <div className="py-16 text-center">
                  <Loader2 className="h-7 w-7 animate-spin mx-auto text-orange-500" />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Memuat katalog produk toko...</p>
                </div>
              ) : catalogItems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto mb-2 text-slate-400">
                    <Package className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada produk ditemukan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Coba gunakan kata kunci pencarian merek atau model lain</p>
                </div>
              ) : (
                catalogItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 transition-all gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 p-1.5 flex items-center justify-center">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {item.brand && (
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            {item.brand}
                          </span>
                        )}
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="font-mono text-xs sm:text-sm font-black text-orange-600 dark:text-orange-400">
                            Rp {item.price?.toLocaleString('id-ID')}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            <span className={`h-1.5 w-1.5 rounded-full ${(item.stock ?? 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            Stok: {item.stock ?? 0} Unit
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleSendMessage('product', null, {
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.images?.[0],
                          stock: item.stock ?? 0,
                          brand: item.brand,
                        })
                        setShowCatalogModal(false)
                      }}
                      className="shrink-0 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer dark:bg-white dark:text-slate-950"
                    >
                      Kirim
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Order Recommendation Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Bagikan Pesanan Terkait</h3>
                <p className="text-xs text-slate-400">Kirim referensi status pesanan ke percakapan</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-4 space-y-2">
              {orderLoading ? (
                <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" /></div>
              ) : orderItems.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">Tidak ada pesanan ditemukan</p>
              ) : (
                orderItems.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900">#{ord.orderNumber}</span>
                      <p className="text-xs font-bold text-slate-600">Total: Rp {ord.total?.toLocaleString('id-ID')}</p>
                    </div>
                    <button
                      onClick={() => handleSendMessage('order', null, {
                        orderNumber: ord.orderNumber,
                        total: ord.total,
                        status: ord.status,
                        items: ord.items,
                      })}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Bagikan
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
