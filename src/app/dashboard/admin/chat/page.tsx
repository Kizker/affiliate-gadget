'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Headphones,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { DateSeparator } from '@/components/chat/date-separator'
import { isSameDay } from '@/utils/chat-helpers'
import { getChatTickStatus } from '@/lib/chat-status'
import { usePageGuard } from '@/hooks/use-page-guard'

const renderAdminWhatsAppTick = (
  isRead?: boolean,
  isOnline: boolean = true,
  theme: 'dark' | 'light' | 'on-blue' = 'light'
) => {
  const tickStatus = getChatTickStatus({ isRead, isRecipientOnline: isOnline })
  const textColor =
    theme === 'on-blue'
      ? 'text-blue-200/80'
      : theme === 'dark'
        ? 'text-slate-300'
        : 'text-slate-400'

  if (tickStatus === 'READ') {
    return (
      <span title="Dibaca oleh pelanggan">
        <CheckCheck
          className={`inline h-3 w-3 ${theme === 'on-blue' ? 'text-sky-300' : 'text-blue-400'}`}
        />
      </span>
    )
  }

  if (tickStatus === 'DELIVERED') {
    return (
      <span title="Diterima pelanggan">
        <CheckCheck className={`inline h-3 w-3 ${textColor}`} />
      </span>
    )
  }

  return (
    <span title="Terkirim (Pelanggan offline)">
      <Check className={`inline h-3 w-3 ${textColor}`} />
    </span>
  )
}

