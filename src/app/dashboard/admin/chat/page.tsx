'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  ShoppingBag,
  Package,
  Clock,
  Check,
  CheckCheck,
} from 'lucide-react'
import Image from 'next/image'

interface ChatRoom {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  orderId: string | null
  orderNumber: string | null
  orderStatus: string | null
  isOnline: boolean
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isRead: boolean
  type: 'text' | 'image' | 'order' | 'product'
  attachments?: {
    type: 'order' | 'product'
    data: any
  }
}

// Dummy data
const dummyChatRooms: ChatRoom[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Ahmad Rizki',
    userAvatar: null,
    lastMessage: 'Terima kasih, produknya sudah sampai!',
    lastMessageTime: '10:30',
    unreadCount: 2,
    orderId: 'ord1',
    orderNumber: 'ORD-2024-001',
    orderStatus: 'COMPLETED',
    isOnline: true,
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Siti Nurhaliza',
    userAvatar: null,
    lastMessage: 'Kapan bisa dikirim?',
    lastMessageTime: '09:15',
    unreadCount: 0,
    orderId: 'ord2',
    orderNumber: 'ORD-2024-002',
    orderStatus: 'PAID',
    isOnline: false,
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Budi Santoso',
    userAvatar: null,
    lastMessage: 'Saya mau tanya stok LCD iPhone 12',
    lastMessageTime: 'Kemarin',
    unreadCount: 5,
    orderId: null,
    orderNumber: null,
    orderStatus: null,
    isOnline: true,
  },
  {
    id: '4',
    userId: 'user4',
    userName: 'Dewi Lestari',
    userAvatar: null,
    lastMessage: 'Baik, saya tunggu konfirmasinya',
    lastMessageTime: '2 hari lalu',
    unreadCount: 0,
    orderId: 'ord3',
    orderNumber: 'ORD-2024-003',
    orderStatus: 'IN_PROGRESS',
    isOnline: false,
  },
]

