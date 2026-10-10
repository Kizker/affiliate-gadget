import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { checkoutSchema } from '@/lib/validations/checkout'

describe('Shopee Multi-Store Checkout Architecture & Cart Floating Bar', () => {
  const cartPagePath = path.resolve(process.cwd(), 'src/app/cart/page.tsx')
  const checkoutPagePath = path.resolve(
    process.cwd(),
    'src/app/checkout/page.tsx'
  )
  const mobileCheckoutPath = path.resolve(
    process.cwd(),
    'src/components/checkout/mobile-shopee-checkout-view.tsx'
  )
  const checkoutApiPath = path.resolve(
    process.cwd(),
    'src/app/api/checkout/route.ts'
  )

  it('1. Cart page must NOT render MobileBottomNav and floating checkout bar is bottom-0', () => {
    const cartContent = fs.readFileSync(cartPagePath, 'utf-8')
    expect(cartContent).not.toContain('<MobileBottomNav')
    expect(cartContent).not.toContain('MobileBottomNav />')
    expect(cartContent).toContain('bottom-0')
    expect(cartContent).toContain('fixed inset-x-0 bottom-0 z-40')
  })

  it('2. Checkout validation schema supports storePackages for multi-store orders', () => {
    const validMultiStoreData = {
      addressId: 'addr-123',
      paymentMethod: 'MIDTRANS' as const,
      courierCode: 'JNE',
      courierService: 'REG',
      shippingCost: 35000,
      insuranceFee: 15000,
      notes: 'Global notes',
      items: [
        {
          id: 'cart-1',
          type: 'PRODUCT' as const,
          productId: 'prod-1',
          name: 'iPhone 15 Pro',
          price: 18000000,
          quantity: 1,
        },
        {
          id: 'cart-2',
          type: 'PRODUCT' as const,
          productId: 'prod-2',
          name: 'Samsung S24 Ultra',
          price: 19000000,
          quantity: 1,
        },
      ],
      storePackages: [
        {
          storeId: 'store-surabaya',
          storeName: 'Mitra PT Surabaya',
          courierCode: 'JNE',
          courierService: 'YES',
          shippingCost: 20000,
          insuranceFee: 8000,
          notes: 'Tolong packing bubble wrap tebal',
          items: [
            {
              id: 'cart-1',
              type: 'PRODUCT' as const,
              productId: 'prod-1',
              name: 'iPhone 15 Pro',
              price: 18000000,
              quantity: 1,
            },
          ],
        },
        {
          storeId: 'store-jakarta',
          storeName: 'Mitra PT Jakarta Pusat',
          courierCode: 'GOJEK',
          courierService: 'INSTANT',
          shippingCost: 15000,
          insuranceFee: 7000,
          notes: 'Kirim sebelum jam 3 sore',
          items: [
            {
              id: 'cart-2',
              type: 'PRODUCT' as const,
              productId: 'prod-2',
              name: 'Samsung S24 Ultra',
              price: 19000000,
              quantity: 1,
            },
          ],
        },
      ],
    }

    const parseResult = checkoutSchema.safeParse(validMultiStoreData)
    expect(parseResult.success).toBe(true)
    if (parseResult.success) {
      expect(parseResult.data.storePackages).toHaveLength(2)
      expect(parseResult.data.storePackages?.[0].storeId).toBe('store-surabaya')
      expect(parseResult.data.storePackages?.[0].notes).toBe(
        'Tolong packing bubble wrap tebal'
      )
      expect(parseResult.data.storePackages?.[1].courierCode).toBe('GOJEK')
    }
  })

  it('3. Checkout API endpoint creates separate orders per store package for Multi-PT accounting', () => {
    const apiContent = fs.readFileSync(checkoutApiPath, 'utf-8')
    // Supports storePackages parsing
    expect(apiContent).toContain('storePackages')
    // Loops over packages and creates distinct orders per store
    expect(apiContent).toContain(
      'for (const pkg of parseResult.data.storePackages)'
    )
    expect(apiContent).toContain('storeId: pkg.storeId')
    expect(apiContent).toContain('customShippingCost: pkg.shippingCost')
    expect(apiContent).toContain('customInsuranceFee: pkg.insuranceFee')
    expect(apiContent).toContain('notes: pkg.notes')
    expect(apiContent).toContain('createdOrders.push(order)')
  })

  it('4. Mobile and Desktop checkout view groups products by store with independent courier and notes', () => {
    const desktopContent = fs.readFileSync(checkoutPagePath, 'utf-8')
    const mobileContent = fs.readFileSync(mobileCheckoutPath, 'utf-8')

    // Desktop view grouping and controls
    expect(desktopContent).toContain('computedStorePackages')
    expect(desktopContent).toContain('handleUpdateStoreCourier')
    expect(desktopContent).toContain('handleUpdateStoreNotes')
    expect(desktopContent).toContain('Pesan untuk Penjual')

    // Mobile view grouping and controls
    expect(mobileContent).toContain('storePackages')
    expect(mobileContent).toContain('onUpdateStoreCourier')
    expect(mobileContent).toContain('onUpdateStoreNotes')
    expect(mobileContent).toContain('Pesan untuk Penjual')
    expect(mobileContent).toContain('Proteksi Kerusakan & Asuransi Kurir')
  })

  it('5. Voucher applies strictly to one store package only in multi-store checkout', () => {
    const apiContent = fs.readFileSync(checkoutApiPath, 'utf-8')
    const desktopContent = fs.readFileSync(checkoutPagePath, 'utf-8')
    const mobileContent = fs.readFileSync(mobileCheckoutPath, 'utf-8')

    // Schema accepts voucherStoreId and package voucherCode
    const multiStoreVoucherData = {
      addressId: 'addr-123',
      paymentMethod: 'MIDTRANS' as const,
      courierCode: 'JNE',
      courierService: 'REG',
      voucherCode: 'HEMAT20',
      voucherStoreId: 'store-surabaya',
      items: [
        {
          id: 'cart-1',
          type: 'PRODUCT' as const,
          productId: 'prod-1',
          price: 18000000,
          quantity: 1,
        },
      ],
      storePackages: [
        {
          storeId: 'store-surabaya',
          storeName: 'Mitra PT Surabaya',
          courierCode: 'JNE',
          courierService: 'REG',
          shippingCost: 20000,
          insuranceFee: 8000,
          voucherCode: 'HEMAT20',
          items: [
            {
              id: 'cart-1',
              type: 'PRODUCT' as const,
              productId: 'prod-1',
              price: 18000000,
              quantity: 1,
            },
          ],
        },
        {
          storeId: 'store-jakarta',
          storeName: 'Mitra PT Jakarta Pusat',
          courierCode: 'GOJEK',
          courierService: 'INSTANT',
          shippingCost: 15000,
          insuranceFee: 7000,
          voucherCode: null,
          items: [
            {
              id: 'cart-2',
              type: 'PRODUCT' as const,
              productId: 'prod-2',
              price: 19000000,
              quantity: 1,
            },
          ],
        },
      ],
    }

    const parseResult = checkoutSchema.safeParse(multiStoreVoucherData)
    expect(parseResult.success).toBe(true)
    if (parseResult.success) {
      expect(parseResult.data.voucherStoreId).toBe('store-surabaya')
      expect(parseResult.data.storePackages?.[0].voucherCode).toBe('HEMAT20')
      expect(parseResult.data.storePackages?.[1].voucherCode).toBeNull()
    }

    // Backend ensures only 1 store order gets the voucher
    expect(apiContent).toContain('let voucherAppliedToPackage = false')
    expect(apiContent).toContain('!voucherAppliedToPackage')
    expect(apiContent).toContain('voucherStoreId')

    // Desktop view scopes voucher to target store package and uses StoreVoucherSelector
    expect(desktopContent).toContain('activeVoucherStorePackage')
    expect(desktopContent).toContain('targetStoreId')
    expect(desktopContent).toContain('targetStoreName')
    expect(desktopContent).toContain('StoreVoucherSelector')

    // Mobile view accepts target store selector and displays target store badge
    expect(mobileContent).toContain('selectedVoucherStoreId')
    expect(mobileContent).toContain('targetStoreName')
    expect(mobileContent).toContain('StoreVoucherSelector')
  })

  it('6. Supports adding multiple vouchers freely across stores with individual deletion and add-more options', () => {
    const desktopContent = fs.readFileSync(checkoutPagePath, 'utf-8')
    const mobileContent = fs.readFileSync(mobileCheckoutPath, 'utf-8')
    const apiContent = fs.readFileSync(checkoutApiPath, 'utf-8')

    // Schema accepts array of voucherCodes and voucherAssignments
    const multiVoucherData = {
      addressId: 'addr-123',
      paymentMethod: 'MIDTRANS' as const,
      courierCode: 'JNE',
      courierService: 'REG',
      voucherCodes: ['SUPERGADGET', 'DISKON300K'],
      voucherAssignments: [
        { code: 'SUPERGADGET', storeId: 'store-surabaya' },
        { code: 'DISKON300K', storeId: 'store-jakarta' },
      ],
      items: [
        {
          id: 'cart-1',
          type: 'PRODUCT' as const,
          productId: 'prod-1',
          price: 18000000,
          quantity: 1,
        },
      ],
      storePackages: [
        {
          storeId: 'store-surabaya',
          storeName: 'Mitra PT Surabaya',
          courierCode: 'JNE',
          courierService: 'REG',
          shippingCost: 20000,
          insuranceFee: 8000,
          voucherCodes: ['SUPERGADGET'],
          items: [
            {
              id: 'cart-1',
              type: 'PRODUCT' as const,
              productId: 'prod-1',
              price: 18000000,
              quantity: 1,
            },
          ],
        },
      ],
    }

    const parseResult = checkoutSchema.safeParse(multiVoucherData)
    expect(parseResult.success).toBe(true)
    if (parseResult.success) {
      expect(parseResult.data.voucherCodes).toEqual([
        'SUPERGADGET',
        'DISKON300K',
      ])
      expect(parseResult.data.voucherAssignments).toHaveLength(2)
      expect(parseResult.data.storePackages?.[0].voucherCodes).toEqual([
        'SUPERGADGET',
      ])
    }

    // Backend validates and loops over multiple vouchers
    expect(apiContent).toContain('candidateVoucherCodes')
    expect(apiContent).toContain('activeVoucherCodes')

    // Frontend supports appliedVouchers list and "+ Tambah Voucher Lain"
    expect(desktopContent).toContain('appliedVouchers')
    expect(desktopContent).toContain('Tambah Voucher Lain')
    expect(mobileContent).toContain('allAppliedVouchers')
    expect(mobileContent).toContain('Tambah Voucher Lain')
  })
})
