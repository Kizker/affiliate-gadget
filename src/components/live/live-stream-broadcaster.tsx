'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Radio,
  StopCircle,
  ShoppingBag,
  Copy,
  CheckCheck,
  Eye,
  AlertTriangle,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  MessageCircle,
  X,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

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
  streamUrl: string
}

export function LiveStreamBroadcaster() {
  const { data: session } = useSession()
  const [step, setStep] = useState<'idle' | 'setup' | 'live'>('idle')
  const [streams, setStreams] = useState<LiveStreamData[]>([])
  const [activeStream, setActiveStream] = useState<LiveStreamData | null>(null)
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [highlightedProductIds, setHighlightedProductIds] = useState<string[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [liveChatMessages, setLiveChatMessages] = useState<any[]>([])
  const [adminReply, setAdminReply] = useState('')

  // Real Camera & Device State
  const [cameraActive, setCameraActive] = useState(false)
  const [micActive, setMicActive] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [permissionState, setPermissionState] = useState<
    'prompt' | 'granted' | 'denied' | 'unknown'
  >('unknown')
  const [permissionErrorType, setPermissionErrorType] = useState<
    'denied' | 'not_found' | 'in_use' | 'constraint' | 'unsupported' | null
  >(null)

  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sseRef = useRef<EventSource | null>(null)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const frameIntervalRef = useRef<any>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
  })

  // Load existing streams
  const loadStreams = useCallback(async () => {
    try {
      const res = await fetch('/api/live-streams?limit=10')
      const data = await res.json()
      if (data.success) {
        const myStreams = data.data.filter(
          (s: any) => s.status === 'LIVE' || s.status === 'SCHEDULED'
        )
        setStreams(myStreams)

        // Resume if already LIVE
        const live = data.data.find((s: any) => s.status === 'LIVE')
        if (live && step === 'idle') {
          setActiveStream(live)
          setHighlightedProductIds(live.featuredProductIds || [])
          setViewerCount(live.viewerCount || 0)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [step])

  useEffect(() => {
    loadStreams()
  }, [loadStreams])

  // Load store products for highlighting
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/admin/products?limit=50&page=1')
        const data = await res.json()
        if (data.success && data.data) {
          setProducts(data.data.products || data.data || [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadProducts()
  }, [])

  // Monitor browser camera permission dynamically
  useEffect(() => {
    let permStatus: PermissionStatus | null = null
    const checkPerm = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
          permStatus = await navigator.permissions.query({
            name: 'camera' as any,
          })
          setPermissionState(permStatus.state)
          permStatus.onchange = () => {
            if (permStatus) {
              setPermissionState(permStatus.state)
              if (permStatus.state === 'granted') {
                setError('')
                setPermissionErrorType(null)
                startCamera(facingMode)
              } else if (permStatus.state === 'denied') {
                setPermissionErrorType('denied')
              }
            }
          }
        }
      } catch {
        /* permissions.query not supported */
      }
    }
    checkPerm()
    return () => {
      if (permStatus) {
        permStatus.onchange = null
      }
    }
  }, [facingMode])

  // Start Camera with resilient multi-tier fallback (Depan / Belakang / Video-Only / Generic)
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setError('')
    setPermissionErrorType(null)

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(
        'Browser Anda tidak mendukung akses kamera WebRTC. Harap gunakan browser modern seperti Google Chrome atau Microsoft Edge.'
      )
      setPermissionErrorType('unsupported')
      return
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop())
      setMediaStream(null)
    }

    let stream: MediaStream | null = null
    let capturedError: any = null

    // Tier 1: Video with resolution & facingMode + Audio
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: mode,
        },
        audio: true,
      })
      setMicActive(true)
    } catch (err: any) {
      capturedError = err
      console.warn(
        'Tier 1 (Video+Audio) failed, retrying Tier 2 (Video-only):',
        err
      )

      // Tier 2: Video with facingMode (No Audio - fallback jika PC tidak punya mic atau mic ditolak)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: mode,
          },
          audio: false,
        })
        setMicActive(false)
      } catch (err2: any) {
        capturedError = err2
        console.warn(
          'Tier 2 (Video-only facingMode) failed, retrying Tier 3 (Basic Video):',
          err2
        )

        // Tier 3: Basic generic webcam (tanpa facingMode / resolusi ketat)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
          setMicActive(false)
        } catch (err3: any) {
          capturedError = err3
          console.error('All camera tiers failed:', err3)
        }
      }
    }

    if (stream) {
      setMediaStream(stream)
      setCameraActive(true)
      setFacingMode(mode)
      setError('')
      setPermissionErrorType(null)
      setPermissionState('granted')

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.play().catch(() => {})
      }

      // If active WebRTC peers, replace video track dynamically
      const newVideoTrack = stream.getVideoTracks()[0]
      if (newVideoTrack && peerConnectionsRef.current.size > 0) {
        for (const pc of peerConnectionsRef.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(newVideoTrack)
          }
        }
      }
    } else {
      setCameraActive(false)
      const errName = capturedError?.name || ''
      const errMsg = capturedError?.message || ''
      console.error('Final getUserMedia failure:', errName, errMsg)

      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError'
      ) {
        setPermissionState('denied')
        setPermissionErrorType('denied')
        setError(
          `Akses kamera dicegat oleh Sistem / Hardware [${errName}${errMsg ? `: ${errMsg}` : ''}]. Bukan karena setelan Chrome, melainkan kamera dikunci aplikasi lain (MS Teams/WhatsApp), hotkey Fn+F10 ASUS, atau privasi Windows 11.`
        )
      } else if (
        errName === 'NotFoundError' ||
        errName === 'DevicesNotFoundError'
      ) {
        setPermissionErrorType('not_found')
        setError(
          `Perangkat kamera (webcam) tidak terdeteksi [${errName}]. Pastikan webcam terpasang dengan baik.`
        )
      } else if (
        errName === 'NotReadableError' ||
        errName === 'TrackStartError'
      ) {
        setPermissionErrorType('in_use')
        setError(
          `Kamera sedang digunakan secara eksklusif oleh aplikasi lain (MS Teams, WhatsApp, atau OBS) [${errName}].`
        )
      } else if (errName === 'OverconstrainedError') {
        setPermissionErrorType('constraint')
        setError(
          `Resolusi atau format kamera tidak didukung perangkat [${errName}].`
        )
      } else {
        setPermissionErrorType('denied')
        setError(errMsg || `Gagal mengakses kamera [${errName}].`)
      }
    }
  }

  // Switch between Kamera Depan and Kamera Belakang
  const switchCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    await startCamera(nextMode)
  }

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
      setMediaStream(null)
    }
    setCameraActive(false)
  }

  const toggleMic = () => {
    if (mediaStream) {
      const audioTracks = mediaStream.getAudioTracks()
      audioTracks.forEach((t) => (t.enabled = !micActive))
      setMicActive(!micActive)
    }
  }

  // Connect SSE for viewer counter and real-time chat
  const connectSSE = useCallback((streamId: string) => {
    if (sseRef.current) sseRef.current.close()
    const es = new EventSource(`/api/live-streams/${streamId}/chat`)
    sseRef.current = es
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload.type === 'viewers') {
          setViewerCount(payload.count || 0)
        } else if (payload.type === 'chat' && payload.data) {
          setLiveChatMessages((prev) => [...prev.slice(-40), payload.data])
        }
      } catch {
        /* ignore */
      }
    }
  }, [])

  // Start real-time camera broadcasting (BroadcastChannel + Frame relay + WebRTC)
  const startBroadcasting = (streamId: string) => {
    // 1. Initialize local BroadcastChannel (for instant 0ms local tab sync)
    try {
      const bc = new BroadcastChannel(`ag-live-stream-${streamId}`)
      broadcastChannelRef.current = bc
    } catch {
      /* BroadcastChannel not supported */
    }

    // 2. Start capturing camera frames every 200ms
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
    frameIntervalRef.current = setInterval(() => {
      if (!videoPreviewRef.current || !canvasRef.current) return
      const video = videoPreviewRef.current
      const canvas = canvasRef.current
      if (video.videoWidth === 0 || video.videoHeight === 0) return

      canvas.width = Math.min(640, video.videoWidth)
      canvas.height = Math.round(
        (canvas.width / video.videoWidth) * video.videoHeight
      )
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const frameData = canvas.toDataURL('image/jpeg', 0.65)

      // Post to local tabs
      broadcastChannelRef.current?.postMessage({
        type: 'frame',
        frame: frameData,
      })

      // Send to server frame buffer for remote viewers
      fetch(`/api/live-streams/${streamId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'frame', frame: frameData }),
      }).catch(() => {})
    }, 200)

    // 3. WebRTC signaling poller
    const webrtcInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/live-streams/${streamId}/stream?action=broadcaster-poll`
        )
        const data = await res.json()
        if (!data.success) return

        // Create PeerConnection for pending viewers
        for (const viewerId of data.pendingViewers || []) {
          if (peerConnectionsRef.current.has(viewerId)) continue

          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          })
          peerConnectionsRef.current.set(viewerId, pc)

          if (mediaStream) {
            mediaStream
              .getTracks()
              .forEach((track) => pc.addTrack(track, mediaStream))
          }

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              fetch(`/api/live-streams/${streamId}/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'webrtc-candidate',
                  viewerId,
                  candidate: event.candidate,
                }),
              }).catch(() => {})
            }
          }

          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)

          await fetch(`/api/live-streams/${streamId}/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'webrtc-offer',
              viewerId,
              offer,
            }),
          })
        }

        // Apply answers from viewers
        for (const [vid, answer] of Object.entries(data.answers || {})) {
          const pc = peerConnectionsRef.current.get(vid)
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(
              new RTCSessionDescription(answer as any)
            )
          }
        }
      } catch {
        /* ignore network tick */
      }
    }, 1500)

    return () => {
      clearInterval(webrtcInterval)
    }
  }

  // Handle Start Live (Admin starts real camera live)
  const handleCreateAndGoLive = async () => {
    if (!form.title.trim()) {
      setError('Judul siaran langsung kamera harus diisi')
      return
    }
    if (!cameraActive || !mediaStream) {
      setError(
        'Harap nyalakan kamera toko terlebih dahulu sebelum memulai siaran.'
      )
      return
    }

    setLoading(true)
    setError('')
    try {
      // 1. Create live stream in DB
      const createRes = await fetch('/api/live-streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
        }),
      })
      const createData = await createRes.json()
      if (!createData.success) throw new Error(createData.error)

      const streamId = createData.data.id

      // 2. Set status to LIVE with 'live-camera' identifier (NO DUMMY VIDEO)
      const liveRes = await fetch(`/api/live-streams/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'LIVE',
          streamUrl: 'live-camera',
          featuredProductIds: highlightedProductIds,
        }),
      })
      const liveData = await liveRes.json()
      if (!liveData.success) throw new Error(liveData.error)

      const fullStream = { ...createData.data, ...liveData.data }
      setActiveStream(fullStream)
      setStep('live')
      connectSSE(streamId)
      startBroadcasting(streamId)
      loadStreams()
    } catch (e: any) {
      setError(e.message || 'Gagal memulai live kamera')
    } finally {
      setLoading(false)
    }
  }

  // Handle Stop Live (Admin ends stream)
  const handleStopLive = async () => {
    if (!activeStream) return
    if (!confirm('Akhiri siaran kamera langsung toko ini sekarang?')) return
    setLoading(true)
    try {
      // 1. Mark stream ENDED in DB
      await fetch(`/api/live-streams/${activeStream.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      })

      // 2. Notify stream API
      await fetch(`/api/live-streams/${activeStream.id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end-stream' }),
      })

      // 3. Notify local BroadcastChannel
      broadcastChannelRef.current?.postMessage({ type: 'ended' })
      broadcastChannelRef.current?.close()

      // 4. Cleanup media & connections
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
      for (const pc of peerConnectionsRef.current.values()) {
        pc.close()
      }
      peerConnectionsRef.current.clear()

      sseRef.current?.close()
      stopCamera()
      setActiveStream(null)
      setStep('idle')
      setHighlightedProductIds([])
      loadStreams()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Toggle Highlight Product
  const toggleProduct = async (productId: string) => {
    const isSelected = highlightedProductIds.includes(productId)
    const next = isSelected
      ? highlightedProductIds.filter((id) => id !== productId)
      : [...highlightedProductIds, productId].slice(0, 5)

    setHighlightedProductIds(next)
    if (activeStream) {
      try {
        await fetch(`/api/live-streams/${activeStream.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featuredProductIds: next }),
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Send admin chat message with "PIN TOKO" verified badge
  const sendAdminChat = async () => {
    if (!adminReply.trim() || !activeStream) return
    try {
      await fetch(`/api/live-streams/${activeStream.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: `${session?.user?.name || 'Admin Toko'} (Official Toko)`,
          message: adminReply.trim(),
          isPinned: true,
        }),
      })
      setAdminReply('')
    } catch (e) {
      console.error(e)
    }
  }

  const copyLiveLink = () => {
    if (!activeStream) return
    const url = `${window.location.origin}/live/${activeStream.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ────────────────────────────────────────────────────────────
  // 1. IDLE STATE: Studio Welcome Card
  // ────────────────────────────────────────────────────────────
  if (step === 'idle') {
    return (
      <div className="space-y-6">
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900 dark:bg-orange-950/40">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Studio Siaran Kamera Toko Cabang
                </h2>
                <p className="text-xs text-slate-500">
                  Siarkan langsung dari kamera depan atau belakang HP/Laptop
                  admin toko Anda ke seluruh pembeli di katalog produk.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('setup')
                startCamera('user')
              }}
              className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
            >
              <Radio className="h-4 w-4" />
              Mulai Siaran Kamera Baru
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 text-xs dark:border-slate-800 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="font-bold text-slate-900 dark:text-white">
                Kamera Depan & Belakang
              </span>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Dapat diganti kapan saja saat siaran berlangsung.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="font-bold text-slate-900 dark:text-white">
                Otomatis Muncul di Katalog
              </span>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Saat live aktif, banner toko langsung muncul di katalog.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="font-bold text-slate-900 dark:text-white">
                Tanpa Bot & Tanpa Video Dummy
              </span>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Murni video kamera asli dan chat interaktif pembeli riil.
              </p>
            </div>
          </div>
        </div>

        {/* Existing Active Streams */}
        {streams.length > 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Sesi Siaran Aktif Toko Anda
            </h3>
            <div className="space-y-3">
              {streams.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div>
                    <span className="inline-block rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                      LIVE
                    </span>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                      {s.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/live/${s.id}`}
                      target="_blank"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Buka Tontonan
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────
  // 2. SETUP STATE: Studio Setup (Preview Kamera & Ganti Kamera)
  // ────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="space-y-6">
        <canvas ref={canvasRef} className="hidden" />

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Pengaturan Kamera & Info Siaran Toko
              </h2>
              <p className="text-xs text-slate-500">
                Posisikan kamera depan atau belakang admin toko sebelum menekan
                tombol Mulai Live
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera()
                setStep('idle')
              }}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>

              {permissionErrorType === 'denied' && (
                <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                        Kenapa Popup Izin Tidak Muncul Padahal di Chrome Sudah
                        Aktif?
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Di setelan Chrome Anda sudah aktif (*Sites can ask to
                        use your camera*), namun akses dicegat di level{' '}
                        <strong>Sistem / Hardware</strong> sebelum Chrome sempat
                        menampilkan popup:
                      </p>
                      <ul className="space-y-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                        <li className="flex items-start gap-2">
                          <span className="shrink-0 font-bold text-orange-600">
                            1.
                          </span>
                          <div>
                            <strong>
                              Tutup Aplikasi yang Sedang Berjalan:
                            </strong>{' '}
                            Proses seperti <strong>Microsoft Teams</strong> atau{' '}
                            <strong>WhatsApp</strong> di komputer sedang
                            memegang akses eksklusif kamera. Harap tutup
                            aplikasi tersebut (klik kanan ikon di taskbar/tray
                            bawah → Keluar / Quit).
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="shrink-0 font-bold text-orange-600">
                            2.
                          </span>
                          <div>
                            <strong>Periksa Tombol Privasi Laptop ASUS:</strong>{' '}
                            Pada laptop ASUS (ASUS HD webcam), tekan tombol{' '}
                            <strong>Fn + F10</strong> (atau F10 bergambar
                            kamera) di keyboard untuk menyalakan sensor kamera,
                            dan pastikan slider fisik penutup kamera di atas
                            layar dalam posisi terbuka.
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="shrink-0 font-bold text-orange-600">
                            3.
                          </span>
                          <div>
                            <strong>Windows 11 Privacy Settings:</strong> Buka{' '}
                            <em>
                              Windows Settings (Win + I) → Privacy &amp;
                              Security → Camera
                            </em>
                            , pastikan opsi{' '}
                            <strong>
                              &quot;Let desktop apps access your camera&quot;
                            </strong>{' '}
                            dalam keadaan <strong>ON</strong>.
                          </div>
                        </li>
                      </ul>
                      <div className="flex flex-wrap items-center gap-2 pt-1.5">
                        <button
                          type="button"
                          onClick={() => startCamera(facingMode)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Coba Aktifkan Kamera Lagi Sekarang</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {permissionErrorType === 'in_use' && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                  <p className="font-bold">Kamera Terkunci Aplikasi Lain</p>
                  <p className="mt-1 text-[11px]">
                    Pastikan Zoom, Google Meet, OBS Studio, Discord, atau
                    aplikasi Windows Camera telah ditutup sepenuhnya. Setelah
                    itu klik tombol di bawah.
                  </p>
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Coba Sambungkan Ulang Kamera</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Column: Camera Preview with Flip Button */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Pratinjau Kamera Toko Fisik
                </label>
                {cameraActive && (
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>
                      Ganti Kamera (
                      {facingMode === 'user'
                        ? 'Kamera Depan'
                        : 'Kamera Belakang'}
                      )
                    </span>
                  </button>
                )}
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-md">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${!cameraActive ? 'hidden' : ''}`}
                />

                {!cameraActive && (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
                    <Camera className="h-10 w-10 text-orange-400" />
                    <div>
                      <p className="text-sm font-bold">Kamera Belum Aktif</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Izinkan akses kamera untuk menyiarkan langsung dari toko
                        fisik
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="flex items-center gap-1.5 rounded-2xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-orange-600"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Minta Izin &amp; Aktifkan Kamera</span>
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <>
                    <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                      Kamera Aktif (
                      {facingMode === 'user' ? 'Depan' : 'Belakang'})
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={switchCamera}
                          className="flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md hover:bg-black/80"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Flip Kamera</span>
                        </button>
                        <button
                          type="button"
                          onClick={toggleMic}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
                        >
                          {micActive ? (
                            <Mic className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <MicOff className="h-4 w-4 text-red-400" />
                          )}
                        </button>
                      </div>
                      <span className="rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-md">
                        1080p HD
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Title & Description Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Judul Siaran Langsung{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Spill Unit iPhone 15 Pro Max & Promo Gojek Instant Hari Ini"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-orange-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  3. Deskripsi Singkat Siaran (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Jelaskan promo khusus toko, bonus 3-in-1, atau garansi tukar baru cabang Anda..."
                  className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Product selection preview */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  4. Sorot Produk Toko ({highlightedProductIds.length}/5
                  dipilih)
                </label>
                <div className="mt-1 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto p-1">
                  {products.slice(0, 8).map((p) => {
                    const isSelected = highlightedProductIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className={`max-w-[200px] truncate rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition ${
                          isSelected
                            ? 'border-orange-300 bg-orange-50 text-orange-600'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {p.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateAndGoLive}
                  disabled={loading || !cameraActive}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-xs font-black text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
                >
                  <Radio className="h-4 w-4 animate-pulse" />
                  🔴 Mulai Siaran Kamera Live Sekarang
                </button>
                {!cameraActive && (
                  <p className="mt-1 text-center text-[10px] text-amber-600">
                    Aktifkan kamera terlebih dahulu untuk memulai siaran live.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────
  // 3. LIVE STATE: Active On-Air Studio Dashboard
  // ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* On-Air Top Bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-red-200 bg-red-50/80 p-5 shadow-sm dark:border-red-900/60 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                KAMERA LIVE ON-AIR
              </span>
              <h2 className="text-sm font-extrabold text-red-950 dark:text-red-200">
                {activeStream?.title}
              </h2>
            </div>
            <p className="mt-0.5 text-[11px] text-red-700 dark:text-red-300">
              Siaran kamera aktif disiarkan langsung ke katalog dan beranda
              platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="shadow-2xs flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-700">
            <Eye className="h-3.5 w-3.5 text-red-500" />
            {viewerCount.toLocaleString('id-ID')} Penonton
          </div>
          <button
            type="button"
            onClick={copyLiveLink}
            className="shadow-2xs flex items-center gap-1 rounded-2xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            {copied ? (
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Tersalin' : 'Salin Tautan'}
          </button>
          <button
            type="button"
            onClick={handleStopLive}
            disabled={loading}
            className="flex items-center gap-1 rounded-2xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-red-700"
          >
            <StopCircle className="h-4 w-4" />
            Akhiri Siaran
          </button>
        </div>
      </div>

      {/* Main Studio Control Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Broadcast Stage & Product Pinning */}
        <div className="space-y-4 lg:col-span-2">
          {/* On-Air Video Frame */}
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-md">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Overlay Status */}
            <div className="absolute left-3.5 top-3.5 z-10 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black text-white">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                LIVE KAMERA TOKO
              </span>
              <span className="rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-md">
                {facingMode === 'user' ? 'Kamera Depan' : 'Kamera Belakang'}
              </span>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchCamera}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md transition hover:bg-black/80"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Ganti Kamera</span>
                </button>
                <button
                  type="button"
                  onClick={toggleMic}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
                >
                  {micActive ? (
                    <Mic className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <MicOff className="h-4 w-4 text-red-400" />
                  )}
                </button>
              </div>

              <span className="rounded-full border border-emerald-400/40 bg-emerald-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                Penyiaran Aktif
              </span>
            </div>
          </div>

          {/* Real-Time Product Pinning Manager */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Sorot Produk Flash Sale ({highlightedProductIds.length}/5)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Centang untuk menampilkan produk di bawah layar penonton
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {products.slice(0, 10).map((p) => {
                const isPinned = highlightedProductIds.includes(p.id)
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-2.5 transition ${
                      isPinned
                        ? 'border-orange-500 bg-orange-50/60 dark:border-orange-500 dark:bg-orange-950/30'
                        : 'dark:bg-slate-850 border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={
                            p.images?.[0] ||
                            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'
                          }
                          alt={p.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {p.name}
                        </p>
                        <p className="text-[11px] font-semibold text-orange-600">
                          Rp {p.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                        isPinned
                          ? 'bg-orange-500 text-white'
                          : 'border border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {isPinned ? 'Aktif' : 'Sorot'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Live Chat Feed from Customers */}
        <div className="flex h-[600px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Chat Interaktif Pembeli
              </h3>
            </div>
            <p className="text-[10px] text-slate-500">
              Pertanyaan pembeli muncul real-time saat Anda siaran
            </p>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50/30 p-4 dark:bg-slate-950/20">
            {liveChatMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <MessageCircle className="mb-2 h-7 w-7 text-slate-300" />
                <p className="text-xs font-medium">Belum ada chat masuk</p>
                <p className="text-[10px] text-slate-400">
                  Komentar penonton akan langsung tampil di sini
                </p>
              </div>
            ) : (
              liveChatMessages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`shadow-2xs rounded-2xl border p-2.5 text-xs ${
                    msg.isPinned
                      ? 'border-orange-200 bg-orange-50/90 text-orange-950'
                      : 'border-slate-200/80 bg-white text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">
                      {msg.userName}
                    </span>
                    {msg.isPinned && (
                      <span className="py-0.2 rounded bg-orange-500 px-1 text-[9px] font-bold text-white">
                        PIN TOKO
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-slate-700">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Quick Admin Reply Bar */}
          <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && sendAdminChat()
                }
                placeholder="Balas penonton resmi toko..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={sendAdminChat}
                disabled={!adminReply.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
