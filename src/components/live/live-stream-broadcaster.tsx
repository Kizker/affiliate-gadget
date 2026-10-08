'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react'
import type { LocalVideoTrack } from 'livekit-client'
import {
  Radio,
  StopCircle,
  ShoppingBag,
  Copy,
  CheckCheck,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Pin,
  Play,
  Share2,
  FlipHorizontal,
  MessageSquare,
  Crop,
  Search,
  X,
  Send,
  Zap,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLiveKitToken } from '@/hooks/use-livekit-token'
import { useLiveChat } from '@/hooks/use-live-chat'
import { useKeyboardInset } from '@/hooks/use-keyboard-inset'
import { captureVideoSnapshot, uploadLiveSnapshot } from '@/lib/live-snapshot'
import { LiveStreamStatusBar } from './live-stream-status-bar'
import { LiveChatPanel } from './live-chat-panel'
import { LiveProductPin } from './live-product-pin'
import { FloatingHeartsOverlay } from './floating-hearts'
import { LiveFrameGuides } from './live-frame-guides'
import { HOST_ROOM_OPTIONS } from '@/lib/livekit-options'

// Custom hook to detect mobile viewport for host studio
function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

interface StoreProduct {
  id: string
  name: string
  price: number
  images: string[]
  brand: string | null
  stock: number
  rating: number
}

interface LiveStreamData {
  id: string
  title: string
  status: string
  viewerCount: number
  startedAt: string | null
  featuredProductIds: string[]
  livekitRoomName?: string
}

