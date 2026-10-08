import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  getOrderContextualTimestamp,
  buildOrderAuditTimeline,
  sortOrdersByLatestProcess,
  formatOrderShortDate,
  formatOrderDateTime,
  formatOrderFullDateTime,
} from '@/lib/order-date-utils'

describe('Dynamic Order Date & Process-Based Timeline Audit Suite', () => {
  const orderDateUtilsPath = path.resolve(
    process.cwd(),
    'src/lib/order-date-utils.ts'
  )
  const ordersClientPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/orders/orders-client.tsx'
  )
  const mobileOrdersViewPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-orders-view.tsx'
  )
  const orderDetailPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/orders/page.tsx'
  )
  const orderDetailClientPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
  )

  it('1. memverifikasi getOrderContextualTimestamp menghasilkan label dan waktu dinamis sesuai tahapan proses', () => {
    // 1a. Belum Bayar (PENDING_PAYMENT)
    const pendingOrder = {
      status: 'PENDING_PAYMENT',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    }
    const pendingMeta = getOrderContextualTimestamp(pendingOrder)
    expect(pendingMeta.label).toBe('Dipesan')
    expect(pendingMeta.fullLabel).toBe('Waktu Dipesan')
    expect(pendingMeta.rawDate).toBe(pendingOrder.createdAt)

    // 1b. Diproses / Sudah Dibayar (PROCESSING / PAID)
    const paidOrder = {
      status: 'PROCESSING',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:15:00.000Z',
      payment: {
        status: 'PAID',
        verifiedAt: '2026-10-01T08:15:00.000Z',
      },
    }
    const paidMeta = getOrderContextualTimestamp(paidOrder)
    expect(paidMeta.label).toBe('Dibayar')
    expect(paidMeta.fullLabel).toBe('Waktu Pembayaran')
    expect(paidMeta.rawDate).toBe('2026-10-01T08:15:00.000Z')

    // 1c. Sedang Dikirim Kurir (SHIPPED / trackingNumber)
    const shippedOrder = {
      status: 'SHIPPED',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-02T10:30:00.000Z',
      trackingNumber: 'SPXID12345678',
    }
    const shippedMeta = getOrderContextualTimestamp(shippedOrder)
    expect(shippedMeta.label).toBe('Dikirim')
    expect(shippedMeta.fullLabel).toBe('Waktu Pengiriman')
    expect(shippedMeta.rawDate).toBe('2026-10-02T10:30:00.000Z')

    // 1d. Pesanan Selesai / Diterima Customer (COMPLETED / customerConfirmedAt)
    const completedOrder = {
      status: 'COMPLETED',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-03T15:45:00.000Z',
      customerConfirmedAt: '2026-10-03T15:45:00.000Z',
      completedAt: '2026-10-03T15:45:00.000Z',
    }
    const completedMeta = getOrderContextualTimestamp(completedOrder)
    expect(completedMeta.label).toBe('Diterima')
    expect(completedMeta.fullLabel).toBe('Waktu Diterima')
    expect(completedMeta.rawDate).toBe('2026-10-03T15:45:00.000Z')

    // 1e. Pesanan Dibatalkan (CANCELLED)
    const cancelledOrder = {
      status: 'CANCELLED',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T09:00:00.000Z',
    }
    const cancelledMeta = getOrderContextualTimestamp(cancelledOrder)
    expect(cancelledMeta.label).toBe('Dibatalkan')
    expect(cancelledMeta.fullLabel).toBe('Waktu Dibatalkan')
    expect(cancelledMeta.rawDate).toBe('2026-10-01T09:00:00.000Z')

    // 1f. Pesanan Diajukan Retur (RETURNED / returnRequests)
    const returnOrder = {
      status: 'RETURNED',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-04T12:00:00.000Z',
      returnRequests: [
        {
          createdAt: '2026-10-04T11:00:00.000Z',
          status: 'PENDING',
        },
      ],
    }
    const returnMeta = getOrderContextualTimestamp(returnOrder)
    expect(returnMeta.label).toBe('Diajukan Retur')
    expect(returnMeta.rawDate).toBe('2026-10-04T11:00:00.000Z')
  })

  it('2. memverifikasi buildOrderAuditTimeline menyusun urutan tahapan audit transaksi dan status garansi', () => {
    const fullOrder = {
      status: 'COMPLETED',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-03T16:00:00.000Z',
      customerConfirmedAt: '2026-10-03T16:00:00.000Z',
      warrantyExpiryDate: '2026-11-02T16:00:00.000Z',
      courierCode: 'JNE',
      trackingNumber: 'JNE987654321',
      payment: {
        status: 'PAID',
        verifiedAt: '2026-10-01T08:20:00.000Z',
      },
    }

    const timeline = buildOrderAuditTimeline(fullOrder)
    expect(timeline.length).toBe(5) // created, paid, shipped, completed, warranty
    expect(timeline[0].key).toBe('created')
    expect(timeline[0].isPassed).toBe(true)

    expect(timeline[1].key).toBe('paid')
    expect(timeline[1].isPassed).toBe(true)

    expect(timeline[2].key).toBe('shipped')
    expect(timeline[2].isPassed).toBe(true)
    expect(timeline[2].description).toContain('JNE')
    expect(timeline[2].description).toContain('JNE987654321')

    expect(timeline[3].key).toBe('completed')
    expect(timeline[3].isPassed).toBe(true)

    expect(timeline[4].key).toBe('warranty')
    expect(timeline[4].title).toBe('Garansi 30 Hari Aktif')
    expect(timeline[4].dateFormatted).toContain('2 Nov 2026')
  })

  it('3. memvalidasi integrasi helper dinamis di orders-client.tsx dan mobile-orders-view.tsx', () => {
    const desktopClient = fs.readFileSync(ordersClientPath, 'utf-8')
    const mobileView = fs.readFileSync(mobileOrdersViewPath, 'utf-8')

    // Desktop
    expect(desktopClient).toContain('getOrderContextualTimestamp')
    expect(desktopClient).toContain('sortOrdersByLatestProcess')
    expect(desktopClient).toContain(
      'const contextualTime = getOrderContextualTimestamp(order)'
    )
    expect(desktopClient).toContain('{contextualTime.label}:')
    expect(desktopClient).toContain('{contextualTime.shortDate}')

    // Mobile
    expect(mobileView).toContain('getOrderContextualTimestamp')
    expect(mobileView).toContain('sortOrdersByLatestProcess')
    expect(mobileView).toContain(
      'const contextualTime = getOrderContextualTimestamp(order)'
    )
    expect(mobileView).toContain('{contextualTime.label}:')
    expect(mobileView).toContain('{contextualTime.shortDate}')
  })

  it('4. memvalidasi server page.tsx menyertakan data customerConfirmedAt, completedAt, dan payment.verifiedAt', () => {
    const pageContent = fs.readFileSync(orderDetailPagePath, 'utf-8')
    expect(pageContent).toContain('verifiedAt: true')
    expect(pageContent).toContain(
      'customerConfirmedAt: order.customerConfirmedAt?.toISOString() ?? null'
    )
    expect(pageContent).toContain(
      'completedAt: order.completedAt?.toISOString() ?? null'
    )
    expect(pageContent).toContain(
      'verifiedAt: order.payment.verifiedAt?.toISOString() ?? null'
    )
  })

  it('5. memvalidasi halaman rincian pesanan order-detail-client.tsx merender header dinamis dan kartu Riwayat Waktu Transaksi', () => {
    const detailClient = fs.readFileSync(orderDetailClientPath, 'utf-8')

    // Import utilitas
    expect(detailClient).toContain('getOrderContextualTimestamp')
    expect(detailClient).toContain('buildOrderAuditTimeline')

    // Memoization
    expect(detailClient).toContain('const contextualTime = useMemo')
    expect(detailClient).toContain('const auditTimeline = useMemo')

    // Header mobile & desktop
    expect(detailClient).toContain('{contextualTime.label}:')
    expect(detailClient).toContain('{contextualTime.fullDateTime}')

    // Mobile audit trail section
    expect(detailClient).toContain(
      'Bagian Riwayat Waktu Transaksi (Mobile Audit Trail)'
    )
    expect(detailClient).toContain('auditTimeline.map')

    // Desktop audit trail bento card
    expect(detailClient).toContain(
      'Riwayat Waktu Transaksi (Audit Trail Bento)'
    )
    expect(detailClient).toContain('Riwayat Waktu Transaksi')
  })

  it('6. memverifikasi sortOrdersByLatestProcess mengurutkan pesanan dari proses terbaru secara descending', () => {
    // Skenario: Pesanan A dibuat 1 Okt, selesai 7 Okt (hari ini)
    // Skenario: Pesanan B dibuat 4 Okt, selesai 5 Okt
    // Skenario: Pesanan C dibuat 6 Okt, baru dibayar 6 Okt
    const orderA = {
      id: 'A',
      status: 'COMPLETED',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-07T14:00:00.000Z',
      customerConfirmedAt: '2026-10-07T14:00:00.000Z',
    }
    const orderB = {
      id: 'B',
      status: 'COMPLETED',
      createdAt: '2026-10-04T08:00:00.000Z',
      updatedAt: '2026-10-05T10:00:00.000Z',
      customerConfirmedAt: '2026-10-05T10:00:00.000Z',
    }
    const orderC = {
      id: 'C',
      status: 'PROCESSING',
      createdAt: '2026-10-06T08:00:00.000Z',
      updatedAt: '2026-10-06T08:30:00.000Z',
      payment: { status: 'PAID', verifiedAt: '2026-10-06T08:30:00.000Z' },
    }

    // Input acak: B, A, C
    const sorted = sortOrdersByLatestProcess([orderB, orderA, orderC])

    // OrderA (selesai 7 Okt) harus nomor 1
    // OrderC (dibayar 6 Okt) harus nomor 2
    // OrderB (selesai 5 Okt) harus nomor 3
    expect(sorted.map((o) => o.id)).toEqual(['A', 'C', 'B'])
  })

  it('7. memvalidasi pengurutan dari yang paling terbaru diterapkan pada server page.tsx, orders-client.tsx, mobile-orders-view.tsx, dan items relation', () => {
    const pageContent = fs.readFileSync(orderDetailPagePath, 'utf-8')
    const desktopClient = fs.readFileSync(ordersClientPath, 'utf-8')
    const mobileView = fs.readFileSync(mobileOrdersViewPath, 'utf-8')

    // Server page: items diurutkan createdAt desc dan orders diurutkan updatedAt desc, createdAt desc
    expect(pageContent).toContain("orderBy: { createdAt: 'desc' }")
    expect(pageContent).toContain(
      "orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]"
    )
    expect(pageContent).toContain('sortOrdersByLatestProcess(ordersData)')

    // Desktop client: filteredOrders diurutkan sortOrdersByLatestProcess
    expect(desktopClient).toContain('sortOrdersByLatestProcess')
    expect(desktopClient).toContain('return sortOrdersByLatestProcess(list)')

    // Mobile view: filteredOrders diurutkan sortOrdersByLatestProcess
    expect(mobileView).toContain('sortOrdersByLatestProcess')
    expect(mobileView).toContain('return sortOrdersByLatestProcess(list)')
  })
})
