import type { WebSocket } from 'ws'

export type WsEventType =
  | 'join'
  | 'leave'
  | 'chat'
  | 'like'
  | 'mirror'
  | 'pin_product'
  | 'unpin_product'
  | 'viewer_count'
  | 'stream_ended'
  | 'system'
  | 'ping'
  | 'pong'

export interface WsMessage<T = any> {
  type: WsEventType
  streamId: string
  payload?: T
  timestamp?: number
}

export interface WsChatPayload {
  id?: string
  userId?: string
  userName: string
  userAvatar?: string
  message: string
  createdAt?: string
}

export interface WsLikePayload {
  count: number
  userId?: string
  totalLikes?: number
}

export interface WsPinProductPayload {
  productId: string
  productTitle?: string
  productPrice?: number
  productImage?: string
  productSlug?: string
  originalPrice?: number
  discountPrice?: number
  dealToken?: string
}

export interface WsViewerCountPayload {
  count: number
}

export interface WsClientSession {
  ws: WebSocket
  streamId?: string
  userId?: string
  viewerId?: string
  userName: string
  userAvatar?: string
  isBroadcaster: boolean
  isAlive: boolean
  joinedAt: number
  lastMessageTime: number
  messageCountWindow: number
}
