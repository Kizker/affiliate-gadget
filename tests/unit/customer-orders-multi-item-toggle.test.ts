import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Customer Orders Multi-Item "Lihat Semua" Toggle Suite', () => {
  const rootDir = process.cwd()
  const mobileViewPath = path.join(
    rootDir,
    'src',
    'components',
    'customer',
    'mobile-orders-view.tsx'
  )
  const desktopClientPath = path.join(
    rootDir,
    'src',
    'app',
    'dashboard',
    'customer',
    'orders',
    'orders-client.tsx'
  )

  const mobileContent = fs.readFileSync(mobileViewPath, 'utf-8')
  const desktopContent = fs.readFileSync(desktopClientPath, 'utf-8')

  it('1. verifies MobileOrdersView implements interactive "Lihat Semua" button and toggle state for multi-item orders', () => {
    // State and toggle handler
    expect(mobileContent).toContain('expandedOrders, setExpandedOrders')
    expect(mobileContent).toContain('toggleExpandOrder')

    // Button label and icon
    expect(mobileContent).toContain('Lihat Semua')
    expect(mobileContent).toContain('Sembunyikan')
    expect(mobileContent).toContain('ChevronDown')

    // Expanded products container renders remaining items with images and details
    expect(mobileContent).toContain(
      'order.items.length > 1 && expandedOrders[order.id]'
    )
    expect(mobileContent).toContain('order.items.slice(1).map')
    expect(mobileContent).toContain('extraItem.product?.images')
    expect(mobileContent).toContain('x{extraItem.quantity || 1}')
  })

  it('2. verifies desktop OrdersClient implements interactive centered "Lihat Semua" button and full-row item display for multi-item orders', () => {
    // State and toggle handler
    expect(desktopContent).toContain('expandedOrders, setExpandedOrders')
    expect(desktopContent).toContain('toggleExpandOrder')

    // Centered button label and icon
    expect(desktopContent).toContain('Lihat Semua')
    expect(desktopContent).toContain('Sembunyikan')
    expect(desktopContent).toContain('ChevronDown')
    expect(desktopContent).toContain(
      'w-full cursor-pointer items-center justify-center'
    )

    // Expanded products container renders full-row items with images, details, and prices matching standard item display
    expect(desktopContent).toContain(
      'order.items.length > 1 && expandedOrders[order.id]'
    )
    expect(desktopContent).toContain('.slice(1)')
    expect(desktopContent).toContain('.map((extraItem')
    expect(desktopContent).toContain('extraItem.product?.images')
    expect(desktopContent).toMatch(
      /formatPrice\(\s*extraItem\.price\s*\*\s*\(extraItem\.quantity\s*\|\|\s*1\)\s*\)/
    )
  })
})
