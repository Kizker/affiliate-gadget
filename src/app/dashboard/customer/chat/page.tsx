'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Search,
  Send,
  ChevronLeft,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Wrench,
  Plus,
  Image as ImageIcon,
  X,
  ZoomIn,
} from 'lucide-react'
import { toast } from 'sonner'

interface ChatRoom {
  id: string
  orderId: string
  lastMessageAt: string
  order: {
    id: string
    orderNumber: string
    status: string
    items: Array<{
      product?: { name: string }
      rentalItem?: { name: string }
    }>
  } | null
  messages: {
    content: string
  }[]
  _count: {
    messages: number
  }
  type: 'admin' | 'technician'
  technician?: {
    user: {
      name: string | null
      image: string | null
    }
  }
}

interface Message {
  id: string
  content: string
  messageType: string
  mediaUrl: string | null
  createdAt: string
  sender: {
    id: string
    name: string | null
    role: string
  }
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

  // Image upload
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch all chat rooms
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true)
      const [adminRes, techRes] = await Promise.all([
        fetch('/api/customer/chat/all-rooms'),
        fetch('/api/chat/rooms'),
      ])

      const allRooms: ChatRoom[] = []

      if (adminRes.ok) {
        const data = await adminRes.json()
        const adminRooms = (data.rooms || []).map(
          (room: {
            id: string
            customerId: string
            orderId: string | null
            lastMessageAt: string
            customer: {
              id: string
              name: string | null
              email: string
              image: string | null
            }
          }) => ({
            ...room,
            type: 'admin' as const,
          })
        )
        allRooms.push(...adminRooms)
      }

      if (techRes.ok) {
        const data = await techRes.json()
        const techRooms = (data.rooms || []).map(
          (room: {
            id: string
            customerId: string
            orderId: string | null
            lastMessageAt: string
            customer: {
              id: string
              name: string | null
              email: string
              image: string | null
            }
          }) => ({
            ...room,
            type: 'technician' as const,
          })
        )
        allRooms.push(...techRooms)
      }

      // Sort by last message
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
  }, [])

  // Fetch messages for selected room
  const fetchMessages = useCallback(
    async (room: ChatRoom, isPolling = false) => {
      try {
        if (!isPolling) {
          setMessagesLoading(true)
        }

        let res
        if (room.type === 'admin') {
          res = await fetch(`/api/customer/chat/room?orderId=${room.orderId}`)
        } else {
          res = await fetch(`/api/chat/rooms/${room.id}/messages`)
        }

        if (!res.ok) throw new Error('Failed to fetch messages')
        const data = await res.json()
        setMessages(data.messages || [])
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        if (!isPolling) {
          setMessagesLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRooms()
    }
  }, [status, fetchRooms])

  // Polling for new messages
  useEffect(() => {
    if (selectedRoom) {
      pollingRef.current = setInterval(() => {
        fetchMessages(selectedRoom, true)
      }, 5000)
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [selectedRoom, fetchMessages])

  // Scroll to bottom
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
    fetchMessages(room)
  }

  const handleBackToList = () => {
    setShowChatOnMobile(false)
    setSelectedRoom(null)
    setMessages([])
  }

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom) return

    setSending(true)
    try {
      let res
      if (selectedRoom.type === 'admin') {
        res = await fetch('/api/customer/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoom.id,
            content: messageInput.trim(),
          }),
        })
      } else {
        res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: messageInput.trim(),
          }),
        })
      }

      if (!res.ok) throw new Error('Failed to send message')

      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setMessageInput('')
      setShouldScrollToBottom(true)
      fetchRooms()
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Gagal mengirim pesan')
    } finally {
      setSending(false)
    }
  }

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoom) return

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

      // Send image message
      let res
      if (selectedRoom.type === 'admin') {
        res = await fetch('/api/customer/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoom.id,
            content: '📷 Gambar',
            messageType: 'image',
            mediaUrl: uploadData.url,
          }),
        })
      } else {
        res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '📷 Gambar',
            messageType: 'image',
            mediaUrl: uploadData.url,
          }),
        })
      }

      if (!res.ok) throw new Error('Failed to send image')

      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setShouldScrollToBottom(true)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Gagal upload gambar')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const filteredRooms = rooms.filter((room) => {
    const orderNumber = room.order?.orderNumber || ''
    const itemName =
      room.order?.items?.[0]?.product?.name ||
      room.order?.items?.[0]?.rentalItem?.name ||
      ''
    const techName = room.technician?.user?.name || ''

    return (
      orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      techName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      PENDING: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Pending',
      },
      CONFIRMED: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Dikonfirmasi',
      },
      PROCESSING: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        label: 'Diproses',
      },
      SHIPPED: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        label: 'Dikirim',
      },
      COMPLETED: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Selesai',
      },
      CANCELLED: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Dibatalkan',
      },
    }
    const config = statusConfig[status] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: status,
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    )
  }

  const totalUnread = rooms.reduce(
    (sum, room) => sum + (room._count?.messages || 0),
    0
  )

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
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

      {/* Page Header - Same as Admin */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MessageSquare className="h-6 w-6" />
              Chat & Messages
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Kelola percakapan dengan admin dan teknisi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">{rooms.length}</div>
              <div className="text-xs text-white/80">Total Chats</div>
            </div>
            <div className="rounded-lg bg-white/20 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">{totalUnread}</div>
              <div className="text-xs text-white/80">Unread</div>
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

      {/* Chat Container - Grid Layout like Admin */}
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
                  placeholder="Cari percakapan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Room List */}
            <div className="flex-1 overflow-y-auto">
              {filteredRooms.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-500">
                  <MessageSquare className="h-12 w-12 text-gray-300" />
                  <p className="mt-2">Belum ada chat</p>
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const itemName =
                    room.order?.items?.[0]?.product?.name ||
                    room.order?.items?.[0]?.rentalItem?.name ||
                    room.technician?.user?.name ||
                    'Percakapan'

                  return (
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
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full ${
                              room.type === 'admin'
                                ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                                : 'bg-gradient-to-br from-blue-400 to-indigo-600'
                            }`}
                          >
                            {room.type === 'admin' ? (
                              <ShoppingBag className="h-5 w-5 text-white" />
                            ) : (
                              <Wrench className="h-5 w-5 text-white" />
                            )}
                          </div>
                          {(room._count?.messages || 0) > 0 && (
                            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                              {room._count.messages > 9
                                ? '9+'
                                : room._count.messages}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate font-semibold text-gray-900">
                              {itemName}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTime(room.lastMessageAt)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                room.type === 'admin'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {room.type === 'admin' ? 'Admin' : 'Teknisi'}
                            </span>
                            {room.order?.status &&
                              getStatusBadge(room.order.status)}
                          </div>
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {room.messages?.[0]?.content || 'Tidak ada pesan'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages Area - Right Side */}
        <div
          className={`lg:col-span-8 xl:col-span-9 ${!showChatOnMobile ? 'hidden lg:block' : 'block'}`}
        >
          <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div
                  className={`flex items-center justify-between border-b border-gray-200 p-4 ${
                    selectedRoom.type === 'admin'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToList}
                      className="rounded-full p-2 hover:bg-white/50 lg:hidden"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        selectedRoom.type === 'admin'
                          ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                          : 'bg-gradient-to-br from-blue-400 to-indigo-600'
                      }`}
                    >
                      {selectedRoom.type === 'admin' ? (
                        <ShoppingBag className="h-6 w-6 text-white" />
                      ) : (
                        <Wrench className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {selectedRoom.type === 'admin'
                          ? selectedRoom.order?.items?.[0]?.product?.name ||
                            selectedRoom.order?.items?.[0]?.rentalItem?.name ||
                            'Chat Admin'
                          : selectedRoom.technician?.user?.name || 'Teknisi'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedRoom.order?.orderNumber || ''}
                      </p>
                    </div>
                  </div>
                  <div>
                    {selectedRoom.order?.status &&
                      getStatusBadge(selectedRoom.order.status)}
                  </div>
                </div>

                {/* Messages - with Wallpaper */}
                <div
                  className="flex-1 space-y-3 overflow-y-auto p-4"
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
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm">
                        <MessageSquare className="h-8 w-8 text-blue-500" />
                      </div>
                      <p className="mt-4 font-medium text-gray-700">
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
                            className={`max-w-[70%] rounded-2xl shadow-sm ${isImage ? 'p-1' : 'px-4 py-2'} ${
                              isMe
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                                : 'border border-gray-200 bg-white text-gray-900'
                            }`}
                          >
                            {!isMe && (
                              <p
                                className={`mb-1 text-xs font-semibold ${isImage ? 'px-3 pt-2' : ''} ${
                                  selectedRoom.type === 'admin'
                                    ? 'text-green-600'
                                    : 'text-blue-600'
                                }`}
                              >
                                {msg.sender.role === 'ADMIN' ||
                                msg.sender.role === 'SUPER_ADMIN'
                                  ? '🛡️ Admin'
                                  : msg.sender.name || 'Teknisi'}
                              </p>
                            )}

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
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                  <ZoomIn className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-sm">
                                {msg.content}
                              </p>
                            )}

                            <p
                              className={`mt-1 text-xs ${isImage ? 'px-3 pb-2' : ''} ${isMe ? 'text-white/70' : 'text-gray-400'}`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString(
                                'id-ID',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
                  {showAttachMenu && (
                    <div className="mb-3 rounded-xl bg-gray-50 p-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-white"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                          {uploadingImage ? (
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-gray-700">
                          Kirim Gambar
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                        showAttachMenu
                          ? 'rotate-45 bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && !e.shiftKey && handleSendMessage()
                      }
                      placeholder="Ketik pesan..."
                      className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white transition-shadow hover:shadow-lg disabled:opacity-50"
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
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                  <MessageSquare className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">
                  Pilih Percakapan
                </h3>
                <p className="mt-2 max-w-md text-sm text-gray-500">
                  Pilih percakapan dari daftar di sebelah kiri untuk mulai chat
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