const dummyMessages: Message[] = [
  {
    id: '1',
    senderId: 'user1',
    senderName: 'Ahmad Rizki',
    content: 'Halo, saya mau order LCD iPhone 12',
    timestamp: '10:00',
    isRead: true,
    type: 'text',
  },
  {
    id: '2',
    senderId: 'admin',
    senderName: 'Admin',
    content: 'Halo! Baik, saya bantu carikan produknya',
    timestamp: '10:01',
    isRead: true,
    type: 'text',
  },
  {
    id: '3',
    senderId: 'admin',
    senderName: 'Admin',
    content: '',
    timestamp: '10:02',
    isRead: true,
    type: 'product',
    attachments: {
      type: 'product',
      data: {
        id: 'prod1',
        name: 'LCD iPhone 12 Original',
        price: 500000,
        image:
          'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200',
        stock: 15,
      },
    },
  },
  {
    id: '4',
    senderId: 'user1',
    senderName: 'Ahmad Rizki',
    content: 'Oke, saya order 1 ya',
    timestamp: '10:05',
    isRead: true,
    type: 'text',
  },
  {
    id: '5',
    senderId: 'admin',
    senderName: 'Admin',
    content: 'Baik, pesanan sudah dibuat',
    timestamp: '10:06',
    isRead: true,
    type: 'text',
  },
  {
    id: '6',
    senderId: 'admin',
    senderName: 'Admin',
    content: '',
    timestamp: '10:06',
    isRead: true,
    type: 'order',
    attachments: {
      type: 'order',
      data: {
        orderNumber: 'ORD-2024-001',
        total: 500000,
        status: 'PENDING_PAYMENT',
        items: [{ name: 'LCD iPhone 12 Original', qty: 1, price: 500000 }],
      },
    },
  },
  {
    id: '7',
    senderId: 'user1',
    senderName: 'Ahmad Rizki',
    content: 'Terima kasih, produknya sudah sampai!',
    timestamp: '10:30',
    isRead: false,
    type: 'text',
  },
]

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState<Message[]>(dummyMessages)
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)

  const filteredRooms = dummyChatRooms.filter((room) =>
    room.userName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room)
    setShowChatOnMobile(true) // Show chat on mobile when room selected
  }

  const handleBackToList = () => {
    setShowChatOnMobile(false)
  }

  const handleSendMessage = () => {
    if (!messageInput.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'admin',
      senderName: 'Admin',
      content: messageInput,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isRead: false,
      type: 'text',
    }

    setMessages([...messages, newMessage])
    setMessageInput('')
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
        label: 'In Progress',
        color: 'bg-purple-100 text-purple-700',
      },
      COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
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

  return (
    <div>
      {/* Header Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">💬 Chat & Messages</h1>
            <p className="mt-2 text-blue-100">
              Kelola percakapan dengan customer
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
              <p className="text-sm font-medium">Total Chats</p>
              <p className="text-2xl font-bold">{dummyChatRooms.length}</p>
            </div>
            <div className="rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
              <p className="text-sm font-medium">Unread</p>
              <p className="text-2xl font-bold">
                {dummyChatRooms.reduce(
                  (sum, room) => sum + room.unreadCount,
                  0
                )}
              </p>
            </div>
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
                  placeholder="Cari customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Room List */}
            <div className="flex-1 overflow-y-auto">
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`w-full border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 ${
                    selectedRoom?.id === room.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <span className="text-lg font-bold">
                          {room.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {room.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-semibold text-gray-900">
                          {room.userName}
                        </p>
                        <span className="text-xs text-gray-500">
                          {room.lastMessageTime}
                        </span>
                      </div>

                      {room.orderNumber && (
                        <div className="mt-1 flex items-center gap-2">
                          <ShoppingBag className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {room.orderNumber}
                          </span>
                          {getStatusBadge(room.orderStatus)}
                        </div>
                      )}

                      <div className="mt-1 flex items-center justify-between">
                        <p className="truncate text-sm text-gray-600">
                          {room.lastMessage}
                        </p>
                        {room.unreadCount > 0 && (
                          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
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
                <div className="flex items-center gap-3">
                  {/* Back Button - Mobile Only */}
                  <button
                    onClick={handleBackToList}
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>

                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <span className="font-bold">
                        {selectedRoom.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {selectedRoom.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedRoom.userName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedRoom.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedRoom.orderNumber && (
                    <div className="mr-4 text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {selectedRoom.orderNumber}
                      </p>
                      {getStatusBadge(selectedRoom.orderStatus)}
                    </div>
                  )}
                  <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((message) => {
                  const isAdmin = message.senderId === 'admin'

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        {/* Text Message */}
                        {message.type === 'text' && message.content && (
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isAdmin
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                        )}

                        {/* Product Card */}
                        {message.type === 'product' && message.attachments && (
                          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex gap-3 p-3">
                              <img
                                src={message.attachments.data.image}
                                alt={message.attachments.data.name}
                                className="h-20 w-20 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {message.attachments.data.name}
                                </p>
                                <p className="mt-1 text-lg font-bold text-blue-600">
                                  Rp{' '}
                                  {message.attachments.data.price.toLocaleString(
                                    'id-ID'
                                  )}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Stock: {message.attachments.data.stock}
                                </p>
                              </div>
                            </div>
                            <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
                              <p className="text-xs text-gray-600">
                                <Package className="mr-1 inline h-3 w-3" />
                                Katalog Produk
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Order Card */}
                        {message.type === 'order' && message.attachments && (
                          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 text-white">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs opacity-90">
                                    Order Number
                                  </p>
                                  <p className="font-bold">
                                    {message.attachments.data.orderNumber}
                                  </p>
                                </div>
                                <ShoppingBag className="h-6 w-6" />
                              </div>
                            </div>
                            <div className="p-3">
                              {message.attachments.data.items.map(
                                (item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-gray-700">
                                      {item.name} x{item.qty}
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      Rp {item.price.toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                )
                              )}
                              <div className="mt-2 border-t border-gray-200 pt-2">
                                <div className="flex justify-between">
                                  <span className="font-bold text-gray-900">
                                    Total
                                  </span>
                                  <span className="font-bold text-blue-600">
                                    Rp{' '}
                                    {message.attachments.data.total.toLocaleString(
                                      'id-ID'
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timestamp & Read Status */}
                        <div
                          className={`mt-1 flex items-center gap-1 text-xs text-gray-500 ${
                            isAdmin ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{message.timestamp}</span>
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
                  )
                })}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-end gap-2">
                  <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                    <Package className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Ketik pesan..."
                      rows={1}
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-2 text-white hover:shadow-lg disabled:opacity-50"
                    disabled={!messageInput.trim()}
                  >
                    <Send className="h-5 w-5" />
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
    </div>
  )
}
