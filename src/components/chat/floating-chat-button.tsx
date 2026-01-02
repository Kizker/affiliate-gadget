'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  X,
  Loader2,
  ShoppingBag,
  Wrench,
  Send,
  Image,
  Plus,
  ZoomIn,
  Search,
  RefreshCw,
  ChevronLeft,
  Check,
  CheckCheck,
  Clock,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface TechnicianChatRoom {
  id: string
  type: 'technician'
  lastMessageAt: string
  customer?: {
    id: string
    name: string | null
    image: string | null
  }
  technician?: {
    id: string
    user: {
      name: string | null
      image: string | null
    }
  }
  messages: Array<{
    content: string
    createdAt: string
  }>
  _count: {
    messages: number
  }
}

interface AdminChatRoom {
  id: string
  type: 'admin'
  lastMessageAt: string
  orderId: string | null
  order?: {
    orderNumber: string
    status: string
    items: Array<{
      product?: { name: string }
      rentalItem?: { name: string }
    }>
  }
  messages: Array<{
    content: string
    sender?: {
      role?: string
      image?: string | null
    }
  }>
  _count: {
    messages: number
  }
}

type ChatRoom = TechnicianChatRoom | AdminChatRoom

interface Message {
  id: string
  content: string
  messageType?: string
  mediaUrl?: string
  createdAt: string
  isRead?: boolean
  sender: {
    id: string
    name: string | null
    image?: string | null
    role?: string
  }
}

