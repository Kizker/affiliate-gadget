'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  Send,
  Loader2,
  ArrowLeft,
  X,
  FileText,
  Video,
  Package,
  Plus,
  Search,
  Image as ImageIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  processFileForUpload,
  formatFileSize,
  getMediaType,
} from '@/lib/media-compress'
import ImageLightbox from '@/components/gallery/image-lightbox'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { DateSeparator } from './date-separator'
import { isSameDay } from '@/utils/chat-helpers'
import OrderReferenceCard from './order-reference-card'
interface Message {
  id: string
  content: string
  createdAt: string
  messageType?: string | null
  mediaUrl?: string | null
  mediaType?: string | null
  mediaSize?: number | null
  mediaName?: string | null
  sender: {
    id: string
    name: string | null
    image: string | null
  }
}

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  slug: string
  stock: number
  category: {
    name: string
  } | null
}

interface ChatWindowProps {
  roomId: string
  currentUserId: string
  otherUserName: string
  otherUserImage: string | null
  roomType?: 'technician' | 'admin'
  order?: {
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: string
    items: Array<{
      type?: string
      quantity: number
      product?: { name: string }
      service?: { name: string }
      rentalItem?: { name: string }
    }>
  }
}

export default function ChatWindow({
  roomId,
  currentUserId,
  otherUserName,
  otherUserImage,
  roomType = 'technician',
  order,
}: ChatWindowProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Context menu and edit states
  const [contextMenu, setContextMenu] = useState<{
    messageId: string
    x: number
    y: number
  } | null>(null)
  const [editingMessage, setEditingMessage] = useState<{
    id: string
    content: string
  } | null>(null)
  const [editContent, setEditContent] = useState('')

  // Attachment menu and product picker states
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState('')

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchMessages()
    markAsRead()

    // Poll for new messages every 2 seconds
    const interval = setInterval(() => {
      fetchMessages(true)
    }, 2000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const fetchMessages = async (silent = false) => {
    try {
      let res
      if (roomType === 'admin' && order?.id) {
        res = await fetch(`/api/customer/chat/room?orderId=${order.id}`)
      } else {
        res = await fetch(`/api/chat/rooms/${roomId}/messages`)
      }

      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'PATCH',
      })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const cancelFileSelection = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || sending) return

    setSending(true)
    setUploading(true)
    const content = newMessage.trim()
    setNewMessage('')

    let mediaData: {
      mediaUrl?: string
      mediaType?: string
      mediaSize?: number
      mediaName?: string
      messageType?: string
    } = {}

    // Process file if selected
    if (selectedFile) {
      try {
        setUploadProgress('Memproses file...')
        const processed = await processFileForUpload(selectedFile)

        // Determine messageType based on file type (for admin chat)
        let messageType = 'text'
        if (processed.type.startsWith('image/')) {
          messageType = 'image'
        } else if (processed.type.startsWith('video/')) {
          messageType = 'video'
        } else {
          messageType = 'document'
        }

        mediaData = {
          mediaUrl: processed.base64,
          mediaType: processed.type,
          mediaSize: processed.size,
          mediaName: processed.name,
          ...(roomType === 'admin' && { messageType }), // Add messageType for admin chat
        }
        setUploadProgress('Mengirim...')
      } catch (error) {
        toast({
          title: 'Error',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          description: (error as any).message || 'Gagal memproses file',
          variant: 'destructive',
        })
        setSending(false)
        setUploading(false)
        setUploadProgress('')
        return
      }
    }

    // Optimistic update
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      content,
      createdAt: new Date().toISOString(),
      ...mediaData,
      sender: {
        id: currentUserId,
        name: 'You',
        image: null,
      },
    }
    setMessages((prev) => [...prev, tempMessage])

    // Scroll to bottom after adding temp message
    setTimeout(() => scrollToBottom(), 50)

    // Clear file selection
    cancelFileSelection()

    try {
      let res
      if (roomType === 'admin') {
        res = await fetch('/api/customer/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, content, ...mediaData }),
        })
      } else {
        res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, ...mediaData }),
        })
      }

      if (res.ok) {
        // Fetch latest messages to replace temp message
        await fetchMessages(true)
        // Scroll to bottom after fetching new messages
        setTimeout(() => scrollToBottom(), 50)
      } else {
        // Remove temp message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
        const errorData = await res.json()
        toast({
          title: 'Gagal',
          description: errorData.error || 'Gagal mengirim pesan',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      toast({
        title: 'Error',
        description: 'Gagal mengirim pesan',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
      setUploading(false)
      setUploadProgress('')
      // Re-focus input to keep keyboard open on mobile
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  // Fetch products for recommendation (technicians only)
  const fetchProducts = async (search: string = '') => {
    setLoadingProducts(true)
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(search)}&limit=20`
      )
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  // Send product recommendation
  const sendProductRecommendation = async (product: Product) => {
    setSending(true)
    try {
      // Create recommendation JSON content
      const recommendationContent = JSON.stringify({
        type: 'product',
        name: product.name,
        price: product.price,
        image: product.images?.[0] || null,
        slug: product.slug,
        stock: product.stock,
        category: product.category?.name || 'Sparepart',
      })

      const endpoint =
        roomType === 'admin'
          ? `/api/customer/chat/room?orderId=${order?.id}`
          : `/api/chat/rooms/${roomId}/messages`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: recommendationContent }),
      })

      if (res.ok) {
        await fetchMessages(true)
        setShowProductPicker(false)
        setShowAttachMenu(false)
        toast({
          title: 'Berhasil',
          description: 'Rekomendasi terkirim!',
        })
        setTimeout(() => scrollToBottom(), 50)
      }
    } catch (error) {
      console.error('Error sending recommendation:', error)
      toast({
        title: 'Error',
        description: 'Gagal mengirim rekomendasi',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault()
    // Only show menu for own messages
    if (message.sender.id !== currentUserId) return

    setContextMenu({
      messageId: message.id,
      x: e.clientX,
      y: e.clientY,
    })
  }

  const handleLongPressStart = (message: Message) => {
    // Only for own messages
    if (message.sender.id !== currentUserId) return

    longPressTimer.current = setTimeout(() => {
      // Show context menu at center of screen for mobile
      const rect = messagesContainerRef.current?.getBoundingClientRect()
      setContextMenu({
        messageId: message.id,
        x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
        y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      })
    }, 500) // 500ms long press
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleEdit = () => {
    if (!contextMenu) return

    const message = messages.find((m) => m.id === contextMenu.messageId)
    if (message) {
      setEditingMessage({ id: message.id, content: message.content })
      setEditContent(message.content)
    }
    setContextMenu(null)
  }

  const handleSaveEdit = async () => {
    if (!editingMessage || !editContent.trim()) return

    try {
      const endpoint =
        roomType === 'admin'
          ? `/api/customer/chat/message/${editingMessage.id}`
          : `/api/chat/rooms/${roomId}/messages/${editingMessage.id}`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })

      if (res.ok) {
        // Update message in local state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? { ...m, content: editContent.trim() }
              : m
          )
        )
        setEditingMessage(null)
        setEditContent('')
        toast({
          title: 'Berhasil',
          description: 'Pesan berhasil diedit',
        })
      } else {
        const errorData = await res.json()
        toast({
          title: 'Gagal',
          description: errorData.error || 'Gagal mengedit pesan',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error editing message:', error)
      toast({
        title: 'Error',
        description: 'Gagal mengedit pesan',
        variant: 'destructive',
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditContent('')
  }

  const handleDelete = async () => {
    if (!contextMenu) return

    confirm(
      'Hapus Pesan',
      'Apakah Anda yakin ingin menghapus pesan ini?',
      async () => {
        try {
          const endpoint =
            roomType === 'admin'
              ? `/api/customer/chat/message/${contextMenu.messageId}`
              : `/api/chat/rooms/${roomId}/messages/${contextMenu.messageId}`

          const res = await fetch(endpoint, { method: 'DELETE' })

          if (res.ok) {
            setMessages((prev) =>
              prev.filter((m) => m.id !== contextMenu.messageId)
            )
            toast({
              title: 'Berhasil',
              description: 'Pesan berhasil dihapus',
            })
          } else {
            toast({
              title: 'Gagal',
              description: 'Gagal menghapus pesan',
              variant: 'destructive',
            })
          }
        } catch (error) {
          console.error('Error deleting message:', error)
          toast({
            title: 'Error',
            description: 'Terjadi kesalahan',
            variant: 'destructive',
          })
        } finally {
          setContextMenu(null)
        }
      },
      'danger'
    )
  }

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  const renderMedia = (message: Message) => {
    // Handle admin chat images (messageType === 'image') and technician chat images (mediaType)
    if (!message.mediaUrl) return null

    // Check if it's an image - either by mediaType or messageType
    const isImage =
      message.mediaType?.startsWith('image/') || message.messageType === 'image'

    if (isImage) {
      return (
        <div className="mt-2">
          <img
            src={message.mediaUrl}
            alt={message.mediaName || 'Image'}
            className="max-w-full cursor-pointer rounded-lg transition-opacity hover:opacity-90"
            style={{ maxHeight: '150px' }}
            onClick={() => {
              // Collect all image URLs from messages (both admin and technician chat)
              const imageUrls = messages
                .filter(
                  (m) =>
                    m.mediaUrl &&
                    (m.messageType === 'image' ||
                      (m.mediaType && getMediaType(m.mediaType) === 'image'))
                )
                .map((m) => m.mediaUrl!)
              const currentImageIndex = imageUrls.indexOf(message.mediaUrl!)
              setLightboxImages(imageUrls)
              setLightboxIndex(currentImageIndex >= 0 ? currentImageIndex : 0)
              setLightboxOpen(true)
            }}
          />
          {message.mediaName && (
            <p className="mt-1 text-xs opacity-75">{message.mediaName}</p>
          )}
        </div>
      )
    }

    // For video and document, we still need mediaType
    const mediaTypeValue = message.mediaType
      ? getMediaType(message.mediaType)
      : null

    if (mediaTypeValue === 'video') {
      return (
        <div className="mt-2">
          <video
            src={message.mediaUrl}
            controls
            className="max-w-full rounded-lg"
            style={{ maxHeight: '300px' }}
          />
          {message.mediaName && (
            <p className="mt-1 text-xs opacity-75">{message.mediaName}</p>
          )}
        </div>
      )
    }

    if (mediaTypeValue === 'document') {
      return (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/10 p-3">
          <FileText className="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{message.mediaName}</p>
            {message.mediaSize && (
              <p className="text-xs opacity-75">
                {formatFileSize(message.mediaSize)}
              </p>
            )}
          </div>
          <a
            href={message.mediaUrl}
            download={message.mediaName}
            className="text-xs underline hover:no-underline"
          >
            Download
          </a>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white p-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <img
          src={
            otherUserImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserName)}&background=3b82f6&color=fff&size=100`
          }
          alt={otherUserName}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div>

      {/* Order Reference Card - Show if order exists */}
      {order && (
        <div className="border-b border-gray-200 bg-white p-3">
          <OrderReferenceCard order={order} variant="compact" />
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{
          backgroundImage:
            'linear-gradient(to bottom right, rgba(239, 246, 255, 0.95), rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.95)), url(https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Belum ada pesan. Mulai percakapan!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              // Date separator logic
              const currentDate = new Date(message.createdAt)
              const previousDate =
                index > 0 ? new Date(messages[index - 1].createdAt) : null
              const showDateSeparator =
                !previousDate || !isSameDay(currentDate, previousDate)

              const isOwn = message.sender.id === currentUserId

              // Check if content is JSON product/rental data
              const isProductJson =
                message.content?.trim().startsWith('{') &&
                (() => {
                  try {
                    const data = JSON.parse(message.content)
                    return (
                      data.name &&
                      (data.type === 'product' ||
                        data.type === 'rental' ||
                        data.price !== undefined)
                    )
                  } catch {
                    return false
                  }
                })()

              // Check if this is an image message (hide "📷 Gambar" text)
              // Admin chat uses messageType === 'image', technician chat uses mediaType
              const isImageMessage =
                message.messageType === 'image' ||
                message.mediaType?.startsWith('image/') ||
                (message.content === '📷 Gambar' && message.mediaUrl)

              // Parse product data if needed
              let productData: {
                name?: string
                price?: number
                image?: string
                type?: string
                stock?: number
              } | null = null
              if (isProductJson) {
                try {
                  productData = JSON.parse(message.content)
                } catch {
                  productData = null
                }
              }

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && <DateSeparator date={currentDate} />}
                  <div
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900'
                      }`}
                      onContextMenu={(e) => handleContextMenu(e, message)}
                      onTouchStart={() => handleLongPressStart(message)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchMove={handleLongPressEnd}
                    >
                      {/* Edit Mode */}
                      {editingMessage?.id === message.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="rounded bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Product Card */}
                          {productData ? (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                              <div className="flex gap-3 p-3">
                                {productData.image && (
                                  <img
                                    src={productData.image}
                                    alt={productData.name}
                                    className="h-16 w-16 rounded-lg object-cover"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-gray-900">
                                    {productData.name}
                                  </p>
                                  <p className="text-sm font-bold text-blue-600">
                                    Rp{' '}
                                    {productData.price?.toLocaleString('id-ID')}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Stock: {productData.stock || 0}
                                  </p>
                                </div>
                              </div>
                              <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5">
                                <p className="text-xs text-gray-600">
                                  {productData.type === 'rental'
                                    ? '🔧 Rekomendasi Sewa'
                                    : '📦 Rekomendasi Produk'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            /* Normal text message - hide if it's just image placeholder */
                            message.content &&
                            !isImageMessage && (
                              <p className="break-words">{message.content}</p>
                            )
                          )}
                          {renderMedia(message)}
                          <p
                            className={`mt-1 text-xs ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="h-16 w-16 rounded object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100">
                {selectedFile.type.startsWith('video/') ? (
                  <Video className="h-8 w-8 text-gray-400" />
                ) : (
                  <FileText className="h-8 w-8 text-gray-400" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={cancelFileSelection}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && uploadProgress && (
        <div className="border-t border-gray-200 bg-blue-50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {uploadProgress}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="border-t border-gray-200 bg-white p-4"
      >
        {/* Attachment Menu */}
        {showAttachMenu && (
          <div className="mb-3 space-y-2 rounded-xl bg-gray-50 p-3">
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click()
                setShowAttachMenu(false)
              }}
              className="flex w-full items-center gap-3 rounded-lg bg-white p-3 text-left shadow-sm transition-colors hover:bg-gray-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Kirim Gambar</p>
                <p className="text-xs text-gray-500">Pilih dari galeri</p>
              </div>
            </button>

            {/* Product Recommendation Button - Only for Technicians */}
            {roomType === 'technician' && (
              <button
                type="button"
                onClick={() => {
                  setShowProductPicker(true)
                  fetchProducts()
                  setShowAttachMenu(false)
                }}
                className="flex w-full items-center gap-3 rounded-lg bg-white p-3 text-left shadow-sm transition-colors hover:bg-gray-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Rekomendasi Sparepart
                  </p>
                  <p className="text-xs text-gray-500">
                    Kirim rekomendasi produk
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`rounded-lg p-2 transition-all ${showAttachMenu ? 'rotate-45 bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'} disabled:opacity-50`}
            disabled={sending}
          >
            <Plus className="h-5 w-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || sending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[150px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            transform: 'translate(-80%, -50%)', // Shift more to left to prevent cutoff on mobile
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleEdit}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <span>🗑️</span>
            <span>Hapus</span>
          </button>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowProductPicker(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-bold text-gray-900">
                Pilih Sparepart
              </h3>
              <button
                onClick={() => setShowProductPicker(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari sparepart..."
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value)
                    fetchProducts(e.target.value)
                  }}
                  className="w-full rounded-lg border bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-3">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2">Tidak ada produk ditemukan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => sendProductRecommendation(product)}
                      disabled={sending}
                      className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
                    >
                      <img
                        src={product.images?.[0] || '/placeholder-product.png'}
                        alt={product.name}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.category?.name || 'Sparepart'}
                        </p>
                        <p className="text-sm font-semibold text-blue-600">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <Send className="h-5 w-5 flex-shrink-0 text-blue-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toaster />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
