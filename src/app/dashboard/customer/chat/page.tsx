'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
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
  storeId?: string | null
  claimedById?: string | null
  claimedBy?: {
    id: string
    name: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
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
      logo?: string | null
    } | null
    claimedBy?: {
      id: string
      name: string | null
      image?: string | null
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
    companyName?: string
    phone?: string | null
    city?: string
    logo?: string | null
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
    messageType?: string
    mediaUrl?: string | null
    mediaType?: string | null
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

const NON_MEDIA_TYPES = [
  'product_reference',
  'product',
  'order',
  'rental',
  'service',
  'text',
]

const isVideoMedia = (
  url?: string | null,
  mediaType?: string | null,
  messageType?: string | null
) => {
  // Never treat non-media message types as video
  if (messageType && NON_MEDIA_TYPES.includes(messageType)) return false
  if (messageType === 'video') return true
  if (mediaType?.startsWith('video/')) return true
  if (url && /\.(mp4|webm|mov|mkv|ogg|3gp)(\?.*)?$/i.test(url)) return true
  return false
}

const isImageMedia = (
  url?: string | null,
  mediaType?: string | null,
  messageType?: string | null
) => {
  // Never treat non-media message types as image
  if (messageType && NON_MEDIA_TYPES.includes(messageType)) return false
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

function CustomerChatContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const paramOrderId = searchParams.get('orderId')
  const paramStoreId = searchParams.get('storeId')
  const paramProductId = searchParams.get('productId')
  const paramProductName = searchParams.get('productName')
  const paramProductPrice = searchParams.get('productPrice')
  const paramVariantName = searchParams.get('variantName')
  const paramProductImage = searchParams.get('productImage')

  const [activeProductContext, setActiveProductContext] = useState<{
    productId?: string
    productName?: string
    productPrice?: number
    productImage?: string
    variantName?: string
  } | null>(null)

  const [isInitializingRoom, setIsInitializingRoom] = useState(false)
  const lastInitializedKeyRef = useRef<string | null>(null)
  const loadedRoomIdRef = useRef<string | null>(null)
  const hasAutoSelectedRef = useRef(false)
  const isSendingRef = useRef(false)

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
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'UNREAD' | 'ORDER'>(
    'ALL'
  )

  // Photo & Video Media upload & Fullscreen Modal
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [fullscreenMedia, setFullscreenMedia] = useState<{
    url: string
    type: 'image' | 'video'
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const selectedRoomRef = useRef<ChatRoom | null>(null)
  const previousMessagesCountRef = useRef<number>(0)

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

  // Track message count for smart auto-scroll on new message
  useEffect(() => {
    previousMessagesCountRef.current = messages.length
  }, [messages])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/customer/chat')
    }
  }, [status, router])

  // Fetch all chat rooms
  // Deps: [] — stable reference, gunakan functional setRooms agar tidak perlu rooms dalam deps
  const fetchRooms = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading((prev) => prev) // trigger loading hanya jika belum ada rooms
        setRooms((prevRooms) => {
          if (prevRooms.length === 0) setLoading(true)
          return prevRooms
        })
      }
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

      setRooms((prev) => {
        // Clear unread count for the active room so badge stays cleared while room is open
        const mappedRooms = allRooms.map((r) =>
          selectedRoomRef.current?.id === r.id
            ? { ...r, _count: { messages: 0 } }
            : r
        )
        if (prev.length !== mappedRooms.length) return mappedRooms
        const hasDiff = mappedRooms.some((r, i) => {
          const p = prev[i]
          return (
            !p ||
            r.id !== p.id ||
            r.lastMessageAt !== p.lastMessageAt ||
            (r._count?.messages || 0) !== (p._count?.messages || 0) ||
            r.claimedBy?.image !== p.claimedBy?.image ||
            r.store?.logo !== p.store?.logo ||
            r.claimedBy?.name !== p.claimedBy?.name
          )
        })
        return hasDiff ? mappedRooms : prev
      })

      // Sync selectedRoom if active room info or avatar changed
      if (selectedRoomRef.current) {
        const currentActive = allRooms.find(
          (r) => r.id === selectedRoomRef.current?.id
        )
        if (currentActive) {
          setSelectedRoom((curr) => {
            if (
              curr &&
              (curr.claimedBy?.image !== currentActive.claimedBy?.image ||
                curr.store?.logo !== currentActive.store?.logo ||
                curr.claimedBy?.name !== currentActive.claimedBy?.name)
            ) {
              return { ...curr, ...currentActive }
            }
            return curr
          })
        }
      }
    } catch (error) {
      if (!isPolling) {
        console.error('Error fetching rooms:', error)
      }
    } finally {
      if (!isPolling) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRooms(false)
    }
  }, [status, fetchRooms])

  // Auto-select first room on desktop only once upon initial load if no storeId or orderId param
  useEffect(() => {
    if (
      !hasAutoSelectedRef.current &&
      !paramStoreId &&
      !paramOrderId &&
      rooms.length > 0 &&
      !selectedRoom &&
      typeof window !== 'undefined' &&
      window.innerWidth >= 1024
    ) {
      hasAutoSelectedRef.current = true
      setSelectedRoom(rooms[0])
    }
  }, [rooms, paramStoreId, paramOrderId, selectedRoom])

  // Fetch messages for selected room
  const fetchMessages = useCallback(
    async (room: ChatRoom, isPolling = false) => {
      // Guard: skip polling fetch if currently sending to prevent wiping optimistic message
      if (isPolling && isSendingRef.current) {
        return
      }

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

          if (data.room) {
            setSelectedRoom((curr) => {
              if (
                curr &&
                curr.id === data.room.id &&
                (curr.claimedBy?.image !== data.room.claimedBy?.image ||
                  curr.store?.logo !== data.room.store?.logo)
              ) {
                return { ...curr, ...data.room }
              }
              return curr
            })
          }

          setMessages((prev) => {
            // Guard: jika newMsgs lebih sedikit dari prev, ada optimistic message pending
            // Jangan overwrite — biarkan polling berikutnya yang akan sync setelah commit DB
            if (isPolling && newMsgs.length < prev.length) {
              return prev
            }

            if (prev.length !== newMsgs.length) {
              // Pesan baru dari toko/admin tiba → trigger auto scroll
              if (newMsgs.length > previousMessagesCountRef.current) {
                setShouldScrollToBottom(true)
              }
              return newMsgs
            }
            const hasDiff = newMsgs.some(
              (m: any, idx: number) =>
                m.id !== prev[idx]?.id ||
                m.content !== prev[idx]?.content ||
                m.isRead !== prev[idx]?.isRead ||
                m.sender?.image !== prev[idx]?.sender?.image
            )
            if (hasDiff) {
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
      if (loadedRoomIdRef.current === selectedRoom.id) {
        // Messages already loaded/injected for this exact room — consume ref and skip duplicate fetch
        loadedRoomIdRef.current = null
        return
      }
      // Hanya tampilkan loading spinner jika belum ada messages untuk room ini
      setMessages((prev) => {
        if (prev.length === 0) setMessagesLoading(true)
        return []
      })
      fetchMessages(selectedRoom, false)
    } else {
      setMessages([])
      setMessagesLoading(false)
    }
  }, [selectedRoom?.id, fetchMessages])

  // Real-time polling for new messages in active room (2s interval)
  useEffect(() => {
    if (selectedRoom?.id) {
      pollingRef.current = setInterval(() => {
        if (selectedRoomRef.current) {
          fetchMessages(selectedRoomRef.current, true)
        }
      }, 2000)
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [selectedRoom?.id, fetchMessages])

  // Background room list polling (5s interval)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRooms(true)
    }, 5000)
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

  const handleSelectRoom = useCallback(
    (room: ChatRoom) => {
      loadedRoomIdRef.current = room.id
      setActiveProductContext(null)
      setSelectedRoom(room)
      setShowChatOnMobile(true)
      setShouldScrollToBottom(true)
      // Instantly clear unread badge in state
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id ? { ...r, _count: { messages: 0 } } : r
        )
      )
      setMessages((prev) => {
        if (prev.length === 0) setMessagesLoading(true)
        return []
      })
      fetchMessages(room, false)

      // Sync URL
      if (typeof window !== 'undefined') {
        if (room.orderId || room.order?.id) {
          window.history.replaceState(
            null,
            '',
            `/dashboard/customer/chat?orderId=${room.orderId || room.order?.id}`
          )
        } else {
          window.history.replaceState(null, '', '/dashboard/customer/chat')
        }
      }
    },
    [fetchMessages]
  )

  // Auto-open and initialize direct store room from URL parameters
  useEffect(() => {
    if (status !== 'authenticated' || (!paramStoreId && !paramOrderId)) return

    const safeParam = (p: string | null) => {
      if (!p) return undefined
      try {
        return decodeURIComponent(p)
      } catch {
        return p
      }
    }

    const resolvedProductName = safeParam(paramProductName)
    const resolvedVariantName = safeParam(paramVariantName)
    const resolvedProductImage = safeParam(paramProductImage)
    const resolvedProductPrice = paramProductPrice
      ? Number(paramProductPrice)
      : undefined

    const initKey = `${paramOrderId || ''}_${paramStoreId || ''}_${paramProductId || ''}_${resolvedProductName || ''}_${resolvedVariantName || ''}`
    if (lastInitializedKeyRef.current === initKey) return
    lastInitializedKeyRef.current = initKey

    if (paramProductId || resolvedProductName) {
      setActiveProductContext({
        productId: paramProductId || undefined,
        productName: resolvedProductName,
        productPrice: resolvedProductPrice,
        productImage: resolvedProductImage,
        variantName: resolvedVariantName,
      })
    }

    async function initStoreRoom() {
      try {
        setIsInitializingRoom(true)
        const res = await fetch('/api/customer/chat/store-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: paramOrderId || undefined,
            storeId: paramStoreId || undefined,
            productId: paramProductId || undefined,
            productName: resolvedProductName,
            productPrice: resolvedProductPrice,
            variantName: resolvedVariantName,
            productImage: resolvedProductImage,
          }),
        })

        if (res.ok) {
          const data = await res.json()

          // Construct target room object directly
          const targetRoom: ChatRoom = {
            id: data.roomId,
            customerId: session?.user?.id,
            storeId: data.store?.id || paramStoreId || null,
            claimedById: data.claimedBy?.id || null,
            claimedBy: data.claimedBy || null,
            orderId: data.orderId || null,
            lastMessageAt: new Date().toISOString(),
            type: 'admin',
            store: data.store,
            order: data.order || null,
            messages:
              data.messages && data.messages.length > 0
                ? [data.messages[data.messages.length - 1]]
                : [],
            _count: { messages: 0 },
          }

          // Immediately inject messages from backend response into state
          if (data.messages && Array.isArray(data.messages)) {
            loadedRoomIdRef.current = data.roomId
            setMessages(data.messages)
            setShouldScrollToBottom(true)
            setMessagesLoading(false)
          }

          // Prevent auto-select from overriding this room
          hasAutoSelectedRef.current = true

          // Set active room and open view
          setSelectedRoom(targetRoom)
          setShowChatOnMobile(true)

          // Immediately inject targetRoom into rooms list state so sidebar is instantly rendered
          setRooms((prev) => {
            const exists = prev.some((r) => r.id === targetRoom.id)
            if (exists) {
              return prev.map((r) => (r.id === targetRoom.id ? targetRoom : r))
            }
            return [targetRoom, ...prev]
          })
          setLoading(false)

          // Refresh rooms list in background
          fetchRooms(true)

          // Clean URL params via window.history and router.replace
          // Preserve ?orderId= in URL if it was opened via order
          if (typeof window !== 'undefined') {
            if (paramOrderId) {
              window.history.replaceState(
                null,
                '',
                `/dashboard/customer/chat?orderId=${paramOrderId}`
              )
            } else {
              window.history.replaceState(null, '', '/dashboard/customer/chat')
              router.replace('/dashboard/customer/chat', { scroll: false })
            }
          }
          lastInitializedKeyRef.current = null
        } else {
          lastInitializedKeyRef.current = null
        }
      } catch (error) {
        lastInitializedKeyRef.current = null
        console.error('Error auto-opening store room:', error)
        toast.error('Gagal menghubungkan ke chat toko')
      } finally {
        setIsInitializingRoom(false)
      }
    }

    initStoreRoom()
  }, [
    status,
    paramOrderId,
    paramStoreId,
    paramProductId,
    paramProductName,
    paramProductPrice,
    paramVariantName,
    paramProductImage,
    fetchRooms,
    session?.user?.id,
    router,
  ])

  const handleBackToList = () => {
    setShowChatOnMobile(false)
  }

  // Send message with optimistic instant feedback without any page reload
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom || sending) return

    const content = messageInput.trim()
    setMessageInput('')
    setSending(true)
    isSendingRef.current = true // Block polling overwrite while message is in transit

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

      // Update room list locally first to reflect instant last message
      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoom.id
            ? {
                ...r,
                lastMessageAt: new Date().toISOString(),
                messages: [
                  {
                    content,
                    messageType: 'text',
                    createdAt: new Date().toISOString(),
                    senderId: session?.user?.id,
                  },
                ],
              }
            : r
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Gagal mengirim pesan')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setMessageInput(content)
    } finally {
      setSending(false)
      // Cooldown 1500ms sebelum polling diizinkan fetch lagi
      // Ini memberikan waktu cukup untuk DB commit + response kembali ke client
      // sehingga polling tidak overwrite optimistic message dengan data lama
      setTimeout(() => {
        isSendingRef.current = false
      }, 1500)
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
    const trimmed = message.content?.trim() || ''

    // 1. Product reference / inquiry from customer
    if (
      message.messageType === 'product_reference' ||
      (trimmed.startsWith('{') &&
        (trimmed.includes('"productName"') ||
          trimmed.includes('"type":"product_reference"')))
    ) {
      try {
        const p = JSON.parse(trimmed)
        const name = p.productName || p.name || 'Produk'
        return `📦 Tanya: ${name}`
      } catch {
        return '📦 Produk Ditanyakan'
      }
    }

    // 2. Product recommendation from store
    if (
      message.messageType === 'product' ||
      (trimmed.startsWith('{') &&
        (trimmed.includes('"name"') || trimmed.includes('"productName"')) &&
        (trimmed.includes('"price"') || trimmed.includes('"productPrice"')))
    ) {
      try {
        const p = JSON.parse(trimmed)
        const name = p.productName || p.name || 'Produk'
        return `📦 Rekomendasi: ${name}`
      } catch {
        return '📦 Rekomendasi Gadget'
      }
    }

    // 3. Order detail
    if (
      message.messageType === 'order' ||
      (trimmed.startsWith('{') && trimmed.includes('"orderNumber"'))
    ) {
      try {
        const o = JSON.parse(trimmed)
        return `📋 Pesanan #${o.orderNumber}`
      } catch {
        return '📋 Rincian Pesanan'
      }
    }

    // 4. Media attachments (check mediaUrl properly)
    if (
      isVideoMedia(message.mediaUrl, message.mediaType, message.messageType)
    ) {
      return '🎥 Lampiran Video'
    }
    if (
      isImageMedia(message.mediaUrl, message.mediaType, message.messageType)
    ) {
      return '📷 Lampiran Foto'
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

  const activeStoreLogo =
    selectedRoom?.claimedBy?.image ||
    activeStore?.logo ||
    selectedRoom?.order?.claimedBy?.image ||
    null

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-[100dvh] h-screen flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        <Navbar variant="light" />
        <div className="flex flex-1 items-center justify-center pt-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] h-screen flex-col overflow-hidden bg-slate-50/50 font-sans dark:bg-slate-950">
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

      <main className="flex flex-1 flex-col overflow-hidden pb-2 pt-16 sm:pb-4 sm:pt-20">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col px-2 sm:px-6 lg:px-8">
          {/* Single-Surface Bento Chat Hub Container */}
          <div className="shadow-xs grid h-full min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl lg:grid-cols-12">
            {/* Left Pane: Integrated Control & Conversation List (4 Cols) */}
            <div
              className={`flex h-full min-h-0 flex-col overflow-hidden border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-4 xl:col-span-4 ${
                showChatOnMobile ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Integrated Sidebar Header */}
              <div className="shrink-0 space-y-2.5 border-b border-slate-100 p-3 dark:border-slate-800 sm:p-3.5">
                {/* Search Capsule */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari toko, no. pesanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Segmented Filter Pills */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'UNREAD', label: 'Belum Dibaca' },
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

              {/* Room List Scrollable */}
              <div className="min-h-0 flex-1 divide-y divide-slate-50 overflow-y-auto dark:divide-slate-800/60">
                {filteredRooms.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 dark:bg-slate-800">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Belum Ada Percakapan
                    </p>
                    <p className="mt-0.5 max-w-[180px] text-[11px] text-slate-400">
                      Mulai chat melalui rincian pesanan Anda.
                    </p>
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id
                    const storeObj = room.order?.store || room.store
                    const storeLogo =
                      room.claimedBy?.image ||
                      storeObj?.logo ||
                      room.order?.claimedBy?.image ||
                      null
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
                        className={`relative flex w-full items-start gap-3 p-3.5 text-left transition-all ${
                          isSelected
                            ? 'bg-slate-50/90 dark:bg-slate-800/90'
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Minimalist Left Accent Pill (No harsh bounding border) */}
                        {isSelected && (
                          <div className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-slate-950 dark:bg-orange-500" />
                        )}

                        {/* Avatar Squircle */}
                        <div className="relative shrink-0">
                          {storeLogo ? (
                            <img
                              src={storeLogo}
                              alt={title}
                              className="shadow-2xs h-10 w-10 rounded-2xl border border-slate-200/60 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-100 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                              {title.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {(room._count?.messages || 0) > 0 && (
                            <span className="shadow-2xs absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                              {room._count?.messages}
                            </span>
                          )}
                        </div>

                        {/* Room Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {title}
                            </h4>
                            <span className="shrink-0 text-[10px] font-medium text-slate-400">
                              {formatTime(room.lastMessageAt)}
                            </span>
                          </div>

                          {orderNumber && (
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                #{orderNumber}
                              </span>
                              {room.order?.status && (
                                <span className="py-0.2 rounded bg-slate-100 px-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {room.order.status}
                                </span>
                              )}
                            </div>
                          )}

                          {!orderNumber && room.claimedBy?.name && (
                            <div className="mt-0.5 flex items-center gap-1">
                              <span className="truncate text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                • Admin: {room.claimedBy.name}
                              </span>
                            </div>
                          )}

                          <p className="mt-1 truncate text-[11px] font-normal text-slate-500 dark:text-slate-400">
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
              className={`flex h-full min-h-0 flex-col overflow-hidden bg-slate-50/40 dark:bg-slate-950/40 lg:col-span-8 xl:col-span-8 ${
                !showChatOnMobile ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {isInitializingRoom ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-orange-500" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Menghubungkan ke Toko...
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Membuka percakapan dan menyiapkan rincian produk
                  </p>
                </div>
              ) : selectedRoom ? (
                <>
                  {/* Chat Top Header */}
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        onClick={handleBackToList}
                        className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {activeStoreLogo ? (
                        <img
                          src={activeStoreLogo}
                          alt={activeStoreTitle}
                          className="shadow-2xs h-10 w-10 shrink-0 rounded-2xl border border-slate-200/60 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-100 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                          {activeStoreTitle.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                            {activeStoreTitle}
                          </h3>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Online
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-slate-400">
                          {selectedRoom.order ? (
                            `Pesanan #${selectedRoom.order.orderNumber}`
                          ) : selectedRoom.claimedBy?.name ? (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              Admin Toko: {selectedRoom.claimedBy.name}
                            </span>
                          ) : (
                            selectedRoom.store?.companyName ||
                            'Customer Support & Sales Toko'
                          )}
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
                        {selectedRoom.order.status && (
                          <span className="py-0.2 rounded bg-blue-100/80 px-1.5 text-[9.5px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                            {selectedRoom.order.status}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/dashboard/customer/orders/${selectedRoom.order.id}`}
                        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                      >
                        <span>Lihat Rincian</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  {/* Messages Bubble Canvas */}
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
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
                          Tanyakan ketersediaan varian gadget, status resi, atau
                          konsultasi servis teknisi.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender.id === session?.user?.id
                        const isVideo = isVideoMedia(
                          msg.mediaUrl,
                          msg.mediaType,
                          msg.messageType
                        )
                        const isImage = isImageMedia(
                          msg.mediaUrl,
                          msg.mediaType,
                          msg.messageType
                        )
                        const isMedia = isVideo || isImage

                        const formattedTime = new Date(
                          msg.createdAt
                        ).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })

                        const contentTrimmed = msg.content?.trim() || ''

                        // Pre-parse JSON content once to detect type field
                        let parsedContent: Record<string, unknown> | null = null
                        if (contentTrimmed.startsWith('{')) {
                          try {
                            parsedContent = JSON.parse(contentTrimmed)
                          } catch {
                            parsedContent = null
                          }
                        }

                        const isOrder =
                          msg.messageType === 'order' ||
                          parsedContent?.orderNumber !== undefined

                        const isProduct =
                          msg.messageType === 'product' ||
                          msg.messageType === 'product_reference' ||
                          parsedContent?.type === 'product_reference' ||
                          (parsedContent !== null &&
                            (parsedContent.productName !== undefined ||
                              parsedContent.name !== undefined) &&
                            (parsedContent.productPrice !== undefined ||
                              parsedContent.price !== undefined))

                        const senderAvatar =
                          msg.sender.image ||
                          selectedRoom?.claimedBy?.image ||
                          activeStoreLogo ||
                          null
                        const senderName =
                          msg.sender.name ||
                          (msg.sender.role === 'ADMIN' ||
                          msg.sender.role === 'SUPER_ADMIN' ||
                          msg.sender.role === 'STORE_ADMIN'
                            ? 'Admin Toko'
                            : 'CS Toko')

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isMe && (
                              <div className="mb-1 shrink-0">
                                {senderAvatar ? (
                                  <img
                                    src={senderAvatar}
                                    alt={senderName}
                                    className="shadow-2xs h-8 w-8 rounded-full border border-slate-200/80 object-cover dark:border-slate-700"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 bg-orange-100 text-xs font-bold text-orange-700 dark:border-slate-700 dark:bg-slate-800 dark:text-orange-400">
                                    {senderName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            )}
                            {isMedia ? (
                              /* Full-Bleed Modern Media Bubble (Apple/Telegram Style) */
                              <div className="shadow-xs group relative max-w-[85%] overflow-hidden rounded-2xl border border-slate-200/80 bg-black dark:border-slate-800 sm:max-w-[70%]">
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
                                      className="clean-video-player block max-h-[300px] w-full max-w-[280px] rounded-2xl bg-black object-cover sm:max-h-[360px] sm:max-w-[340px]"
                                    />
                                    {/* Floating Theater Mode Button */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFullscreenMedia({
                                          url: msg.mediaUrl!,
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
                                        url: msg.mediaUrl!,
                                        type: 'image',
                                      })
                                    }
                                    className="relative cursor-pointer"
                                  >
                                    <img
                                      src={msg.mediaUrl!}
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
                                  {isMe && (
                                    <CheckCheck className="inline h-3 w-3 text-blue-400" />
                                  )}
                                </div>
                              </div>
                            ) : isProduct ? (
                              /* Standalone Luxury Product Card (High Quality Visual Card) */
                              (() => {
                                try {
                                  const p: Record<string, unknown> =
                                    parsedContent ?? JSON.parse(msg.content)
                                  const prodId =
                                    (p.productId as string) || (p.id as string)
                                  const prodName =
                                    (p.productName as string) ||
                                    (p.name as string) ||
                                    'Produk Gadget'
                                  const prodPrice =
                                    p.productPrice !== undefined
                                      ? p.productPrice
                                      : p.price
                                  const rawImage =
                                    p.productImage || p.image || null
                                  const prodImage = Array.isArray(rawImage)
                                    ? (rawImage[0] as string)
                                    : typeof rawImage === 'string' &&
                                        rawImage.trim() !== ''
                                      ? rawImage
                                      : null
                                  const isReference =
                                    p.type === 'product_reference' ||
                                    msg.messageType === 'product_reference'

                                  return (
                                    <div className="max-w-[88%] space-y-3 rounded-3xl border border-slate-200/90 bg-white p-4 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:max-w-[380px]">
                                      {/* Top Header Info Pill */}
                                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                                          <Package className="h-3 w-3" />
                                          {isReference
                                            ? 'Produk Ditanyakan'
                                            : 'Rekomendasi Toko'}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                          <span>{formattedTime}</span>
                                          {isMe && (
                                            <CheckCheck className="inline h-3 w-3 text-blue-500" />
                                          )}
                                        </div>
                                      </div>

                                      {/* Main Product Snippet */}
                                      <div className="flex items-center gap-3">
                                        {prodImage ? (
                                          <img
                                            src={prodImage as string}
                                            alt={prodName}
                                            className="h-16 w-16 shrink-0 rounded-2xl border border-slate-100 bg-slate-50 object-cover p-1 dark:border-slate-800 dark:bg-slate-800"
                                          />
                                        ) : (
                                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-orange-200/60 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/40">
                                            <Package className="h-7 w-7 text-orange-500" />
                                          </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                          {typeof p.brand === 'string' &&
                                            p.brand && (
                                              <span className="text-[9.5px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                                {p.brand}
                                              </span>
                                            )}
                                          <p
                                            className="truncate text-xs font-bold text-slate-900 dark:text-white"
                                            title={prodName}
                                          >
                                            {prodName}
                                          </p>
                                          {typeof p.variantName === 'string' &&
                                            p.variantName && (
                                              <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                Varian: {p.variantName}
                                              </p>
                                            )}
                                          <p className="mt-0.5 font-mono text-sm font-black text-orange-600 dark:text-orange-400 sm:text-base">
                                            Rp{' '}
                                            {(
                                              Number(prodPrice) || 0
                                            ).toLocaleString('id-ID')}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Footer CTA */}
                                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                                        <span className="text-[10.5px] text-slate-400">
                                          {isMe
                                            ? 'Pertanyaan Anda'
                                            : activeStoreTitle || 'Toko Resmi'}
                                        </span>
                                        {prodId && (
                                          <a
                                            href={`/gadget/${prodId}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="shadow-2xs inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                          >
                                            <span>Lihat Unit</span>
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )
                                } catch {
                                  return (
                                    <div className="shadow-2xs max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 sm:max-w-[70%]">
                                      <p className="whitespace-pre-wrap">
                                        {msg.content}
                                      </p>
                                    </div>
                                  )
                                }
                              })()
                            ) : (
                              /* Standard Text Bubble */
                              <div
                                className={`shadow-2xs max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:max-w-[70%] ${
                                  isMe
                                    ? 'rounded-tr-xs bg-slate-950 text-white dark:bg-blue-600'
                                    : 'rounded-tl-xs border border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {!isMe && (
                                  <div className="mb-1 flex items-center gap-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                      {senderName}
                                    </p>
                                  </div>
                                )}
                                {isOrder ? (
                                  (() => {
                                    try {
                                      const orderData = JSON.parse(msg.content)
                                      return (
                                        <div className="shadow-2xs max-w-sm space-y-2.5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                            <div className="flex min-w-0 items-center gap-1.5">
                                              <ShoppingBag className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                              <span className="truncate font-mono text-xs font-bold">
                                                #{orderData.orderNumber}
                                              </span>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                              {orderData.status || 'Pesanan'}
                                            </span>
                                          </div>

                                          {orderData.items &&
                                            orderData.items.length > 0 && (
                                              <div className="space-y-2">
                                                {orderData.items.map(
                                                  (it: any, idx: number) => {
                                                    const name =
                                                      it.product?.name ||
                                                      it.rentalItem?.name ||
                                                      it.service?.name ||
                                                      it.name ||
                                                      'Unit Gadget'
                                                    const img =
                                                      it.product?.images?.[0] ||
                                                      it.rentalItem
                                                        ?.images?.[0] ||
                                                      it.image
                                                    return (
                                                      <div
                                                        key={idx}
                                                        className="flex items-center gap-2.5"
                                                      >
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
                                                            {it.quantity || 1}x
                                                            • Rp{' '}
                                                            {(
                                                              it.price || 0
                                                            ).toLocaleString(
                                                              'id-ID'
                                                            )}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    )
                                                  }
                                                )}
                                              </div>
                                            )}

                                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                                            <span className="text-[11px] text-slate-500">
                                              Total Pesanan:
                                            </span>
                                            <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 sm:text-sm">
                                              Rp{' '}
                                              {orderData.total?.toLocaleString(
                                                'id-ID'
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    } catch {
                                      return (
                                        <p className="whitespace-pre-wrap break-words break-all text-xs leading-relaxed sm:text-[13px]">
                                          {msg.content}
                                        </p>
                                      )
                                    }
                                  })()
                                ) : (
                                  <p className="whitespace-pre-wrap break-words break-all text-xs leading-relaxed sm:text-[13px]">
                                    {msg.content}
                                  </p>
                                )}

                                <div
                                  className={`mt-1.5 flex items-center justify-end gap-1 text-[9.5px] font-medium ${
                                    isMe
                                      ? 'text-slate-400 dark:text-blue-200'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  <span>{formattedTime}</span>
                                  {isMe && (
                                    <CheckCheck className="inline h-3 w-3 text-blue-400" />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Contextual Pinned Product Bar if customer entered from a product or room has active product context */}
                  {activeProductContext && (
                    <div className="flex items-center justify-between gap-3 border-t border-orange-100 bg-orange-50/80 px-4 py-2.5 dark:border-orange-900/40 dark:bg-orange-950/30">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {activeProductContext.productImage ? (
                          <img
                            src={activeProductContext.productImage}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-xl border border-orange-200/80 bg-white object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50">
                            <Package className="h-5 w-5 text-orange-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">
                              Membahas:
                            </span>
                            <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {activeProductContext.productName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            {activeProductContext.variantName && (
                              <span className="truncate text-slate-500 dark:text-slate-400">
                                Varian: {activeProductContext.variantName}
                              </span>
                            )}
                            {activeProductContext.productPrice !==
                              undefined && (
                              <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                                Rp{' '}
                                {activeProductContext.productPrice.toLocaleString(
                                  'id-ID'
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMessageInput(
                              `Halo admin, apakah unit ${activeProductContext.productName}${activeProductContext.variantName ? ` (${activeProductContext.variantName})` : ''} ini masih ready stok?`
                            )
                          }}
                          className="shadow-2xs hidden cursor-pointer items-center gap-1 rounded-full border border-orange-200 bg-white px-3 py-1 text-[10.5px] font-bold text-orange-600 transition hover:bg-orange-50 dark:border-orange-900 dark:bg-slate-900 dark:text-orange-300 sm:inline-flex"
                        >
                          <span>Tanya Stok</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveProductContext(null)}
                          className="p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                          title="Tutup ringkasan"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Message Input Bar */}
                  <div className="shrink-0 border-t border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-3.5">
                    <div className="flex items-center gap-2">
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
                            handleSendMessage()
                          }
                        }}
                        placeholder="Ketik pesan ke admin toko..."
                        className="flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />

                      <button
                        type="button"
                        onClick={handleSendMessage}
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
                    Pilih Percakapan Toko
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    Pilih percakapan dari daftar di sebelah kiri untuk mulai
                    berkirim pesan dengan toko.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CustomerChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
          <Navbar variant="light" />
          <div className="flex flex-1 items-center justify-center pt-24">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        </div>
      }
    >
      <CustomerChatContent />
    </React.Suspense>
  )
}
