'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Send,
  Loader2,
  ArrowLeft,
  Paperclip,
  X,
  FileText,
  Video,
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
interface Message {
  id: string
  content: string
  createdAt: string
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

interface ChatWindowProps {
  roomId: string
  currentUserId: string
  otherUserName: string
  otherUserImage: string | null
}

export default function ChatWindow({
  roomId,
  currentUserId,
  otherUserName,
  otherUserImage,
}: ChatWindowProps) {
  const router = useRouter()
  const { toast } = useToast()
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
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`)
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
    } = {}

    // Process file if selected
    if (selectedFile) {
      try {
        setUploadProgress('Memproses file...')
        const processed = await processFileForUpload(selectedFile)
        mediaData = {
          mediaUrl: processed.base64,
          mediaType: processed.type,
          mediaSize: processed.size,
          mediaName: processed.name,
        }
        setUploadProgress('Mengirim...')
      } catch (error) {
        toast({
          title: 'Error',
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
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, ...mediaData }),
      })

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

  const renderMedia = (message: Message) => {
    if (!message.mediaUrl || !message.mediaType) return null

    const mediaType = getMediaType(message.mediaType)

    if (mediaType === 'image') {
      return (
        <div className="mt-2">
          <img
            src={message.mediaUrl}
            alt={message.mediaName || 'Image'}
            className="max-w-full cursor-pointer rounded-lg transition-opacity hover:opacity-90"
            style={{ maxHeight: '300px' }}
            onClick={() => {
              // Collect all image URLs from messages
              const imageUrls = messages
                .filter(
                  (m) =>
                    m.mediaUrl &&
                    m.mediaType &&
                    getMediaType(m.mediaType) === 'image'
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

    if (mediaType === 'video') {
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

    if (mediaType === 'document') {
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

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50 p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Belum ada pesan. Mulai percakapan!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender.id === currentUserId

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    {message.content && (
                      <p className="break-words">{message.content}</p>
                    )}
                    {renderMedia(message)}
                    <p
                      className={`mt-1 text-xs ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
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
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            disabled={sending}
          >
            <Paperclip className="h-5 w-5" />
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

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}
