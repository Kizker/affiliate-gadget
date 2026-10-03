'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface LiveChatMessage {
  id: string
  userId?: string
  userName: string
  userAvatar?: string
  message: string
  createdAt?: string
  isPinned?: boolean
}

export interface PinnedProduct {
  productId: string
  productTitle?: string
  productPrice?: number
  productImage?: string
  productSlug?: string
  originalPrice?: number
  discountPrice?: number
  dealToken?: string
}

export interface UseLiveChatOptions {
  streamId: string
  userName?: string
  userAvatar?: string
  token?: string
  initialViewerCount?: number
  isBroadcaster?: boolean
}

export function useLiveChat({
  streamId,
  userName = 'Penonton',
  userAvatar,
  token,
  initialViewerCount = 0,
  isBroadcaster = false,
}: UseLiveChatOptions) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [viewerCount, setViewerCount] = useState<number>(initialViewerCount)
  const [pinnedProduct, setPinnedProduct] = useState<PinnedProduct | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isStreamEnded, setIsStreamEnded] = useState<boolean>(false)
  const [likeCount, setLikeCount] = useState<number>(0)
  const [isMirrored, setIsMirrored] = useState<boolean>(false)

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef<number>(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Persistent client viewer ID (deduplicates device/browser sessions)
  const getViewerId = useCallback(() => {
    if (typeof window === 'undefined') return 'guest-ssr'
    try {
      let vid = localStorage.getItem('affiliate_gadget_viewer_id')
      if (!vid) {
        vid =
          'v_' +
          Math.random().toString(36).substring(2, 9) +
          Date.now().toString(36)
        localStorage.setItem('affiliate_gadget_viewer_id', vid)
      }
      return vid
    } catch {
      return 'guest-anon'
    }
  }, [])

  // 1. Fetch initial chat history from REST API
  useEffect(() => {
    if (!streamId) return

    let cancelled = false
    async function loadHistory() {
      try {
        const res = await fetch(`/api/live-streams/${streamId}/chat?limit=50`)
        const json = await res.json()
        if (!cancelled && json.success && Array.isArray(json.data)) {
          setMessages(json.data)
        }
      } catch {
        // Fallback silently if history load fails
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [streamId])

  // 2. Resolve WebSocket Server URL
  const getWsUrl = useCallback(() => {
    const configuredUrl = process.env.NEXT_PUBLIC_WS_URL
    const viewerId = getViewerId()

    let base = configuredUrl
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:'
      if (!base) {
        base = isHttps
          ? `wss://${window.location.host}/ws`
          : `ws://${window.location.hostname}:3001`
      } else if (configuredUrl?.includes('localhost')) {
        base = isHttps
          ? `wss://${window.location.host}/ws`
          : `ws://${window.location.hostname}:3001`
      }
    } else if (!base) {
      base = 'ws://localhost:3001'
    }

    const params = new URLSearchParams()
    if (streamId) params.set('streamId', streamId)
    if (userName) params.set('name', userName)
    if (userAvatar) params.set('avatar', userAvatar)
    if (token) params.set('token', token)
    if (viewerId) params.set('viewerId', viewerId)
    if (isBroadcaster) params.set('isBroadcaster', 'true')

    return `${base}?${params.toString()}`
  }, [streamId, userName, userAvatar, token, isBroadcaster, getViewerId])

  // 3. Connect to WebSocket
  const connectWs = useCallback(() => {
    if (!streamId) return

    try {
      const wsUrl = getWsUrl()
      const viewerId = getViewerId()
      const ws = new WebSocket(wsUrl)
      socketRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0

        // Send initial join message
        ws.send(
          JSON.stringify({
            type: 'join',
            streamId,
            payload: { userName, userAvatar, isBroadcaster, viewerId },
          })
        )

        // Ping heartbeat every 20 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', streamId }))
          }
        }, 20000)
      }

      ws.onmessage = (event) => {
        // Abaikan pesan dari socket lama/stale (mencegah chat ganda)
        if (socketRef.current !== ws) return
        try {
          const data = JSON.parse(event.data)
          switch (data.type) {
            case 'chat': {
              const newMsg: LiveChatMessage = {
                id: data.payload?.id || `msg-${Date.now()}`,
                userId: data.payload?.userId,
                userName: data.payload?.userName || 'Anonim',
                userAvatar: data.payload?.userAvatar,
                message: data.payload?.message || '',
                createdAt: data.payload?.createdAt || new Date().toISOString(),
                isPinned: data.payload?.isPinned,
              }
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev
                return [...prev.slice(-100), newMsg]
              })
              break
            }

            case 'viewer_count': {
              if (typeof data.payload?.count === 'number') {
                setViewerCount(data.payload.count)
              }
              break
            }

            case 'like': {
              const burst = data.payload?.count || 1
              setLikeCount((prev) => prev + burst)
              break
            }

            case 'pin_product': {
              if (data.payload?.productId) {
                setPinnedProduct(data.payload)
              }
              break
            }

            case 'unpin_product': {
              setPinnedProduct(null)
              break
            }

            case 'stream_ended': {
              setIsStreamEnded(true)
              break
            }

            case 'mirror': {
              if (typeof data.payload?.isMirrored === 'boolean') {
                setIsMirrored(data.payload.isMirrored)
              }
              break
            }

            default:
              break
          }
        } catch {
          // Ignore unparseable message
        }
      }

      ws.onclose = () => {
        // Socket ini sudah digantikan/ditutup sengaja saat cleanup: jangan reconnect
        if (socketRef.current !== ws) return
        setIsConnected(false)
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }

        // Exponential backoff reconnect: 1s, 2s, 4s, 8s (max 5 tries)
        if (reconnectAttemptsRef.current < 5 && !isStreamEnded) {
          const timeout = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000
          )
          reconnectAttemptsRef.current += 1
          reconnectTimeoutRef.current = setTimeout(connectWs, timeout)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch (err) {
      console.warn('Live chat WebSocket connection failed, will retry:', err)
    }
  }, [streamId, getWsUrl, userName, userAvatar, isBroadcaster, isStreamEnded])

  useEffect(() => {
    connectWs()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      const current = socketRef.current
      // Lepas referensi lebih dulu agar handler onclose/onmessage socket lama diabaikan
      socketRef.current = null
      if (current) {
        try {
          if (current.readyState === WebSocket.OPEN) {
            current.send(JSON.stringify({ type: 'leave', streamId }))
          }
        } catch {
          // Ignore
        }
        current.close()
      }
    }
  }, [connectWs])

  // 4. Send Message function
  const sendMessage = useCallback(
    (msgText: string, customUserName?: string) => {
      const trimmed = msgText.trim()
      if (
        !trimmed ||
        !socketRef.current ||
        socketRef.current.readyState !== WebSocket.OPEN
      ) {
        return false
      }

      const activeSender = customUserName || userName || 'Penonton'

      socketRef.current.send(
        JSON.stringify({
          type: 'chat',
          streamId,
          payload: {
            message: trimmed,
            userName: activeSender,
            userAvatar,
          },
        })
      )
      return true
    },
    [streamId, userName, userAvatar]
  )

  // 5. Send Like function
  const sendLike = useCallback(
    (count = 1) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'like',
            streamId,
            payload: { count },
          })
        )
      }
      setLikeCount((prev) => prev + count)
    },
    [streamId]
  )

  // 6. Pin / Unpin Product (Broadcaster)
  const pinProduct = useCallback(
    (product: PinnedProduct) => {
      const payload = { ...product, isBroadcaster: true }
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'pin_product',
            streamId,
            payload,
          })
        )
      }
      setPinnedProduct(product)
    },
    [streamId]
  )

  const unpinProduct = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'unpin_product',
          streamId,
        })
      )
    }
    setPinnedProduct(null)
  }, [streamId])

  // 7. End Stream (Broadcaster)
  const endStream = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'stream_ended',
          streamId,
        })
      )
    }
    setIsStreamEnded(true)
  }, [streamId])

  // 8. Mirror state sync (Broadcaster broadcasts mirror state to all viewers)
  const setMirror = useCallback(
    (mirrored: boolean) => {
      setIsMirrored(mirrored)
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'mirror',
            streamId,
            payload: { isMirrored: mirrored },
          })
        )
      }
    },
    [streamId]
  )

  return {
    messages,
    viewerCount,
    pinnedProduct,
    isConnected,
    isStreamEnded,
    likeCount,
    isMirrored,
    sendMessage,
    sendLike,
    pinProduct,
    unpinProduct,
    endStream,
    setMirror,
  }
}
