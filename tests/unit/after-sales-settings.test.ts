import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { GET, PATCH } from '@/app/api/admin/profile/route'
import { NextRequest } from 'next/server'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    store: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((cb) =>
      cb({
        user: {
          update: vi.fn().mockResolvedValue({
            id: 'as-user-001',
            name: 'Budi Santoso After Sales',
            email: 'aftersales@affiliategadget.com',
            image: '/uploads/avatars/new-avatar.jpg',
            phone: '081234567890',
            role: 'AFTER_SALES',
            storeId: null,
          }),
        },
      })
    ),
  },
}))

describe('After Sales Settings & Profile Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. GET /api/admin/profile mengizinkan akses untuk role AFTER_SALES', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: 'as-user-001',
        role: 'AFTER_SALES',
        email: 'aftersales@affiliategadget.com',
      },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'as-user-001',
      name: 'Admin After Sales Roxy',
      email: 'aftersales@affiliategadget.com',
      image: '/uploads/avatars/default.jpg',
      phone: '081234567890',
      role: 'AFTER_SALES',
      storeId: null,
      store: null,
    } as any)

    const req = new NextRequest('http://localhost:3000/api/admin/profile')
    const res = await GET()
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.user.role).toBe('AFTER_SALES')
    expect(json.user.name).toBe('Admin After Sales Roxy')
  })

  it('2. PATCH /api/admin/profile mengizinkan AFTER_SALES memperbarui nama, phone, dan foto profil', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: 'as-user-001',
        role: 'AFTER_SALES',
        email: 'aftersales@affiliategadget.com',
      },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'as-user-001',
      role: 'AFTER_SALES',
      email: 'aftersales@affiliategadget.com',
      storeId: null,
    } as any)

    const req = new NextRequest('http://localhost:3000/api/admin/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Budi Santoso After Sales',
        phone: '081234567890',
        image: '/uploads/avatars/new-avatar.jpg',
      }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.message).toContain('berhasil')
    expect(json.user.name).toBe('Budi Santoso After Sales')
  })
})
