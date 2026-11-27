import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('After Sales Chat Without Return Claim Suite', () => {
  it('does NOT create return_reference bubble in store-room route if there is no active return', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/customer/chat/store-room/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    // Bubble retur hanya boleh terbentuk jika ada klaim retur nyata
    expect(content).toContain(
      'const hasActiveReturnClaim = Boolean(latestReturn?.id || returnId)'
    )
    expect(content).toContain('const isReturnInquiry = hasActiveReturnClaim')
    expect(content).toContain('const refMessageType = isReturnInquiry')
    expect(content).toContain("'return_reference'")
    expect(content).toContain("'order_reference'")
    expect(content).toContain(
      'if (isReturnInquiry && orderReferencePayload && room)'
    )
  })

  it('filters out completed/rejected returnId when customer clicks Chat Admin After Sales from orders list', () => {
    const ordersClientPath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/orders/orders-client.tsx'
    )
    const content = fs.readFileSync(ordersClientPath, 'utf-8')

    expect(content).toContain("latestReturn.status !== 'COMPLETED'")
    expect(content).toContain("latestReturn.status !== 'REJECTED'")
  })

  it('filters out completed/rejected returnId in order detail and mobile views', () => {
    const detailPath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
    )
    const content = fs.readFileSync(detailPath, 'utf-8')

    expect(content).toContain("latestReturnRequest.status !== 'COMPLETED'")
    expect(content).toContain("latestReturnRequest.status !== 'REJECTED'")
  })
})
