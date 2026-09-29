import http from 'http'
import { parse as parseUrl } from 'url'
import { WebSocketServer, WebSocket } from 'ws'
import dotenv from 'dotenv'
import { parseAuthSession } from './auth'
import { roomManager, prisma } from './room-manager'
import type { WsClientSession, WsMessage } from './types'

// Load environment variables from .env in project root
dotenv.config()

const PORT = parseInt(process.env.WS_PORT || '3001', 10)
const ALLOWED_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// 1. Create HTTP server for health check and WebSocket upgrade
const server = http.createServer((req, res) => {
  // Simple CORS headers for health check
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'affiliate-gadget-ws-server',
        port: PORT,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      })
    )
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
})

// 2. Initialize WebSocket Server
const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin

  // Origin security check: allow same origin or localhost in dev
  if (origin) {
    const isAllowed =
      origin === ALLOWED_ORIGIN ||
      origin.includes('localhost:') ||
      origin.includes('127.0.0.1:')

    if (!isAllowed) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      socket.destroy()
      return
    }
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

// Helper to sanitize chat messages (anti-XSS & length limit)
function sanitizeText(input: string): string {
  if (!input) return ''
  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip JS protocol
    .trim()
    .slice(0, 300) // Maximum 300 characters
}

// 3. Handle incoming WebSocket connections
wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
  const parsed = parseUrl(req.url || '', true)
  const query = parsed.query

  const tokenParam = typeof query.token === 'string' ? query.token : undefined
  const initialStreamId =
    typeof query.streamId === 'string' ? query.streamId : undefined
  const queryName =
    typeof query.name === 'string' ? query.name.slice(0, 50) : undefined
  const queryAvatar =
    typeof query.avatar === 'string' ? query.avatar : undefined

  // Attempt to authenticate from session cookie or explicit token
  const authSession = await parseAuthSession(req.headers.cookie, tokenParam)

  const isBroadcaster =
    authSession?.role === 'STORE_ADMIN' || authSession?.role === 'SUPER_ADMIN'

  const session: WsClientSession = {
    ws,
    streamId: initialStreamId,
    userId: authSession?.id,
    userName: authSession?.name || queryName || 'Penonton',
    userAvatar: authSession?.image || queryAvatar || undefined,
    isBroadcaster,
    isAlive: true,
    joinedAt: Date.now(),
    lastMessageTime: 0,
    messageCountWindow: 0,
  }

  // Auto-join room if streamId is present in query parameters
  if (initialStreamId) {
    roomManager.joinRoom(initialStreamId, session)
  }

  // Handle heartbeats (pong reply)
  ws.on('pong', () => {
    session.isAlive = true
  })

  // Handle incoming client messages
  ws.on('message', async (data: Buffer | string) => {
    try {
      const rawText = data.toString()
      const msg: WsMessage = JSON.parse(rawText)

      const targetStreamId = msg.streamId || session.streamId
      if (!targetStreamId) {
        return
      }

      switch (msg.type) {
        case 'join': {
          roomManager.joinRoom(targetStreamId, session)
          break
        }

        case 'leave': {
          roomManager.leaveRoom(session)
          break
        }

        case 'chat': {
          const rawMessage = msg.payload?.message || ''
          const sanitized = sanitizeText(rawMessage)
          if (!sanitized) return

          // Rate Limiter: Max 5 messages per 2 seconds
          const now = Date.now()
          if (now - session.lastMessageTime < 2000) {
            session.messageCountWindow += 1
            if (session.messageCountWindow > 5) {
              // Rate limit exceeded - drop message
              roomManager.sendToClient(ws, {
                type: 'system',
                streamId: targetStreamId,
                payload: {
                  error: 'RATE_LIMITED',
                  message: 'Kirim pesan terlalu cepat. Harap tunggu sebentar.',
                },
              })
              return
            }
          } else {
            session.lastMessageTime = now
            session.messageCountWindow = 1
          }

          // Persist comment to PostgreSQL
          let savedComment: any = null
          try {
            savedComment = await prisma.liveStreamComment.create({
              data: {
                streamId: targetStreamId,
                userId: session.userId || null,
                userName: session.userName,
                userAvatar: session.userAvatar || null,
                message: sanitized,
                type: 'CHAT',
              },
            })
          } catch {
            // Fallback object if database insert temporarily fails
            savedComment = {
              id: `temp-${Date.now()}`,
              userName: session.userName,
              userAvatar: session.userAvatar,
              message: sanitized,
              createdAt: new Date().toISOString(),
            }
          }

          // Broadcast to everyone in the room
          roomManager.broadcastToRoom(targetStreamId, {
            type: 'chat',
            streamId: targetStreamId,
            payload: {
              id: savedComment.id,
              userId: session.userId,
              userName: session.userName,
              userAvatar: session.userAvatar,
              message: sanitized,
              createdAt: savedComment.createdAt,
            },
          })
          break
        }

        case 'like': {
          const count =
            typeof msg.payload?.count === 'number' ? msg.payload.count : 1
          roomManager.recordLike(targetStreamId, count)

          // Broadcast like animation to all viewers
          roomManager.broadcastToRoom(targetStreamId, {
            type: 'like',
            streamId: targetStreamId,
            payload: { count, userId: session.userId },
          })
          break
        }

        case 'pin_product': {
          // Broadcaster / Admin only
          if (!session.isBroadcaster) {
            roomManager.sendToClient(ws, {
              type: 'system',
              streamId: targetStreamId,
              payload: {
                error: 'UNAUTHORIZED',
                message: 'Hanya host yang dapat menyematkan produk.',
              },
            })
            return
          }

          roomManager.setPinnedProduct(targetStreamId, msg.payload)
          break
        }

        case 'unpin_product': {
          // Broadcaster / Admin only
          if (!session.isBroadcaster) return
          roomManager.setPinnedProduct(targetStreamId, null)
          break
        }

        case 'stream_ended': {
          // Broadcaster / Admin only
          if (!session.isBroadcaster) return

          roomManager.broadcastToRoom(targetStreamId, {
            type: 'stream_ended',
            streamId: targetStreamId,
          })

          try {
            await prisma.liveStream.update({
              where: { id: targetStreamId },
              data: {
                status: 'ENDED',
                endedAt: new Date(),
              },
            })
          } catch {
            // Stream record may already be updated
          }
          break
        }

        case 'ping': {
          roomManager.sendToClient(ws, {
            type: 'pong',
            streamId: targetStreamId,
          })
          break
        }

        default:
          break
      }
    } catch (err) {
      // Invalid JSON payload received
    }
  })

  // Handle client disconnect
  ws.on('close', () => {
    roomManager.leaveRoom(session)
  })

  ws.on('error', () => {
    roomManager.leaveRoom(session)
  })
})

// 4. Heartbeat interval to terminate stale or zombie connections
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const client = ws as WebSocket & { isAlive?: boolean }
    if (client.isAlive === false) {
      return ws.terminate()
    }
    client.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on('close', () => {
  clearInterval(heartbeatInterval)
  roomManager.destroy()
})

// Start standalone server
server.listen(PORT, () => {
  console.log(
    `🚀 Standalone Live Stream WebSocket Server running on port ${PORT}`
  )
  console.log(`🔗 WS endpoint: ws://localhost:${PORT}`)
  console.log(`🩺 Health check: http://localhost:${PORT}/health`)
})

export default server
