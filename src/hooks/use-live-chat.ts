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

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef<number>(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
    const configuredUrl =
      process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

    let base = configuredUrl
    if (typeof window !== 'undefined' && configuredUrl.includes('localhost')) {
      base = `ws://${window.location.hostname}:3001`
    }

    const params = new URLSearchParams()
    if (streamId) params.set('streamId', streamId)
    if (userName) params.set('name', userName)
    if (userAvatar) params.set('avatar', userAvatar)
    if (token) params.set('token', token)

    return `${base}?${params.toString()}`
  }, [streamId, userName, userAvatar, token])

  // 3. Connect to WebSocket
  const connectWs = useCallback(() => {
    if (!streamId) return

    try {
      const wsUrl = getWsUrl()
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
            payload: { userName, userAvatar, isBroadcaster },
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
              setMessages((prev) => [...prev.slice(-100), newMsg])
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

            default:
              break
          }
        } catch {
          // Ignore unparseable message
        }
      }

      ws.onclose = () => {
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
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [connectWs])

  // 4. Send Message function
  const sendMessage = useCallback(
    (msgText: string) => {
      const trimmed = msgText.trim()
      if (
        !trimmed ||
        !socketRef.current ||
        socketRef.current.readyState !== WebSocket.OPEN
      ) {
        return false
      }

      socketRef.current.send(
        JSON.stringify({
          type: 'chat',
          streamId,
          payload: {
            message: trimmed,
            userName,
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
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'pin_product',
            streamId,
            payload: product,
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

  return {
    messages,
    viewerCount,
    pinnedProduct,
    isConnected,
    isStreamEnded,
    likeCount,
    sendMessage,
    sendLike,
    pinProduct,
    unpinProduct,
    endStream,
  }
}
