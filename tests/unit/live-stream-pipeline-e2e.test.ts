import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  POST as createStreamHandler,
  GET as listStreamsHandler,
} from '@/app/api/live-streams/route'
import {
  GET as getStreamDetailHandler,
  PATCH as updateStreamHandler,
  DELETE as deleteStreamHandler,
} from '@/app/api/live-streams/[id]/route'
import { GET as getLiveKitTokenHandler } from '@/app/api/live-streams/[id]/livekit-token/route'
import {
  GET as getChatHistoryHandler,
  POST as postChatHandler,
} from '@/app/api/live-streams/[id]/chat/route'
import prisma from '@/lib/db'

// Mock next-auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/auth'

describe('Live Streaming Engine — Full End-to-End Pipeline Simulation', () => {
  const mockStoreAdmin = {
    user: {
      id: 'usr-admin-roxy',
      email: 'admin.roxy@affiliategadget.com',
      name: 'Bambang Susanto',
      role: 'STORE_ADMIN',
      storeId: 'store-roxy-mas',
    },
  }

  const mockCustomer = {
    user: {
      id: 'usr-customer-1',
      email: 'customer@test.com',
      name: 'Rian Pratama',
      role: 'CUSTOMER',
    },
  }

  const mockStore = {
    id: 'store-roxy-mas',
    name: 'Affiliate Gadget Roxy Mas',
    companyName: 'PT Gadget Jaya Sentosa',
    slug: 'roxy-mas',
    logo: 'https://images.unsplash.com/store-roxy.jpg',
    city: 'Jakarta Pusat',
    whatsapp: '081234567890',
  }

  const mockProduct = {
    id: 'prod-iphone-15',
    name: 'iPhone 15 Pro Max 256GB Natural Titanium',
    price: 21999000,
    originalPrice: 24999000,
    images: ['https://images.unsplash.com/iphone-15.jpg'],
    brand: 'Apple',
    stock: 5,
    rating: 4.9,
    warrantyDays: 30,
    isActive: true,
  }

  let createdStreamId: string = ''

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Step 1: Security Gate — Blocks non-admin users from creating live stream', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockCustomer as any)

    const req = new NextRequest('http://localhost:3002/api/live-streams', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Siaran Langsung Ilegal',
      }),
    })

    const res = await createStreamHandler(req)
    const json = await res.json()
    expect(res.status).toBe(403)
    expect(json.success).toBe(false)
    expect(json.error).toBe('Forbidden')
  })

  it('Step 2: Store Admin creates a live streaming session', async () => {
    vi.mocked(auth).mockResolvedValue(mockStoreAdmin as any)

    // Mock prisma
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      storeId: 'store-roxy-mas',
    } as any)

    const fakeStream = {
      id: 'stream-live-test-101',
      storeId: 'store-roxy-mas',
      hostId: 'usr-admin-roxy',
      title: 'Flash Sale iPhone 15 Pro Max Garansi 30 Hari Toko Roxy Mas',
      description: 'Diskon kilat khusus penonton live siang ini!',
      coverImage: null,
      streamUrl: '',
      status: 'SCHEDULED',
      scheduledAt: null,
      startedAt: null,
      endedAt: null,
      viewerCount: 0,
      featuredProductIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      store: mockStore,
    }

    vi.spyOn(prisma.liveStream, 'create').mockResolvedValueOnce(
      fakeStream as any
    )

    const req = new NextRequest('http://localhost:3002/api/live-streams', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Flash Sale iPhone 15 Pro Max Garansi 30 Hari Toko Roxy Mas',
        description: 'Diskon kilat khusus penonton live siang ini!',
      }),
    })

    const res = await createStreamHandler(req)
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.id).toBe('stream-live-test-101')
    expect(json.data.status).toBe('SCHEDULED')
    createdStreamId = json.data.id
  })

  it('Step 3: Admin starts camera and sets status to LIVE with pinned products', async () => {
    vi.mocked(auth).mockResolvedValue(mockStoreAdmin as any)

    vi.spyOn(prisma.liveStream, 'findUnique').mockResolvedValueOnce({
      id: createdStreamId,
      storeId: 'store-roxy-mas',
    } as any)

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      storeId: 'store-roxy-mas',
    } as any)

    const updatedStream = {
      id: createdStreamId,
      status: 'LIVE',
      streamUrl: 'live-camera',
      featuredProductIds: ['prod-iphone-15'],
      startedAt: new Date(),
    }

    vi.spyOn(prisma.liveStream, 'update').mockResolvedValueOnce(
      updatedStream as any
    )

    const req = new NextRequest(
      `http://localhost:3002/api/live-streams/${createdStreamId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'LIVE',
          streamUrl: 'live-camera',
          featuredProductIds: ['prod-iphone-15'],
        }),
      }
    )

    const res = await updateStreamHandler(req, {
      params: Promise.resolve({ id: createdStreamId }),
    })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('LIVE')
    expect(json.data.featuredProductIds).toEqual(['prod-iphone-15'])
  })

  it('Step 4: Public catalog lists active live stream with LIVE badge', async () => {
    vi.spyOn(prisma.liveStream, 'findMany').mockResolvedValueOnce([
      {
        id: createdStreamId,
        title: 'Flash Sale iPhone 15 Pro Max',
        status: 'LIVE',
        viewerCount: 1,
        store: mockStore,
        host: { id: 'usr-admin-roxy', name: 'Bambang Susanto', image: null },
        _count: { comments: 0 },
      },
    ] as any)

    const req = new NextRequest(
      'http://localhost:3000/api/live-streams?status=LIVE'
    )
    const res = await listStreamsHandler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].status).toBe('LIVE')
  })

  it('Step 5: Customer accesses live stream detail & receives pinned product', async () => {
    vi.spyOn(prisma.liveStream, 'findUnique').mockResolvedValueOnce({
      id: createdStreamId,
      storeId: 'store-roxy-mas',
      title: 'Flash Sale iPhone 15 Pro Max Garansi 30 Hari Toko Roxy Mas',
      status: 'LIVE',
      streamUrl: 'live-camera',
      featuredProductIds: ['prod-iphone-15'],
      viewerCount: 1,
      store: mockStore,
      host: { id: 'usr-admin-roxy', name: 'Bambang Susanto', image: null },
      comments: [],
    } as any)

    vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([
      mockProduct,
    ] as any)

    const req = new NextRequest(
      `http://localhost:3002/api/live-streams/${createdStreamId}`
    )
    const res = await getStreamDetailHandler(req, {
      params: Promise.resolve({ id: createdStreamId }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('LIVE')
    expect(json.data.featuredProducts).toHaveLength(1)
    expect(json.data.featuredProducts[0].name).toContain('iPhone 15 Pro Max')
    expect(json.data.featuredProducts[0].warrantyDays).toBe(30)
  })

  it('Step 6: Store Admin requests LiveKit broadcaster token with publish rights', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockStoreAdmin as any)

    vi.spyOn(prisma.liveStream, 'findUnique').mockResolvedValueOnce({
      id: createdStreamId,
      storeId: 'store-roxy-mas',
      status: 'LIVE',
      livekitRoomName: `ag-live-${createdStreamId}`,
      store: mockStore,
    } as any)

    const req = new NextRequest(
      `http://localhost:3000/api/live-streams/${createdStreamId}/livekit-token?role=broadcaster`
    )
    const res = await getLiveKitTokenHandler(req, {
      params: Promise.resolve({ id: createdStreamId }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.isBroadcaster).toBe(true)
    expect(json.data.token).toBeDefined()
    expect(typeof json.data.token).toBe('string')
    expect(json.data.roomName).toContain(createdStreamId)
  })

  it('Step 7: Customer requests LiveKit viewer token with subscriber-only rights', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockCustomer as any)

    vi.spyOn(prisma.liveStream, 'findUnique').mockResolvedValueOnce({
      id: createdStreamId,
      storeId: 'store-roxy-mas',
      status: 'LIVE',
      livekitRoomName: `ag-live-${createdStreamId}`,
      store: mockStore,
    } as any)

    const req = new NextRequest(
      `http://localhost:3000/api/live-streams/${createdStreamId}/livekit-token?role=viewer`
    )
    const res = await getLiveKitTokenHandler(req, {
      params: Promise.resolve({ id: createdStreamId }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.isBroadcaster).toBe(false)
    expect(json.data.token).toBeDefined()
  })

  it('Step 8: Live Chat History & HTTP Persistence', async () => {
    // A. Fetch Chat History (GET)
    const fakeComments = [
      {
        id: 'cmt-1',
        streamId: createdStreamId,
        userName: 'Rian Pratama',
        userAvatar: null,
        message: 'Halo min, produk masih ready?',
        type: 'CHAT',
        metadata: null,
        isPinned: false,
        createdAt: new Date(),
      },
    ]

    vi.spyOn(prisma.liveStreamComment, 'findMany').mockResolvedValueOnce(
      fakeComments as any
    )

    const historyReq = new NextRequest(
      `http://localhost:3000/api/live-streams/${createdStreamId}/chat`
    )
    const historyRes = await getChatHistoryHandler(historyReq, {
      params: Promise.resolve({ id: createdStreamId }),
    })
    const historyJson = await historyRes.json()
    expect(historyRes.status).toBe(200)
    expect(historyJson.success).toBe(true)
    expect(historyJson.data).toHaveLength(1)

    // B. Customer sends chat comment (POST fallback)
    vi.spyOn(prisma.liveStreamComment, 'create').mockResolvedValueOnce(
      fakeComments[0] as any
    )

    const chatReq = new NextRequest(
      `http://localhost:3000/api/live-streams/${createdStreamId}/chat`,
      {
        method: 'POST',
        body: JSON.stringify({
          userName: 'Rian Pratama',
          message: 'Halo min, produk masih ready?',
        }),
      }
    )

    const chatRes = await postChatHandler(chatReq, {
      params: Promise.resolve({ id: createdStreamId }),
    })
    const chatJson = await chatRes.json()
    expect(chatRes.status).toBe(201)
    expect(chatJson.success).toBe(true)
    expect(chatJson.data.message).toBe('Halo min, produk masih ready?')
  })

  it('Step 9: Admin ends the live stream session', async () => {
    vi.mocked(auth).mockResolvedValue(mockStoreAdmin as any)

    vi.spyOn(prisma.liveStream, 'findUnique').mockResolvedValueOnce({
      id: createdStreamId,
      storeId: 'store-roxy-mas',
      livekitRoomName: `ag-live-${createdStreamId}`,
    } as any)

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      storeId: 'store-roxy-mas',
    } as any)

    vi.spyOn(prisma.liveStream, 'update').mockResolvedValueOnce({
      id: createdStreamId,
      status: 'ENDED',
      endedAt: new Date(),
    } as any)

    const patchReq = new NextRequest(
      `http://localhost:3000/api/live-streams/${createdStreamId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ENDED' }),
      }
    )

    const patchRes = await updateStreamHandler(patchReq, {
      params: Promise.resolve({ id: createdStreamId }),
    })
    const patchJson = await patchRes.json()
    expect(patchRes.status).toBe(200)
    expect(patchJson.success).toBe(true)
    expect(patchJson.data.status).toBe('ENDED')
  })
})
