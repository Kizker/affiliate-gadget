import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

export interface CreateLiveKitTokenParams {
  roomName: string
  participantIdentity: string
  participantName: string
  isBroadcaster: boolean
  metadata?: Record<string, any>
}

/**
 * Generates a signed LiveKit JWT AccessToken for a broadcaster or viewer.
 * Broadcaster has canPublish: true, viewer has canPublish: false.
 */
export async function createLiveKitToken({
  roomName,
  participantIdentity,
  participantName,
  isBroadcaster,
  metadata,
}: CreateLiveKitTokenParams): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error(
      'LiveKit credentials (LIVEKIT_API_KEY, LIVEKIT_API_SECRET) missing'
    )
  }

  // TTL: 6 hours for host, 4 hours for viewer
  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: isBroadcaster ? '6h' : '4h',
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isBroadcaster,
    canSubscribe: true,
    canPublishData: isBroadcaster,
  })

  return await at.toJwt()
}

/**
 * Returns a LiveKit RoomServiceClient instance for administrative tasks
 * like closing rooms or listing participants.
 */
export function getLiveKitRoomService(): RoomServiceClient {
  const url = process.env.LIVEKIT_URL || ''
  // RoomServiceClient communicates over HTTPS
  const httpUrl = url.replace('wss://', 'https://').replace('ws://', 'http://')
  const apiKey = process.env.LIVEKIT_API_KEY || ''
  const apiSecret = process.env.LIVEKIT_API_SECRET || ''

  return new RoomServiceClient(httpUrl, apiKey, apiSecret)
}
