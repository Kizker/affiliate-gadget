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
  PENDING_PAYMENT: {
    label: 'Belum Bayar',
    color: 'bg-amber-50 text-amber-700',
  },
  PAID: { label: 'Dibayar', color: 'bg-blue-50 text-blue-700' },
  PROCESSING: { label: 'Diproses', color: 'bg-purple-50 text-purple-700' },
  SHIPPED: { label: 'Dikirim', color: 'bg-indigo-50 text-indigo-700' },
  DELIVERED: { label: 'Terkirim', color: 'bg-teal-50 text-teal-700' },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-rose-50 text-rose-700' },
}

const isVideoMedia = (
  url?: string | null,
  mediaType?: string | null,
  messageType?: string | null
) => {
  if (messageType === 'video') return true
  if (mediaType?.startsWith('video/')) return true
  if (url && /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(url)) return true
  return false
}

const isImageMedia = (
  url?: string | null,
  mediaType?: string | null,
  messageType?: string | null
) => {
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
  const [fullscreenMedia, setFullscreenMedia] = useState<{
    url: string
    type: 'image' | 'video'
  } | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'UNREAD' | 'ORDER'>(
    'ALL'
  )
  const [stats, setStats] = useState({ totalRooms: 0, unreadRooms: 0 })
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)

  // Catalog Modal States
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogTab, setCatalogTab] = useState<
    'sparepart' | 'sewa' | 'teknisi' | 'mitra'
  >('sparepart')

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
        selectedRoomRef.current?.id === r.id
          ? { ...r, _count: { messages: 0 } }
          : r
      )

      setRooms((prev) => {
        if (prev.length !== mappedRooms.length) return mappedRooms
        const hasDiff = mappedRooms.some((r, i) => {
          const p = prev[i]
          return (
            !p ||
            r.id !== p.id ||
            r.lastMessageAt !== p.lastMessageAt ||
            (r._count?.messages || 0) !== (p._count?.messages || 0)
          )
        })
        return hasDiff ? mappedRooms : prev
      })
      const unreadCount = mappedRooms.filter(
        (r) => (r._count?.messages || 0) > 0
      ).length
      setStats({
        totalRooms: data.stats?.totalRooms ?? mappedRooms.length,
        unreadRooms: unreadCount,
      })

      // Auto select first room if none selected on desktop (keep reference to avoid re-triggering effects)
      setSelectedRoom((curr) => {
        if (curr) {
          return curr
        }
        if (
          typeof window !== 'undefined' &&
          window.innerWidth >= 1024 &&
          mappedRooms.length > 0
        ) {
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
  const fetchMessages = useCallback(
    async (roomId: string, isPolling = false) => {
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
    },
    []
  )

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
      prev.map((r) =>
        r.id === room.id ? { ...r, _count: { messages: 0 } } : r
      )
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

    const contentToSend =
      type !== 'text' && extraData
        ? JSON.stringify(extraData)
        : messageInput.trim()
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
      toast.error(
        'Hanya file foto (JPG, PNG, WebP) dan video (MP4, WebM, MOV) yang diperbolehkan.'
      )
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
      toast.success(
        isVideo ? 'Video berhasil dikirim' : 'Foto berhasil dikirim'
      )
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
  const fetchCustomerOrders = async (
    customerId?: string,
    search: string = ''
  ) => {
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
      case 'product_reference':
      case 'product':
        return '📦 Rekomendasi Gadget'
      default:
        if (isVideoMedia(message.content, undefined, message.messageType))
          return '🎥 Lampiran Video'
        if (isImageMedia(message.content, undefined, message.messageType))
          return '📷 Lampiran Foto'
        if (
          message.messageType === 'product' ||
          message.messageType === 'product_reference' ||
          (message.content?.trim().startsWith('{') &&
            (message.content.includes('"name"') ||
              message.content.includes('"productName"')) &&
            (message.content.includes('"price"') ||
              message.content.includes('"productPrice"')))
        ) {
          return '📦 Rekomendasi Gadget'
        }
        if (
          message.messageType === 'order' ||
          (message.content?.trim().startsWith('{') &&
            message.content.includes('"orderNumber"'))
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
      (contentTrimmed.startsWith('{') &&
        contentTrimmed.includes('"orderNumber"'))
    const isProduct =
      message.messageType === 'product' ||
      message.messageType === 'product_reference' ||
      message.messageType === 'rental' ||
      (contentTrimmed.startsWith('{') &&
        (contentTrimmed.includes('"name"') ||
          contentTrimmed.includes('"productName"')) &&
        (contentTrimmed.includes('"price"') ||
          contentTrimmed.includes('"productPrice"')))

    if (isProduct) {
      try {
        const data = JSON.parse(message.content)
        const prodName = data.productName || data.name || 'Produk Gadget'
        const prodPrice =
          data.productPrice !== undefined ? data.productPrice : data.price
        const rawImage = data.productImage || data.image || null
        const prodImage = Array.isArray(rawImage)
          ? rawImage[0]
          : typeof rawImage === 'string' && rawImage.trim() !== ''
            ? rawImage
            : null
        const isReference =
          data.type === 'product_reference' ||
          message.messageType === 'product_reference'
        const prodId = data.productId || data.id

        return (
          <div className="shadow-2xs max-w-xs space-y-2.5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:max-w-sm">
            <div className="flex items-center gap-3">
              {prodImage ? (
                <img
                  src={prodImage}
                  alt={prodName}
                  className="h-14 w-14 shrink-0 rounded-xl border bg-slate-50 object-contain p-1 dark:border-slate-800 dark:bg-slate-800"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-orange-200/60 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/40">
                  <Package className="h-6 w-6 text-orange-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {data.brand && (
                  <span className="text-[9.5px] font-black uppercase text-orange-600 dark:text-orange-400">
                    {data.brand}
                  </span>
                )}
                <p className="truncate text-xs font-bold" title={prodName}>
                  {prodName}
                </p>
                {data.variantName && (
                  <p className="truncate text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                    Varian: {data.variantName}
                  </p>
                )}
                <p className="mt-0.5 font-mono text-xs font-black text-orange-600 dark:text-orange-400 sm:text-sm">
                  Rp {(Number(prodPrice) || 0).toLocaleString('id-ID')}
                </p>
                {data.stock !== undefined && (
                  <p className="text-[10px] text-slate-400">
                    Stok Cabang: {data.stock} Unit
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10.5px] font-semibold dark:border-slate-800">
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <Package className="h-3 w-3" />
                <span>
                  {isReference
                    ? 'Produk Ditanyakan Customer'
                    : 'Rekomendasi Toko'}
                </span>
              </div>
              {prodId && (
                <a
                  href={`/gadget/${prodId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Detail</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
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
          <div className="shadow-2xs max-w-sm space-y-2.5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="truncate font-mono text-xs font-bold">
                  #{data.orderNumber}
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                {data.status || 'Pesanan'}
              </span>
            </div>

            {data.items && data.items.length > 0 && (
              <div className="space-y-2">
                {data.items.map((it: any, idx: number) => {
                  const name =
                    it.product?.name ||
                    it.rentalItem?.name ||
                    it.service?.name ||
                    it.name ||
                    'Unit Gadget'
                  const img =
                    it.product?.images?.[0] ||
                    it.rentalItem?.images?.[0] ||
                    it.image
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      {img && (
                        <img
                          src={img}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-xl border bg-slate-50 object-contain p-1"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                          {name}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {it.quantity || 1}x • Rp{' '}
                          {(it.price || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
              <span className="text-[11px] text-slate-500">Total Pesanan:</span>
              <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 sm:text-sm">
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
      <p className="whitespace-pre-wrap text-xs leading-relaxed sm:text-[13px]">
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
        room.order.orderNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))

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
    <div className="flex h-full max-h-full w-full flex-col font-sans">
      {/* Luxury Fullscreen Portal Lightbox Modal (Escape stacking context & covers 100% viewport) */}
      {mounted &&
        fullscreenMedia &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex cursor-pointer select-none flex-col items-center justify-between bg-white/45 p-4 backdrop-blur-xl sm:p-6"
              onClick={() => setFullscreenMedia(null)}
            >
              {/* Top spacing spacer */}
              <div className="h-2 sm:h-4" />

              {/* Middle Main Media (Image/Video) Stage */}
              <div className="relative my-auto flex w-full flex-1 items-center justify-center px-2 sm:px-14">
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex max-h-[68vh] max-w-[90vw] cursor-default items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 shadow-2xl ring-1 ring-black/5 sm:max-h-[72vh] sm:max-w-[80vw] sm:rounded-3xl"
                  >
                    {fullscreenMedia.type === 'video' ? (
                      <video
                        src={fullscreenMedia.url}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-[68vh] w-auto max-w-full rounded-2xl bg-black object-contain shadow-2xl sm:max-h-[72vh] sm:rounded-3xl"
                      />
                    ) : (
                      <img
                        src={fullscreenMedia.url}
                        alt="Pratinjau Foto Lampiran"
                        className="max-h-[68vh] w-auto max-w-full select-none rounded-2xl object-contain sm:max-h-[72vh] sm:rounded-3xl"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Bar: Instructions / Keyboard shortcuts */}
              <div
                className="z-20 flex w-full max-w-sm cursor-default items-center justify-center gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 text-[11px] font-bold text-slate-700 shadow-lg backdrop-blur-xl">
                  <span>
                    Klik di luar area atau tekan{' '}
                    <kbd className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">
                      ESC
                    </kbd>{' '}
                    untuk menutup
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}

      {/* Single-Surface Unified Bento Chat Hub Container */}
      <div className="shadow-xs grid h-full max-h-full min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-12">
        {/* Left Pane: Integrated Control & Customer Chat Rooms List (4 Cols) */}
        <div
          className={`flex h-full min-h-0 flex-col overflow-hidden border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-4 xl:col-span-4 ${
            showChatOnMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Integrated Sidebar Header */}
          <div className="space-y-2.5 border-b border-slate-100 p-3 dark:border-slate-800 sm:p-3.5">
            {/* Search Capsule */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari customer, no. order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'UNREAD', label: `Belum Dibaca (${stats.unreadRooms})` },
                { id: 'ORDER', label: 'Pesanan' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRoomFilter(tab.id as any)}
                  className={`flex-1 rounded-lg py-1 text-center text-[11px] font-bold transition-all ${
                    roomFilter === tab.id
                      ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms Scroll Area */}
          <div className="flex-1 divide-y divide-slate-50 overflow-y-auto dark:divide-slate-800/60">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center space-y-2 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <p className="text-xs font-medium">Memuat percakapan...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-2 p-6 text-center text-slate-400">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <MessageSquare className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Belum ada percakapan
                </p>
                <p className="text-[11px] text-slate-400">
                  Pesan dari customer toko akan otomatis masuk ke panel ini.
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id
                const customerName =
                  room.customer.name || room.customer.email.split('@')[0]
                const status = room.order
                  ? statusConfig[room.order.status]
                  : null
                const unreadCount = room._count?.messages || 0

                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
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

                    {/* Customer Avatar */}
                    <div className="relative shrink-0">
                      {room.customer.image ? (
                        <img
                          src={room.customer.image}
                          alt={customerName}
                          className="shadow-2xs h-10 w-10 rounded-2xl border border-slate-200/60 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-100 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <span className="shadow-2xs absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {customerName}
                        </p>
                        <span className="shrink-0 text-[10px] font-medium text-slate-400">
                          {formatTime(room.lastMessageAt)}
                        </span>
                      </div>

                      {/* Order Tag */}
                      {room.order && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                          <span className="max-w-[130px] truncate font-mono font-semibold text-slate-500 dark:text-slate-400">
                            #{room.order.orderNumber}
                          </span>
                          {status && (
                            <span className="py-0.2 rounded bg-slate-100 px-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {status.label}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Message Preview */}
                      <p className="mt-1 truncate text-[11px] font-normal text-slate-500 dark:text-slate-400">
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
          className={`flex h-full min-h-0 flex-col overflow-hidden bg-slate-50/40 dark:bg-slate-950/40 lg:col-span-8 xl:col-span-8 ${
            !showChatOnMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {selectedRoom ? (
            <>
              {/* Active Room Header */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={handleBackToList}
                    className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="relative shrink-0">
                    {selectedRoom.customer.image ? (
                      <img
                        src={selectedRoom.customer.image}
                        alt=""
                        className="shadow-2xs h-10 w-10 rounded-2xl border border-slate-200/60 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-100 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                        {(
                          selectedRoom.customer.name ||
                          selectedRoom.customer.email
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                        {selectedRoom.customer.name ||
                          selectedRoom.customer.email}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Customer
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-400">
                      {selectedRoom.customer.phone ||
                        selectedRoom.customer.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contextual Order Banner (If order linked) */}
              {selectedRoom.order && (
                <div className="flex shrink-0 items-center justify-between border-b border-blue-100/70 bg-blue-50/50 px-4 py-2 text-xs dark:border-blue-900/30 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 truncate">
                    <Package className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span className="truncate font-mono font-bold text-blue-950 dark:text-blue-200">
                      Order #{selectedRoom.order.orderNumber}
                    </span>
                    <span className="hidden text-slate-400 sm:inline">•</span>
                    <span className="hidden font-medium text-slate-600 dark:text-slate-300 sm:inline">
                      Rp {selectedRoom.order.total.toLocaleString('id-ID')}
                    </span>
                    {statusConfig[selectedRoom.order.status] && (
                      <span className="py-0.2 rounded bg-blue-100/80 px-1.5 text-[9.5px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                        {statusConfig[selectedRoom.order.status].label}
                      </span>
                    )}
                  </div>

                  <a
                    href={`/dashboard/admin/orders?search=${selectedRoom.order.orderNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                  >
                    <span>Lihat Rincian</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Chat Canvas (Messages Bubble Area) */}
              <div
                ref={messagesContainerRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5"
              >
                {messagesLoading && messages.length === 0 ? (
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
                      Balas pertanyaan customer atau kirimkan rekomendasi gadget
                      cabang.
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const currentDate = new Date(message.createdAt)
                    const previousDate =
                      index > 0 ? new Date(messages[index - 1].createdAt) : null
                    const showDateSeparator =
                      !previousDate || !isSameDay(currentDate, previousDate)
                    const isAdmin =
                      ['ADMIN', 'SUPER_ADMIN', 'STORE_ADMIN'].includes(
                        message.sender.role
                      ) || message.senderId === 'me'
                    const isVideo = isVideoMedia(
                      message.mediaUrl,
                      message.mediaType,
                      message.messageType
                    )
                    const isImage = isImageMedia(
                      message.mediaUrl,
                      message.mediaType,
                      message.messageType
                    )
                    const isMedia = isVideo || isImage

                    const formattedTime = new Date(
                      message.createdAt
                    ).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <DateSeparator date={currentDate} />
                        )}

                        <div
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          {isMedia ? (
                            /* Full-Bleed Modern Media Bubble (Apple/Telegram Style) */
                            <div className="shadow-xs group relative max-w-[85%] overflow-hidden rounded-2xl border border-slate-200/80 bg-black dark:border-slate-800 sm:max-w-[70%]">
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
                                    className="clean-video-player block max-h-[300px] w-full max-w-[280px] rounded-2xl bg-black object-cover sm:max-h-[360px] sm:max-w-[340px]"
                                  />
                                  {/* Floating Theater Mode Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFullscreenMedia({
                                        url: message.mediaUrl!,
                                        type: 'video',
                                      })
                                    }
                                    title="Perbesar Layar Penuh"
                                    className="shadow-xs absolute right-2.5 top-2.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/85"
                                  >
                                    <Maximize2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() =>
                                    setFullscreenMedia({
                                      url: message.mediaUrl!,
                                      type: 'image',
                                    })
                                  }
                                  className="relative cursor-pointer"
                                >
                                  <img
                                    src={message.mediaUrl!}
                                    alt="Foto Lampiran"
                                    className="group-hover:scale-102 block max-h-[280px] max-w-[280px] rounded-2xl object-cover transition-transform duration-200 sm:max-h-[340px] sm:max-w-[340px]"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md">
                                      <ZoomIn className="h-4 w-4" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Floating Glassmorphic Timestamp Pill */}
                              <div className="shadow-xs pointer-events-none absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-medium text-white/95 backdrop-blur-md">
                                <span>{formattedTime}</span>
                                {isAdmin && (
                                  <span>
                                    {message.isRead ? (
                                      <CheckCheck className="inline h-3 w-3 text-blue-400" />
                                    ) : (
                                      <Check className="inline h-3 w-3 text-slate-300" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Standard Text / Card Bubble */
                            <div
                              className={`shadow-2xs max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:max-w-[70%] ${
                                isAdmin
                                  ? 'rounded-tr-xs bg-slate-950 text-white dark:bg-blue-600'
                                  : 'rounded-tl-xs border border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
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
                                  isAdmin
                                    ? 'text-slate-400 dark:text-blue-200'
                                    : 'text-slate-400'
                                }`}
                              >
                                <span>{formattedTime}</span>
                                {isAdmin && (
                                  <span>
                                    {message.isRead ? (
                                      <CheckCheck className="inline h-3 w-3 text-blue-400" />
                                    ) : (
                                      <Check className="inline h-3 w-3 text-slate-400" />
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
              <div className="shrink-0 space-y-2 border-t border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-3.5">
                {/* Action Shortcuts */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={openCatalogModal}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Package className="h-3 w-3 text-orange-500" />
                    <span>Rekomendasikan Gadget</span>
                  </button>

                  <button
                    onClick={openOrderModal}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                        handleSendMessage('text')
                      }
                    }}
                    placeholder="Tulis balasan untuk customer..."
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <button
                    onClick={() => handleSendMessage('text')}
                    disabled={!messageInput.trim() || sending}
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
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="shadow-2xs mb-3 flex h-14 w-14 items-center justify-center rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
                <MessageSquare className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pilih Percakapan Customer
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Pilih percakapan dari daftar di sebelah kiri untuk mulai
                merespon customer toko.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Catalog Recommendation Modal (Portal-based Bento Card) */}
      {mounted &&
        showCatalogModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Katalog & Rekomendasi Unit Toko
                    </h3>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                      {catalogItems.length} Produk
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Pilih gadget dari inventori toko untuk dibagikan langsung ke
                    customer
                  </p>
                </div>
                <button
                  onClick={() => setShowCatalogModal(false)}
                  className="cursor-pointer rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search Input Bar */}
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari merek, model gadget (misal: iPhone 15, Galaxy S24)..."
                    value={catalogSearch}
                    onChange={(e) => {
                      setCatalogSearch(e.target.value)
                      fetchCatalogItems(e.target.value)
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Product List */}
              <div className="max-h-[420px] min-h-[240px] flex-1 space-y-2.5 overflow-y-auto p-4">
                {catalogLoading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-orange-500" />
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Memuat katalog produk toko...
                    </p>
                  </div>
                ) : catalogItems.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                      <Package className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tidak ada produk ditemukan
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Coba gunakan kata kunci pencarian merek atau model lain
                    </p>
                  </div>
                ) : (
                  catalogItems.map((item) => (
                    <div
                      key={item.id}
                      className="shadow-2xs flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-800">
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
                          <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                            {item.name}
                          </h4>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 sm:text-sm">
                              Rp {item.price?.toLocaleString('id-ID')}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${(item.stock ?? 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              />
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
                        className="shadow-xs shrink-0 cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950"
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
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bagikan Pesanan Terkait
                </h3>
                <p className="text-xs text-slate-400">
                  Kirim referensi status pesanan ke percakapan
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto p-4">
              {orderLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : orderItems.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Tidak ada pesanan ditemukan
                </p>
              ) : (
                orderItems.map((ord) => (
                  <div
                    key={ord.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 transition hover:bg-slate-50"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        #{ord.orderNumber}
                      </span>
                      <p className="text-xs font-bold text-slate-600">
                        Total: Rp {ord.total?.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleSendMessage('order', null, {
                          orderNumber: ord.orderNumber,
                          total: ord.total,
                          status: ord.status,
                          items: ord.items,
                        })
                      }
                      className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
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