interface ChatRoom {
  id: string
  customerId: string
  storeId?: string | null
  orderId: string | null
  claimedById: string | null
  claimedAt: string | null
  lastMessageAt: string
  isStoreHelpToSuperAdmin?: boolean
  isStoreAdminUser?: boolean
  customer: {
    id: string
    name: string | null
    email: string
    image: string | null
    phone: string | null
    role?: string
    store?: {
      id: string
      name: string
      city?: string
    } | null
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
  store?: {
    id: string
    name: string
    companyName?: string
    city?: string
  } | null
  hasOrder?: boolean
  totalUnread?: number
  messages: Array<{
    content: string
    createdAt: string
    senderId: string
    isRead?: boolean
    messageType?: string
    mediaUrl?: string | null
    mediaType?: string | null
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

interface PinnedOrderContext {
  messageId?: string
  orderId?: string
  orderNumber: string
  total?: number
  status?: string
  productName?: string | null
  isReturn?: boolean
  returnReason?: string | null
  returnStatus?: string | null
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
  if (url && /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(url))
    return true
  if (
    url &&
    (url.startsWith('/uploads/') || url.includes('images.unsplash.com')) &&
    !isVideoMedia(url, mediaType, messageType)
  ) {
    return true
  }
  return false
}

function AdminChatContent() {
  const searchParams = useSearchParams()
  const paramRoomId = searchParams?.get('roomId')
  const paramOrderId = searchParams?.get('orderId')
  const paramCs = searchParams?.get('cs') === 'true'

  const {
    isLoading: guardLoading,
    isAllowed,
    session,
  } = usePageGuard('/dashboard/admin/chat')
  const currentUserId = session?.user?.id
  const userRole = session?.user?.role as string | undefined
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isStoreAdmin = userRole === 'STORE_ADMIN' || userRole === 'STORE_SALES'

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
  const [roomFilter, setRoomFilter] = useState<
    'ALL' | 'UNREAD' | 'ORDER' | 'STORE_HELP' | 'CUSTOMER_CS'
  >('ALL')
  const [stats, setStats] = useState({ totalRooms: 0, unreadRooms: 0 })
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)
  const [activePinnedOrder, setActivePinnedOrder] =
    useState<PinnedOrderContext | null>(null)

  // Handler untuk membuka/membuat ruang bantuan CS Superadmin (khusus Store Admin / Sales)
  const handleOpenSuperAdminCsChat = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/customer/chat/store-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCs: true }),
      })
      if (!res.ok) throw new Error('Gagal membuka chat CS Superadmin')
      const data = await res.json()

      const csRoom: ChatRoom = {
        id: data.roomId,
        customerId: currentUserId || '',
        storeId: null,
        orderId: null,
        claimedById: data.claimedBy?.id || null,
        claimedAt: null,
        lastMessageAt: new Date().toISOString(),
        isStoreHelpToSuperAdmin: true,
        customer: {
          id: currentUserId || '',
          name: session?.user?.name || 'Admin Toko',
          email: session?.user?.email || '',
          image: session?.user?.image || null,
          phone: null,
          role: userRole,
        },
        claimedBy: data.claimedBy || null,
        order: null,
        messages: (data.messages || []).slice(-1),
        _count: { messages: 0 },
      }

      setSelectedRoom(csRoom)
      setShowChatOnMobile(true)
      setRooms((prev) => {
        const exists = prev.some((r) => r.id === csRoom.id)
        if (exists)
          return prev.map((r) => (r.id === csRoom.id ? { ...r, ...csRoom } : r))
        return [csRoom, ...prev]
      })
    } catch (err) {
      console.error('Error opening Superadmin CS chat:', err)
      toast.error('Gagal membuka ruang bantuan Superadmin')
    } finally {
      setLoading(false)
    }
  }, [currentUserId, session?.user, userRole])

  // Auto-buka CS room jika diakses via parameter ?cs=true
  useEffect(() => {
    if (paramCs && isStoreAdmin && isAllowed) {
      handleOpenSuperAdminCsChat()
    }
  }, [paramCs, isStoreAdmin, isAllowed, handleOpenSuperAdminCsChat])
  const [activeOrderContext, setActiveOrderContext] = useState<{
    orderId: string
    orderNumber: string
    status: string
    total: number
    productName: string
    productImage?: string | null
    productPrice?: number
  } | null>(null)

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
  const fetchRooms = useCallback(
    async (isPolling = false) => {
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

        // Auto select room: prioritized by paramRoomId / paramOrderId, then current or first on desktop
        setSelectedRoom((curr) => {
          if (paramRoomId || paramOrderId) {
            const match = mappedRooms.find(
              (r) =>
                (paramRoomId && r.id === paramRoomId) ||
                (paramOrderId &&
                  (r.orderId === paramOrderId || r.order?.id === paramOrderId))
            )
            if (match) return match
          }
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
    },
    [paramRoomId, paramOrderId]
  )

  // Priority auto-selection from URL parameters (e.g. from Order Detail modal "Hubungi via Chat")
  useEffect(() => {
    if ((paramRoomId || paramOrderId) && rooms.length > 0) {
      const match = rooms.find(
        (r) =>
          (paramRoomId && r.id === paramRoomId) ||
          (paramOrderId &&
            (r.orderId === paramOrderId || r.order?.id === paramOrderId))
      )
      if (match && selectedRoom?.id !== match.id) {
        setSelectedRoom(match)
        setShowChatOnMobile(true)
      }
    }
  }, [paramRoomId, paramOrderId, rooms, selectedRoom?.id])

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

  // Extract all order contexts present in this conversation
  const conversationOrderContexts = useMemo<PinnedOrderContext[]>(() => {
    if (!selectedRoom) return []
    const list: PinnedOrderContext[] = []
    const seenOrderNumbers = new Set<string>()

    // Check all messages for order context cards
    for (const msg of messages) {
      const contentTrimmed = msg.content?.trim() || ''
      const isReturn =
        msg.messageType === 'return_reference' ||
        (contentTrimmed.startsWith('{') &&
          (contentTrimmed.includes('"returnReason"') ||
            contentTrimmed.includes('"return_reference"')))
      const isOrder =
        isReturn ||
        msg.messageType === 'order' ||
        msg.messageType === 'order_reference' ||
        (contentTrimmed.startsWith('{') &&
          contentTrimmed.includes('"orderNumber"'))

      if (isOrder) {
        try {
          const data = JSON.parse(msg.content)
          const num = data.orderNumber || data.orderNum
          if (num && !seenOrderNumbers.has(num)) {
            seenOrderNumbers.add(num)
            list.push({
              messageId: msg.id,
              orderId: data.orderId || selectedRoom.order?.id,
              orderNumber: num,
              total:
                Number(data.orderTotal) ||
                Number(data.total) ||
                Number(data.productPrice) ||
                selectedRoom.order?.total ||
                0,
              status:
                data.orderStatus ||
                data.status ||
                selectedRoom.order?.status ||
                'PAID',
              productName: data.productName || null,
              isReturn,
              returnReason: data.returnReason || null,
              returnStatus: data.returnStatus || null,
            })
          }
        } catch {}
      }
    }

    // Also include selectedRoom.order if not yet in list
    if (
      selectedRoom.order &&
      !seenOrderNumbers.has(selectedRoom.order.orderNumber)
    ) {
      list.unshift({
        orderId: selectedRoom.order.id,
        orderNumber: selectedRoom.order.orderNumber,
        total: selectedRoom.order.total,
        status: selectedRoom.order.status,
      })
    }

    return list
  }, [selectedRoom, messages])

  // Track active context card on scroll (like WhatsApp pinned feature)
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || conversationOrderContexts.length === 0) {
      if (conversationOrderContexts.length > 0) {
        setActivePinnedOrder(conversationOrderContexts[0])
      } else {
        setActivePinnedOrder(null)
      }
      return
    }

    const updateActivePinnedContext = () => {
      const containerRect = container.getBoundingClientRect()
      // Threshold: around 120px from top of container viewport
      const thresholdY = containerRect.top + 120

      let currentContext = conversationOrderContexts[0]

      // Check all context messages that have rendered elements in DOM
      for (const ctx of conversationOrderContexts) {
        if (!ctx.messageId) continue
        const el = document.getElementById(`chat-context-msg-${ctx.messageId}`)
        if (el) {
          const rect = el.getBoundingClientRect()
          // If this card is at or has passed the threshold
          if (rect.top <= thresholdY) {
            currentContext = ctx
          }
        }
      }

      setActivePinnedOrder((prev: PinnedOrderContext | null) => {
        if (
          !prev ||
          prev.orderNumber !== currentContext.orderNumber ||
          prev.messageId !== currentContext.messageId
        ) {
          return currentContext
        }
        return prev
      })
    }

    container.addEventListener('scroll', updateActivePinnedContext, {
      passive: true,
    })
    updateActivePinnedContext()

    return () => {
      container.removeEventListener('scroll', updateActivePinnedContext)
    }
  }, [conversationOrderContexts])

  const handleScrollToContextMessage = (messageId?: string) => {
    if (!messageId) return
    const el = document.getElementById(`chat-context-msg-${messageId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add(
        'ring-2',
        'ring-blue-500',
        'ring-offset-2',
        'transition-all',
        'duration-300'
      )
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')
      }, 2000)
    }
  }

  // Synchronize active order context strictly when URL paramOrderId is provided
  useEffect(() => {
    if (!selectedRoom) return

    if (paramOrderId) {
      // 1. Try from selectedRoom.order
      if (
        selectedRoom.order &&
        (selectedRoom.order.id === paramOrderId ||
          selectedRoom.order.orderNumber === paramOrderId)
      ) {
        const firstItem = selectedRoom.order.items?.[0]
        const firstProduct = (firstItem as any)?.product
        setActiveOrderContext({
          orderId: selectedRoom.order.id,
          orderNumber: selectedRoom.order.orderNumber,
          status: selectedRoom.order.status,
          total: selectedRoom.order.total,
          productName:
            firstProduct?.name || (firstItem as any)?.name || 'Unit Gadget',
          productImage: firstProduct?.images?.[0] || null,
          productPrice: (firstItem as any)?.price || 0,
        })
        return
      }

      // 2. Try from conversationOrderContexts
      const match = conversationOrderContexts.find(
        (c) => c.orderId === paramOrderId || c.orderNumber === paramOrderId
      )
      if (match) {
        setActiveOrderContext({
          orderId: match.orderId || paramOrderId,
          orderNumber: match.orderNumber,
          status: match.status || 'PAID',
          total: match.total || 0,
          productName: match.productName || 'Unit Gadget',
          productImage: null,
          productPrice: match.total || 0,
        })
        return
      }

      // 3. Fallback: fetch order info if paramOrderId is present but not in selectedRoom
      fetch(`/api/admin/orders?search=${paramOrderId}`)
        .then((res) => res.json())
        .then((data) => {
          const found = data.orders?.find(
            (o: any) => o.id === paramOrderId || o.orderNumber === paramOrderId
          )
          if (found) {
            const firstItem = found.items?.[0]
            const firstProduct = (firstItem as any)?.product
            setActiveOrderContext({
              orderId: found.id,
              orderNumber: found.orderNumber,
              status: found.status,
              total: found.total,
              productName:
                firstProduct?.name || (firstItem as any)?.name || 'Unit Gadget',
              productImage: firstProduct?.images?.[0] || null,
              productPrice: (firstItem as any)?.price || 0,
            })
          }
        })
        .catch(() => {})
    } else {
      // Navbar access or standard room change without ?orderId= -> No context staged
      setActiveOrderContext(null)
    }
  }, [paramOrderId, selectedRoom, conversationOrderContexts])

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
    if (type === 'text' && !messageInput.trim() && !activeOrderContext) return

    // If activeOrderContext is present when user sends text/caption, automatically send order card with typed message as caption (note)
    if (type === 'text' && activeOrderContext) {
      const caption = messageInput.trim()
      const payload = {
        type: 'order_reference',
        orderId: activeOrderContext.orderId,
        orderNumber: activeOrderContext.orderNumber,
        status: activeOrderContext.status,
        total: activeOrderContext.total,
        productName: activeOrderContext.productName,
        productImage: activeOrderContext.productImage,
        productPrice: activeOrderContext.productPrice,
        note: caption || undefined,
      }
      setActiveOrderContext(null)
      setMessageInput('')
      if (typeof window !== 'undefined' && window.history) {
        const url = new URL(window.location.href)
        url.searchParams.delete('orderId')
        window.history.replaceState(null, '', url.toString())
      }
      return handleSendMessage('order_reference', null, payload)
    }

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
    mediaUrl?: string | null
    mediaType?: string | null
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
      case 'order_reference':
        return '📋 Rincian Pesanan'
      case 'return_reference':
        return '🔄 Pengajuan Retur'
      case 'image':
        return '📷 Lampiran Foto'
      case 'video':
        return '🎥 Lampiran Video'
      case 'product_reference':
      case 'product': {
        const trimmed = message.content?.trim() || ''
        if (trimmed.startsWith('{')) {
          try {
            const p = JSON.parse(trimmed)
            const name = p.productName || p.name
            if (name)
              return `📦 ${message.messageType === 'product_reference' ? 'Tanya' : 'Rekomendasi'}: ${name}`
          } catch {}
        }
        return message.messageType === 'product_reference'
          ? '📦 Produk Ditanyakan'
          : '📦 Rekomendasi Gadget'
      }
      default: {
        const trimmed = message.content?.trim() || ''
        if (
          message.messageType === 'product' ||
          message.messageType === 'product_reference' ||
          (trimmed.startsWith('{') &&
            (trimmed.includes('"name"') || trimmed.includes('"productName"')) &&
            (trimmed.includes('"price"') || trimmed.includes('"productPrice"')))
        ) {
          try {
            const p = JSON.parse(trimmed)
            const name = p.productName || p.name
            if (name)
              return `📦 ${p.type === 'product_reference' ? 'Tanya' : 'Rekomendasi'}: ${name}`
          } catch {}
          return '📦 Rekomendasi Gadget'
        }
        if (
          message.messageType === 'order' ||
          (trimmed.startsWith('{') && trimmed.includes('"orderNumber"'))
        ) {
          try {
            const o = JSON.parse(trimmed)
            if (o.orderNumber) return `📋 Pesanan #${o.orderNumber}`
          } catch {}
          return '📋 Rincian Pesanan'
        }
        if (
          isVideoMedia(message.mediaUrl, message.mediaType, message.messageType)
        )
          return '🎥 Lampiran Video'
        if (
          isImageMedia(message.mediaUrl, message.mediaType, message.messageType)
        )
          return '📷 Lampiran Foto'
        return message.content
      }
    }
  }

  // Render message content for text/catalog/order
  // Render message content for text/catalog/order
  const renderMessageContent = (
    message: Message,
    isAdmin: boolean,
    formattedTime?: string,
    isCustomerOnline?: boolean
  ) => {
    const contentTrimmed = message.content?.trim() || ''
    const isReturn =
      message.messageType === 'return_reference' ||
      (contentTrimmed.startsWith('{') &&
        (contentTrimmed.includes('"returnReason"') ||
          contentTrimmed.includes('"return_reference"')))
    const isOrder =
      isReturn ||
      message.messageType === 'order' ||
      message.messageType === 'order_reference' ||
      (contentTrimmed.startsWith('{') &&
        contentTrimmed.includes('"orderNumber"'))
    const isProduct =
      !isOrder &&
      (message.messageType === 'product' ||
        message.messageType === 'product_reference' ||
        message.messageType === 'rental' ||
        (contentTrimmed.startsWith('{') &&
          (contentTrimmed.includes('"name"') ||
            contentTrimmed.includes('"productName"')) &&
          (contentTrimmed.includes('"price"') ||
            contentTrimmed.includes('"productPrice"'))))

    if (isOrder) {
      try {
        const data = JSON.parse(message.content)
        const isReturnCard =
          isReturn ||
          data.type === 'return_reference' ||
          Boolean(data.returnReason)

        const orderNum = data.orderNumber || ''
        const prodName =
          data.productName ||
          data.name ||
          data.items?.[0]?.product?.name ||
          'Produk Pesanan'
        const rawPrice =
          data.productPrice ??
          data.price ??
          data.items?.[0]?.price ??
          data.total ??
          data.orderTotal ??
          0
        const prodPrice = Number(rawPrice) || 0
        const prodImage =
          data.productImage ||
          data.image ||
          data.items?.[0]?.product?.images?.[0] ||
          null
        const brand = data.brand || data.items?.[0]?.product?.brand || null
        const statusLabel = data.status || data.orderStatus || ''
        const storeName =
          data.storeName || selectedRoom?.store?.name || 'Affiliate Gadget'

        return (
          <div className="shadow-xs max-w-[85%] space-y-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:max-w-[320px]">
            {/* Top Header Info Pill */}
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 dark:border-slate-800">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  isReturnCard
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                }`}
              >
                {isReturnCard ? (
                  <RotateCcw className="h-2.5 w-2.5" />
                ) : (
                  <Package className="h-2.5 w-2.5" />
                )}
                {isReturnCard ? 'Pengajuan Retur' : 'Rincian Pesanan'}
              </span>
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <span>{formattedTime}</span>
                {isAdmin &&
                  renderAdminWhatsAppTick(
                    message.isRead,
                    isCustomerOnline,
                    'light'
                  )}
              </div>
            </div>

            {/* Main Product / Order Row */}
            <div className="flex items-center gap-2">
              {prodImage ? (
                <img
                  src={prodImage}
                  alt={prodName}
                  className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-cover p-0.5 dark:border-slate-800 dark:bg-slate-800"
                />
              ) : (
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                    isReturnCard
                      ? 'border-purple-200/60 bg-purple-50 dark:border-purple-900/40 dark:bg-purple-950/40'
                      : 'border-blue-200/60 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/40'
                  }`}
                >
                  {isReturnCard ? (
                    <RotateCcw className="h-5 w-5 text-purple-500" />
                  ) : (
                    <Package className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                {brand && (
                  <span className="block text-[8.5px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    {brand}
                  </span>
                )}
                <p
                  className="truncate text-[11px] font-bold leading-tight text-slate-950 dark:text-white"
                  title={prodName}
                >
                  {prodName}
                </p>
                {orderNum && (
                  <p className="truncate font-mono text-[9.5px] font-bold text-blue-600 dark:text-blue-400">
                    #{orderNum}
                  </p>
                )}
                {isReturnCard && data.returnReason && (
                  <p className="truncate text-[9.5px] font-medium text-purple-600 dark:text-purple-400">
                    Kendala: {data.returnReason}
                  </p>
                )}
                {data.variantName && !orderNum && (
                  <p className="truncate text-[9.5px] font-medium text-slate-500 dark:text-slate-400">
                    Varian: {data.variantName}
                  </p>
                )}
                {prodPrice > 0 && (
                  <p className="mt-0.5 font-mono text-xs font-black text-orange-600 dark:text-orange-400">
                    Rp {prodPrice.toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>

            {/* Note ONLY if user explicitly typed a note (filter out automated greeting) */}
            {typeof data.note === 'string' &&
              data.note.trim() !== '' &&
              !data.note.includes('ingin mengonfirmasi pesanan') && (
                <div className="mt-1 rounded-xl border border-slate-100 bg-slate-50/90 p-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {data.note}
                  </p>
                </div>
              )}

            {/* Footer CTA */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 dark:border-slate-800">
              <span className="max-w-[160px] truncate text-[9.5px] text-slate-400">
                {isReturnCard
                  ? data.returnStatus === 'APPROVED'
                    ? 'Disetujui'
                    : data.returnStatus === 'REJECTED'
                      ? 'Ditolak'
                      : 'Menunggu Verifikasi Toko'
                  : storeName}
              </span>
              {(data.orderId || orderNum) && (
                <a
                  href={`/dashboard/admin/orders?search=${orderNum || data.orderId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shadow-2xs inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  <span>Lihat Pesanan</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
        )
      } catch {
        return <p className="text-xs text-slate-400">Info Pesanan</p>
      }
    }

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
          <div className="shadow-xs max-w-[85%] space-y-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:max-w-[320px]">
            {/* Top Header Info Pill */}
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <Package className="h-2.5 w-2.5" />
                {isReference ? 'Tanya Produk' : 'Rekomendasi Gadget'}
              </span>
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <span>{formattedTime}</span>
                {isAdmin &&
                  renderAdminWhatsAppTick(
                    message.isRead,
                    isCustomerOnline,
                    'light'
                  )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {prodImage ? (
                <img
                  src={prodImage}
                  alt={prodName}
                  className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-cover p-0.5 dark:border-slate-800 dark:bg-slate-800"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200/60 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/40">
                  <Package className="h-5 w-5 text-orange-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {data.brand && (
                  <span className="block text-[8.5px] font-black uppercase text-orange-600 dark:text-orange-400">
                    {data.brand}
                  </span>
                )}
                <p
                  className="truncate text-[11px] font-bold leading-tight"
                  title={prodName}
                >
                  {prodName}
                </p>
                {data.variantName && (
                  <p className="truncate text-[9.5px] font-medium text-slate-500 dark:text-slate-400">
                    Varian: {data.variantName}
                  </p>
                )}
                <p className="mt-0.5 font-mono text-xs font-black text-orange-600 dark:text-orange-400">
                  Rp {(Number(prodPrice) || 0).toLocaleString('id-ID')}
                </p>
                {data.stock !== undefined && (
                  <p className="text-[9.5px] text-slate-400">
                    Stok Cabang: {data.stock} Unit
                  </p>
                )}
              </div>
            </div>
            {data.note && (
              <div className="mt-1 rounded-xl border border-slate-100 bg-slate-50/90 p-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {data.note}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] font-semibold dark:border-slate-800">
              <span className="text-slate-400">
                {isReference
                  ? 'Produk Ditanyakan'
                  : selectedRoom?.store?.name || 'Rekomendasi Toko'}
              </span>
              {prodId && (
                <a
                  href={`/gadget/${prodId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shadow-2xs inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  <span>Detail</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
        )
      } catch {
        return <p className="text-xs text-slate-400">Rekomendasi Produk</p>
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
      const incomingUnread = (room._count?.messages || 0) > 0
      const latestMsgUnread =
        room.messages?.[0] && room.messages[0].isRead === false
      const roomTotalUnread = ((room as any).totalUnread || 0) > 0
      return incomingUnread || latestMsgUnread || roomTotalUnread
    }
    if (roomFilter === 'ORDER') {
      return !!room.order || !!(room as any).hasOrder
    }
    if (roomFilter === 'STORE_HELP') {
      return (
        room.isStoreAdminUser ||
        room.customer.role === 'STORE_ADMIN' ||
        room.customer.role === 'STORE_SALES'
      )
    }
    if (roomFilter === 'CUSTOMER_CS') {
      return (
        !room.storeId &&
        room.customer.role !== 'STORE_ADMIN' &&
        room.customer.role !== 'STORE_SALES'
      )
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
            {/* Tombol Bantuan CS Superadmin khusus untuk Admin Toko */}
            {isStoreAdmin && (
              <button
                type="button"
                onClick={handleOpenSuperAdminCsChat}
                className="shadow-xs flex w-full items-center justify-between gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 text-left text-white transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Headphones className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-bold leading-tight">
                      Bantuan CS Superadmin
                    </span>
                    <span className="block truncate text-[10px] text-blue-100">
                      Konsultasi kendala & bantuan langsung ke Superadmin
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/80" />
              </button>
            )}

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
              {(isSuperAdmin
                ? [
                    { id: 'ALL', label: 'Semua' },
                    { id: 'STORE_HELP', label: '🏢 Toko' },
                    { id: 'CUSTOMER_CS', label: '🎧 CS' },
                    {
                      id: 'UNREAD',
                      label: `Belum Dibaca (${stats.unreadRooms})`,
                    },
                  ]
                : [
                    { id: 'ALL', label: 'Semua' },
                    {
                      id: 'UNREAD',
                      label: `Belum Dibaca (${stats.unreadRooms})`,
                    },
                    { id: 'ORDER', label: 'Pesanan' },
                  ]
              ).map((tab) => (
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
                const isStoreHelpChat =
                  (room.customerId === currentUserId &&
                    room.storeId === null) ||
                  room.isStoreHelpToSuperAdmin
                const isStoreAdminUser =
                  room.isStoreAdminUser ||
                  room.customer.role === 'STORE_ADMIN' ||
                  room.customer.role === 'STORE_SALES'

                const displayTitle = isStoreHelpChat
                  ? 'Customer Service (Superadmin)'
                  : isStoreAdminUser
                    ? `${room.customer.name || 'Admin Toko'} (${room.customer.store?.name || 'Toko Cabang'})`
                    : room.customer.name || room.customer.email.split('@')[0]

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

                    {/* Customer / CS Avatar */}
                    <div className="relative shrink-0">
                      {isStoreHelpChat ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200/60 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                          <Headphones className="h-5 w-5" />
                        </div>
                      ) : room.customer.image ? (
                        <img
                          src={room.customer.image}
                          alt={displayTitle}
                          className="shadow-2xs h-10 w-10 rounded-2xl border border-slate-200/60 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-100 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                          {displayTitle.charAt(0).toUpperCase()}
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
                          {displayTitle}
                        </p>
                        <span className="shrink-0 text-[10px] font-medium text-slate-400">
                          {formatTime(room.lastMessageAt)}
                        </span>
                      </div>

                      {/* Tag Badges */}
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {isStoreHelpChat ? (
                          <span className="rounded bg-blue-50 px-1 text-[9px] font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            Superadmin CS
                          </span>
                        ) : isStoreAdminUser ? (
                          <span className="rounded bg-indigo-50 px-1 text-[9px] font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                            🏢 Admin Toko:{' '}
                            {room.customer.store?.name || 'Cabang'}
                          </span>
                        ) : !room.storeId ? (
                          <span className="rounded bg-sky-50 px-1 text-[9px] font-bold text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                            🎧 CS Pelanggan
                          </span>
                        ) : null}

                        {room.order && (
                          <span className="max-w-[120px] truncate font-mono text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                            #{room.order.orderNumber}
                          </span>
                        )}
                        {status && (
                          <span className="py-0.2 rounded bg-slate-100 px-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {status.label}
                          </span>
                        )}
                      </div>

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
                    {selectedRoom.customerId === currentUserId &&
                    selectedRoom.storeId === null ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200/60 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                        <Headphones className="h-5 w-5" />
                      </div>
                    ) : selectedRoom.customer.image ? (
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
                        {selectedRoom.customerId === currentUserId &&
                        selectedRoom.storeId === null
                          ? 'Customer Service (Superadmin)'
                          : selectedRoom.customer.role === 'STORE_ADMIN' ||
                              selectedRoom.customer.role === 'STORE_SALES'
                            ? `${selectedRoom.customer.name || 'Admin Toko'} (${selectedRoom.customer.store?.name || 'Toko Cabang'})`
                            : selectedRoom.customer.name ||
                              selectedRoom.customer.email}
                      </h3>
                      {selectedRoom.customerId === currentUserId &&
                      selectedRoom.storeId === null ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9.5px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          Superadmin CS
                        </span>
                      ) : selectedRoom.customer.role === 'STORE_ADMIN' ||
                        selectedRoom.customer.role === 'STORE_SALES' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[9.5px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          Admin Toko
                        </span>
                      ) : !selectedRoom.storeId ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[9.5px] font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                          CS Pelanggan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                          Customer
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-slate-400">
                      {selectedRoom.customerId === currentUserId &&
                      selectedRoom.storeId === null
                        ? 'Pusat Layanan & Bantuan CS Superadmin Platform'
                        : selectedRoom.customer.role === 'STORE_ADMIN' ||
                            selectedRoom.customer.role === 'STORE_SALES'
                          ? `Admin Toko: ${selectedRoom.customer.store?.name || 'Cabang'} • ${selectedRoom.customer.email}`
                          : selectedRoom.customer.phone ||
                            selectedRoom.customer.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Pinned Order Context Banner (Changes on Scroll like WhatsApp Pinned) */}
              {activePinnedOrder && (
                <div
                  onClick={() =>
                    handleScrollToContextMessage(activePinnedOrder.messageId)
                  }
                  className="flex shrink-0 cursor-pointer items-center justify-between border-b border-blue-100/80 bg-blue-50/70 px-4 py-2 text-xs transition-all hover:bg-blue-100/60 dark:border-blue-900/40 dark:bg-blue-950/40"
                  title="Klik untuk melompat ke kartu pesanan ini di chat"
                >
                  <div className="flex min-w-0 items-center gap-2 truncate">
                    {activePinnedOrder.isReturn ? (
                      <RotateCcw className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Package className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    )}
                    <span className="truncate font-mono font-bold text-blue-950 dark:text-blue-200">
                      Order #{activePinnedOrder.orderNumber}
                    </span>
                    {(activePinnedOrder.total ?? 0) > 0 && (
                      <>
                        <span className="hidden text-slate-400 sm:inline">
                          •
                        </span>
                        <span className="hidden font-medium text-slate-600 dark:text-slate-300 sm:inline">
                          Rp {activePinnedOrder.total!.toLocaleString('id-ID')}
                        </span>
                      </>
                    )}
                    {activePinnedOrder.isReturn ? (
                      <span className="py-0.2 rounded bg-purple-100 px-1.5 text-[9.5px] font-bold text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                        Retur:{' '}
                        {activePinnedOrder.returnStatus === 'APPROVED'
                          ? 'Disetujui'
                          : activePinnedOrder.returnStatus === 'REJECTED'
                            ? 'Ditolak'
                            : 'Verifikasi'}
                      </span>
                    ) : statusConfig[activePinnedOrder.status || ''] ? (
                      <span className="py-0.2 rounded bg-blue-100/80 px-1.5 text-[9.5px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                        {statusConfig[activePinnedOrder.status!].label}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="hidden items-center gap-1 text-[10.5px] font-semibold text-blue-600/80 dark:text-blue-400/80 md:inline-flex">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                      Konteks Pinned
                    </span>
                    <a
                      href={`/dashboard/admin/orders?search=${activePinnedOrder.orderNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400"
                    >
                      <span>Lihat Rincian</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Chat Canvas (Messages Bubble Area) */}
              <div
                ref={messagesContainerRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4 sm:p-5"
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
                    const isCustomerOnline = selectedRoom?.lastMessageAt
                      ? Date.now() -
                          new Date(selectedRoom.lastMessageAt).getTime() <
                        15 * 60 * 1000
                      : false
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

                    const contentTrimmed = message.content?.trim() || ''
                    const isReturn =
                      message.messageType === 'return_reference' ||
                      (contentTrimmed.startsWith('{') &&
                        (contentTrimmed.includes('"returnReason"') ||
                          contentTrimmed.includes('"return_reference"')))
                    const isOrder =
                      isReturn ||
                      message.messageType === 'order' ||
                      message.messageType === 'order_reference' ||
                      (contentTrimmed.startsWith('{') &&
                        contentTrimmed.includes('"orderNumber"'))
                    const isProduct =
                      !isOrder &&
                      (message.messageType === 'product' ||
                        message.messageType === 'product_reference' ||
                        message.messageType === 'rental' ||
                        (contentTrimmed.startsWith('{') &&
                          (contentTrimmed.includes('"name"') ||
                            contentTrimmed.includes('"productName"')) &&
                          (contentTrimmed.includes('"price"') ||
                            contentTrimmed.includes('"productPrice"'))))
                    const isCardMessage = isOrder || isProduct

                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <DateSeparator date={currentDate} />
                        )}

                        <div
                          id={
                            isCardMessage
                              ? `chat-context-msg-${message.id}`
                              : undefined
                          }
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          {isMedia ? (
                            /* Full-Bleed Modern Media Bubble (Compact Mobile Friendly) */
                            <div className="shadow-xs group relative max-w-[65%] overflow-hidden rounded-2xl border border-slate-200/80 bg-black dark:border-slate-800 sm:max-w-[240px]">
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
                                    className="clean-video-player block max-h-[160px] w-full max-w-[200px] rounded-2xl bg-black object-cover sm:max-h-[220px] sm:max-w-[240px]"
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
                                    className="shadow-xs absolute right-2 top-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/85"
                                  >
                                    <Maximize2 className="h-3 w-3" />
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
                                    className="group-hover:scale-102 block max-h-[160px] w-auto max-w-[200px] rounded-2xl object-cover transition-transform duration-200 sm:max-h-[220px] sm:max-w-[240px]"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md">
                                      <ZoomIn className="h-3.5 w-3.5" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Floating Glassmorphic Timestamp Pill */}
                              <div className="shadow-xs pointer-events-none absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-medium text-white/95 backdrop-blur-md">
                                <span>{formattedTime}</span>
                                {isAdmin &&
                                  renderAdminWhatsAppTick(
                                    message.isRead,
                                    isCustomerOnline,
                                    'dark'
                                  )}
                              </div>
                            </div>
                          ) : isCardMessage ? (
                            /* Standalone Card Bubble (No Blue Background Wrapper) */
                            renderMessageContent(
                              message,
                              isAdmin,
                              formattedTime,
                              isCustomerOnline
                            )
                          ) : (
                            /* Standard Text Bubble */
                            <div
                              className={`shadow-2xs max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:max-w-[70%] ${
                                isAdmin
                                  ? 'rounded-tr-xs bg-blue-600 text-white shadow-blue-500/10'
                                  : 'rounded-tl-xs border border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {!isAdmin && (
                                <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                  {message.sender.name || 'Customer'}
                                </p>
                              )}

                              {renderMessageContent(
                                message,
                                isAdmin,
                                formattedTime,
                                isCustomerOnline
                              )}

                              {/* Timestamp & Read Status */}
                              <div
                                className={`mt-1.5 flex items-center justify-end gap-1 text-[9.5px] font-medium ${
                                  isAdmin
                                    ? 'text-blue-100 dark:text-blue-200'
                                    : 'text-slate-400'
                                }`}
                              >
                                <span>{formattedTime}</span>
                                {isAdmin &&
                                  renderAdminWhatsAppTick(
                                    message.isRead,
                                    isCustomerOnline,
                                    'on-blue'
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
                {/* Contextual Active Order Banner above Input */}
                {activeOrderContext && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {activeOrderContext.productImage ? (
                        <img
                          src={activeOrderContext.productImage}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-xl border border-blue-200/80 bg-white object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                          <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                            Membahas Pesanan:
                          </span>
                          <span className="truncate font-mono text-xs font-bold text-slate-900 dark:text-white">
                            #{activeOrderContext.orderNumber}
                          </span>
                          {statusConfig[activeOrderContext.status] && (
                            <span className="py-0.2 rounded bg-blue-100 px-1.5 text-[9.5px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                              {statusConfig[activeOrderContext.status].label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="truncate text-slate-600 dark:text-slate-300">
                            {activeOrderContext.productName}
                          </span>
                          {activeOrderContext.total > 0 && (
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              • Rp{' '}
                              {activeOrderContext.total.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveOrderContext(null)
                          if (typeof window !== 'undefined' && window.history) {
                            const url = new URL(window.location.href)
                            url.searchParams.delete('orderId')
                            window.history.replaceState(
                              null,
                              '',
                              url.toString()
                            )
                          }
                        }}
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                        title="Tutup Konteks"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

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
                    placeholder={
                      activeOrderContext
                        ? `Ketik caption untuk pesanan #${activeOrderContext.orderNumber}... (Enter untuk kirim)`
                        : 'Tulis balasan untuk customer...'
                    }
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <button
                    onClick={() => handleSendMessage('text')}
                    disabled={
                      (!messageInput.trim() && !activeOrderContext) || sending
                    }
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

export default function AdminChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-[75vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
        </div>
      }
    >
      <AdminChatContent />
    </React.Suspense>
  )
}
