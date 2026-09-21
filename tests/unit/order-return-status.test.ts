import { describe, it, expect } from 'vitest'
import {
  isReturnOrder,
  getOrderStatusMeta,
  ORDER_STATUS_MAP as STATUS_MAP,
  type BaseOrderForReturn,
} from '@/lib/order-return-utils'

describe('Order Return Status & Tabs Filtering Suite', () => {
  const mockBaseOrder: BaseOrderForReturn = {
    status: 'COMPLETED',
  }

  it('should identify order as return order when status is RETURNED', () => {
    const returnedOrder: BaseOrderForReturn = {
      ...mockBaseOrder,
      status: 'RETURNED',
    }
    expect(isReturnOrder(returnedOrder)).toBe(true)
  })

  it('should identify order as return order when active returnRequest is present', () => {
    const orderWithReturn: BaseOrderForReturn = {
      ...mockBaseOrder,
      status: 'COMPLETED',
      returnRequests: [
        {
          id: 'ret-1',
          status: 'PENDING',
        },
      ],
    }
    expect(isReturnOrder(orderWithReturn)).toBe(true)
  })

  it('should return false for regular completed or in-progress orders without return requests', () => {
    expect(isReturnOrder(mockBaseOrder)).toBe(false)

    const inProgressOrder: BaseOrderForReturn = {
      ...mockBaseOrder,
      status: 'IN_PROGRESS',
    }
    expect(isReturnOrder(inProgressOrder)).toBe(false)
  })

  it('should display correct contextual return badge label and style per return status', () => {
    // 1. Pending verification
    const pendingReturnOrder: BaseOrderForReturn = {
      ...mockBaseOrder,
      returnRequests: [{ id: 'ret-1', status: 'PENDING' }],
    }
    const pendingMeta = getOrderStatusMeta(pendingReturnOrder)
    expect(pendingMeta.label).toBe('Menunggu Verifikasi Retur')
    expect(pendingMeta.textClass).toContain('text-orange-600')

    // 2. In Review
    const reviewReturnOrder: BaseOrderForReturn = {
      ...mockBaseOrder,
      returnRequests: [{ id: 'ret-2', status: 'IN_REVIEW' }],
    }
    const reviewMeta = getOrderStatusMeta(reviewReturnOrder)
    expect(reviewMeta.label).toBe('Retur Sedang Ditinjau')
    expect(reviewMeta.textClass).toContain('text-indigo-600')

    // 3. Approved
    const approvedReturnOrder: BaseOrderForReturn = {
      ...mockBaseOrder,
      returnRequests: [{ id: 'ret-3', status: 'APPROVED' }],
    }
    const approvedMeta = getOrderStatusMeta(approvedReturnOrder)
    expect(approvedMeta.label).toBe('Retur Disetujui')
    expect(approvedMeta.textClass).toContain('text-emerald-600')

    // 4. Rejected
    const rejectedReturnOrder: BaseOrderForReturn = {
      ...mockBaseOrder,
      returnRequests: [{ id: 'ret-4', status: 'REJECTED' }],
    }
    const rejectedMeta = getOrderStatusMeta(rejectedReturnOrder)
    expect(rejectedMeta.label).toBe('Pengajuan Retur Ditolak')
    expect(rejectedMeta.textClass).toContain('text-rose-600')

    // 5. Returned
    const finalReturnedOrder: BaseOrderForReturn = {
      ...mockBaseOrder,
      status: 'RETURNED',
    }
    const returnedMeta = getOrderStatusMeta(finalReturnedOrder)
    expect(returnedMeta.label).toBe('Dikembalikan (Retur)')
    expect(returnedMeta.textClass).toContain('text-purple-600')
  })

  it('should map standard non-return statuses properly', () => {
    expect(STATUS_MAP.PENDING_PAYMENT.label).toBe('Menunggu Pembayaran')
    expect(STATUS_MAP.PROCESSING.label).toBe('Sedang Dikemas')
    expect(STATUS_MAP.IN_PROGRESS.label).toBe('Sedang Dikirim')
    expect(STATUS_MAP.COMPLETED.label).toBe('Selesai')
    expect(STATUS_MAP.CANCELLED.label).toBe('Dibatalkan')
    expect(STATUS_MAP.RETURNED.label).toBe('Dikembalikan')
  })
})
