import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createLiveKitToken } from '@/lib/livekit'

describe('LiveKit Token Generation & Permissions', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.LIVEKIT_API_KEY = 'mock_test_api_key_12345'
    process.env.LIVEKIT_API_SECRET =
      'mock_test_api_secret_abcdef1234567890abcdef'
    process.env.LIVEKIT_URL = 'wss://mock-test.livekit.cloud'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('generates a valid JWT token for broadcaster with publish permissions', async () => {
    const token = await createLiveKitToken({
      roomName: 'ag-live-test-123',
      participantIdentity: 'host-user-1',
      participantName: 'Host Admin Toko',
      isBroadcaster: true,
    })

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    // JWT format: header.payload.signature
    const parts = token.split('.')
    expect(parts.length).toBe(3)

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    )
    expect(payload.sub).toBe('host-user-1')
    expect(payload.name).toBe('Host Admin Toko')
    expect(payload.video).toBeDefined()
    expect(payload.video.room).toBe('ag-live-test-123')
    expect(payload.video.roomJoin).toBe(true)
    expect(payload.video.canPublish).toBe(true)
    expect(payload.video.canSubscribe).toBe(true)
  })

  it('generates a restricted JWT token for viewer with canPublish: false', async () => {
    const token = await createLiveKitToken({
      roomName: 'ag-live-test-123',
      participantIdentity: 'guest-viewer-99',
      participantName: 'Penonton Pembeli',
      isBroadcaster: false,
    })

    expect(token).toBeDefined()
    const parts = token.split('.')
    expect(parts.length).toBe(3)

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    )
    expect(payload.sub).toBe('guest-viewer-99')
    expect(payload.name).toBe('Penonton Pembeli')
    expect(payload.video).toBeDefined()
    expect(payload.video.room).toBe('ag-live-test-123')
    expect(payload.video.canPublish).toBe(false)
    expect(payload.video.canSubscribe).toBe(true)
  })

  it('throws an error if LiveKit credentials are missing', async () => {
    delete process.env.LIVEKIT_API_KEY
    delete process.env.LIVEKIT_API_SECRET

    await expect(
      createLiveKitToken({
        roomName: 'ag-live-test',
        participantIdentity: 'user-1',
        participantName: 'Test',
        isBroadcaster: false,
      })
    ).rejects.toThrow('LiveKit credentials')
  })
})
