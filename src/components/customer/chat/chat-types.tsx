import React from 'react'
import { Check, CheckCheck } from 'lucide-react'
import { getChatTickStatus } from '@/lib/chat-status'

export interface ChatRoom {
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
      isActive?: boolean
      schedules?: Array<{
        day: string
        openTime: string
        closeTime: string
        isClosed?: boolean
      }>
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
    returnRequests?: Array<{
      id: string
      status: string
      type: string
      reason?: string
      reasonLabel?: string
    }>
  } | null
  store?: {
    id: string
    name: string
    companyName?: string
    phone?: string | null
    city?: string
    logo?: string | null
    isActive?: boolean
    schedules?: Array<{
      day: string
      openTime: string
      closeTime: string
      isClosed?: boolean
    }>
  } | null
  technician?: {
    id?: string
    isAvailable?: boolean
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
  hasOrder?: boolean
  totalUnread?: number
  messages?: {
    id?: string
    content: string
    messageType?: string
    mediaUrl?: string | null
    mediaType?: string | null
    isRead?: boolean
    createdAt?: string
    senderId?: string
  }[]
  _count?: {
    messages: number
  }
}

export interface Message {
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

export interface PinnedOrderContext {
  messageId?: string
  orderId?: string
  orderNumber: string
  total?: number
  status?: string
  productName?: string | null
  isReturn?: boolean
  returnReason?: string | null
  returnStatus?: string | null
}

export interface ActiveServiceContext {
  mitraId: string
  mitraName: string
  mitraCity?: string
  mitraImage?: string
}

export interface ActiveProductContext {
  productId?: string
  productName?: string
  productPrice?: number
  productImage?: string
  variantName?: string
}

export interface ActiveOrderContext {
  orderId: string
  orderNumber?: string
  status?: string
  total?: number
  productName?: string
  productImage?: string
  productPrice?: number
  returnRequest?: {
    id?: string
    status?: string
    reason?: string
    type?: string
  } | null
}

export const NON_MEDIA_TYPES = [
  'product_reference',
  'product',
  'order',
  'rental',
  'service',
  'text',
]

export const isVideoMedia = (
  url?: string | null,
  mediaType?: string | null,
  messageType?: string | null
): boolean => {
  if (messageType && NON_MEDIA_TYPES.includes(messageType)) return false
  if (messageType === 'video') return true
  if (mediaType?.startsWith('video/')) return true
  if (url && /\.(mp4|webm|mov|mkv|ogg|3gp)(\?.*)?$/i.test(url)) return true
  return false
}

export const isImageMedia = (
  url?: string | null,
  mediaType?: string | null,
  messageType?: string | null
): boolean => {
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

export const renderWhatsAppTick = (
  isRead?: boolean,
  isOnline: boolean = true,
  size: 'normal' | 'small' = 'normal',
  variant: 'default' | 'on-blue' = 'default'
) => {
  const tickStatus = getChatTickStatus({ isRead, isRecipientOnline: isOnline })
  const iconClass = size === 'small' ? 'inline h-2.5 w-2.5' : 'inline h-3 w-3'

  if (variant === 'on-blue') {
    if (tickStatus === 'READ') {
      return (
        <span title="Sudah dibaca">
          <CheckCheck className={`${iconClass} text-sky-300`} />
        </span>
      )
    }
    if (tickStatus === 'DELIVERED') {
      return (
        <span title="Diterima server (Toko online)">
          <CheckCheck className={`${iconClass} text-blue-200/80`} />
        </span>
      )
    }
    return (
      <span title="Terkirim ke server (Toko offline)">
        <Check className={`${iconClass} text-blue-200/80`} />
      </span>
    )
  }

  if (tickStatus === 'READ') {
    return (
      <span title="Sudah dibaca">
        <CheckCheck
          className={`${iconClass} text-blue-500 dark:text-blue-400`}
        />
      </span>
    )
  }

  if (tickStatus === 'DELIVERED') {
    return (
      <span title="Diterima server (Toko online)">
        <CheckCheck
          className={`${iconClass} text-slate-400 dark:text-slate-400`}
        />
      </span>
    )
  }

  return (
    <span title="Terkirim ke server (Toko offline)">
      <Check className={`${iconClass} text-slate-400 dark:text-slate-400`} />
    </span>
  )
}

export const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: {
    label: 'Belum Bayar',
    color: 'bg-amber-50 text-amber-700',
  },
  PAID: { label: 'Dibayar', color: 'bg-blue-50 text-blue-700' },
  PROCESSING: { label: 'Diproses', color: 'bg-purple-50 text-purple-700' },
  SHIPPED: { label: 'Dikirim', color: 'bg-indigo-50 text-indigo-700' },
  DELIVERED: { label: 'Terkirim', color: 'bg-teal-50 text-teal-700' },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-rose-50 text-rose-700' },
}

export const formatTime = (dateString: string): string => {
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

export const formatMessagePreview = (message?: {
  content: string
  messageType?: string
  mediaUrl?: string | null
  mediaType?: string | null
}): string => {
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

  // 4. Media attachments
  if (isVideoMedia(message.mediaUrl, message.mediaType, message.messageType)) {
    return '🎥 Lampiran Video'
  }
  if (isImageMedia(message.mediaUrl, message.mediaType, message.messageType)) {
    return '📷 Lampiran Foto'
  }

  if (message.messageType === 'rental') return '🔄 Rekomendasi Sewa'
  if (message.messageType === 'service') return '🔧 Rekomendasi Servis'
  return message.content
}
