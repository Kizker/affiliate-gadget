import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  doesReturnMatchOrderItem,
  extractReturnedQuantityFromDescription,
  findReturnForOrderItem,
  isOrderItemReturnEligible,
} from '@/lib/order-return-utils'

describe('Order Units Display & Per-Item Return Flow Suite', () => {
  const adminOrdersPagePath = path.resolve(
    'src/app/dashboard/admin/orders/page.tsx'
  )
  const returnsApiPath = path.resolve('src/app/api/returns/route.ts')
  const returnsIdApiPath = path.resolve('src/app/api/returns/[id]/route.ts')
  const customerOrdersClientPath = path.resolve(
    'src/app/dashboard/customer/orders/orders-client.tsx'
  )
  const returnModalPath = path.resolve(
    'src/components/customer/return-modal.tsx'
  )
  const sidebarPath = path.resolve('src/components/dashboard/sidebar.tsx')
  const middlewarePath = path.resolve('src/middleware.ts')

  it('1. Tabel pesanan admin menghitung dan menampilkan total unit yang dipesan (bukan hardcode 1 Unit)', () => {
    const content = fs.readFileSync(adminOrdersPagePath, 'utf-8')
    expect(content).toContain('totalUnits =')
    expect(content).toContain('{totalUnits} Unit')
    expect(content).toContain('extraItemsCount > 0')
  })

  it('2. WhatsApp Gateway di sidebar dan middleware dikunci eksklusif hanya untuk Superadmin', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8')
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8')

    expect(sidebarContent).toContain("href: '/dashboard/admin/whatsapp'")
    expect(middlewareContent).toContain(
      "'/dashboard/admin/whatsapp': ['SUPER_ADMIN']"
    )
  })

  it('3. doesReturnMatchOrderItem mencocokkan retur secara presisi ke produk yang diajukan (bukan seluruh pesanan)', () => {
    const itemA = {
      id: 'item_flip_5',
      product: { name: 'Samsung Galaxy Flip 5' },
      variantName: '512GB - Titanium',
      quantity: 1,
      price: 10999999,
    }
    const itemB = {
      id: 'item_fold_8',
      product: { name: 'Samsung Galaxy Z Fold 8' },
      variantName: 'Black Titanium',
      quantity: 1,
      price: 34999999,
    }

    const returnRequestForA = {
      description:
        '[Unit yang Diretur: Samsung Galaxy Flip 5 - Varian: 512GB - Titanium - 1 unit @ Rp 10.999.999 | ItemID:item_flip_5 | Qty:1]\n\nCacat layar retak',
    }

    expect(doesReturnMatchOrderItem(returnRequestForA, itemA, 2)).toBe(true)
    expect(doesReturnMatchOrderItem(returnRequestForA, itemB, 2)).toBe(false)
  })

  it('4. isOrderItemReturnEligible mengizinkan item lain diajukan retur meski item pertama sedang dalam proses retur', () => {
    const itemA = {
      id: 'item_flip_5',
      product: { name: 'Samsung Galaxy Flip 5' },
      variantName: '512GB - Titanium',
    }
    const itemB = {
      id: 'item_fold_8',
      product: { name: 'Samsung Galaxy Z Fold 8' },
      variantName: 'Black Titanium',
    }

    const order = {
      status: 'COMPLETED',
      returnRequests: [
        {
          id: 'ret_1',
          status: 'PENDING',
          description:
            '[Unit yang Diretur: Samsung Galaxy Flip 5 - Varian: 512GB - Titanium | ItemID:item_flip_5 | Qty:1]',
        },
      ],
    }

    // Item A sudah ada retur aktif -> tidak eligible
    expect(isOrderItemReturnEligible(order, itemA, 2)).toBe(false)
    // Item B belum ada retur -> TETAP ELIGIBLE diajukan retur mandiri!
    expect(isOrderItemReturnEligible(order, itemB, 2)).toBe(true)
  })

  it('5. extractReturnedQuantityFromDescription mengekstrak jumlah unit yang diretur dari deskripsi', () => {
    const desc =
      '[Unit yang Diretur: iPhone 15 - Varian: 256GB - 2 unit @ Rp 15.000.000 | ItemID:item_123 | Qty:2]'
    expect(extractReturnedQuantityFromDescription(desc, 1)).toBe(2)
  })

  it('6. ReturnModal menyediakan pemilih produk dan stepper kuantitas unit yang ingin diretur', () => {
    const content = fs.readFileSync(returnModalPath, 'utf-8')
    expect(content).toContain('selectedItemId')
    expect(content).toContain('returnQuantity')
    expect(content).toContain('safeReturnQty')
    expect(content).toContain('Jumlah Unit Diretur:')
    expect(content).toContain('ItemID:')
  })

  it('7. PUT /api/returns/[id] hanya memotong stok unit produk yang diretur saat dieksekusi Superadmin', () => {
    const content = fs.readFileSync(returnsIdApiPath, 'utf-8')
    expect(content).toContain('doesReturnMatchOrderItem')
    expect(content).toContain('extractReturnedQuantityFromDescription')
    expect(content).toContain('targetOrderItems')
  })
})
