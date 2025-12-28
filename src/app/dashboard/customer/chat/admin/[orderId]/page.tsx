'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Loader2,
  Package,
  ShoppingBag,
  MessageCircle,
  X,
  ZoomIn,
  Plus,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  messageType: string
  attachmentId: string | null
  mediaUrl: string | null
  createdAt: string
  sender: {
    id: string
    name: string | null
    role: string
  }
}

interface RoomInfo {
  id: string
  order: {
    id: string
    orderNumber: string
    status: string
    items: Array<{
      product?: { name: string }
      rentalItem?: { name: string }
    }>
  } | null
}

export default function CustomerAdminChatPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orderId, setOrderId] = useState<string>('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId))
  }, [params])

  const initializeRoom = useCallback(async () => {
    if (!orderId) return

    try {
      const res = await fetch(`/api/customer/chat/room?orderId=${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setRoomId(data.room.id)
        setRoomInfo(data.room)
        setMessages(data.messages || [])
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

  useEffect(() => {
    if (!roomId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/customer/chat/room?orderId=${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Error polling messages:', error)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [roomId, orderId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (
    content?: string,
    messageType = 'text',
    mediaUrl?: string
  ) => {
    const messageContent = content || newMessage.trim()
    if (!messageContent && !mediaUrl) return
    if (!roomId || sending) return

    setSending(true)
    setNewMessage('')
    setShowAttachMenu(false)

    try {
      const res = await fetch(`/api/customer/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          content: messageContent,
          messageType,
          mediaUrl,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
      } else {
        toast.error('Gagal mengirim pesan')
        if (content) setNewMessage(content)
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
    if (!file) return

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
        await handleSendMessage('📷 Gambar', 'image', data.url)
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    )
  }

  const orderName =
    roomInfo?.order?.items?.[0]?.product?.name ||
    roomInfo?.order?.items?.[0]?.rentalItem?.name ||
    'Pesanan'

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customer/orders"
            className="rounded-full p-2 transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MessageCircle className="h-6 w-6" />
              Chat Admin
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {roomInfo?.order?.orderNumber} - {orderName}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
              className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
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

        {/* Messages Area */}
        <div className="h-[500px] space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Mulai percakapan
              </h3>
              <p className="mt-1 max-w-xs text-sm text-gray-500">
                Tanyakan seputar pesanan Anda kepada admin kami
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender.id === session?.user?.id
              const isAdmin =
                msg.sender.role === 'ADMIN' || msg.sender.role === 'SUPER_ADMIN'
              const isImage = msg.messageType === 'image' && msg.mediaUrl

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl ${
                      isImage ? 'p-1' : 'px-4 py-2'
                    } ${
                      isMe
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-900'
                    }`}
                  >
                    {!isMe && (
                      <p
                        className={`mb-1 text-xs font-semibold text-green-600 ${isImage ? 'px-3 pt-2' : ''}`}
                      >
                        {isAdmin ? '🛡️ Admin' : msg.sender.name}
                      </p>
                    )}

                    {/* Image message */}
                    {isImage ? (
                      <div
                        className="group relative cursor-pointer"
                        onClick={() => setFullscreenImage(msg.mediaUrl!)}
                      >
                        <img
                          src={msg.mediaUrl!}
                          alt="Shared image"
                          className="max-h-[150px] max-w-[200px] rounded-xl object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <ZoomIn className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Product recommendation */}
                        {msg.messageType === 'product' && (
                          <div className="mb-2 flex items-center gap-2">
                            <Package
                              className={`h-4 w-4 ${isMe ? 'text-white/80' : 'text-orange-500'}`}
                            />
                            <span
                              className={`text-xs ${isMe ? 'text-white/80' : 'text-orange-600'}`}
                            >
                              Rekomendasi Produk
                            </span>
                          </div>
                        )}

                        {/* Order info */}
                        {msg.messageType === 'order' && (
                          <div className="mb-2 flex items-center gap-2">
                            <ShoppingBag
                              className={`h-4 w-4 ${isMe ? 'text-white/80' : 'text-blue-500'}`}
                            />
                            <span
                              className={`text-xs ${isMe ? 'text-white/80' : 'text-blue-600'}`}
                            >
                              Info Pesanan
                            </span>
                          </div>
                        )}

                        <p className="whitespace-pre-wrap text-sm">
                          {msg.content}
                        </p>
                      </>
                    )}

                    <p
                      className={`mt-1 text-xs ${isImage ? 'px-3 pb-2' : ''} ${isMe ? 'text-white/70' : 'text-gray-400'}`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4">
          {/* Attach Menu */}
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
                <span className="text-sm text-gray-700">Kirim Gambar</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                showAttachMenu
                  ? 'rotate-45 bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Plus className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.shiftKey && handleSendMessage()
              }
              placeholder="Ketik pesan..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!newMessage.trim() || sending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
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
    </div>
  )
}