// Inner Studio Component inside LiveKitRoom context
function LiveKitStudioControls({
  stream,
  products,
  onEndStream,
}: {
  stream: LiveStreamData
  products: StoreProduct[]
  onEndStream: () => void
}) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [cameraActive, setCameraActive] = useState(true)
  const [micActive, setMicActive] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [isMirrored, setIsMirrored] = useState(true)
  const [showGuides, setShowGuides] = useState(true)
  const [mobileTab, setMobileTab] = useState<'chat' | 'products'>('chat')
  const [productSearch, setProductSearch] = useState('')
  const [productFilterMode, setProductFilterMode] = useState<
    'all' | 'featured'
  >('all')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  )
  const [copied, setCopied] = useState(false)
  const [hostInputText, setHostInputText] = useState('')
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [discountInputs, setDiscountInputs] = useState<Record<string, string>>(
    {}
  )

  const isMobile = useIsMobile()
  const { keyboardInset } = useKeyboardInset(isMobile)
  const mobileChatScrollRef = useRef<HTMLDivElement>(null)
  const videoElementRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMobile) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.classList.add('mobile-live-active')
      document.body.classList.add('mobile-live-active')

      const handleViewportReset = () => {
        window.scrollTo(0, 0)
      }
      window.addEventListener('resize', handleViewportReset)
      window.addEventListener('orientationchange', handleViewportReset)

      return () => {
        document.documentElement.classList.remove('mobile-live-active')
        document.body.classList.remove('mobile-live-active')
        window.removeEventListener('resize', handleViewportReset)
        window.removeEventListener('orientationchange', handleViewportReset)
      }
    }
  }, [isMobile])

  // Attach local video track to DOM element otomatis saat track siap
  useEffect(() => {
    if (!localParticipant || !videoElementRef.current || !cameraActive) return
    const videoEl = videoElementRef.current

    const tryAttach = () => {
      if (!videoEl) return false
      const publication =
        localParticipant.getTrackPublication('camera' as any) ||
        Array.from(localParticipant.trackPublications.values()).find(
          (p) => p.source === 'camera' || p.kind === 'video'
        )

      if (publication && publication.track) {
        try {
          publication.track.attach(videoEl)
          return true
        } catch {
          return false
        }
      }
      return false
    }

    // Coba pasang langsung
    if (tryAttach()) return

    // Pasang listener jika track sedang dipersiapkan/dipublikasikan
    const onTrackPublished = () => {
      tryAttach()
    }

    localParticipant.on('localTrackPublished' as any, onTrackPublished)
    localParticipant.on('trackPublished' as any, onTrackPublished)
    if (room) {
      room.on('localTrackPublished' as any, onTrackPublished)
    }

    // Polling fallback singkat (setiap 150ms maks 5 detik)
    const interval = setInterval(() => {
      if (tryAttach()) {
        clearInterval(interval)
      }
    }, 150)

    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      localParticipant.off('localTrackPublished' as any, onTrackPublished)
      localParticipant.off('trackPublished' as any, onTrackPublished)
      if (room) {
        room.off('localTrackPublished' as any, onTrackPublished)
      }
      const publication = localParticipant.getTrackPublication('camera' as any)
      if (publication && publication.track && videoEl) {
        try {
          publication.track.detach(videoEl)
        } catch {
          // Ignore detach error on unmount
        }
      }
    }
  }, [localParticipant, room, cameraActive, facingMode])

  // WebSocket Chat & Interactions Hook for Host
  const {
    messages,
    viewerCount,
    pinnedProduct,
    isConnected: isWsConnected,
    likeCount,
    sendMessage,
    sendLike,
    pinProduct,
    unpinProduct,
    endStream: wsEndStream,
    setMirror,
  } = useLiveChat({
    streamId: stream.id,
    userName: 'Host Toko',
    isBroadcaster: true,
  })

  // Sync initial mirror state when WebSocket connects
  useEffect(() => {
    if (isWsConnected) {
      setMirror(isMirrored)
    }
  }, [isWsConnected, isMirrored, setMirror])

  // Toggle Camera
  const toggleCamera = async () => {
    if (!localParticipant) return
    const nextState = !cameraActive
    await localParticipant.setCameraEnabled(nextState)
    setCameraActive(nextState)
  }

  // Toggle Microphone
  const toggleMic = async () => {
    if (!localParticipant) return
    const nextState = !micActive
    await localParticipant.setMicrophoneEnabled(nextState)
    setMicActive(nextState)
  }

  // Flip Camera (Front / Back)
  const flipCamera = async () => {
    if (!localParticipant) return
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    const nextMirror = nextMode === 'user'

    try {
      // Cari perangkat kamera fisik (depan / belakang) via enumerateDevices
      let targetDeviceId: string | undefined
      if (
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices?.enumerateDevices
      ) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === 'videoinput')

        if (videoDevices.length > 1) {
          if (nextMode === 'environment') {
            const backCam = videoDevices.find((d) =>
              /back|rear|environment|belakang|main/i.test(d.label)
            )
            if (backCam) {
              targetDeviceId = backCam.deviceId
            } else {
              const currentPub = localParticipant.getTrackPublication(
                'camera' as any
              )
              const currentTrack = currentPub?.track?.mediaStreamTrack
              const currentId = currentTrack?.getSettings()?.deviceId
              const otherCam = videoDevices.find(
                (d) => d.deviceId !== currentId
              )
              if (otherCam) targetDeviceId = otherCam.deviceId
            }
          } else {
            const frontCam = videoDevices.find((d) =>
              /front|user|depan|selfie|face/i.test(d.label)
            )
            if (frontCam) {
              targetDeviceId = frontCam.deviceId
            } else {
              const currentPub = localParticipant.getTrackPublication(
                'camera' as any
              )
              const currentTrack = currentPub?.track?.mediaStreamTrack
              const currentId = currentTrack?.getSettings()?.deviceId
              const otherCam = videoDevices.find(
                (d) => d.deviceId !== currentId
              )
              if (otherCam) targetDeviceId = otherCam.deviceId
            }
          }
        }
      }

      // 1. Restart LocalVideoTrack dengan constraints target facingMode & deviceId
      const publication = localParticipant.getTrackPublication('camera' as any)
      const localTrack = publication?.track as LocalVideoTrack | undefined

      if (localTrack && typeof localTrack.restartTrack === 'function') {
        const videoOptions: {
          facingMode?: 'user' | 'environment'
          deviceId?: string
        } = {
          facingMode: nextMode,
        }
        if (targetDeviceId) {
          videoOptions.deviceId = targetDeviceId
        }
        await localTrack.restartTrack(videoOptions)

        if (videoElementRef.current) {
          localTrack.attach(videoElementRef.current)
        }
      }

      // 2. Beritahukan room untuk switchActiveDevice jika ada targetDeviceId
      if (
        room &&
        typeof room.switchActiveDevice === 'function' &&
        targetDeviceId
      ) {
        await room
          .switchActiveDevice('videoinput', targetDeviceId)
          .catch(() => {})
      }

      setFacingMode(nextMode)
      setIsMirrored(nextMirror)
      setMirror(nextMirror)
    } catch (err) {
      console.warn(
        'Gagal beralih kamera via restartTrack, mencoba fallback unpublish/republish:',
        err
      )
      try {
        const publication = localParticipant.getTrackPublication(
          'camera' as any
        )
        if (publication?.track) {
          await localParticipant.unpublishTrack(publication.track)
          publication.track.stop()
        }
        await localParticipant.setCameraEnabled(true, {
          facingMode: nextMode,
        })
        const newPub = localParticipant.getTrackPublication('camera' as any)
        if (newPub?.track && videoElementRef.current) {
          newPub.track.attach(videoElementRef.current)
        }
        setFacingMode(nextMode)
        setIsMirrored(nextMirror)
        setMirror(nextMirror)
      } catch (fallbackErr) {
        console.error('Fallback switch kamera gagal:', fallbackErr)
      }
    }
  }

  // Toggle Mirror View manually
  const toggleMirror = () => {
    const nextMirror = !isMirrored
    setIsMirrored(nextMirror)
    setMirror(nextMirror)
  }

  // Handle Pin Product (memilih diskon sematan khusus yang berbeda dari diskon 5 barang live)
  const handlePinProduct = async (
    prod: StoreProduct,
    customDiscount?: number
  ) => {
    let dealToken: string | undefined
    if (customDiscount && customDiscount > 0 && customDiscount < prod.price) {
      try {
        const res = await fetch(`/api/live-streams/${stream.id}/deals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: prod.id,
            productTitle: prod.name,
            productImage: prod.images[0] || '',
            productSlug: prod.id,
            originalPrice: prod.price,
            discountPrice: customDiscount,
            dealType: 'PINNED_DEAL',
            badgeLabel: 'Diskon Spesial Sematan Live',
          }),
        })
        const json = await res.json()
        if (json.success && json.data?.dealToken) {
          dealToken = json.data.dealToken
        }
      } catch (err) {
        console.error('Error creating pinned live deal:', err)
      }
    } else {
      // Periksa apakah produk ini sudah memiliki diskon khusus sematan atau live yang dibuat saat setup
      try {
        const res = await fetch(`/api/live-streams/${stream.id}/deals`)
        const json = await res.json()
        const deals: any[] =
          json.activeDeals || (json.activeDeal ? [json.activeDeal] : [])
        // Prioritaskan PINNED_DEAL, fallback ke LIVE_FEATURED
        const existingPinned = deals.find(
          (d: any) =>
            d.productId === prod.id &&
            d.dealType === 'PINNED_DEAL' &&
            d.isActive &&
            !d.isUsed
        )
        const existingFeatured = deals.find(
          (d: any) => d.productId === prod.id && d.isActive && !d.isUsed
        )
        const chosen = existingPinned || existingFeatured
        if (chosen) {
          dealToken = chosen.dealToken
          customDiscount = chosen.discountPrice
        }
      } catch (err) {
        console.error('Error fetching existing setup deals:', err)
      }
    }

    pinProduct({
      productId: prod.id,
      productTitle: prod.name,
      productPrice: prod.price,
      productImage: prod.images[0] || '',
      productSlug: prod.id,
      originalPrice: prod.price,
      discountPrice: customDiscount || (dealToken ? customDiscount : undefined),
      dealToken,
    })
    setSelectedProductId(prod.id)

    // Tambahkan otomatis ke featuredProductIds di database jika belum ada
    if (stream.id && !stream.featuredProductIds?.includes(prod.id)) {
      try {
        const nextIds = Array.from(
          new Set([...(stream.featuredProductIds || []), prod.id])
        )
        await fetch(`/api/live-streams/${stream.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featuredProductIds: nextIds }),
        })
        stream.featuredProductIds = nextIds
      } catch {
        // Abaikan kegagalan patch non-kritis
      }
    }
  }

  const handleUnpinProduct = async () => {
    unpinProduct()
    if (stream.id) {
      fetch(
        `/api/live-streams/${stream.id}/deals?productId=${selectedProductId || ''}&dealType=PINNED_DEAL`,
        {
          method: 'DELETE',
        }
      ).catch(() => {})
    }
  }

  // Filter produk katalog berdasarkan search & filter mode
  const filteredCatalogProducts = products.filter((p) => {
    if (productFilterMode === 'featured') {
      const isInitial = (stream.featuredProductIds || []).includes(p.id)
      if (!isInitial) return false
    }
    if (!productSearch.trim()) return true
    const q = productSearch.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    )
  })

  // Auto-scroll mobile host comments stream to bottom
  useEffect(() => {
    if (mobileChatScrollRef.current) {
      mobileChatScrollRef.current.scrollTop =
        mobileChatScrollRef.current.scrollHeight
    }
  }, [messages])

  // Periodic automatic snapshot every 30 seconds for social thumbnail
  useEffect(() => {
    if (!stream.id || !cameraActive) return
    const interval = setInterval(() => {
      if (videoElementRef.current) {
        const snap = captureVideoSnapshot(
          videoElementRef.current,
          1280,
          720,
          0.85,
          isMirrored
        )
        if (snap) {
          uploadLiveSnapshot(stream.id, snap).catch(() => {})
        }
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [stream.id, cameraActive, isMirrored])

  // Handle send host reply comment
  const handleSendHostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = hostInputText.trim()
    if (!trimmed) return
    sendMessage(trimmed)
    setHostInputText('')
  }

  // Handle share live stream with immediate snapshot capture
  const handleShare = async () => {
    const videoEl = videoElementRef.current
    const snapshot = captureVideoSnapshot(videoEl, 1280, 720, 0.85, isMirrored)
    if (snapshot && stream?.id) {
      uploadLiveSnapshot(stream.id, snapshot).catch(() => {})
    }
    const shareUrl = `${window.location.origin}/live/${stream?.id}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: stream?.title || 'Live Streaming Toko',
          text: `Tonton live streaming toko kami di Affiliate Gadget!`,
          url: shareUrl,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore
    }
  }

  const handleEnd = () => {
    if (confirm('Apakah Anda yakin ingin mengakhiri siaran langsung ini?')) {
      wsEndStream()
      onEndStream()
    }
  }

  // ===================================================================
  // 1. MOBILE VIEW: FULLSCREEN IMMERSIVE BROADCASTER STUDIO (Instagram/TikTok Host Style)
  // ===================================================================
  if (isMobile) {
    const mobileStudio = (
      <div
        className="fixed inset-0 z-[99999] flex h-[100dvh] h-full w-full select-none flex-col overflow-hidden bg-black text-white"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100dvh',
          width: '100%',
          position: 'fixed',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        {/* Fullscreen Video Camera Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-black">
          {cameraActive ? (
            <video
              ref={videoElementRef}
              autoPlay
              playsInline
              muted
              style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
              className="h-full w-full object-cover transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
              <CameraOff className="h-16 w-16 stroke-1 text-slate-600" />
              <p className="text-sm font-medium">Kamera Dimatikan</p>
            </div>
          )}

          {/* Floating Hearts Animation */}
          <FloatingHeartsOverlay triggerCount={likeCount} />
        </div>

        {/* Top Floating Status Bar & Quick Actions */}
        <div className="pointer-events-auto absolute left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top,12px))] z-30 flex items-center justify-between gap-2">
          <LiveStreamStatusBar
            startedAt={stream.startedAt || new Date()}
            viewerCount={viewerCount}
            isLive={stream.status === 'LIVE'}
            isConnected={isWsConnected}
          />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-2 text-white/90 backdrop-blur-md transition-all hover:bg-black/80 active:scale-90"
              title="Bagikan Tautan Siaran"
            >
              {copied ? (
                <CheckCheck className="h-4 w-4 text-emerald-400" />
              ) : (
                <Share2 className="h-4 w-4 text-white" />
              )}
            </button>

            <button
              type="button"
              onClick={handleEnd}
              className="flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-rose-700 active:scale-95"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>Akhiri</span>
            </button>
          </div>
        </div>

        {/* Right Floating Quick Camera/Mic Controls */}
        <div className="pointer-events-auto absolute right-3 top-[calc(max(0.75rem,env(safe-area-inset-top,12px))+3.25rem)] z-30 flex flex-col items-center gap-2">
          {/* Flip Camera */}
          <button
            type="button"
            onClick={flipCamera}
            className="rounded-full border border-white/15 bg-black/60 p-2 text-white shadow-md backdrop-blur-md hover:bg-black/80 active:scale-90"
            title="Balik Kamera Depan/Belakang"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Microphone */}
          <button
            type="button"
            onClick={toggleMic}
            className={`rounded-full border border-white/15 p-2 shadow-md backdrop-blur-md transition-all active:scale-90 ${
              micActive
                ? 'bg-black/60 text-white'
                : 'bg-rose-600 text-white ring-2 ring-rose-400/50'
            }`}
            title={micActive ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {micActive ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={toggleCamera}
            className={`rounded-full border border-white/15 p-2 shadow-md backdrop-blur-md transition-all active:scale-90 ${
              cameraActive
                ? 'bg-black/60 text-white'
                : 'bg-rose-600 text-white ring-2 ring-rose-400/50'
            }`}
            title={cameraActive ? 'Matikan Kamera' : 'Nyalakan Kamera'}
          >
            {cameraActive ? (
              <Camera className="h-4 w-4" />
            ) : (
              <CameraOff className="h-4 w-4" />
            )}
          </button>

          {/* Mirror */}
          <button
            type="button"
            onClick={toggleMirror}
            className={`rounded-full border border-white/15 p-2 shadow-md backdrop-blur-md transition-all active:scale-90 ${
              isMirrored
                ? 'bg-orange-500 text-white ring-2 ring-orange-400/50'
                : 'bg-black/60 text-white/70'
            }`}
            title="Cermin/Mirror Kamera"
          >
            <FlipHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Floating Comments Stream, Pinned Product & Bottom Action Bar */}
        <div
          className="pointer-events-none relative z-30 mt-auto flex flex-col justify-end gap-2.5 p-3"
          style={{
            transform: `translateY(-${keyboardInset}px)`,
            paddingBottom:
              keyboardInset > 0
                ? 10
                : 'max(1.25rem, env(safe-area-inset-bottom, 16px))',
          }}
        >
          {/* Floating Comments Stream (Overlay di atas video, menempel di bawah / di atas barang sematan) */}
          <div
            ref={mobileChatScrollRef}
            className="pointer-events-auto flex max-h-[46dvh] flex-col gap-1.5 overflow-y-auto pr-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              maskImage:
                messages.length > 3
                  ? 'linear-gradient(to bottom, transparent 0%, black 12%)'
                  : undefined,
              WebkitMaskImage:
                messages.length > 3
                  ? 'linear-gradient(to bottom, transparent 0%, black 12%)'
                  : undefined,
            }}
          >
            {messages.slice(-30).map((msg) => (
              <div
                key={msg.id}
                className="flex max-w-[90%] items-start gap-1.5 self-start rounded-2xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white shadow-sm backdrop-blur-md"
              >
                <span className="shrink-0 font-bold text-orange-500">
                  {msg.userName === 'Host Toko' ? (
                    <span className="mr-1 rounded bg-orange-500 px-1 py-0.5 text-[9px] font-black text-white">
                      HOST
                    </span>
                  ) : null}
                  {msg.userName}:
                </span>
                <span className="break-words leading-snug text-white/95">
                  {msg.message}
                </span>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="self-start rounded-full bg-black/40 px-3 py-1 text-[11px] italic text-white/70 backdrop-blur-sm">
                Belum ada komentar dari penonton...
              </div>
            )}
          </div>

          {/* Floating Pinned Product Card (Light Mode Bersih - Setengah Lebar) */}
          {pinnedProduct && (
            <div className="pointer-events-auto relative flex max-w-[62%] items-center justify-between gap-2 self-start rounded-2xl border border-orange-500/40 bg-white/95 p-2 text-slate-900 shadow-2xl shadow-black/20 backdrop-blur-md animate-in slide-in-from-bottom-2 sm:max-w-[280px]">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {pinnedProduct.productImage ? (
                    <img
                      src={pinnedProduct.productImage}
                      alt={pinnedProduct.productTitle || 'Produk'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-orange-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-bold text-slate-900"
                    title={pinnedProduct.productTitle}
                  >
                    {pinnedProduct.productTitle}
                  </p>
                  {pinnedProduct.discountPrice &&
                  pinnedProduct.discountPrice <
                    (pinnedProduct.originalPrice ||
                      pinnedProduct.productPrice ||
                      0) ? (
                    <div className="flex flex-wrap items-baseline gap-1">
                      <p className="text-xs font-extrabold text-orange-600">
                        Rp {pinnedProduct.discountPrice.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-slate-400 line-through">
                        Rp{' '}
                        {(
                          pinnedProduct.originalPrice ||
                          pinnedProduct.productPrice
                        )?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-extrabold text-orange-600">
                      Rp {pinnedProduct.productPrice?.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleUnpinProduct}
                className="shrink-0 rounded-xl bg-slate-100 p-1.5 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
                title="Lepas Sematan Produk"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Bottom Action Bar: Floating Product Selector & Chat Input */}
          <div className="pointer-events-auto mt-1 flex items-center gap-2">
            {/* Floating button untuk memilih & menyematkan barang */}
            <button
              type="button"
              onClick={() => setIsProductDrawerOpen(true)}
              className="relative flex shrink-0 items-center justify-center rounded-full border border-orange-500/50 bg-orange-500 p-2.5 text-white shadow-lg transition-all hover:bg-orange-600 active:scale-90"
              title="Pilih & Sematkan Barang Katalog"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black text-orange-600 shadow-md">
                {products.length}
              </span>
            </button>

            {/* Input komentar untuk Host membalas chat secara langsung */}
            <form
              onSubmit={handleSendHostComment}
              className="flex flex-1 items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 backdrop-blur-md"
            >
              <input
                type="text"
                value={hostInputText}
                onChange={(e) => setHostInputText(e.target.value)}
                onFocus={() => {
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                  }
                }}
                placeholder="Balas komentar sebagai Host..."
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                style={{ fontSize: 16 }}
                className="w-full bg-transparent text-xs text-white placeholder-white/50 outline-none"
              />
              <button
                type="submit"
                disabled={!hostInputText.trim()}
                className="shrink-0 rounded-full bg-orange-500 p-1.5 text-white transition-all hover:bg-orange-600 active:scale-90 disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Sheet Drawer: Pilih & Sematkan Barang (Clean Light Mode) */}
        {isProductDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div
              className="fixed inset-0"
              onClick={() => setIsProductDrawerOpen(false)}
            />
            <div className="relative z-10 flex max-h-[80vh] w-full flex-col rounded-t-3xl border-t border-slate-200 bg-white p-4 text-slate-900 shadow-2xl duration-300 animate-in slide-in-from-bottom">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-orange-500" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Sematkan Barang Siaran
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pilih dari {products.length} katalog toko Anda
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductDrawerOpen(false)}
                  className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search & Filter pills */}
              <div className="my-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Cari gadget (iPhone, Samsung, MacBook...)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setProductFilterMode('all')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      productFilterMode === 'all'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua Katalog ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductFilterMode('featured')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      productFilterMode === 'featured'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Pilihan Awal ({stream.featuredProductIds?.length || 0})
                  </button>
                </div>
              </div>

              {/* List of products */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {filteredCatalogProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian.
                  </div>
                ) : (
                  filteredCatalogProducts.map((p) => {
                    const isCurrentlyPinned = pinnedProduct?.productId === p.id
                    return (
                      <div
                        key={p.id}
                        className={`shadow-xs flex flex-col rounded-2xl border p-2.5 transition-all ${
                          isCurrentlyPinned
                            ? 'border-orange-500 bg-orange-50/70'
                            : 'border-slate-200/90 bg-white hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-3 pr-2">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                              {p.images[0] ? (
                                <Image
                                  src={p.images[0]}
                                  alt={p.name}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <ShoppingBag className="m-auto h-5 w-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-900">
                                {p.name}
                              </p>
                              <p className="text-xs font-extrabold text-orange-600">
                                Rp {p.price.toLocaleString('id-ID')}
                              </p>
                              <span className="text-[10px] text-slate-500">
                                Stok: {p.stock}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (isCurrentlyPinned) {
                                handleUnpinProduct()
                              } else {
                                const rawVal = discountInputs[p.id]?.replace(
                                  /\D/g,
                                  ''
                                )
                                const discountPrice = rawVal
                                  ? parseInt(rawVal, 10)
                                  : undefined
                                handlePinProduct(p, discountPrice)
                                setIsProductDrawerOpen(false)
                              }
                            }}
                            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                              isCurrentlyPinned
                                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20 hover:bg-rose-600'
                                : 'bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600'
                            }`}
                          >
                            {isCurrentlyPinned ? 'Lepas' : 'Sematkan'}
                          </button>
                        </div>

                        {/* Input Memilih Diskon Khusus Sematan Saat Disematkan */}
                        {!isCurrentlyPinned && (
                          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
                            <span className="whitespace-nowrap text-[10px] font-bold text-orange-600">
                              Diskon Sematan (Rp):
                            </span>
                            <input
                              type="number"
                              value={discountInputs[p.id] || ''}
                              onChange={(e) =>
                                setDiscountInputs((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              placeholder="Pilih diskon ekstra khusus sematan"
                              className="w-full rounded-lg border border-orange-200 bg-orange-50/50 px-2 py-1 text-[11px] font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )

    if (isMounted && typeof document !== 'undefined') {
      return createPortal(mobileStudio, document.body)
    }
    return mobileStudio
  }

  // ===================================================================
  // 2. DESKTOP VIEW: 3-COLUMN STUDIO LAYOUT
  // ===================================================================
  return (
    <div className="flex flex-col gap-4 lg:grid lg:h-[calc(100vh-140px)] lg:min-h-[640px] lg:grid-cols-3 lg:gap-6">
      {/* Kolom Kiri & Tengah: Kamera Live View & Kontrol */}
      <div className="relative flex h-[54vh] max-h-[580px] min-h-[380px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950 shadow-md dark:border-slate-800 sm:h-[62vh] lg:col-span-2 lg:h-full lg:max-h-none">
        {/* Top Status Bar Floating Overlay */}
        <div className="pointer-events-auto absolute left-2.5 right-2.5 top-2.5 z-20 flex items-center justify-between gap-1.5 sm:left-4 sm:right-4 sm:top-4 sm:gap-2">
          <LiveStreamStatusBar
            startedAt={stream.startedAt || new Date()}
            viewerCount={viewerCount}
            isLive={stream.status === 'LIVE'}
            isConnected={isWsConnected}
          />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleShare}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 p-2 text-xs text-white shadow-md backdrop-blur-md transition-all hover:bg-slate-800 sm:px-3.5 sm:py-1.5"
              title="Bagikan Tautan Siaran"
            >
              {copied ? (
                <>
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden text-emerald-400 sm:inline">
                    Tersalin!
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-slate-300" />
                  <span className="hidden sm:inline">Bagikan</span>
                </>
              )}
            </button>

            <button
              onClick={handleEnd}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-rose-700 active:scale-95 sm:px-3.5 sm:py-1.5"
            >
              <StopCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-[11px] sm:text-xs">Akhiri</span>
            </button>
          </div>
        </div>

        {/* Video Canvas / Video Track View */}
        <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-slate-950">
          {cameraActive ? (
            <video
              ref={videoElementRef}
              autoPlay
              playsInline
              muted
              style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
              className={`h-full w-full transition-transform duration-300 ${
                showGuides ? 'object-contain' : 'object-cover'
              }`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
              <CameraOff className="h-16 w-16 stroke-1 text-slate-600" />
              <p className="text-sm font-medium">Kamera Dimatikan</p>
            </div>
          )}

          {/* Panduan Frame: batas layar HP (9:16) & desktop (16:9) untuk host */}
          {showGuides && cameraActive && (
            <LiveFrameGuides videoRef={videoElementRef} />
          )}

          {/* Floating Hearts Animation Overlay on Video Canvas */}
          <FloatingHeartsOverlay triggerCount={likeCount} />

          {/* Floating Pinned Product Card on Video (Kiri Bawah Mengambang) */}
          {pinnedProduct && (
            <div className="pointer-events-auto absolute bottom-16 left-2.5 right-2.5 z-30 max-w-[calc(100%-20px)] sm:bottom-20 sm:left-4 sm:right-auto sm:max-w-sm">
              <LiveProductPin
                product={pinnedProduct}
                isBroadcaster={true}
                onUnpin={handleUnpinProduct}
              />
            </div>
          )}
        </div>

        {/* Bottom Hardware Controls Bar */}
        <div className="pointer-events-auto absolute bottom-3 left-2.5 right-2.5 z-20 flex items-center justify-center sm:bottom-4 sm:left-4 sm:right-4">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/90 px-3 py-1.5 shadow-xl backdrop-blur-md sm:gap-2 sm:px-4 sm:py-2">
            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`cursor-pointer rounded-full p-2 transition-all sm:p-2.5 ${
                cameraActive
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              }`}
              title={cameraActive ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            >
              {cameraActive ? (
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <CameraOff className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            {/* Microphone Toggle */}
            <button
              onClick={toggleMic}
              className={`cursor-pointer rounded-full p-2 transition-all sm:p-2.5 ${
                micActive
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              }`}
              title={micActive ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {micActive ? (
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            {/* Switch Camera */}
            <button
              onClick={flipCamera}
              className="cursor-pointer rounded-full bg-white/10 p-2 text-white transition-all hover:bg-white/20 sm:p-2.5"
              title="Ganti Kamera Depan/Belakang"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Mirror View Toggle (Instagram Style) */}
            <button
              onClick={toggleMirror}
              className={`cursor-pointer rounded-full p-2 transition-all sm:p-2.5 ${
                isMirrored
                  ? 'bg-orange-500/30 text-orange-300 ring-2 ring-orange-400/50 hover:bg-orange-500/40'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
              title={
                isMirrored
                  ? 'Cermin Aktif (Mode Selfie/Instagram - Klik untuk Normal)'
                  : 'Cermin Nonaktif (Klik untuk Mirror View)'
              }
            >
              <FlipHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Panduan Frame Toggle (batas layar HP & desktop) */}
            <button
              onClick={() => setShowGuides((v) => !v)}
              className={`cursor-pointer rounded-full p-2 transition-all sm:p-2.5 ${
                showGuides
                  ? 'bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-400/50 hover:bg-emerald-500/40'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
              title={
                showGuides
                  ? 'Panduan Frame Aktif (batas layar HP & Desktop) - Klik untuk sembunyikan'
                  : 'Tampilkan Panduan Frame (batas layar HP & Desktop)'
              }
            >
              <Crop className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher: Chat vs Sematan Produk */}
      <div className="shadow-2xs flex rounded-2xl border border-slate-200/80 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('chat')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mobileTab === 'chat'
              ? 'shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Live Chat ({messages.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('products')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mobileTab === 'products'
              ? 'shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="h-4 w-4 text-orange-500" />
          <span>Sematan Produk ({products.length})</span>
        </button>
      </div>

      {/* Kolom Kanan: Live Chat & Daftar Produk untuk Disematkan */}
      <div className="flex flex-col gap-4 overflow-hidden lg:h-full">
        {/* Tab Chat */}
        <div
          className={`h-[440px] sm:h-[480px] lg:h-3/5 lg:min-h-[300px] lg:flex-1 ${
            mobileTab === 'chat' ? 'block' : 'hidden lg:block'
          }`}
        >
          <LiveChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            onSendLike={sendLike}
            likeCount={likeCount}
            isBroadcaster={true}
            currentUserName="Host Toko"
            isConnected={isWsConnected}
          />
        </div>

        {/* Tab Featured Products (Pin Management) - Clean White Theme */}
        <div
          className={`h-[440px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:h-[480px] lg:h-2/5 lg:min-h-[220px] ${
            mobileTab === 'products' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <ShoppingBag className="h-4 w-4 text-orange-500" />
              <span>Katalog Sematan ({products.length})</span>
            </div>
            {pinnedProduct && (
              <button
                onClick={unpinProduct}
                className="cursor-pointer text-[11px] font-semibold text-rose-500 hover:underline"
              >
                Lepas Sematan
              </button>
            )}
          </div>

          {/* Search bar & filter pills untuk memilih dari semua 200+ katalog */}
          <div className="mt-2 space-y-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Cari semua gadget katalog..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setProductFilterMode('all')}
                className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                  productFilterMode === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Semua ({products.length})
              </button>
              {stream.featuredProductIds &&
                stream.featuredProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setProductFilterMode('featured')}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      productFilterMode === 'featured'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Pilihan Awal ({stream.featuredProductIds.length})
                  </button>
                )}
            </div>
          </div>

          <div className="scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 mt-2 flex-1 space-y-2 overflow-y-auto">
            {filteredCatalogProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {productSearch
                  ? 'Tidak ada produk yang cocok dengan pencarian.'
                  : 'Tidak ada produk di katalog toko.'}
              </div>
            ) : (
              filteredCatalogProducts.map((p) => {
                const isPinned = pinnedProduct?.productId === p.id
                return (
                  <div
                    key={p.id}
                    className={`flex flex-col rounded-2xl border p-2 text-xs transition-all ${
                      isPinned
                        ? 'border-orange-400 bg-orange-50/70 shadow-sm dark:border-orange-500/40 dark:bg-orange-950/20'
                        : 'border-slate-200/70 bg-slate-50/80 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2 pr-2">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-700">
                          {p.images[0] ? (
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ShoppingBag className="m-auto h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[130px] truncate font-semibold text-slate-800 dark:text-slate-100">
                            {p.name}
                          </p>
                          <p className="text-[11px] font-bold text-orange-600 dark:text-orange-500">
                            Rp {p.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const rawVal = discountInputs[p.id]?.replace(
                            /\D/g,
                            ''
                          )
                          const discountPrice = rawVal
                            ? parseInt(rawVal, 10)
                            : undefined
                          handlePinProduct(p, discountPrice)
                        }}
                        disabled={isPinned}
                        className={`flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                          isPinned
                            ? 'cursor-default bg-orange-500 text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <Pin className="h-3 w-3" />
                        {isPinned ? 'Tersemat' : 'Sematkan'}
                      </button>
                    </div>

                    {!isPinned && (
                      <div className="mt-1.5 flex items-center gap-1.5 border-t border-slate-200/60 pt-1.5 dark:border-slate-700/60">
                        <span className="shrink-0 text-[10px] font-bold text-orange-600 dark:text-orange-500">
                          Diskon Sematan / Diskon (Rp):
                        </span>
                        <input
                          type="number"
                          value={discountInputs[p.id] || ''}
                          onChange={(e) =>
                            setDiscountInputs((prev) => ({
                              ...prev,
                              [p.id]: e.target.value,
                            }))
                          }
                          placeholder="Pilih diskon saat disematkan"
                          className="w-full rounded-lg border border-orange-200 bg-white px-2 py-0.5 text-[10.5px] font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Broadcaster Studio Container
export function LiveStreamBroadcaster() {
  const { data: session } = useSession()
  const [step, setStep] = useState<'idle' | 'setup' | 'live'>('idle')
  const [streams, setStreams] = useState<LiveStreamData[]>([])
  const [activeStream, setActiveStream] = useState<LiveStreamData | null>(null)
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([])
  const [setupDiscounts, setSetupDiscounts] = useState<Record<string, string>>(
    {}
  )
  const [setupPinnedDiscounts, setSetupPinnedDiscounts] = useState<
    Record<string, string>
  >({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form setup
  const [form, setForm] = useState({
    title: '',
    description: '',
  })

  // Load existing streams for the current store
  const loadStreams = async () => {
    try {
      const res = await fetch('/api/live-streams?limit=20')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setStreams(json.data)
      }
    } catch {
      // Ignore
    }
  }

  // Load store products (semua katalog untuk disematkan saat live)
  const loadProducts = async () => {
    try {
      const res = await fetch('/api/gadgets?limit=500')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data)
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadStreams()
    loadProducts()
  }, [])

  // Create stream session in DB
  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Judul siaran wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/live-streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal membuat sesi live')
      }

      // Update featured products if selected
      if (featuredProductIds.length > 0) {
        await fetch(`/api/live-streams/${json.data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featuredProductIds }),
        })

        // Buat diskon khusus live untuk produk yang diberikan diskon spesial saat persiapan setup
        for (const prodId of featuredProductIds) {
          const discountRaw = setupDiscounts[prodId]?.replace(/\D/g, '')
          const pinnedDiscountRaw = setupPinnedDiscounts[prodId]?.replace(
            /\D/g,
            ''
          )
          const prodObj = products.find((p) => p.id === prodId)

          if (prodObj) {
            // 1. Diskon Khusus Siaran Live (Etalase 5 barang live)
            if (discountRaw) {
              const discPrice = parseInt(discountRaw, 10)
              if (discPrice > 0 && discPrice < prodObj.price) {
                try {
                  await fetch(`/api/live-streams/${json.data.id}/deals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      productId: prodObj.id,
                      productTitle: prodObj.name,
                      productImage: prodObj.images[0] || '',
                      productSlug: prodObj.id,
                      originalPrice: prodObj.price,
                      discountPrice: discPrice,
                      dealType: 'LIVE_FEATURED',
                      badgeLabel: 'Diskon Khusus Siaran Live',
                    }),
                  })
                } catch (dealErr) {
                  console.error('Error creating setup live deal:', dealErr)
                }
              }
            }

            // 2. Diskon Khusus Saat Disematkan (Pinned Deal)
            if (pinnedDiscountRaw) {
              const pinnedPrice = parseInt(pinnedDiscountRaw, 10)
              if (pinnedPrice > 0 && pinnedPrice < prodObj.price) {
                try {
                  await fetch(`/api/live-streams/${json.data.id}/deals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      productId: prodObj.id,
                      productTitle: prodObj.name,
                      productImage: prodObj.images[0] || '',
                      productSlug: prodObj.id,
                      originalPrice: prodObj.price,
                      discountPrice: pinnedPrice,
                      dealType: 'PINNED_DEAL',
                      badgeLabel: 'Diskon Spesial Sematan Live',
                    }),
                  })
                } catch (pinnedErr) {
                  console.error('Error creating setup pinned deal:', pinnedErr)
                }
              }
            }
          }
        }
      }

      // Activate stream to LIVE status
      await fetch(`/api/live-streams/${json.data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LIVE' }),
      })

      setActiveStream({ ...json.data, status: 'LIVE', featuredProductIds })
      setStep('live')
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  // Resume or enter studio for an existing stream
  const handleEnterStudio = async (stream: LiveStreamData) => {
    try {
      if (stream.status !== 'LIVE') {
        await fetch(`/api/live-streams/${stream.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'LIVE' }),
        })
      }
      setActiveStream({ ...stream, status: 'LIVE' })
      setStep('live')
    } catch {
      setError('Gagal masuk ke studio')
    }
  }

  // End active stream
  const handleEndActiveStream = async () => {
    if (!activeStream) return
    try {
      await fetch(`/api/live-streams/${activeStream.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      })
      setActiveStream(null)
      setStep('idle')
      loadStreams()
    } catch {
      // Ignore
    }
  }

  // Fetch LiveKit Token for broadcaster when in live step
  const {
    token: livekitToken,
    wsUrl: livekitWsUrl,
    loading: isTokenLoading,
    error: tokenError,
  } = useLiveKitToken(activeStream?.id || '', 'broadcaster')

  // Filter products selected for this stream
  const activeProducts = products.filter((p) =>
    (activeStream?.featuredProductIds || featuredProductIds).includes(p.id)
  )

  // 1. STEP: LIVE (ON-AIR STUDIO VIA LIVEKIT)
  if (step === 'live' && activeStream) {
    if (isTokenLoading) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-800 dark:text-slate-200">
          <RefreshCw className="mb-4 h-8 w-8 animate-spin text-slate-600 dark:text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Mempersiapkan Studio LiveKit...
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Menghubungkan kamera & mikrofon perangkat
          </p>
        </div>
      )
    }

    if (tokenError || !livekitToken) {
      return (
        <div className="shadow-2xs mx-auto my-12 max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center text-slate-900 dark:border-rose-900/50 dark:bg-slate-900 dark:text-white">
          <p className="mb-2 text-sm font-bold text-rose-600 dark:text-rose-400">
            Gagal Menghubungkan ke LiveKit
          </p>
          <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
            {tokenError ||
              'Kredensial token tidak valid atau sesi siaran telah berakhir'}
          </p>
          <button
            onClick={() => setStep('idle')}
            className="shadow-2xs active:scale-98 cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950"
          >
            Kembali ke Beranda Live
          </button>
        </div>
      )
    }

    return (
      <LiveKitRoom
        serverUrl={livekitWsUrl}
        token={livekitToken}
        connect={true}
        video={true}
        audio={true}
        options={HOST_ROOM_OPTIONS}
        className="w-full"
      >
        <RoomAudioRenderer />
        <LiveKitStudioControls
          stream={activeStream}
          products={products}
          onEndStream={handleEndActiveStream}
        />
      </LiveKitRoom>
    )
  }

  // 2. STEP: SETUP STREAM FORM
  if (step === 'setup') {
    return (
      <div className="shadow-2xs mx-auto max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Radio className="h-4.5 w-4.5 text-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                Persiapan Siaran Langsung Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lengkapi rincian siaran dan sematkan produk katalog toko Anda
              </p>
            </div>
          </div>
          <button
            onClick={() => setStep('idle')}
            className="dark:hover:bg-slate-750 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Batal
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateStream} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Siaran Langsung <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Flash Sale iPhone 15 Pro Max & Promo Garansi 30 Hari!"
              className="focus:outline-hidden w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Tuliskan info promo, unit yang akan di-review, atau diskon khusus penonton..."
              className="focus:outline-hidden w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
            />
          </div>

          {/* Select Featured Products */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Produk yang Akan Dijual (Maks. 5)
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {featuredProductIds.length} / 5 dipilih
              </span>
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
              {products.slice(0, 15).map((p) => {
                const isSelected = featuredProductIds.includes(p.id)
                return (
                  <div
                    key={p.id}
                    className={`flex flex-col rounded-xl p-2.5 transition-all ${
                      isSelected
                        ? 'shadow-2xs border border-slate-900 bg-white text-slate-900 dark:border-white dark:bg-slate-800 dark:text-white'
                        : 'border border-transparent bg-white/70 text-slate-700 hover:bg-white dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div
                      onClick={() => {
                        if (isSelected) {
                          setFeaturedProductIds(
                            featuredProductIds.filter((id) => id !== p.id)
                          )
                        } else if (featuredProductIds.length < 5) {
                          setFeaturedProductIds([...featuredProductIds, p.id])
                        }
                      }}
                      className="flex cursor-pointer items-center justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3 pr-2">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {p.images[0] && (
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                            {p.name}
                          </p>
                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            Rp {p.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition-colors ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 font-bold text-white dark:border-white dark:bg-white dark:text-slate-950'
                            : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>

                    {/* Kolom Diskon Spesial Live & Sematan untuk produk yang dipilih */}
                    {isSelected && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2.5 space-y-2 border-t border-slate-100 pt-2.5 dark:border-slate-700/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-36 shrink-0 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            Diskon Live (Rp):
                          </span>
                          <input
                            type="number"
                            value={setupDiscounts[p.id] || ''}
                            onChange={(e) =>
                              setSetupDiscounts((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            placeholder={`Harga siaran live (Normal: Rp ${p.price.toLocaleString('id-ID')})`}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-36 shrink-0 text-[10px] font-bold text-orange-600 dark:text-orange-500">
                            Diskon Sematan (Rp):
                          </span>
                          <input
                            type="number"
                            value={setupPinnedDiscounts[p.id] || ''}
                            onChange={(e) =>
                              setSetupPinnedDiscounts((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            placeholder="Harga spesial jika disematkan nanti (opsional)"
                            className="w-full rounded-lg border border-orange-200 bg-orange-50/40 px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white dark:border-orange-900/60 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="shadow-2xs active:scale-98 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Radio className="h-4 w-4" />
              <span>
                {loading
                  ? 'Menyiapkan Studio...'
                  : 'Mulai On-Air Siaran Sekarang'}
              </span>
            </button>
          </div>
        </form>
      </div>
    )
  }

  // 3. STEP: IDLE (DAFTAR SIARAN & TOMBOL MULAI)
  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Live Shopping Studio</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Studio Siaran Langsung Toko
            </h1>
            <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Siarkan produk gadget langsung dari toko fisik Anda dengan latensi
              rendah, interaksi chat pelanggan real-time, dan sematkan produk
              langsung ke keranjang belanja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/"
              target="_blank"
              className="shadow-2xs active:scale-98 dark:hover:bg-slate-750 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              <span>Katalog Beranda Publik</span>
            </Link>
            <button
              onClick={() => setStep('setup')}
              className="shadow-2xs active:scale-98 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Mulai Siaran Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Studio Info Bento Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Infrastruktur Siaran
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Radio className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            LiveKit SFU Cloud
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Ultra-low latency streaming
          </p>
        </div>

        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Katalog Toko
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            {products.length} Unit Siap Semat
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Langsung checkout dari live chat
          </p>
        </div>

        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Riwayat Siaran
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Play className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            {streams.length} Total Sesi
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {streams.filter((s) => s.status === 'LIVE').length} sedang mengudara
          </p>
        </div>
      </div>

      {/* Streams Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Daftar Sesi Siaran Toko
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {streams.length}
            </span>
          </div>
        </div>

        {streams.length === 0 ? (
          <div className="shadow-2xs rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Radio className="stroke-1.5 h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Belum Ada Sesi Siaran
            </h3>
            <p className="mx-auto mb-5 mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Mulai live streaming pertama toko cabang Anda untuk mempromosikan
              katalog gadget dengan interaksi real-time kepada pembeli.
            </p>
            <button
              onClick={() => setStep('setup')}
              className="shadow-2xs active:scale-98 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Buat Sesi Siaran Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {streams.map((s) => {
              const isLive = s.status === 'LIVE'
              return (
                <div
                  key={s.id}
                  className="shadow-2xs flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isLive
                            ? 'animate-pulse border border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
                            : s.status === 'ENDED'
                              ? 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              : 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {isLive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                        )}
                        {s.status}
                      </span>
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                        {s.viewerCount} penonton
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                      {s.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <Link
                      href={`/live/${s.id}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Lihat Publik</span>
                    </Link>

                    {s.status !== 'ENDED' ? (
                      <button
                        onClick={() => handleEnterStudio(s)}
                        className="shadow-2xs active:scale-98 flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Buka Studio</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        Siaran Selesai
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