export default function FloatingChatButton() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(false)

  // Active chat state
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)

  // UI state
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileChat, setShowMobileChat] = useState(false) // Control mobile view

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Prevent body scroll when chat is open (mobile fullscreen)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Listen for custom event to open chat with specific order
  useEffect(() => {
    const handleOpenChat = async (event: CustomEvent<{ orderId: string }>) => {
      const { orderId } = event.detail
      setIsOpen(true)

      // Fetch rooms and find the matching one
      try {
        const [technicianRes, adminRes] = await Promise.all([
          fetch('/api/chat/rooms'),
          fetch('/api/customer/chat/all-rooms'),
        ])

        const allRooms: ChatRoom[] = []

        if (technicianRes.ok) {
          const techData = await technicianRes.json()
          const techRooms = (techData.rooms || []).map(
            (r: TechnicianChatRoom) => ({
              ...r,
              type: 'technician' as const,
            })
          )
          allRooms.push(...techRooms)
        }

        if (adminRes.ok) {
          const adminData = await adminRes.json()
          const adminRooms = (adminData.rooms || []).map(
            (r: AdminChatRoom) => ({
              ...r,
              type: 'admin' as const,
            })
          )
          allRooms.push(...adminRooms)
        }

        // Set rooms first
        setRooms(allRooms)

        // Find room matching orderId
        let matchingRoom = allRooms.find(
          (room) =>
            room.type === 'admin' && (room as AdminChatRoom).orderId === orderId
        )

        // If room doesn't exist, create it
        if (!matchingRoom) {
          try {
            const createRes = await fetch(
              `/api/customer/chat/room?orderId=${orderId}`
            )
            if (createRes.ok) {
              const createData = await createRes.json()
              // Create a ChatRoom object from the response
              matchingRoom = {
                id: createData.room.id,
                type: 'admin' as const,
                orderId: orderId,
                lastMessageAt: new Date().toISOString(),
                order: createData.room.order,
                messages: [],
                _count: { messages: 0 },
              }
              // Add to rooms list
              setRooms([matchingRoom, ...allRooms])
            }
          } catch (error) {
            console.error('Error creating room:', error)
            toast.error('Gagal membuat chat room')
            return
          }
        }

        if (matchingRoom) {
          // Set active room and fetch messages
          setActiveRoom(matchingRoom)
          setShowMobileChat(true) // Force mobile view to show chat
          setLoadingMessages(true)

          // Use correct endpoint based on room type
          let msgRes
          if (matchingRoom.type === 'admin') {
            const adminRoom = matchingRoom as AdminChatRoom
            msgRes = await fetch(
              `/api/customer/chat/room?orderId=${adminRoom.orderId}`
            )
          } else {
            msgRes = await fetch(`/api/chat/rooms/${matchingRoom.id}/messages`)
          }

          if (msgRes.ok) {
            const msgData = await msgRes.json()
            setMessages(msgData.messages || [])
            setShouldScrollToBottom(true)
          }
          setLoadingMessages(false)
        }
      } catch (error) {
        console.error('Error opening chat:', error)
      }
    }

    window.addEventListener(
      'openFloatingChat',
      handleOpenChat as unknown as EventListener
    )
    return () => {
      window.removeEventListener(
        'openFloatingChat',
        handleOpenChat as unknown as EventListener
      )
    }
  }, [])

  useEffect(() => {
    if (isOpen && status === 'authenticated') {
      fetchRooms()
    }
  }, [isOpen, status])

  useEffect(() => {
    if (activeRoom) {
      pollingRef.current = setInterval(() => {
        fetchMessages(activeRoom, true)
      }, 5000)
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [activeRoom])

  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement
      if (container) {
        container.scrollTop = container.scrollHeight
      }
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom])

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const [technicianRes, adminRes] = await Promise.all([
        fetch('/api/chat/rooms'),
        fetch('/api/customer/chat/all-rooms'),
      ])

      const allRooms: ChatRoom[] = []

      if (technicianRes.ok) {
        const techData = await technicianRes.json()
        const techRooms = (techData.rooms || []).map(
          (room: TechnicianChatRoom) => ({
            ...room,
            type: 'technician' as const,
          })
        )
        allRooms.push(...techRooms)
      }

      if (adminRes.ok) {
        const adminData = await adminRes.json()
        const adminRooms = (adminData.rooms || []).map(
          (room: AdminChatRoom) => ({
            ...room,
            type: 'admin' as const,
          })
        )
        allRooms.push(...adminRooms)
      }

      allRooms.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      )

      setRooms(allRooms)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (room: ChatRoom, isPolling = false) => {
    if (!isPolling) {
      setLoadingMessages(true)
    }
    try {
      let res
      if (room.type === 'admin') {
        const adminRoom = room as AdminChatRoom
        res = await fetch(
          `/api/customer/chat/room?orderId=${adminRoom.orderId}`
        )
      } else {
        res = await fetch(`/api/chat/rooms/${room.id}/messages`)
      }

      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (!isPolling) {
        setLoadingMessages(false)
        setShouldScrollToBottom(true) // Scroll after messages loaded
      }
    }
  }

  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoom(room)
    setShowMobileChat(true) // Show chat on mobile
    fetchMessages(room)
  }

  const handleBackToRooms = () => {
    setActiveRoom(null)
    setShowMobileChat(false) // Show room list on mobile
    setMessages([])
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || sending) return

    setSending(true)
    try {
      let res
      if (activeRoom.type === 'admin') {
        res = await fetch('/api/customer/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: activeRoom.id,
            content: newMessage.trim(),
          }),
        })
      } else {
        res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage.trim() }),
        })
      }

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage('')
        setShouldScrollToBottom(true)
        fetchRooms()
      } else {
        toast.error('Gagal mengirim pesan')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeRoom) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }

    setUploadingImage(true)
    setShowAttachMenu(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      const uploadData = await uploadRes.json()

      let res
      if (activeRoom.type === 'admin') {
        res = await fetch('/api/customer/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: activeRoom.id,
            content: '📷 Gambar',
            messageType: 'image',
            mediaUrl: uploadData.url,
          }),
        })
      } else {
        res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '📷 Gambar',
            messageType: 'image',
            mediaUrl: uploadData.url,
          }),
        })
      }

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setShouldScrollToBottom(true)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal upload gambar')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (status !== 'authenticated') {
      window.location.href = '/login'
      return
    }
    setIsOpen(!isOpen)
  }

  const closeWidget = () => {
    setIsOpen(false)
    setActiveRoom(null)
    setMessages([])
  }

  const totalUnread = rooms.reduce(
    (sum, room) => sum + (room._count?.messages || 0),
    0
  )

  const formatTime = (dateString: string) => {
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
        month: '2-digit',
      })
    }
  }

  const filteredRooms = rooms.filter((room) => {
    if (room.type === 'admin') {
      const adminRoom = room as AdminChatRoom
      const itemName =
        adminRoom.order?.items?.[0]?.product?.name ||
        adminRoom.order?.items?.[0]?.rentalItem?.name ||
        ''
      return (
        itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adminRoom.order?.orderNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    } else {
      const techRoom = room as TechnicianChatRoom
      return techRoom.technician?.user?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
    }
  })

  // Don't show for non-customers
  if (status === 'loading') return null
  if (session?.user?.role && !['CUSTOMER', 'USER'].includes(session.user.role))
    return null

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-3 text-white transition-colors hover:bg-white/30"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={handleClick}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl active:scale-95 md:bottom-6 md:right-6"
        aria-label={isOpen ? 'Tutup chat' : 'Buka chat'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {totalUnread > 0 && (
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                {totalUnread > 9 ? '9+' : totalUnread}
              </div>
            )}
          </>
        )}
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden border-0 border-gray-200 bg-white shadow-2xl md:inset-auto md:bottom-24 md:right-6 md:h-[550px] md:w-[800px] md:flex-row md:rounded-2xl md:border">
          {/* Left Sidebar - Room List */}
          <div
            className={`${showMobileChat ? 'hidden md:flex' : 'flex'} h-full min-h-0 w-full flex-col border-r border-gray-200 bg-gray-50 md:w-[280px]`}
          >
            {/* Header */}
            <div className="safe-area-top flex-shrink-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <MessageCircle className="h-5 w-5" />
                    Chat Saya
                  </h3>
                  <p className="text-xs text-white/80">
                    {rooms.length} percakapan
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchRooms}
                    className="rounded-full p-2 transition-colors hover:bg-white/20"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                  <button
                    onClick={closeWidget}
                    className="rounded-full p-2 transition-colors hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-white p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari percakapan..."
                  className="w-full rounded-xl border-none bg-gray-100 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Room List - SCROLLABLE */}
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {loading ? (
                <div className="flex h-full items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                    <MessageCircle className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="mt-4 font-medium text-gray-700">
                    Belum ada percakapan
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Pesan akan muncul di sini
                  </p>
                </div>
              ) : (
                filteredRooms.map((room) => {
                  let itemName = ''
                  if (room.type === 'admin') {
                    const adminRoom = room as AdminChatRoom
                    itemName =
                      adminRoom.order?.items?.[0]?.product?.name ||
                      adminRoom.order?.items?.[0]?.rentalItem?.name ||
                      'Pesanan'
                  } else {
                    const techRoom = room as TechnicianChatRoom
                    itemName = techRoom.technician?.user?.name || 'Teknisi'
                  }

                  const isActive = activeRoom?.id === room.id

                  return (
                    <button
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      className={`w-full border-b border-gray-100 p-4 text-left transition-all hover:bg-white active:bg-blue-50 ${isActive ? 'border-l-4 border-l-blue-600 bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Admin/Technician Avatar */}
                        {room.type === 'admin' ? (
                          (() => {
                            // Get admin info from room messages
                            const adminMessage = room.messages?.find(
                              (m) =>
                                m.sender?.role === 'ADMIN' ||
                                m.sender?.role === 'SUPER_ADMIN'
                            )
                            const adminImage = adminMessage?.sender?.image

                            return adminImage ? (
                              <img
                                src={adminImage}
                                alt="Admin"
                                className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-2 ring-green-200"
                              />
                            ) : (
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-md">
                                <ShoppingBag className="h-5 w-5 text-white" />
                              </div>
                            )
                          })()
                        ) : (
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-md">
                            <Wrench className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-semibold text-gray-900">
                              {itemName}
                            </p>
                            <span className="flex-shrink-0 text-xs text-gray-400">
                              {formatTime(room.lastMessageAt)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                room.type === 'admin'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {room.type === 'admin'
                                ? '🛒 Admin'
                                : '🔧 Teknisi'}
                            </span>
                          </div>
                          <p className="mt-1.5 truncate text-sm text-gray-500">
                            {room.messages?.[0]?.content || 'Tidak ada pesan'}
                          </p>
                        </div>
                        {(room._count?.messages || 0) > 0 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm">
                            {room._count.messages > 9
                              ? '9+'
                              : room._count.messages}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Side - Chat Area */}
          <div
            className={`${!showMobileChat ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-1 flex-col bg-white`}
          >
            {activeRoom ? (
              <>
                {/* Chat Header */}
                <div
                  className={`safe-area-top flex-shrink-0 border-b border-gray-200 p-4 ${
                    activeRoom.type === 'admin'
                      ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
                  }`}
                >
                  <div className="flex items-center gap-3 text-white">
                    {/* Back button for mobile */}
                    <button
                      onClick={handleBackToRooms}
                      className="rounded-full p-2 transition-colors hover:bg-white/20 md:hidden"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {/* Admin/Technician Avatar */}
                    {activeRoom.type === 'admin' ? (
                      // Get admin info from messages
                      (() => {
                        const adminMessage = messages.find(
                          (m) =>
                            m.sender.role === 'ADMIN' ||
                            m.sender.role === 'SUPER_ADMIN'
                        )
                        const adminName = adminMessage?.sender.name || 'Admin'
                        const adminImage = adminMessage?.sender.image

                        return adminImage ? (
                          <img
                            src={adminImage}
                            alt={adminName}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white/30"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )
                      })()
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Wrench className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">
                        {activeRoom.type === 'admin'
                          ? (() => {
                              const adminMessage = messages.find(
                                (m) =>
                                  m.sender.role === 'ADMIN' ||
                                  m.sender.role === 'SUPER_ADMIN'
                              )
                              return adminMessage?.sender.name || 'Chat Admin'
                            })()
                          : (activeRoom as TechnicianChatRoom).technician?.user
                              ?.name || 'Teknisi'}
                      </h3>
                      <p className="truncate text-xs text-white/80">
                        {activeRoom.type === 'admin' &&
                          (activeRoom as AdminChatRoom).order?.orderNumber}
                      </p>
                    </div>
                    <button
                      onClick={closeWidget}
                      className="rounded-full p-2 transition-colors hover:bg-white/20"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Messages - with Wallpaper */}
                <div
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    backgroundImage:
                      'linear-gradient(to bottom right, rgba(239, 246, 255, 0.95), rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.95)), url(https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'local',
                  }}
                >
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm">
                        <MessageCircle className="h-10 w-10 text-blue-500" />
                      </div>
                      <p className="mt-4 font-semibold text-gray-700">
                        Mulai percakapan
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Ketik pesan atau kirim gambar
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender.id === session?.user?.id
                      const isImage =
                        msg.messageType === 'image' && msg.mediaUrl

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl shadow-sm md:max-w-[70%] ${isImage ? 'p-1' : 'px-4 py-3'} ${
                              isMe
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                                : 'border border-gray-200 bg-white text-gray-900'
                            }`}
                          >
                            {!isMe && (
                              <p
                                className={`mb-1 text-xs font-semibold ${isImage ? 'px-3 pt-2' : ''} ${activeRoom.type === 'admin' ? 'text-green-600' : 'text-blue-600'}`}
                              >
                                {msg.sender.role === 'ADMIN' ||
                                msg.sender.role === 'SUPER_ADMIN'
                                  ? msg.sender.name || 'Admin'
                                  : msg.sender.name || 'Teknisi'}
                              </p>
                            )}

                            {/* Render based on message type */}
                            {isImage ? (
                              <div
                                className="group relative cursor-pointer"
                                onClick={() =>
                                  setFullscreenImage(msg.mediaUrl!)
                                }
                              >
                                <img
                                  src={msg.mediaUrl!}
                                  alt="Shared"
                                  className="max-h-[150px] max-w-[200px] rounded-xl object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity active:opacity-100 group-hover:opacity-100">
                                  <ZoomIn className="h-8 w-8 text-white" />
                                </div>
                              </div>
                            ) : msg.messageType === 'product' ||
                              msg.messageType === 'rental' ? (
                              // Product/Rental Card
                              (() => {
                                try {
                                  const data = JSON.parse(msg.content)
                                  return (
                                    <div className="max-w-xs overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                      <div className="flex gap-2 p-2">
                                        {data.image && (
                                          <img
                                            src={data.image}
                                            alt={data.name}
                                            className="h-14 w-14 rounded-lg object-cover"
                                          />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm font-semibold text-gray-900">
                                            {data.name}
                                          </p>
                                          <p className="text-sm font-bold text-blue-600">
                                            Rp{' '}
                                            {data.price?.toLocaleString(
                                              'id-ID'
                                            )}
                                            {msg.messageType === 'rental' && (
                                              <span className="text-xs font-normal">
                                                /hari
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            Stock: {data.stock}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="border-t border-gray-100 bg-gray-50 px-2 py-1">
                                        <p className="text-xs text-gray-600">
                                          📦{' '}
                                          {msg.messageType === 'product'
                                            ? 'Rekomendasi Produk'
                                            : 'Rekomendasi Sewa'}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                } catch {
                                  return (
                                    <p className="text-sm text-gray-500">
                                      Invalid product data
                                    </p>
                                  )
                                }
                              })()
                            ) : msg.messageType === 'order' ? (
                              // Order Card
                              (() => {
                                try {
                                  const data = JSON.parse(msg.content)
                                  return (
                                    <div className="max-w-xs overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 text-white">
                                        <p className="text-xs opacity-90">
                                          Order Number
                                        </p>
                                        <p className="font-bold">
                                          {data.orderNumber}
                                        </p>
                                      </div>
                                      <div className="p-2">
                                        <p className="text-sm font-bold text-gray-900">
                                          Rp{' '}
                                          {data.total?.toLocaleString('id-ID')}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {data.items?.length} item(s)
                                        </p>
                                      </div>
                                    </div>
                                  )
                                } catch {
                                  return (
                                    <p className="text-sm text-gray-500">
                                      Invalid order data
                                    </p>
                                  )
                                }
                              })()
                            ) : msg.messageType === 'technician' ? (
                              // Technician Card
                              (() => {
                                try {
                                  const data = JSON.parse(msg.content)
                                  return (
                                    <div className="max-w-xs overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                      <div className="flex gap-2 p-2">
                                        {data.image ? (
                                          <img
                                            src={data.image}
                                            alt={data.name}
                                            className="h-12 w-12 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white">
                                            <span className="text-sm font-bold">
                                              {(data.name || 'T').charAt(0)}
                                            </span>
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-semibold text-gray-900">
                                            {data.name}
                                          </p>
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-yellow-500">
                                              ⭐
                                            </span>
                                            <span className="text-xs font-medium">
                                              {data.rating?.toFixed(1)}
                                            </span>
                                          </div>
                                          <p className="truncate text-xs text-gray-500">
                                            {data.specialties
                                              ?.slice(0, 2)
                                              .join(', ')}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="border-t border-gray-100 bg-orange-50 px-2 py-1">
                                        <p className="text-xs text-orange-600">
                                          🔧 Rekomendasi Teknisi
                                        </p>
                                      </div>
                                    </div>
                                  )
                                } catch {
                                  return (
                                    <p className="text-sm text-gray-500">
                                      Invalid technician data
                                    </p>
                                  )
                                }
                              })()
                            ) : msg.messageType === 'mitra' ? (
                              // Mitra Card
                              (() => {
                                try {
                                  const data = JSON.parse(msg.content)
                                  return (
                                    <div className="max-w-xs overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                      <div className="flex gap-2 p-2">
                                        {data.image ? (
                                          <img
                                            src={data.image}
                                            alt={data.name}
                                            className="h-12 w-12 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                                            <span className="text-sm font-bold">
                                              {(data.name || 'M').charAt(0)}
                                            </span>
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-semibold text-gray-900">
                                            {data.name}
                                          </p>
                                          <p className="truncate text-xs text-gray-500">
                                            {data.email}
                                          </p>
                                          {data.phone && (
                                            <p className="text-xs text-gray-400">
                                              {data.phone}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="border-t border-gray-100 bg-purple-50 px-2 py-1">
                                        <p className="text-xs text-purple-600">
                                          👥 Rekomendasi Mitra
                                        </p>
                                      </div>
                                    </div>
                                  )
                                } catch {
                                  return (
                                    <p className="text-sm text-gray-500">
                                      Invalid mitra data
                                    </p>
                                  )
                                }
                              })()
                            ) : (
                              // Default text message
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {msg.content}
                              </p>
                            )}

                            <div
                              className={`mt-1.5 flex items-center gap-1 text-xs ${isImage ? 'px-3 pb-2' : ''} ${isMe ? 'text-white/70' : 'text-gray-400'}`}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  'id-ID',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </span>
                              {isMe && (
                                <>
                                  {msg.isRead ? (
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  ) : msg.id ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Clock className="h-3.5 w-3.5" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="safe-area-bottom flex-shrink-0 border-t border-gray-200 bg-white p-3">
                  {showAttachMenu && (
                    <div className="mb-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm transition-colors hover:bg-gray-50"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                          {uploadingImage ? (
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                          ) : (
                            <Image className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Kirim Gambar
                          </p>
                          <p className="text-xs text-gray-500">
                            Pilih dari galeri
                          </p>
                        </div>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                        showAttachMenu
                          ? 'rotate-45 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                      }`}
                      aria-label={
                        showAttachMenu
                          ? 'Tutup menu lampiran'
                          : 'Buka menu lampiran'
                      }
                    >
                      <Plus className="h-6 w-6" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && !e.shiftKey && handleSendMessage()
                      }
                      placeholder="Ketik pesan..."
                      className="flex-1 rounded-full border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg transition-shadow hover:shadow-xl active:scale-95 disabled:opacity-50"
                      aria-label="Kirim pesan"
                    >
                      {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-8 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner">
                  <MessageCircle className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">
                  Pilih Percakapan
                </h3>
                <p className="mt-2 max-w-xs text-sm text-gray-500">
                  Pilih percakapan dari daftar di sebelah kiri untuk mulai chat
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
