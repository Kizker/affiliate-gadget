import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { DELETE } from '@/app/api/admin/users/[id]/route'
import { PUT } from '@/app/api/admin/mitras/[id]/route'
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
      delete: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb({
        session: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        account: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        userDevice: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        otpToken: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        emailVerificationToken: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        notificationLog: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        notification: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        cart: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        userAddress: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        auditLog: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        voucherUsage: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        chatTemplate: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        massUpdateTask: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        liveStreamComment: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        storeGroup: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
        adminChatRoom: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        adminChatMessage: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        chatMessage: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        chatRoom: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        order: {
          count: vi.fn().mockResolvedValue(0),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        returnRequest: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
        complaint: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
        review: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
        user: {
          delete: vi.fn().mockResolvedValue({ id: 'target-user-001' }),
        },
      })
    }),
  },
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    storeBankAccount: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('User Deletion and Store Admin Assignment Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Menghapus akun STORE_ADMIN menonaktifkan toko sementara tanpa mengganggu riwayat toko', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'superadmin-001', role: 'SUPER_ADMIN' },
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'store-admin-target',
      role: 'STORE_ADMIN',
      email: 'admin.toko@affiliategadget.com',
      storeId: 'store-123',
    } as any)

    vi.mocked(prisma.store.findUnique).mockResolvedValue({
      id: 'store-123',
      name: 'Andri Cell',
      isActive: true,
    } as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/users/store-admin-target',
      {
        method: 'DELETE',
      }
    )
    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'store-admin-target' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.storeDeactivated).toBe(true)
    expect(json.storeName).toBe('Andri Cell')

    // Verifikasi bahwa toko dinonaktifkan sementara
    expect(prisma.store.update).toHaveBeenCalledWith({
      where: { id: 'store-123' },
      data: { isActive: false },
    })
  })

  it('2. PUT /api/admin/mitras/[id] mengizinkan Superadmin menugaskan akun Admin Toko baru via adminUserId', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'superadmin-001', role: 'SUPER_ADMIN' },
    } as any)

    const { db } = await import('@/lib/db')
    vi.mocked(db.store.findUnique).mockResolvedValue({
      id: 'store-123',
      name: 'Andri Cell',
      companyName: 'PT Gadget Jaya',
      isActive: false,
    } as any)

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'new-store-admin-99',
      name: 'Fauzan Baru',
      email: 'fauzan.newadmin@affiliategadget.com',
      role: 'STORE_ADMIN',
    } as any)

    vi.mocked(db.store.update).mockResolvedValue({
      id: 'store-123',
      name: 'Andri Cell',
      email: 'fauzan.newadmin@affiliategadget.com',
      isActive: true,
    } as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/mitras/store-123',
      {
        method: 'PUT',
        body: JSON.stringify({
          adminUserId: 'new-store-admin-99',
          isActive: true,
        }),
      }
    )

    const res = await PUT(req, { params: Promise.resolve({ id: 'store-123' }) })
    expect(res.status).toBe(200)

    // Verifikasi user baru ditautkan ke toko ini
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'new-store-admin-99' },
      data: {
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        isActive: true,
        mitraStatus: 'APPROVED',
      },
    })
  })
})
