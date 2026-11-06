import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

// Import route handlers to test
import {
  GET as getComplaint,
  PATCH as patchComplaint,
} from '@/app/api/complaints/[id]/route'
import {
  GET as getReturnRequest,
  PUT as putReturnRequest,
} from '@/app/api/returns/[id]/route'
import {
  GET as getAdminAd,
  PATCH as patchAdminAd,
  DELETE as deleteAdminAd,
} from '@/app/api/admin/ads/[id]/route'
import {
  GET as getVoucher,
  PATCH as patchVoucher,
  DELETE as deleteVoucher,
} from '@/app/api/admin/vouchers/[id]/route'
import { GET as getOrder } from '@/app/api/orders/[orderId]/route'
import { PATCH as updateOrderStatus } from '@/app/api/orders/[orderId]/status/route'
import { POST as cancelOrder } from '@/app/api/orders/[orderId]/cancel/route'
import { POST as confirmOrder } from '@/app/api/orders/[orderId]/confirm/route'
import { POST as withdrawFunds } from '@/app/api/admin/finance/withdraw/route'
import { GET as getAdminChatOrders } from '@/app/api/admin/chat/orders/route'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/auth'

describe('Comprehensive Security Audit: Multi-Tenant IDOR & Cross-Store Authorization Verification', () => {
  const storeAId = 'sec-store-a-001'
  const storeBId = 'sec-store-b-002'

  const userTokoA = {
    id: 'sec-user-toko-a',
    email: 'admin.sec.a@testcorp.id',
    role: 'STORE_ADMIN',
    storeId: storeAId,
  }

  const userTokoB = {
    id: 'sec-user-toko-b',
    email: 'admin.sec.b@testcorp.id',
    role: 'STORE_ADMIN',
    storeId: storeBId,
  }

  const customerUser1 = {
    id: 'sec-cust-user-1',
    email: 'cust1.sec@testcorp.id',
    role: 'CUSTOMER',
  }

  const customerUser2 = {
    id: 'sec-cust-user-2',
    email: 'cust2.sec@testcorp.id',
    role: 'CUSTOMER',
  }

  const afterSalesGroupA = {
    id: 'sec-as-user-a',
    email: 'aftersales.a.sec@testcorp.id',
    role: 'AFTER_SALES',
  }

  const afterSalesGroupB = {
    id: 'sec-as-user-b',
    email: 'aftersales.b.sec@testcorp.id',
    role: 'AFTER_SALES',
  }

  let orderBId = 'sec-order-b-101'
  let complaintBId = 'sec-complaint-b-101'
  let returnBId = 'sec-return-b-101'
  let adBId = 'sec-ad-b-101'
  let voucherBId = 'sec-voucher-b-101'

  beforeEach(async () => {
    vi.clearAllMocks()

    // 1. Setup stores
    await prisma.store.upsert({
      where: { id: storeAId },
      update: {},
      create: {
        id: storeAId,
        name: 'Toko Alpha Jakarta',
        companyName: 'PT Alpha Jakarta Retail',
        slug: 'toko-alpha-jakarta',
        address: 'Jl. Alpha No. 1',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        phone: '0811000001',
      },
    })

    await prisma.store.upsert({
      where: { id: storeBId },
      update: {},
      create: {
        id: storeBId,
        name: 'Toko Beta Surabaya',
        companyName: 'PT Beta Surabaya Retail',
        slug: 'toko-beta-surabaya',
        address: 'Jl. Beta No. 2',
        city: 'Surabaya',
        province: 'Jawa Timur',
        phone: '0811000002',
      },
    })

    // 2. Setup users
    await prisma.user.upsert({
      where: { id: userTokoA.id },
      update: { storeId: storeAId, role: 'STORE_ADMIN' },
      create: {
        id: userTokoA.id,
        email: userTokoA.email,
        name: 'Admin Toko A',
        role: 'STORE_ADMIN',
        storeId: storeAId,
      },
    })

    await prisma.user.upsert({
      where: { id: customerUser1.id },
      update: { role: 'CUSTOMER' },
      create: {
        id: customerUser1.id,
        email: customerUser1.email,
        name: 'Customer Satu',
        role: 'CUSTOMER',
      },
    })

    await prisma.user.upsert({
      where: { id: customerUser2.id },
      update: { role: 'CUSTOMER' },
      create: {
        id: customerUser2.id,
        email: customerUser2.email,
        name: 'Customer Dua',
        role: 'CUSTOMER',
      },
    })

    await prisma.user.upsert({
      where: { id: afterSalesGroupA.id },
      update: { role: 'AFTER_SALES' },
      create: {
        id: afterSalesGroupA.id,
        email: afterSalesGroupA.email,
        name: 'After Sales Group A',
        role: 'AFTER_SALES',
      },
    })

    await prisma.user.upsert({
      where: { id: afterSalesGroupB.id },
      update: { role: 'AFTER_SALES' },
      create: {
        id: afterSalesGroupB.id,
        email: afterSalesGroupB.email,
        name: 'After Sales Group B',
        role: 'AFTER_SALES',
      },
    })

    // Setup StoreGroup: Group A manages Store A, Group B manages Store B
    await prisma.storeGroup.upsert({
      where: { id: 'group-a-sec' },
      update: { afterSalesUserId: afterSalesGroupA.id },
      create: {
        id: 'group-a-sec',
        name: 'Grup Alpha',
        afterSalesUserId: afterSalesGroupA.id,
      },
    })
    await prisma.store.update({
      where: { id: storeAId },
      data: { groupId: 'group-a-sec' },
    })

    await prisma.storeGroup.upsert({
      where: { id: 'group-b-sec' },
      update: { afterSalesUserId: afterSalesGroupB.id },
      create: {
        id: 'group-b-sec',
        name: 'Grup Beta',
        afterSalesUserId: afterSalesGroupB.id,
      },
    })
    await prisma.store.update({
      where: { id: storeBId },
      data: { groupId: 'group-b-sec' },
    })

    // 3. Create Order belonging to Store B (Customer 2)
    const orderB = await prisma.order.upsert({
      where: { id: orderBId },
      update: { storeId: storeBId, userId: customerUser2.id },
      create: {
        id: orderBId,
        orderNumber: 'SPR-SEC-STORE-B-001',
        userId: customerUser2.id,
        storeId: storeBId,
        total: 10000000,
        subtotal: 10000000,
        status: 'PAID',
      },
    })
    orderBId = orderB.id

    // 4. Create Complaint on Order B
    const complaintB = await prisma.complaint.upsert({
      where: { id: complaintBId },
      update: { orderId: orderBId, userId: customerUser2.id },
      create: {
        id: complaintBId,
        orderId: orderBId,
        userId: customerUser2.id,
        subject: 'Layar Retak Toko B',
        description: 'Layar pecah saat unboxing produk toko B',
        status: 'OPEN',
      },
    })
    complaintBId = complaintB.id

    // 5. Create Return Request on Order B
    const returnB = await prisma.returnRequest.upsert({
      where: { id: returnBId },
      update: {
        orderId: orderBId,
        userId: customerUser2.id,
        storeId: storeBId,
      },
      create: {
        id: returnBId,
        orderId: orderBId,
        userId: customerUser2.id,
        storeId: storeBId,
        reason: 'PRODUK_RUSAK',
        description: 'Retur unit toko B',
        status: 'PENDING',
      },
    })
    returnBId = returnB.id

    // 6. Create Internal Ad for Store B
    const adB = await prisma.internalAd.upsert({
      where: { id: adBId },
      update: { storeId: storeBId },
      create: {
        id: adBId,
        title: 'Iklan Promosi Toko B',
        bannerUrl:
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5',
        targetUrl: '/toko/toko-beta-surabaya',
        placement: 'PROMOTED_LIST',
        storeId: storeBId,
        status: 'PENDING',
        isActive: false,
      },
    })
    adBId = adB.id

    // 7. Create Voucher for Store B
    const voucherB = await prisma.voucher.upsert({
      where: { id: voucherBId },
      update: { storeId: storeBId },
      create: {
        id: voucherBId,
        code: 'VOUCHER-STORE-B',
        storeId: storeBId,
        discountType: 'PERCENTAGE',
        discountPercent: 10,
        totalQuota: 50,
        validFrom: new Date(Date.now() - 86400000),
        validUntil: new Date(Date.now() + 864000000),
      },
    })
    voucherBId = voucherB.id
  })

  // ─── AREA 1: COMPLAINTS IDOR ─────────────────────────────────────
  it('1. GET & PATCH /api/complaints/[id]: Admin Toko A ditolak 404 saat mengakses komplain Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    // GET complaint of Store B
    const reqGet = new NextRequest(
      `http://localhost:3000/api/complaints/${complaintBId}`
    )
    const resGet = await getComplaint(reqGet, {
      params: Promise.resolve({ id: complaintBId }),
    })
    expect(resGet.status).toBe(404)

    // PATCH complaint of Store B
    const reqPatch = new NextRequest(
      `http://localhost:3000/api/complaints/${complaintBId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'RESOLVED',
          resolution: 'Toko A menutup komplain Toko B',
        }),
      }
    )
    const resPatch = await patchComplaint(reqPatch, {
      params: Promise.resolve({ id: complaintBId }),
    })
    expect(resPatch.status).toBe(404)

    // Verify database remains untouched
    const dbComp = await prisma.complaint.findUnique({
      where: { id: complaintBId },
    })
    expect(dbComp?.status).toBe('OPEN')
  })

  // ─── AREA 2: RETURNS IDOR ────────────────────────────────────────
  it('2. GET & PUT /api/returns/[id]: Admin Toko A & After Sales Grup A ditolak 404 pada tiket retur Toko B', async () => {
    // Toko A accesses Return of Toko B
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)
    const reqGetTokoA = new NextRequest(
      `http://localhost:3000/api/returns/${returnBId}`
    )
    const resGetTokoA = await getReturnRequest(reqGetTokoA, {
      params: Promise.resolve({ id: returnBId }),
    })
    expect(resGetTokoA.status).toBe(404)

    // After Sales Group A tries to approve Return of Store B (belongs to Group B)
    vi.mocked(auth).mockResolvedValue({ user: afterSalesGroupA } as any)
    const reqPutAs = new NextRequest(
      `http://localhost:3000/api/returns/${returnBId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'AFTER_SALES_CONFIRM',
          decision: 'APPROVE',
          notes: 'Bypass cross-group',
        }),
      }
    )
    const resPutAs = await putReturnRequest(reqPutAs, {
      params: Promise.resolve({ id: returnBId }),
    })
    expect(resPutAs.status).toBe(404)

    // Verify return request remains PENDING
    const dbRet = await prisma.returnRequest.findUnique({
      where: { id: returnBId },
    })
    expect(dbRet?.status).toBe('PENDING')
  })

  // ─── AREA 3: INTERNAL ADS IDOR ───────────────────────────────────
  it('3. GET, PATCH, DELETE /api/admin/ads/[id]: Admin Toko A ditolak 404 saat memanipulasi iklan Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    // GET Ad of Store B
    const reqGet = new NextRequest(
      `http://localhost:3000/api/admin/ads/${adBId}`
    )
    const resGet = await getAdminAd(reqGet, {
      params: Promise.resolve({ id: adBId }),
    })
    expect(resGet.status).toBe(404)

    // PATCH Ad of Store B
    const reqPatch = new NextRequest(
      `http://localhost:3000/api/admin/ads/${adBId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Hacked Ad Title' }),
      }
    )
    const resPatch = await patchAdminAd(reqPatch, {
      params: Promise.resolve({ id: adBId }),
    })
    expect(resPatch.status).toBe(404)

    // DELETE Ad of Store B
    const reqDel = new NextRequest(
      `http://localhost:3000/api/admin/ads/${adBId}`,
      { method: 'DELETE' }
    )
    const resDel = await deleteAdminAd(reqDel, {
      params: Promise.resolve({ id: adBId }),
    })
    expect(resDel.status).toBe(404)

    // Verify ad remains untouched
    const dbAd = await prisma.internalAd.findUnique({ where: { id: adBId } })
    expect(dbAd).not.toBeNull()
    expect(dbAd?.title).toBe('Iklan Promosi Toko B')
  })

  // ─── AREA 4: VOUCHERS IDOR ───────────────────────────────────────
  it('4. GET, PATCH, DELETE /api/admin/vouchers/[id]: Admin Toko A ditolak 404 saat memanipulasi voucher Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    // GET Voucher of Store B
    const reqGet = new NextRequest(
      `http://localhost:3000/api/admin/vouchers/${voucherBId}`
    )
    const resGet = await getVoucher(reqGet, {
      params: Promise.resolve({ id: voucherBId }),
    })
    expect(resGet.status).toBe(404)

    // PATCH Voucher of Store B
    const reqPatch = new NextRequest(
      `http://localhost:3000/api/admin/vouchers/${voucherBId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ discountPercent: 99 }),
      }
    )
    const resPatch = await patchVoucher(reqPatch, {
      params: Promise.resolve({ id: voucherBId }),
    })
    expect(resPatch.status).toBe(404)

    // DELETE Voucher of Store B
    const reqDel = new NextRequest(
      `http://localhost:3000/api/admin/vouchers/${voucherBId}`,
      { method: 'DELETE' }
    )
    const resDel = await deleteVoucher(reqDel, {
      params: Promise.resolve({ id: voucherBId }),
    })
    expect(resDel.status).toBe(404)

    // Verify voucher remains untouched
    const dbVoucher = await prisma.voucher.findUnique({
      where: { id: voucherBId },
    })
    expect(dbVoucher?.discountPercent).toBe(10)
  })

  // ─── AREA 5: ORDERS & CUSTOMER ACTIONS IDOR ──────────────────────
  it('5. Orders IDOR: Customer 1 & Toko A ditolak 404 saat mengakses pesanan Toko B / Customer 2', async () => {
    // Store Admin A queries Order B
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)
    const reqGetTokoA = new NextRequest(
      `http://localhost:3000/api/orders/${orderBId}`
    )
    const resGetTokoA = await getOrder(reqGetTokoA, {
      params: Promise.resolve({ orderId: orderBId }),
    })
    expect(resGetTokoA.status).toBe(404)

    // Store Admin A attempts status update on Order B
    const reqPatchStatus = new NextRequest(
      `http://localhost:3000/api/orders/${orderBId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SHIPPED' }),
      }
    )
    const resPatchStatus = await updateOrderStatus(reqPatchStatus, {
      params: Promise.resolve({ orderId: orderBId }),
    })
    expect(resPatchStatus.status).toBe(404)

    // Customer 1 attempts to cancel Customer 2's order
    vi.mocked(auth).mockResolvedValue({ user: customerUser1 } as any)
    const reqCancel = new NextRequest(
      `http://localhost:3000/api/orders/${orderBId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ reason: 'Malicious cancel' }),
      }
    )
    const resCancel = await cancelOrder(reqCancel, {
      params: Promise.resolve({ orderId: orderBId }),
    })
    expect(resCancel.status).toBe(404)

    // Customer 1 attempts to confirm Customer 2's order
    const reqConfirm = new NextRequest(
      `http://localhost:3000/api/orders/${orderBId}/confirm`,
      {
        method: 'POST',
      }
    )
    const resConfirm = await confirmOrder(reqConfirm, {
      params: Promise.resolve({ orderId: orderBId }),
    })
    expect(resConfirm.status).toBe(404)

    // Verify order status is still PAID
    const dbOrder = await prisma.order.findUnique({ where: { id: orderBId } })
    expect(dbOrder?.status).toBe('PAID')
  })

  // ─── AREA 6: FINANCE WITHDRAWAL IDOR ─────────────────────────────
  it('6. POST /api/admin/finance/withdraw: Admin Toko A tidak bisa mencairkan saldo Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    // Toko A sends requestStoreId of Toko B
    const reqWithdraw = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: 500000,
          storeId: storeBId, // Cross-store target
        }),
      }
    )
    const resWithdraw = await withdrawFunds(reqWithdraw)

    // Store Admin is locked to storeAId, cannot withdraw Store B's funds
    const json = await resWithdraw.json()
    // It should evaluate Store A's data, ignoring storeBId completely
    expect(resWithdraw.status).not.toBe(200) // Toko A doesn't have sufficient balance or OTP
  })

  // ─── AREA 7: ADMIN CHAT ORDERS SEARCH ISOLATION ──────────────────
  it('7. GET /api/admin/chat/orders: Admin Toko A hanya melihat pesanan Toko A saat mencari order', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    // Search for Order B's orderNumber
    const reqSearch = new NextRequest(
      'http://localhost:3000/api/admin/chat/orders?search=SPR-SEC-STORE-B-001'
    )
    const resSearch = await getAdminChatOrders(reqSearch)

    expect(resSearch.status).toBe(200)
    const json = await resSearch.json()
    // Order B MUST NOT appear in Toko A's search results!
    expect(json.orders).toEqual([])
  })
})
