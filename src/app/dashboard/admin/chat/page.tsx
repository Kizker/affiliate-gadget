'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  RefreshCw,
  Wrench,
  Users,
  Star,
  Hammer,
} from 'lucide-react'
import { toast } from 'sonner'
import { DateSeparator } from '@/components/chat/date-separator'
import { isSameDay } from '@/utils/chat-helpers'
import OrderReferenceCard from '@/components/chat/order-reference-card'

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
    items: Array<{
      type?: string
      quantity: number
      product?: { name: string } | null
      rentalItem?: { name: string } | null
      service?: { name: string } | null
      price: number
    }>
  } | null
  messages: {
    content: string
    createdAt: string
    senderId: string
    messageType: string
  }[]
  _count: {
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
  price?: number
  pricePerDay?: number
  stock: number
  images: string[]
  type: 'product' | 'rental'
  category?: string
  brand?: string
}

interface OrderItem {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  items: Array<{
    product?: { name: string } | null
    rentalItem?: { name: string } | null
    service?: { name: string } | null
    quantity: number
    price: number
  }>
}

interface TechnicianItem {
  id: string
  userId: string
  name: string | null
  image: string | null
  email: string
  phone: string | null
  rating: number
  totalReview: number
  experience: number
  specialties: string[]
  type: 'technician'
}

interface MitraItem {
  id: string
  name: string | null
  image: string | null
  email: string
  phone: string | null
  type: 'mitra'
}

