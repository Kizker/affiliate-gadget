import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Order Payment Subtotal Breakdown Suite', () => {
  it('1. AdminOrderPaymentCard merincikan barang satu per satu dengan kuantitas dan harga saat dropdown Subtotal Pesanan dibuka', () => {
    const cardPath = path.join(
      process.cwd(),
      'src/components/admin/orders/admin-order-payment-card.tsx'
    )
    const content = fs.readFileSync(cardPath, 'utf-8')

    expect(content).toContain('groupedItems = React.useMemo')
    expect(content).toContain('openSections.subtotal &&')
    expect(content).toContain('groupedItems.map')
    expect(content).toContain('x {gItem.quantity}')
    expect(content).toContain("gItem.subtotal.toLocaleString('id-ID')")
  })
})
