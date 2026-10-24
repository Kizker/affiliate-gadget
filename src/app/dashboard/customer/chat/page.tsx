'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layouts'
import { ChevronLeft, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { isStoreOperational } from '@/lib/chat-status'
import { processMediaUploadFile } from '@/lib/media-upload-client'

import dynamic from 'next/dynamic'

import {
  ChatRoom,
  Message,
  PinnedOrderContext,
  ActiveServiceContext,
  ActiveProductContext,
  ActiveOrderContext,
  ChatSidebar,
  ChatHeader,
  ChatPinnedBanner,
  ChatMessageList,
  ChatOrderContextBar,
  ChatServiceContextBar,
  ChatProductContextBar,
  ChatInputBar,
} from '@/components/customer/chat'

const ChatMediaModal = dynamic(
  () =>
    import('@/components/customer/chat/chat-media-modal').then(
      (mod) => mod.ChatMediaModal
    ),
  { ssr: false }
)

function CustomerChatContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const paramOrderId = searchParams.get('orderId')
  const paramOrderNumber = searchParams.get('orderNumber')
  const paramStoreId = searchParams.get('storeId')
  const paramType = searchParams.get('type')
  const paramMitraId = searchParams.get('mitraId')
  const paramMitraName = searchParams.get('mitraName')
  const paramMitraCity = searchParams.get('mitraCity')
  const paramMitraImage = searchParams.get('mitraImage')
  const paramProductId = searchParams.get('productId')
  const paramProductName = searchParams.get('productName')
  const paramProductPrice = searchParams.get('productPrice')
  const paramVariantName = searchParams.get('variantName')
  const paramProductImage = searchParams.get('productImage')
  const paramReturnId = searchParams.get('returnId')
  const paramReturnReason = searchParams.get('returnReason')
  const paramReturnStatus = searchParams.get('returnStatus')
  const paramReturnType = searchParams.get('returnType')
  const paramServiceContext =
    searchParams.get('serviceContext') || searchParams.get('initialMessage')

  const [activeServiceContext, setActiveServiceContext] =
    useState<ActiveServiceContext | null>(null)
  const [activeProductContext, setActiveProductContext] =
    useState<ActiveProductContext | null>(null)
  const [activeOrderContext, setActiveOrderContext] =
    useState<ActiveOrderContext | null>(null)

  const [isInitializingRoom, setIsInitializingRoom] = useState(false)
  const lastInitializedKeyRef = useRef<string | null>(null)
  const loadedRoomIdRef = useRef<string | null>(null)
  const hasAutoSelectedRef = useRef(false)
  const isSendingRef = useRef(false)
  const sentContextsRef = useRef<Set<string>>(new Set())

  // Melacak apakah chat dibuka langsung dari halaman eksternal (mitra servis, toko, produk, pesanan)
  const isDirectEntryRef = useRef<boolean>(
    Boolean(
      paramMitraId ||
      paramStoreId ||
      paramProductId ||
      paramOrderId ||
      paramReturnId ||
      paramServiceContext
    )
  )
  const originMitraIdRef = useRef<string | null>(paramMitraId)
  const originStoreIdRef = useRef<string | null>(paramStoreId)
  const originProductIdRef = useRef<string | null>(paramProductId)
  const originOrderIdRef = useRef<string | null>(paramOrderId)

  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)

  const [searchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)
  const showChatOnMobileRef = useRef<boolean>(false)
  const chatRoomPushedRef = useRef<boolean>(false)

  // Sinkronisasi ref showChatOnMobile
  useEffect(() => {
    showChatOnMobileRef.current = showChatOnMobile
  }, [showChatOnMobile])

  // Bersihkan history state chatRoomMobile jika halaman dimuat ulang secara segar
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history.state?.chatRoomMobile) {
      window.history.replaceState(null, '', window.location.href)
    }
  }, [])

  // Menangani gestur kembali dan maju bawaan handphone (swipe back / Android back gesture)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Jika percakapan dibuka langsung dari halaman eksternal (mitra, toko, dll),
      // biarkan browser kembali alami ke halaman pemanggil
      if (isDirectEntryRef.current) {
        return
      }

      if (event.state?.chatRoomMobile) {
        // Gestur maju kembali ke ruang obrolan
        chatRoomPushedRef.current = true
        setShowChatOnMobile(true)
      } else if (showChatOnMobileRef.current) {
        // Gestur kembali dari ruang chat ke daftar percakapan (room list)
        chatRoomPushedRef.current = false
        setShowChatOnMobile(false)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const [roomFilter, setRoomFilter] = useState<'ALL' | 'UNREAD' | 'ORDER'>(
    'ALL'
  )

  // Photo & Video Media upload & Fullscreen Modal
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [fullscreenMedia, setFullscreenMedia] = useState<{
    url: string
    type: 'image' | 'video'
  } | null>(null)

  const [activePinnedOrder, setActivePinnedOrder] =
    useState<PinnedOrderContext | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const selectedRoomRef = useRef<ChatRoom | null>(null)
  const previousMessagesCountRef = useRef<number>(0)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      const fullUrl =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/dashboard/customer/chat'
      router.push(`/login?callbackUrl=${encodeURIComponent(fullUrl)}`)
    }
  }, [status, router])

  // Fetch all chat rooms
  const fetchRooms = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) {
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
      !paramMitraId &&
      !paramOrderId &&
      rooms.length > 0 &&
      !selectedRoom &&
      typeof window !== 'undefined' &&
      window.innerWidth >= 1024
    ) {
      hasAutoSelectedRef.current = true
      setSelectedRoom(rooms[0])
    }
  }, [rooms, paramStoreId, paramMitraId, paramOrderId, selectedRoom])

  // Fetch messages for selected room
  const fetchMessages = useCallback(
    async (room: ChatRoom, isPolling = false) => {
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
            if (isPolling && newMsgs.length < prev.length) {
              return prev
            }

            if (prev.length !== newMsgs.length) {
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
        loadedRoomIdRef.current = null
        return
      }
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

  // Real-time polling for new messages in active room (4s interval, visible tabs only)
  useEffect(() => {
    if (selectedRoom?.id) {
      // 4s initial delay allows page paint and initial hydration to settle cleanly
      const timeoutId = setTimeout(() => {
        pollingRef.current = setInterval(() => {
          if (
            typeof document !== 'undefined' &&
            document.visibilityState !== 'visible'
          ) {
            return
          }
          if (selectedRoomRef.current) {
            fetchMessages(selectedRoomRef.current, true)
          }
        }, 4000)
      }, 4000)

      return () => {
        clearTimeout(timeoutId)
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
        }
      }
    }
  }, [selectedRoom?.id, fetchMessages])

  // Background room list polling (8s interval, visible tabs only)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const interval = setInterval(() => {
        if (
          typeof document !== 'undefined' &&
          document.visibilityState !== 'visible'
        ) {
          return
        }
        fetchRooms(true)
      }, 8000)

      return () => clearInterval(interval)
    }, 6000)

    return () => clearTimeout(timeoutId)
  }, [fetchRooms])

  // Helper to scroll messages to bottom and reset window scroll
  const scrollToBottom = useCallback((smooth = false) => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
    const container = messagesContainerRef.current
    if (container) {
      if (smooth) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      } else {
        container.scrollTop = container.scrollHeight
      }
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      })
    }
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom(false)
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom, scrollToBottom])

  // Dedicated effect: Whenever room is selected, room finishes initializing, or messages change,
  // ensure the chat view is instantly pinned to the bottom (latest messages + input bar visible)
  useEffect(() => {
    if (!selectedRoom || isInitializingRoom) return

    // Immediate scroll
    scrollToBottom(false)

    // Repeated ticks for DOM layout / image settlement
    const rafId = requestAnimationFrame(() => {
      scrollToBottom(false)
    })
    const t1 = setTimeout(() => scrollToBottom(false), 60)
    const t2 = setTimeout(() => scrollToBottom(false), 200)
    const t3 = setTimeout(() => scrollToBottom(false), 500)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [
    selectedRoom?.id,
    isInitializingRoom,
    messagesLoading,
    messages.length,
    showChatOnMobile,
    activeServiceContext,
    activeOrderContext,
    activeProductContext,
    scrollToBottom,
  ])

  const handleSelectRoom = useCallback(
    (room: ChatRoom) => {
      // Pemilihan manual dari daftar percakapan menonaktifkan mode direct-entry
      isDirectEntryRef.current = false
      loadedRoomIdRef.current = room.id
      setActiveProductContext(null)
      setActiveOrderContext(null)
      setActiveServiceContext(null)
      setSelectedRoom(room)
      setShowChatOnMobile(true)
      setShouldScrollToBottom(true)
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

      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 1024
        if (isMobile) {
          // Push state ke history browser agar gestur kembali handphone menutup obrolan ke daftar chat
          window.history.pushState(
            { chatRoomMobile: true, roomId: room.id },
            '',
            '/dashboard/customer/chat'
          )
          chatRoomPushedRef.current = true
        } else {
          window.history.replaceState(null, '', '/dashboard/customer/chat')
        }
      }
    },
    [fetchMessages]
  )

  // Extract all order contexts present in this conversation
  const conversationOrderContexts = useMemo<PinnedOrderContext[]>(() => {
    if (!selectedRoom) return []
    const list: PinnedOrderContext[] = []
    const seenOrderNumbers = new Set<string>()

    for (const msg of messages) {
      const contentTrimmed = msg.content?.trim() || ''
      let parsed: any = null
      if (contentTrimmed.startsWith('{')) {
        try {
          parsed = JSON.parse(contentTrimmed)
        } catch {}
      }

      const isReturn =
        msg.messageType === 'return_reference' ||
        parsed?.type === 'return_reference' ||
        Boolean(parsed?.returnReason)
      const isOrder =
        isReturn ||
        msg.messageType === 'order' ||
        msg.messageType === 'order_reference' ||
        parsed?.type === 'order' ||
        parsed?.type === 'order_reference' ||
        Boolean(parsed?.orderNumber)

      if (isOrder && parsed) {
        const num = parsed.orderNumber || parsed.orderNum
        if (num && !seenOrderNumbers.has(num)) {
          seenOrderNumbers.add(num)
          list.push({
            messageId: msg.id,
            orderId:
              parsed.orderId ||
              selectedRoom.order?.id ||
              activeOrderContext?.orderId,
            orderNumber: num,
            total:
              Number(parsed.orderTotal) ||
              Number(parsed.total) ||
              Number(parsed.productPrice) ||
              selectedRoom.order?.total ||
              activeOrderContext?.total ||
              0,
            status:
              parsed.orderStatus ||
              parsed.status ||
              selectedRoom.order?.status ||
              activeOrderContext?.status ||
              'PAID',
            productName: parsed.productName || null,
            isReturn,
            returnReason: parsed.returnReason || null,
            returnStatus: parsed.returnStatus || null,
          })
        }
      }
    }

    if (
      activeOrderContext?.orderNumber &&
      !seenOrderNumbers.has(activeOrderContext.orderNumber)
    ) {
      seenOrderNumbers.add(activeOrderContext.orderNumber)
      list.unshift({
        orderId: activeOrderContext.orderId,
        orderNumber: activeOrderContext.orderNumber,
        total: activeOrderContext.total,
        status: activeOrderContext.status,
        productName: activeOrderContext.productName,
        isReturn: Boolean(activeOrderContext.returnRequest),
        returnReason: activeOrderContext.returnRequest?.reason,
        returnStatus: activeOrderContext.returnRequest?.status,
      })
    }

    return list
  }, [selectedRoom, messages, activeOrderContext])

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
      const thresholdY = containerRect.top + 120

      let currentContext = conversationOrderContexts[0]

      for (const ctx of conversationOrderContexts) {
        if (!ctx.messageId) continue
        const el = document.getElementById(`chat-context-msg-${ctx.messageId}`)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= thresholdY) {
            currentContext = ctx
          }
        }
      }

      setActivePinnedOrder((prev) => {
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
      el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')
      }, 2000)
    }
  }

  // Auto-open and initialize direct store room from URL parameters
  useEffect(() => {
    const isCsParam =
      paramType === 'cs' ||
      paramStoreId === 'superadmin' ||
      paramStoreId === 'cs'

    if (
      status !== 'authenticated' ||
      (!paramStoreId && !paramOrderId && !paramMitraId && !isCsParam)
    )
      return

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

    const resolvedOrderNumber = safeParam(paramOrderNumber)
    const resolvedReturnReason = safeParam(paramReturnReason)
    const resolvedReturnStatus = safeParam(paramReturnStatus)
    const resolvedReturnType = safeParam(paramReturnType)
    const resolvedServiceContext = safeParam(paramServiceContext)
    const resolvedMitraName = safeParam(paramMitraName)
    const resolvedMitraCity = safeParam(paramMitraCity)
    const resolvedMitraImage = safeParam(paramMitraImage)

    const initKey = `${paramType || ''}_${paramOrderId || ''}_${paramStoreId || ''}_${paramMitraId || ''}_${paramProductId || ''}_${resolvedProductName || ''}_${resolvedMitraName || ''}_${resolvedVariantName || ''}_${resolvedReturnReason || ''}_${resolvedServiceContext || ''}`
    if (lastInitializedKeyRef.current === initKey) return
    lastInitializedKeyRef.current = initKey

    const isAlreadySent =
      (paramOrderId && sentContextsRef.current.has(paramOrderId)) ||
      (resolvedOrderNumber &&
        sentContextsRef.current.has(resolvedOrderNumber)) ||
      (paramProductId && sentContextsRef.current.has(paramProductId)) ||
      (paramMitraId && sentContextsRef.current.has(paramMitraId))

    if (!isAlreadySent) {
      if (paramOrderId) {
        setActiveOrderContext({
          orderId: paramOrderId,
          orderNumber: resolvedOrderNumber,
          productName: resolvedProductName,
          productImage: resolvedProductImage,
          productPrice: resolvedProductPrice,
          returnRequest: resolvedReturnReason
            ? {
                reason: resolvedReturnReason,
                status: resolvedReturnStatus || 'PENDING',
                type: resolvedReturnType || 'REFUND',
              }
            : null,
        })
        setActiveProductContext(null)
        setActiveServiceContext(null)
      } else if (paramMitraId || resolvedMitraName) {
        setActiveServiceContext({
          mitraId: paramMitraId || '',
          mitraName: resolvedMitraName || 'Mitra Servis',
          mitraCity: resolvedMitraCity,
          mitraImage: resolvedMitraImage,
        })
        setActiveOrderContext(null)
        setActiveProductContext(null)
      } else if (paramProductId || resolvedProductName) {
        setActiveProductContext({
          productId: paramProductId || undefined,
          productName: resolvedProductName,
          productPrice: resolvedProductPrice,
          productImage: resolvedProductImage,
          variantName: resolvedVariantName,
        })
        setActiveOrderContext(null)
        setActiveServiceContext(null)
      } else {
        setActiveOrderContext(null)
        setActiveProductContext(null)
        setActiveServiceContext(null)
      }
    } else {
      setActiveOrderContext(null)
      setActiveProductContext(null)
      setActiveServiceContext(null)
    }

    async function initStoreRoom() {
      try {
        setIsInitializingRoom(true)

        const isMitraRoom = !!paramMitraId && !paramStoreId && !paramOrderId
        const endpoint = isMitraRoom
          ? '/api/customer/chat/mitra-room'
          : '/api/customer/chat/store-room'

        const fetchBody = isMitraRoom
          ? JSON.stringify({
              mitraId: paramMitraId,
              serviceContext: resolvedServiceContext || undefined,
            })
          : JSON.stringify({
              isCs: isCsParam,
              orderId: paramOrderId || undefined,
              orderNumber: resolvedOrderNumber || undefined,
              returnId: paramReturnId || undefined,
              returnReason: resolvedReturnReason || undefined,
              returnStatus: resolvedReturnStatus || undefined,
              returnType: resolvedReturnType || undefined,
              storeId: paramStoreId || undefined,
              productId: paramProductId || undefined,
              productName: resolvedProductName,
              productPrice: resolvedProductPrice,
              variantName: resolvedVariantName,
              productImage: resolvedProductImage,
            })

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: fetchBody,
        })

        if (res.ok) {
          const data = await res.json()

          const targetRoom: ChatRoom = {
            id: data.roomId,
            customerId: session?.user?.id,
            storeId: data.store?.id || paramStoreId || null,
            claimedById: data.claimedBy?.id || null,
            claimedBy: data.claimedBy || null,
            orderId: paramOrderId ? data.orderId || null : null,
            lastMessageAt: new Date().toISOString(),
            type: 'admin',
            store: data.store,
            order: paramOrderId ? data.order || null : null,
            messages:
              data.messages && data.messages.length > 0
                ? [data.messages[data.messages.length - 1]]
                : [],
            _count: { messages: 0 },
          }

          if (data.messages && Array.isArray(data.messages)) {
            loadedRoomIdRef.current = data.roomId
            setMessages(data.messages)
            setShouldScrollToBottom(true)
            setMessagesLoading(false)
          }

          hasAutoSelectedRef.current = true
          setSelectedRoom(targetRoom)
          setShowChatOnMobile(true)

          setRooms((prev) => {
            const exists = prev.some((r) => r.id === targetRoom.id)
            if (exists) {
              return prev.map((r) => (r.id === targetRoom.id ? targetRoom : r))
            }
            return [targetRoom, ...prev]
          })
          setLoading(false)

          if (paramOrderId && data.order) {
            const firstItem = data.order.items?.[0]
            const prod = firstItem?.product
            const ret = data.order.returnRequests?.[0]
            setActiveOrderContext({
              orderId: data.order.id,
              orderNumber: data.order.orderNumber || resolvedOrderNumber,
              status: data.order.status,
              total: data.order.total,
              productName: prod?.name || resolvedProductName,
              productImage: prod?.images?.[0] || resolvedProductImage,
              productPrice: firstItem?.price || resolvedProductPrice,
              returnRequest: ret
                ? {
                    id: ret.id,
                    status: ret.status,
                    reason: ret.reasonLabel || ret.reason,
                    type: ret.type,
                  }
                : null,
            })
          } else if (!paramOrderId) {
            setActiveOrderContext(null)
          }

          fetchRooms(true)

          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/dashboard/customer/chat')
            if (
              !paramOrderId &&
              !paramStoreId &&
              !paramMitraId &&
              !paramProductId
            ) {
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
    paramOrderNumber,
    paramStoreId,
    paramType,
    paramMitraId,
    paramMitraName,
    paramMitraCity,
    paramMitraImage,
    paramProductId,
    paramProductName,
    paramProductPrice,
    paramVariantName,
    paramProductImage,
    paramReturnReason,
    paramReturnStatus,
    paramReturnType,
    paramServiceContext,
    fetchRooms,
    session?.user?.id,
    router,
    paramReturnId,
  ])

  const handleBackToList = () => {
    // Jika percakapan dibuka langsung dari halaman eksternal (mitra servis, toko, produk, pesanan),
    // tombol kembali harus selalu membawa pengguna kembali ke halaman pemanggilnya
    if (isDirectEntryRef.current) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back()
        return
      }
      if (originMitraIdRef.current) {
        router.push(`/rekomendasi/${originMitraIdRef.current}`)
        return
      }
      if (originStoreIdRef.current) {
        router.push(`/toko/${originStoreIdRef.current}`)
        return
      }
      if (originProductIdRef.current) {
        router.push(`/gadget/${originProductIdRef.current}`)
        return
      }
      if (originOrderIdRef.current) {
        router.push(`/dashboard/customer/orders/${originOrderIdRef.current}`)
        return
      }
      router.back()
      return
    }

    // Jika pengguna memilih percakapan dari daftar room list di mobile,
    // pop history entry yang tadi di-push agar sinkron dengan gestur handphone
    if (chatRoomPushedRef.current) {
      chatRoomPushedRef.current = false
      setShowChatOnMobile(false)
      if (typeof window !== 'undefined') {
        window.history.back()
      }
      return
    }

    // Jika pengguna memilih percakapan dari daftar room list, kembali ke daftar percakapan
    setShowChatOnMobile(false)
  }

  // Send message with optimistic instant feedback
  const handleSendMessage = async (
    overrideContent?: string | React.MouseEvent
  ) => {
    const rawContent = (
      typeof overrideContent === 'string' ? overrideContent : messageInput
    ).trim()
    if (!rawContent || !selectedRoom || sending) return
    const content = rawContent

    const currentOrderContext = activeOrderContext
    const currentProductContext = !activeOrderContext
      ? activeProductContext
      : null

    if (currentOrderContext) {
      setActiveOrderContext(null)
      if (currentOrderContext.orderId)
        sentContextsRef.current.add(currentOrderContext.orderId)
      if (currentOrderContext.orderNumber)
        sentContextsRef.current.add(currentOrderContext.orderNumber)
    }
    if (currentProductContext) {
      setActiveProductContext(null)
      if (currentProductContext.productId)
        sentContextsRef.current.add(currentProductContext.productId)
    }
    if (activeServiceContext) {
      if (activeServiceContext.mitraId)
        sentContextsRef.current.add(activeServiceContext.mitraId)
      setActiveServiceContext(null)
    }
    if (typeof window !== 'undefined') {
      if (chatRoomPushedRef.current && selectedRoom) {
        window.history.replaceState(
          { chatRoomMobile: true, roomId: selectedRoom.id },
          '',
          '/dashboard/customer/chat'
        )
      } else {
        window.history.replaceState(null, '', '/dashboard/customer/chat')
      }
    }

    setMessageInput('')
    setSending(true)
    isSendingRef.current = true

    let messageType:
      | 'text'
      | 'order_reference'
      | 'return_reference'
      | 'product_reference' = 'text'
    let contentToSend = rawContent

    if (currentOrderContext) {
      messageType = currentOrderContext.returnRequest
        ? 'return_reference'
        : 'order_reference'
      contentToSend = JSON.stringify({
        type: messageType,
        orderId: currentOrderContext.orderId,
        orderNumber: currentOrderContext.orderNumber,
        productName: currentOrderContext.productName,
        productPrice: currentOrderContext.productPrice,
        productImage: currentOrderContext.productImage,
        note: rawContent,
        ...(currentOrderContext.returnRequest
          ? {
              returnId: currentOrderContext.returnRequest.id,
              returnReason: currentOrderContext.returnRequest.reason,
              returnStatus: currentOrderContext.returnRequest.status,
              returnType: currentOrderContext.returnRequest.type,
            }
          : {
              orderTotal: currentOrderContext.total,
              orderStatus: currentOrderContext.status,
            }),
      })
    } else if (currentProductContext) {
      messageType = 'product_reference'
      contentToSend = JSON.stringify({
        type: 'product_reference',
        productId: currentProductContext.productId,
        productName: currentProductContext.productName,
        productPrice: currentProductContext.productPrice,
        productImage: currentProductContext.productImage,
        variantName: currentProductContext.variantName,
        note: rawContent,
      })
    }

    const tempId = `temp-${Date.now()}`
    const optimisticMsg: Message = {
      id: tempId,
      content: contentToSend,
      messageType,
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
            content: contentToSend,
            messageType,
          }),
        })
      } else {
        res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: contentToSend,
          }),
        })
      }

      if (!res.ok) throw new Error('Gagal mengirim pesan')

      const data = await res.json()
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m))
      )
      setShouldScrollToBottom(true)

      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoom.id
            ? {
                ...r,
                lastMessageAt: new Date().toISOString(),
                messages: [
                  {
                    content: contentToSend,
                    messageType,
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
      setTimeout(() => {
        isSendingRef.current = false
      }, 1500)
    }
  }

  // Media upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoom) return

    const isVideo =
      file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4')
    const isImage = !isVideo

    const messageType = isVideo ? 'video' : 'image'
    const defaultText = isVideo ? '🎥 Video' : '📷 Foto'

    setUploadingMedia(true)

    try {
      // Validasi spesifikasi media dan kompresi otomatis foto jika > 2MB
      let fileToUpload = file
      try {
        fileToUpload = await processMediaUploadFile(file)
        if (isImage && file.size > 2 * 1024 * 1024) {
          toast.info(
            `Foto "${file.name}" otomatis dikompres ke ukuran optimal (< 2 MB).`
          )
        }
      } catch (validationErr: any) {
        toast.error(
          validationErr.message ||
            'Format atau ukuran file tidak sesuai ketentuan.'
        )
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('folder', 'chat')

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

  const checkIsRoomUnread = (room: ChatRoom) => {
    const incomingUnread = (room._count?.messages || 0) > 0
    const latestMsgUnread =
      room.messages?.[0] && room.messages[0].isRead === false
    const roomTotalUnread = (room.totalUnread || 0) > 0
    return incomingUnread || latestMsgUnread || roomTotalUnread
  }

  const checkIsRoomOrder = (room: ChatRoom) => {
    return !!room.order || !!room.hasOrder || !!room.orderId
  }

  const unreadRoomsCount = rooms.filter(checkIsRoomUnread).length
  const orderRoomsCount = rooms.filter(checkIsRoomOrder).length

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
      return checkIsRoomUnread(room)
    }
    if (roomFilter === 'ORDER') {
      return checkIsRoomOrder(room)
    }
    return true
  })

  const activeStore = selectedRoom?.order?.store || selectedRoom?.store
  const isStoreOnline =
    isStoreOperational(activeStore, selectedRoom?.technician) ||
    Boolean(
      selectedRoom?.lastMessageAt &&
      Date.now() - new Date(selectedRoom.lastMessageAt).getTime() <
        60 * 60 * 1000
    ) ||
    Boolean(selectedRoom?.claimedById)

  // Support CS Superadmin chat mode
  const isCsActive =
    (activeStore as any)?.isCs ||
    (selectedRoom?.type === 'admin' &&
      !selectedRoom?.storeId &&
      !selectedRoom?.technician)

  const activeStoreTitle = isCsActive
    ? 'Customer Service (Superadmin)' // CS Superadmin
    : activeStore?.name ||
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
      <div className="flex h-[100dvh] h-screen flex-col overflow-hidden bg-white dark:bg-slate-950">
        <div className="hidden shrink-0 md:block">
          <Navbar variant="light" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-20 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-white font-sans dark:bg-slate-950 md:static md:z-auto md:h-[100dvh]">
      {/* 1. Top Navigation: Desktop Navbar only */}
      <div className="hidden shrink-0 md:block">
        <Navbar variant="light" />
      </div>

      {/* Hidden file input for Photo & Video */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,video/mp4"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Fullscreen Modal Lightbox */}
      <ChatMediaModal
        media={fullscreenMedia}
        onClose={() => setFullscreenMedia(null)}
        mounted={mounted}
      />

      <main className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden p-0 md:pb-4 md:pt-20">
        <h1 className="sr-only">Pusat Pesan & Chat Pelanggan</h1>
        <div className="flex h-full min-h-0 w-full flex-1 flex-col px-0 md:mx-auto md:max-w-7xl md:px-6 lg:px-8">
          {/* Single-Surface Bento Chat Hub Container */}
          <div className="md:shadow-xs flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-white dark:bg-slate-900 md:rounded-3xl md:border md:border-slate-200/80 lg:grid lg:grid-cols-12 lg:grid-rows-1">
            {/* Left Pane: Integrated Control & Conversation List (4 Cols) */}
            <div
              className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-4 xl:col-span-4 ${
                showChatOnMobile ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Mobile Dedicated Header for Room List (Kembali ke Halaman Sebelumnya) */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3.5 py-3 dark:border-slate-800 lg:hidden">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        typeof window !== 'undefined' &&
                        window.history.length > 1
                      ) {
                        router.back()
                      } else {
                        router.push('/dashboard/customer/settings')
                      }
                    }}
                    aria-label="Kembali ke Pengaturan"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Kembali"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pusat Chat Toko
                  </h2>
                </div>
              </div>

              {/* Sidebar Tabs & Room List */}
              <ChatSidebar
                rooms={rooms}
                unreadRoomsCount={unreadRoomsCount}
                orderRoomsCount={orderRoomsCount}
                roomFilter={roomFilter}
                setRoomFilter={setRoomFilter}
                filteredRooms={filteredRooms}
                selectedRoom={selectedRoom}
                onSelectRoom={handleSelectRoom}
                loading={loading}
              />
            </div>

            {/* Right Pane: Active Conversation Window (8 Cols) */}
            <div
              className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-50/40 dark:bg-slate-950/40 lg:col-span-8 xl:col-span-8 ${
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
                  <ChatHeader
                    onBackToList={handleBackToList}
                    activeStoreLogo={activeStoreLogo}
                    activeStoreTitle={activeStoreTitle}
                    isStoreOnline={isStoreOnline}
                    activeOrderContext={activeOrderContext}
                    isCsActive={isCsActive}
                    selectedRoom={selectedRoom}
                  />

                  {/* Dynamic Pinned Order Context Banner */}
                  <ChatPinnedBanner
                    activePinnedOrder={activePinnedOrder}
                    onScrollToContextMessage={handleScrollToContextMessage}
                  />

                  {/* Messages Bubble Canvas */}
                  <ChatMessageList
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                    messagesLoading={messagesLoading}
                    messages={messages}
                    sessionUserId={session?.user?.id}
                    selectedRoom={selectedRoom}
                    isStoreOnline={isStoreOnline}
                    activeStoreLogo={activeStoreLogo}
                    activeStoreTitle={activeStoreTitle}
                    activeOrderContext={activeOrderContext}
                    onOpenFullscreenMedia={setFullscreenMedia}
                  />

                  {/* Single Mutually Exclusive Context Bar above message input (Order > Service > Product) */}
                  {activeOrderContext ? (
                    <ChatOrderContextBar
                      activeOrderContext={activeOrderContext}
                      messageInput={messageInput}
                      onSendMessage={handleSendMessage}
                      onDismiss={() => {
                        if (activeOrderContext.orderId)
                          sentContextsRef.current.add(
                            activeOrderContext.orderId
                          )
                        if (activeOrderContext.orderNumber)
                          sentContextsRef.current.add(
                            activeOrderContext.orderNumber
                          )
                        setActiveOrderContext(null)
                        if (typeof window !== 'undefined') {
                          if (chatRoomPushedRef.current && selectedRoom) {
                            window.history.replaceState(
                              { chatRoomMobile: true, roomId: selectedRoom.id },
                              '',
                              '/dashboard/customer/chat'
                            )
                          } else {
                            window.history.replaceState(
                              null,
                              '',
                              '/dashboard/customer/chat'
                            )
                          }
                        }
                      }}
                    />
                  ) : activeServiceContext ? (
                    <ChatServiceContextBar
                      activeServiceContext={activeServiceContext}
                      messageInput={messageInput}
                      onSendMessage={handleSendMessage}
                      onDismiss={() => setActiveServiceContext(null)}
                    />
                  ) : activeProductContext ? (
                    <ChatProductContextBar
                      activeProductContext={activeProductContext}
                      messageInput={messageInput}
                      onSendMessage={handleSendMessage}
                      onDismiss={() => setActiveProductContext(null)}
                    />
                  ) : null}

                  {/* Bottom Message Input Bar: pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] */}
                  <ChatInputBar
                    fileInputRef={fileInputRef}
                    uploadingMedia={uploadingMedia}
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
                    onSendMessage={() => handleSendMessage()}
                    sending={sending}
                  />
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
        <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
          <div className="hidden shrink-0 md:block">
            <Navbar variant="light" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        </div>
      }
    >
      <CustomerChatContent />
    </React.Suspense>
  )
}