export default function AdminChatPage() {
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

  // Catalog modal
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(false)

  // Order modal
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [orderSearch, setOrderSearch] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)

  // People (teknisi/mitra) state
  const [technicianItems, setTechnicianItems] = useState<TechnicianItem[]>([])
  const [mitraItems, setMitraItems] = useState<MitraItem[]>([])
  const [catalogTab, setCatalogTab] = useState<
    'sparepart' | 'sewa' | 'teknisi' | 'mitra'
  >('sparepart')
  const [peopleLoading, setPeopleLoading] = useState(false)

  // Image upload
  const [, setUploadingImage] = useState(false)
  const [, setShowAttachMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [stats, setStats] = useState({ totalRooms: 0, unreadRooms: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch chat rooms
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chat/rooms')
      if (!res.ok) throw new Error('Failed to fetch rooms')
      const data = await res.json()
      setRooms(data.rooms || [])
      setStats(data.stats || { totalRooms: 0, unreadRooms: 0 })
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch messages for selected room
  const fetchMessages = useCallback(
    async (roomId: string, isPolling = false) => {
      try {
        // Only show loading on initial fetch, not polling
        if (!isPolling) {
          setMessagesLoading(true)
        }

        const res = await fetch(`/api/admin/chat/rooms/${roomId}/messages`)
        if (!res.ok) throw new Error('Failed to fetch messages')
        const data = await res.json()
        setMessages(data.messages || [])

        // Mark as read (only on initial load)
        if (!isPolling) {
          await fetch(`/api/admin/chat/rooms/${roomId}/messages`, {
            method: 'PATCH',
          })
          // Small delay then refresh rooms to update unread count
          setTimeout(fetchRooms, 500)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        if (!isPolling) {
          setMessagesLoading(false)
          setShouldScrollToBottom(true) // Scroll after messages loaded
        }
      }
    },
    [fetchRooms]
  )

  // Initial load
  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  // Polling for new messages - use isPolling flag
  useEffect(() => {
    if (selectedRoom) {
      pollingRef.current = setInterval(() => {
        fetchMessages(selectedRoom.id, true)
      }, 5000)
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [selectedRoom, fetchMessages])

  // Scroll to bottom only when shouldScrollToBottom is true
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement
      if (container) {
        container.scrollTop = container.scrollHeight
      }
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom])

  // Filter rooms by search
  const filteredRooms = rooms.filter(
    (room) =>
      room.customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.order?.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room)
    setShowChatOnMobile(true)
    fetchMessages(room.id)
  }

  const handleBackToList = () => {
    setShowChatOnMobile(false)
    setSelectedRoom(null)
    setMessages([])
  }

  // Send message
  const handleSendMessage = async (
    messageType = 'text',
    attachmentId?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachmentData?: any
  ) => {
    if (messageType === 'text' && !messageInput.trim()) return
    if (!selectedRoom) return

    setSending(true)
    try {
      let content = messageInput.trim()

      // For product/order attachments, include data as JSON in content
      if (attachmentData) {
        content = JSON.stringify(attachmentData)
      }

      const res = await fetch(
        `/api/admin/chat/rooms/${selectedRoom.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            messageType,
            attachmentId,
          }),
        }
      )

      if (!res.ok) throw new Error('Failed to send message')

      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setMessageInput('')
      setShouldScrollToBottom(true)

      // Close modals
      setShowCatalogModal(false)
      setShowOrderModal(false)

      // Refresh rooms
      fetchRooms()
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Gagal mengirim pesan')
    } finally {
      setSending(false)
    }
  }

  // Search catalog
  const searchCatalog = async (search: string) => {
    setCatalogLoading(true)
    try {
      const res = await fetch(
        `/api/admin/chat/catalog?search=${encodeURIComponent(search)}`
      )
      if (!res.ok) throw new Error('Failed to search catalog')
      const data = await res.json()
      setCatalogItems([...(data.products || []), ...(data.rentalItems || [])])
    } catch (error) {
      console.error('Error searching catalog:', error)
    } finally {
      setCatalogLoading(false)
    }
  }

  // Search orders
  const searchOrders = async (search: string) => {
    setOrderLoading(true)
    try {
      const customerId = selectedRoom?.customer.id
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (customerId) params.append('customerId', customerId)

      const res = await fetch(`/api/admin/chat/orders?${params}`)
      if (!res.ok) throw new Error('Failed to search orders')
      const data = await res.json()
      setOrderItems(data.orders || [])
    } catch (error) {
      console.error('Error searching orders:', error)
    } finally {
      setOrderLoading(false)
    }
  }

  // Search people (technicians/mitra)
  const searchPeople = async (search: string) => {
    setPeopleLoading(true)
    try {
      const res = await fetch(
        `/api/admin/chat/people?search=${encodeURIComponent(search)}`
      )
      if (!res.ok) throw new Error('Failed to search people')
      const data = await res.json()
      setTechnicianItems(data.technicians || [])
      setMitraItems(data.mitra || [])
    } catch (error) {
      console.error('Error searching people:', error)
    } finally {
      setPeopleLoading(false)
    }
  }

  // Handle image upload (currently unused, kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoom) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    setUploadingImage(true)
    setShowAttachMenu(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        // Send image message
        const msgRes = await fetch(
          `/api/admin/chat/rooms/${selectedRoom.id}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: '📷 Gambar',
              messageType: 'image',
              mediaUrl: data.url,
            }),
          }
        )

        if (msgRes.ok) {
          const msgData = await msgRes.json()
          setMessages((prev) => [...prev, msgData.message])
          fetchRooms()
        }
      } else {
        toast.error('Gagal upload gambar')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Terjadi kesalahan saat upload')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Open catalog modal
  const openCatalogModal = () => {
    setShowCatalogModal(true)
    setCatalogSearch('')
    setCatalogTab('sparepart')
    searchCatalog('')
    searchPeople('')
  }

  // Open order modal
  const openOrderModal = () => {
    setShowOrderModal(true)
    setOrderSearch('')
    searchOrders('')
  }

  // Send product recommendation
  const sendProductRecommendation = (item: CatalogItem) => {
    handleSendMessage(item.type, item.id, {
      id: item.id,
      name: item.name,
      price: item.price || item.pricePerDay,
      image: item.images?.[0] || null,
      stock: item.stock,
      type: item.type,
    })
  }

  // Send technician recommendation
  const sendTechnicianRecommendation = (tech: TechnicianItem) => {
    handleSendMessage('technician', tech.id, {
      id: tech.id,
      userId: tech.userId,
      name: tech.name,
      image: tech.image,
      rating: tech.rating,
      totalReview: tech.totalReview,
      experience: tech.experience,
      specialties: tech.specialties,
      type: 'technician',
    })
  }

  // Send mitra recommendation
  const sendMitraRecommendation = (mitra: MitraItem) => {
    handleSendMessage('mitra', mitra.id, {
      id: mitra.id,
      name: mitra.name,
      image: mitra.image,
      email: mitra.email,
      phone: mitra.phone,
      type: 'mitra',
    })
  }

  // Send order info
  const sendOrderInfo = (order: OrderItem) => {
    handleSendMessage('order', order.id, {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      items: order.items?.map(
        (i: {
          product?: { name: string } | null
          rentalItem?: { name: string } | null
          service?: { name: string } | null
          quantity: number
          price: number
        }) => ({
          name: i.product?.name || i.rentalItem?.name || i.service?.name,
          qty: i.quantity,
          price: i.price,
        })
      ),
    })
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null

    const statusConfig: Record<string, { label: string; color: string }> = {
      PENDING_PAYMENT: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-700',
      },
      PAID: { label: 'Paid', color: 'bg-blue-100 text-blue-700' },
      IN_PROGRESS: {
        label: 'Progress',
        color: 'bg-purple-100 text-purple-700',
      },
      SHIPPED: { label: 'Terkirim', color: 'bg-orange-100 text-orange-700' },
      RENTED: { label: 'Disewa', color: 'bg-cyan-100 text-cyan-700' },
      RETURNED: { label: 'Kembali', color: 'bg-indigo-100 text-indigo-700' },
      COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
      CANCELLED: { label: 'Batal', color: 'bg-red-100 text-red-700' },
    }

    const config = statusConfig[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-700',
    }

    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    )
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (days === 1) {
      return 'Kemarin'
    } else if (days < 7) {
      return `${days} hari lalu`
    }
    return date.toLocaleDateString('id-ID')
  }

  // Render message content based on type
  const renderMessageContent = (message: Message, isAdmin: boolean) => {
    if (message.messageType === 'text') {
      return (
        <div
          className={`rounded-2xl px-4 py-2 ${
            isAdmin
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
      )
    }

    // Product/Rental recommendation
    if (message.messageType === 'product' || message.messageType === 'rental') {
      try {
        const data = JSON.parse(message.content)
        return (
          <div className="max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex gap-3 p-3">
              {data.image && (
                <img
                  src={data.image}
                  alt={data.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {data.name}
                </p>
                <p className="mt-1 text-base font-bold text-blue-600">
                  Rp {data.price?.toLocaleString('id-ID')}
                  {message.messageType === 'rental' && (
                    <span className="text-xs font-normal">/hari</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">Stock: {data.stock}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-600">
                <Package className="mr-1 inline h-3 w-3" />
                {message.messageType === 'product'
                  ? 'Rekomendasi Produk'
                  : 'Rekomendasi Sewa'}
              </p>
            </div>
          </div>
        )
      } catch {
        return <p className="text-sm text-gray-500">Invalid product data</p>
      }
    }

    // Order info
    if (message.messageType === 'order') {
      try {
        const data = JSON.parse(message.content)
        return (
          <div className="max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Order Number</p>
                  <p className="font-bold">{data.orderNumber}</p>
                </div>
                <ShoppingBag className="h-6 w-6" />
              </div>
            </div>
            <div className="p-3">
              {data.items?.slice(0, 2).map(
                (
                  item: {
                    name: string
                    qty: number
                    price: number
                  },
                  idx: number
                ) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="mr-2 truncate text-gray-700">
                      {item.name}
                    </span>
                    <span className="shrink-0 font-medium text-gray-900">
                      x{item.qty}
                    </span>
                  </div>
                )
              )}
              {data.items?.length > 2 && (
                <p className="mt-1 text-xs text-gray-500">
                  +{data.items.length - 2} item lainnya
                </p>
              )}
              <div className="mt-2 border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-blue-600">
                    Rp {data.total?.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      } catch {
        return <p className="text-sm text-gray-500">Invalid order data</p>
      }
    }

    // Technician recommendation
    if (message.messageType === 'technician') {
      try {
        const data = JSON.parse(message.content)
        return (
          <div className="max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex gap-3 p-3">
              {data.image ? (
                <img
                  src={data.image}
                  alt={data.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white">
                  <span className="text-lg font-bold">
                    {(data.name || 'T').charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {data.name}
                </p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="text-sm text-yellow-500">⭐</span>
                  <span className="text-sm font-medium">
                    {data.rating?.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({data.totalReview} review)
                  </span>
                </div>
                <p className="truncate text-xs text-gray-500">
                  {data.specialties?.slice(0, 2).join(', ')}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-orange-50 px-3 py-2">
              <p className="text-xs text-orange-600">
                <Wrench className="mr-1 inline h-3 w-3" />
                Rekomendasi Teknisi
              </p>
            </div>
          </div>
        )
      } catch {
        return <p className="text-sm text-gray-500">Invalid technician data</p>
      }
    }

    // Mitra recommendation
    if (message.messageType === 'mitra') {
      try {
        const data = JSON.parse(message.content)
        return (
          <div className="max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex gap-3 p-3">
              {data.image ? (
                <img
                  src={data.image}
                  alt={data.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                  <span className="text-lg font-bold">
                    {(data.name || 'M').charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {data.name}
                </p>
                <p className="truncate text-sm text-gray-500">{data.email}</p>
                {data.phone && (
                  <p className="text-xs text-gray-400">{data.phone}</p>
                )}
              </div>
            </div>
            <div className="border-t border-gray-100 bg-purple-50 px-3 py-2">
              <p className="text-xs text-purple-600">
                <Users className="mr-1 inline h-3 w-3" />
                Rekomendasi Mitra
              </p>
            </div>
          </div>
        )
      } catch {
        return <p className="text-sm text-gray-500">Invalid mitra data</p>
      }
    }

    // Image/Media
    if (message.mediaUrl) {
      return (
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <img
            src={message.mediaUrl}
            alt="Media"
            className="max-h-64 max-w-xs object-cover"
          />
        </div>
      )
    }

    return (
      <div
        className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[70%] ${
          isAdmin
            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
            : 'border border-gray-200 bg-white text-gray-900'
        }`}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 text-white shadow-lg lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">
              💬 Chat & Messages
            </h1>
            <p className="mt-1 text-sm text-blue-100 lg:mt-2 lg:text-base">
              Kelola percakapan dengan customer
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm lg:px-4">
              <p className="text-xs font-medium lg:text-sm">Total Chats</p>
              <p className="text-xl font-bold lg:text-2xl">
                {stats.totalRooms}
              </p>
            </div>
            <div className="rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm lg:px-4">
              <p className="text-xs font-medium lg:text-sm">Unread</p>
              <p className="text-xl font-bold lg:text-2xl">
                {stats.unreadRooms}
              </p>
            </div>
            <button
              onClick={fetchRooms}
              className="rounded-lg bg-white/20 p-2 transition-colors hover:bg-white/30"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Chat Room List - Left Sidebar */}
        <div
          className={`lg:col-span-4 xl:col-span-3 ${showChatOnMobile ? 'hidden lg:block' : 'block'}`}
        >
          <div className="flex h-[600px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Search */}
            <div className="border-b border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari customer atau order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Room List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-500">
                  <MessageSquare className="h-12 w-12 text-gray-300" />
                  <p className="mt-2">Belum ada chat</p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className={`w-full border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 ${
                      selectedRoom?.id === room.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {room.customer.image ? (
                          <img
                            src={room.customer.image}
                            alt={room.customer.name || 'Customer'}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            <span className="text-lg font-bold">
                              {(room.customer.name || room.customer.email)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-semibold text-gray-900">
                            {room.customer.name || room.customer.email}
                          </p>
                          <span className="ml-2 shrink-0 text-xs text-gray-500">
                            {formatTime(room.lastMessageAt)}
                          </span>
                        </div>

                        {room.order && (
                          <div className="mt-1 flex items-center gap-2">
                            <ShoppingBag className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="truncate text-xs text-gray-600">
                              {room.order.orderNumber}
                            </span>
                            {getStatusBadge(room.order.status)}
                          </div>
                        )}

                        {/* Claim Status */}
                        <div className="mt-1">
                          {room.claimedById ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              ✓ {room.claimedBy?.name || 'Claimed'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                              ⏳ Menunggu Diambil
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                          <p className="truncate text-sm text-gray-600">
                            {room.messages[0]?.content || 'Tidak ada pesan'}
                          </p>
                          {room._count.messages > 0 && (
                            <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                              {room._count.messages}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages - Main Area */}
        <div
          className={`lg:col-span-8 xl:col-span-9 ${!showChatOnMobile ? 'hidden lg:block' : 'block'}`}
        >
          {selectedRoom ? (
            <div className="flex h-[600px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  {/* Back Button - Mobile Only */}
                  <button
                    onClick={handleBackToList}
                    className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="relative shrink-0">
                    {selectedRoom.customer.image ? (
                      <img
                        src={selectedRoom.customer.image}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <span className="font-bold">
                          {(
                            selectedRoom.customer.name ||
                            selectedRoom.customer.email
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {selectedRoom.customer.name ||
                        selectedRoom.customer.email}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {selectedRoom.customer.phone ||
                        selectedRoom.customer.email}
                    </p>
                  </div>
                </div>

                {selectedRoom.order && (
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedRoom.order.orderNumber}
                    </p>
                    {getStatusBadge(selectedRoom.order.status)}
                  </div>
                )}
              </div>

              {/* Order Reference Card - Show if room has order */}
              {selectedRoom.order && (
                <div className="border-b border-gray-200 bg-white p-3">
                  <OrderReferenceCard
                    order={{
                      id: selectedRoom.order.id,
                      orderNumber: selectedRoom.order.orderNumber,
                      status: selectedRoom.order.status,
                      total: selectedRoom.order.total,
                      createdAt:
                        selectedRoom.order.createdAt ||
                        new Date().toISOString(),
                      items: selectedRoom.order.items.map((item) => ({
                        type: item.type,
                        quantity: item.quantity,
                        product: item.product || undefined,
                        service: item.service || undefined,
                        rentalItem: item.rentalItem || undefined,
                      })),
                    }}
                    variant="compact"
                  />
                </div>
              )}

              {/* Messages - with Wallpaper */}
              <div
                className="flex-1 space-y-4 overflow-y-auto p-4"
                style={{
                  backgroundImage:
                    'linear-gradient(to bottom right, rgba(239, 246, 255, 0.95), rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.95)), url(https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundAttachment: 'local',
                }}
              >
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-500">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm">
                      <MessageSquare className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="mt-3 font-medium">Belum ada pesan</p>
                    <p className="text-sm">Kirim pesan pertama!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    // Date separator logic
                    const currentDate = new Date(message.createdAt)
                    const previousDate =
                      index > 0 ? new Date(messages[index - 1].createdAt) : null
                    const showDateSeparator =
                      !previousDate || !isSameDay(currentDate, previousDate)

                    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(
                      message.sender.role
                    )

                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <DateSeparator date={currentDate} />
                        )}
                        <div
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] ${isAdmin ? 'items-end' : 'items-start'}`}
                          >
                            {renderMessageContent(message, isAdmin)}

                            {/* Timestamp & Read Status */}
                            <div
                              className={`mt-1 flex items-center gap-1 text-xs text-gray-500 ${
                                isAdmin ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span>{formatTime(message.createdAt)}</span>
                              {isAdmin && (
                                <span>
                                  {message.isRead ? (
                                    <CheckCheck className="h-3 w-3 text-blue-600" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={openCatalogModal}
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                    title="Rekomendasikan Produk"
                  >
                    <Package className="h-5 w-5" />
                  </button>
                  <button
                    onClick={openOrderModal}
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                    title="Bagikan Order"
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage('text')
                        }
                      }}
                      placeholder="Ketik pesan..."
                      rows={1}
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleSendMessage('text')}
                    className="self-start rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-2 text-white hover:shadow-lg disabled:opacity-50"
                    disabled={!messageInput.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[600px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
              <div className="text-center">
                <MessageSquare className="mx-auto h-16 w-16 text-gray-400" />
                <p className="mt-4 text-gray-600">
                  Pilih chat untuk memulai percakapan
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Catalog Modal - Enhanced with Tabs */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    📦 Katalog & Rekomendasi
                  </h3>
                  <p className="text-sm text-white/80">
                    Pilih item untuk dikirim ke customer
                  </p>
                </div>
                <button
                  onClick={() => setShowCatalogModal(false)}
                  className="rounded-full p-2 transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                <button
                  onClick={() => setCatalogTab('sparepart')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    catalogTab === 'sparepart'
                      ? 'border-b-2 border-blue-600 bg-white text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  Sparepart
                </button>
                <button
                  onClick={() => setCatalogTab('sewa')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    catalogTab === 'sewa'
                      ? 'border-b-2 border-green-600 bg-white text-green-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Hammer className="h-4 w-4" />
                  Sewa Alat
                </button>
                <button
                  onClick={() => setCatalogTab('teknisi')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    catalogTab === 'teknisi'
                      ? 'border-b-2 border-orange-600 bg-white text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                  Teknisi
                </button>
                <button
                  onClick={() => setCatalogTab('mitra')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    catalogTab === 'mitra'
                      ? 'border-b-2 border-purple-600 bg-white text-purple-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Mitra
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-gray-100 bg-white p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Cari ${catalogTab === 'sparepart' ? 'produk' : catalogTab === 'sewa' ? 'alat sewa' : catalogTab === 'teknisi' ? 'teknisi' : 'mitra'}...`}
                  value={catalogSearch}
                  onChange={(e) => {
                    setCatalogSearch(e.target.value)
                    if (catalogTab === 'teknisi' || catalogTab === 'mitra') {
                      searchPeople(e.target.value)
                    } else {
                      searchCatalog(e.target.value)
                    }
                  }}
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto p-4">
              {/* Sparepart Tab */}
              {catalogTab === 'sparepart' &&
                (catalogLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : catalogItems.filter((i) => i.type === 'product').length ===
                  0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-gray-500">Tidak ada produk</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {catalogItems
                      .filter((i) => i.type === 'product')
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => sendProductRecommendation(item)}
                          className="group flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
                        >
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900 group-hover:text-blue-600">
                              {item.name}
                            </p>
                            <p className="text-sm font-bold text-blue-600">
                              Rp {(item.price || 0).toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {item.stock}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                ))}

              {/* Sewa Tab */}
              {catalogTab === 'sewa' &&
                (catalogLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  </div>
                ) : catalogItems.filter((i) => i.type === 'rental').length ===
                  0 ? (
                  <div className="py-12 text-center">
                    <Hammer className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-gray-500">Tidak ada alat sewa</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {catalogItems
                      .filter((i) => i.type === 'rental')
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => sendProductRecommendation(item)}
                          className="group flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-green-300 hover:bg-green-50"
                        >
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100">
                              <Hammer className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900 group-hover:text-green-600">
                              {item.name}
                            </p>
                            <p className="text-sm font-bold text-green-600">
                              Rp{' '}
                              {(item.pricePerDay || 0).toLocaleString('id-ID')}
                              /hari
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {item.stock}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                ))}

              {/* Teknisi Tab */}
              {catalogTab === 'teknisi' &&
                (peopleLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  </div>
                ) : technicianItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <Wrench className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-gray-500">Tidak ada teknisi</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {technicianItems.map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() => sendTechnicianRecommendation(tech)}
                        className="group flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
                      >
                        {tech.image ? (
                          <img
                            src={tech.image}
                            alt={tech.name || ''}
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500">
                            <span className="text-xl font-bold text-white">
                              {(tech.name || 'T').charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900 group-hover:text-orange-600">
                            {tech.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-medium">
                              {tech.rating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({tech.totalReview} review)
                            </span>
                          </div>
                          <p className="truncate text-xs text-gray-500">
                            {tech.specialties?.slice(0, 2).join(', ')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}

              {/* Mitra Tab */}
              {catalogTab === 'mitra' &&
                (peopleLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : mitraItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-gray-500">Tidak ada mitra</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {mitraItems.map((mitra) => (
                      <button
                        key={mitra.id}
                        onClick={() => sendMitraRecommendation(mitra)}
                        className="group flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-purple-300 hover:bg-purple-50"
                      >
                        {mitra.image ? (
                          <img
                            src={mitra.image}
                            alt={mitra.name || ''}
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500">
                            <span className="text-xl font-bold text-white">
                              {(mitra.name || 'M').charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900 group-hover:text-purple-600">
                            {mitra.name}
                          </p>
                          <p className="truncate text-sm text-gray-500">
                            {mitra.email}
                          </p>
                          {mitra.phone && (
                            <p className="text-xs text-gray-400">
                              {mitra.phone}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold">Bagikan Order</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari order number..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value)
                    searchOrders(e.target.value)
                  }}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {orderLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : orderItems.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">
                    Tidak ada order
                  </p>
                ) : (
                  orderItems.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => sendOrderInfo(order)}
                      className="w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">
                          {order.orderNumber}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {order.items?.length || 0} item • Rp{' '}
                        {order.total.toLocaleString('id-ID')}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatTime(order.createdAt)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
