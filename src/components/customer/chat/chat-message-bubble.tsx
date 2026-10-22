'use client'

import React from 'react'
import Link from 'next/link'
import { RotateCcw, Package, ZoomIn, ExternalLink } from 'lucide-react'
import { ChatVideoPlayer } from '@/components/chat/chat-video-player'
import {
  Message,
  ChatRoom,
  ActiveOrderContext,
  isVideoMedia,
  isImageMedia,
  renderWhatsAppTick,
} from './chat-types'

interface ChatMessageBubbleProps {
  msg: Message
  sessionUserId?: string
  selectedRoom: ChatRoom | null
  isStoreOnline: boolean
  activeStoreLogo: string | null
  activeStoreTitle: string
  activeOrderContext: ActiveOrderContext | null
  onOpenFullscreenMedia: (media: {
    url: string
    type: 'image' | 'video'
  }) => void
}

export function ChatMessageBubble({
  msg,
  sessionUserId,
  selectedRoom,
  isStoreOnline,
  activeStoreLogo,
  activeStoreTitle,
  activeOrderContext,
  onOpenFullscreenMedia,
}: ChatMessageBubbleProps) {
  const isMe = msg.sender.id === sessionUserId
  const isVideo = isVideoMedia(msg.mediaUrl, msg.mediaType, msg.messageType)
  const isImage = isImageMedia(msg.mediaUrl, msg.mediaType, msg.messageType)
  const isMedia = isVideo || isImage

  const formattedTime = new Date(msg.createdAt).toLocaleTimeString('id-ID', {
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

  const isOrderOrReturn =
    msg.messageType === 'return_reference' ||
    msg.messageType === 'order_reference' ||
    msg.messageType === 'order' ||
    parsedContent?.type === 'return_reference' ||
    parsedContent?.type === 'order_reference' ||
    parsedContent?.type === 'order' ||
    (parsedContent !== null && parsedContent.orderNumber !== undefined)

  // Detect legacy or prefilled plain text message patterns (e.g. from previous sends)
  const returnTextMatch =
    !parsedContent &&
    contentTrimmed.match(
      /Halo admin, saya ingin menanyakan perkembangan pengajuan retur untuk pesanan #([^\s(]+)(?:\s*\(([^,)]+)(?:,\s*Kendala:\s*([^)]+))?\))?/i
    )
  const orderTextMatch =
    !parsedContent &&
    !returnTextMatch &&
    contentTrimmed.match(
      /Halo admin, saya ingin menanyakan (?:tentang pesanan saya|pesanan saya) #([^\s(]+)(?:\s*\(([^)]+)\))?/i
    )

  const isStructuredInquiry =
    isOrderOrReturn || Boolean(returnTextMatch) || Boolean(orderTextMatch)

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
      id={isStructuredInquiry ? `chat-context-msg-${msg.id}` : undefined}
      className={`flex items-end gap-2.5 transition-all ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      {!isMe && (
        <div className="mb-1 shrink-0">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              width={32}
              height={32}
              loading="lazy"
              decoding="async"
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
        /* Full-Bleed Modern Media Bubble (Compact Mobile Friendly) */
        <div className="shadow-xs group relative max-w-[65%] overflow-hidden rounded-2xl border border-slate-200/80 bg-black dark:border-slate-800 sm:max-w-[240px]">
          {isVideo ? (
            <ChatVideoPlayer
              src={msg.mediaUrl!}
              onOpenFullscreen={() =>
                onOpenFullscreenMedia({
                  url: msg.mediaUrl!,
                  type: 'video',
                })
              }
            />
          ) : (
            <div
              onClick={() =>
                onOpenFullscreenMedia({
                  url: msg.mediaUrl!,
                  type: 'image',
                })
              }
              className="relative cursor-pointer"
            >
              <img
                src={msg.mediaUrl!}
                alt="Foto Lampiran"
                width={200}
                height={160}
                loading="lazy"
                decoding="async"
                className="group-hover:scale-102 block max-h-[160px] w-auto max-w-[200px] rounded-2xl object-cover transition-transform duration-200 sm:max-h-[220px] sm:max-w-[240px]"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md">
                  <ZoomIn className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          )}

          {/* Floating Glassmorphic Timestamp Pill */}
          <div className="shadow-xs pointer-events-none absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[9px] font-medium text-white/95 backdrop-blur-md">
            <span>{formattedTime}</span>
            {isMe && renderWhatsAppTick(msg.isRead, isStoreOnline)}
          </div>
        </div>
      ) : isStructuredInquiry ? (
        /* Standalone Luxury Order / Return Card (Compact Mobile Friendly, identical to product card) */
        (() => {
          try {
            const p: Record<string, unknown> = parsedContent ?? {}
            const isReturn =
              Boolean(returnTextMatch) ||
              msg.messageType === 'return_reference' ||
              p.type === 'return_reference' ||
              p.returnReason !== undefined ||
              p.returnId !== undefined

            const orderNumber =
              (p.orderNumber as string) ||
              (returnTextMatch && returnTextMatch[1]) ||
              (orderTextMatch && orderTextMatch[1]) ||
              selectedRoom?.order?.orderNumber ||
              ''

            const orderId =
              (p.orderId as string) ||
              selectedRoom?.order?.id ||
              activeOrderContext?.orderId ||
              ''

            const prodName =
              (p.productName as string) ||
              (p.name as string) ||
              (returnTextMatch && returnTextMatch[2]) ||
              (orderTextMatch && orderTextMatch[2]) ||
              activeOrderContext?.productName ||
              selectedRoom?.order?.items?.[0]?.product?.name ||
              'Produk Pesanan'

            const rawPrice =
              p.productPrice !== undefined
                ? p.productPrice
                : p.price !== undefined
                  ? p.price
                  : p.orderTotal !== undefined
                    ? p.orderTotal
                    : activeOrderContext?.productPrice ||
                      selectedRoom?.order?.items?.[0]?.price ||
                      selectedRoom?.order?.total ||
                      0

            const prodPrice = Number(rawPrice) || 0

            const rawImage =
              p.productImage ||
              p.image ||
              activeOrderContext?.productImage ||
              selectedRoom?.order?.items?.[0]?.product?.images?.[0] ||
              null

            const prodImage = Array.isArray(rawImage)
              ? (rawImage[0] as string)
              : typeof rawImage === 'string' && rawImage.trim() !== ''
                ? rawImage
                : null

            const brand =
              (p.brand as string) ||
              selectedRoom?.order?.items?.[0]?.product?.brand ||
              null

            const variantName = (p.variantName as string) || null

            const returnReason =
              (p.returnReason as string) ||
              (returnTextMatch && returnTextMatch[3]) ||
              activeOrderContext?.returnRequest?.reason ||
              null

            const returnStatus =
              (p.returnStatus as string) ||
              activeOrderContext?.returnRequest?.status ||
              'PENDING'

            return (
              <div className="shadow-xs max-w-[85%] space-y-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:max-w-[320px]">
                {/* Top Header Info Pill */}
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      isReturn
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    }`}
                  >
                    {isReturn ? (
                      <RotateCcw className="h-2.5 w-2.5" />
                    ) : (
                      <Package className="h-2.5 w-2.5" />
                    )}
                    {isReturn ? 'Pengajuan Retur' : 'Rincian Pesanan'}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span>{formattedTime}</span>
                    {isMe &&
                      renderWhatsAppTick(msg.isRead, isStoreOnline, 'small')}
                  </div>
                </div>

                {/* Main Product / Order Snippet */}
                <div className="flex items-center gap-2">
                  {prodImage ? (
                    <img
                      src={prodImage}
                      alt={prodName}
                      width={44}
                      height={44}
                      loading="lazy"
                      decoding="async"
                      className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-cover p-0.5 dark:border-slate-800 dark:bg-slate-800"
                    />
                  ) : (
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        isReturn
                          ? 'border-purple-200/60 bg-purple-50 dark:border-purple-900/40 dark:bg-purple-950/40'
                          : 'border-blue-200/60 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/40'
                      }`}
                    >
                      {isReturn ? (
                        <RotateCcw className="h-5 w-5 text-purple-500" />
                      ) : (
                        <Package className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {brand && (
                      <span className="block text-[8.5px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        {brand}
                      </span>
                    )}
                    <p
                      className="truncate text-[11px] font-bold leading-tight text-slate-950 dark:text-white"
                      title={prodName}
                    >
                      {prodName}
                    </p>
                    {orderNumber && (
                      <p className="truncate font-mono text-[9.5px] font-bold text-blue-600 dark:text-blue-400">
                        #{orderNumber}
                      </p>
                    )}
                    {isReturn && returnReason && (
                      <p className="truncate text-[9.5px] font-medium text-purple-600 dark:text-purple-400">
                        Kendala: {returnReason}
                      </p>
                    )}
                    {variantName && !orderNumber && (
                      <p className="truncate text-[9.5px] font-medium text-slate-500 dark:text-slate-400">
                        Varian: {variantName}
                      </p>
                    )}
                    {prodPrice > 0 && (
                      <p className="mt-0.5 font-mono text-xs font-black text-orange-600 dark:text-orange-400">
                        Rp {prodPrice.toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Note / Caption sent together (filter automated confirmation greeting) */}
                {typeof p.note === 'string' &&
                  p.note.trim() !== '' &&
                  !p.note.includes('ingin mengonfirmasi pesanan') && (
                    <div className="mt-1.5 rounded-xl border border-slate-100 bg-slate-50/90 p-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {p.note}
                      </p>
                    </div>
                  )}

                {/* Footer CTA */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 dark:border-slate-800">
                  <span className="text-[9.5px] text-slate-400">
                    {isReturn
                      ? returnStatus === 'APPROVED'
                        ? 'Disetujui'
                        : returnStatus === 'REJECTED'
                          ? 'Ditolak'
                          : 'Menunggu Verifikasi Toko'
                      : isMe
                        ? 'Pertanyaan Anda'
                        : activeStoreTitle || 'Toko Resmi'}
                  </span>
                  {(orderId || orderNumber) && (
                    <Link
                      href={`/dashboard/customer/orders/${orderId || orderNumber}`}
                      className="shadow-2xs inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      <span>Lihat Pesanan</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            )
          } catch {
            return (
              <div className="shadow-2xs max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 sm:max-w-[70%]">
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            )
          }
        })()
      ) : isProduct ? (
        /* Standalone Luxury Product Card (Compact Mobile Friendly) */
        (() => {
          try {
            const p: Record<string, unknown> =
              parsedContent ?? JSON.parse(msg.content)
            const prodId = (p.productId as string) || (p.id as string)
            const prodName =
              (p.productName as string) || (p.name as string) || 'Produk Gadget'
            const prodPrice =
              p.productPrice !== undefined ? p.productPrice : p.price
            const rawImage = p.productImage || p.image || null
            const prodImage = Array.isArray(rawImage)
              ? (rawImage[0] as string)
              : typeof rawImage === 'string' && rawImage.trim() !== ''
                ? rawImage
                : null
            const isReference =
              p.type === 'product_reference' ||
              msg.messageType === 'product_reference'

            return (
              <div className="shadow-xs max-w-[80%] space-y-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:max-w-[300px]">
                {/* Top Header Info Pill */}
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                    <Package className="h-2.5 w-2.5" />
                    {isReference ? 'Produk Ditanyakan' : 'Rekomendasi Toko'}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span>{formattedTime}</span>
                    {isMe &&
                      renderWhatsAppTick(msg.isRead, isStoreOnline, 'small')}
                  </div>
                </div>

                {/* Main Product Snippet */}
                <div className="flex items-center gap-2">
                  {prodImage ? (
                    <img
                      src={prodImage as string}
                      alt={prodName}
                      width={44}
                      height={44}
                      loading="lazy"
                      decoding="async"
                      className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-cover p-0.5 dark:border-slate-800 dark:bg-slate-800"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200/60 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/40">
                      <Package className="h-5 w-5 text-orange-500" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {typeof p.brand === 'string' && p.brand && (
                      <span className="block text-[8.5px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        {p.brand}
                      </span>
                    )}
                    <p
                      className="truncate text-[11px] font-bold leading-tight text-slate-950 dark:text-white"
                      title={prodName}
                    >
                      {prodName}
                    </p>
                    {typeof p.variantName === 'string' && p.variantName && (
                      <p className="truncate text-[9.5px] font-medium text-slate-500 dark:text-slate-400">
                        Varian: {p.variantName}
                      </p>
                    )}
                    <p className="mt-0.5 font-mono text-xs font-black text-orange-600 dark:text-orange-400">
                      Rp {(Number(prodPrice) || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Customer Note / Caption sent together */}
                {typeof p.note === 'string' && p.note.trim() !== '' && (
                  <div className="mt-1.5 rounded-xl border border-slate-100 bg-slate-50/90 p-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {p.note}
                    </p>
                  </div>
                )}

                {/* Footer CTA */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 dark:border-slate-800">
                  <span className="text-[9.5px] text-slate-400">
                    {isMe
                      ? 'Pertanyaan Anda'
                      : activeStoreTitle || 'Toko Resmi'}
                  </span>
                  {prodId && (
                    <a
                      href={`/gadget/${prodId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shadow-2xs inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      <span>Lihat Unit</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            )
          } catch {
            return (
              <div className="shadow-2xs max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 sm:max-w-[70%]">
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            )
          }
        })()
      ) : (
        /* Standard Text Bubble */
        <div
          className={`shadow-2xs max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:max-w-[70%] ${
            isMe
              ? 'rounded-tr-xs bg-blue-600 text-white shadow-blue-500/10'
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
          <p className="whitespace-pre-wrap break-words break-all text-xs leading-relaxed sm:text-[13px]">
            {msg.content}
          </p>

          <div
            className={`mt-1.5 flex items-center justify-end gap-1 text-[9.5px] font-medium ${
              isMe ? 'text-blue-100 dark:text-blue-200' : 'text-slate-400'
            }`}
          >
            <span>{formattedTime}</span>
            {isMe &&
              renderWhatsAppTick(
                msg.isRead,
                isStoreOnline,
                'normal',
                'on-blue'
              )}
          </div>
        </div>
      )}
    </div>
  )
}
