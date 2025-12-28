'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Loader2,
  User,
  MessageCircle,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string | null
    image: string | null
  }
}

interface RoomInfo {
  id: string
  technician: {
    id: string
    user: {
      name: string | null
      image: string | null
      phone: string | null
    }
  }
}

interface OrderInfo {
  id: string
  orderNumber: string
  technicianId: string
  items: Array<{
    service?: { name: string }
  }>
}

export default function CustomerTechnicianChatPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orderId, setOrderId] = useState<string>('')
  const [order, setOrder] = useState<OrderInfo | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId))
  }, [params])

  // Find or create chat room for this order's technician
  const initializeRoom = useCallback(async () => {
    if (!orderId) return

    try {
      // First get order to find technician
      const orderRes = await fetch(`/api/orders/${orderId}`)
      if (!orderRes.ok) {
        toast.error('Pesanan tidak ditemukan')
        router.push('/dashboard/customer/orders')
        return
      }

      const orderData = await orderRes.json()
      const orderInfo = orderData.order

      if (!orderInfo.technician) {
        toast.error('Pesanan ini tidak memiliki teknisi')
        router.push('/dashboard/customer/orders')
        return
      }

      setOrder({
        id: orderInfo.id,
        orderNumber: orderInfo.orderNumber,
        technicianId: orderInfo.technician.id,
        items: orderInfo.items,
      })

      // Get or create chat room with technician
      const res = await fetch(`/api/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: orderInfo.technician.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setRoomId(data.room.id)
        setRoomInfo(data.room)

        // Fetch messages
        const messagesRes = await fetch(
          `/api/chat/rooms/${data.room.id}/messages`
        )
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          setMessages(messagesData.messages || [])
        }
      } else {
        toast.error('Tidak dapat memuat chat')
        router.push('/dashboard/customer/orders')
      }
    } catch (error) {
      console.error('Error initializing room:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [orderId, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && orderId) {
      initializeRoom()
    }
  }, [status, orderId, router, initializeRoom])

  // Poll for new messages
  useEffect(() => {
    if (!roomId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/rooms/${roomId}/messages`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Error polling messages:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [roomId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
      } else {
        toast.error('Gagal mengirim pesan')
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Terjadi kesalahan')
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  const serviceName = order?.items?.[0]?.service?.name || 'Layanan'
  const technicianName = roomInfo?.technician?.user?.name || 'Teknisi'

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/dashboard/customer/orders"
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-cyan-600">
                {roomInfo?.technician?.user?.image ? (
                  <img
                    src={roomInfo.technician.user.image}
                    alt={technicianName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Wrench className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-bold text-gray-900">
                  {technicianName}
                </h1>
                <p className="truncate text-xs text-gray-500">
                  {order?.orderNumber} - {serviceName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              Mulai percakapan
            </h3>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Tanyakan seputar layanan servis kepada teknisi
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === session?.user?.id

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex max-w-[80%] items-end gap-2">
                  {!isMe && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100">
                      {msg.sender.image ? (
                        <img
                          src={msg.sender.image}
                          alt={msg.sender.name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-900'
                    }`}
                  >
                    {!isMe && (
                      <p className="mb-1 text-xs font-semibold text-blue-600">
                        {msg.sender.name || 'Teknisi'}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        isMe ? 'text-white/70' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && !e.shiftKey && handleSendMessage()
            }
            placeholder="Ketik pesan..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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
  )
}
