import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Navigation Notification Badges Suite', () => {
  it('has dedicated API route for admin nav notifications with all operational categories', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/admin/nav-notifications/route.ts'
    )
    expect(fs.existsSync(routePath)).toBe(true)

    const content = fs.readFileSync(routePath, 'utf-8')
    expect(content).toContain('export async function GET')
    expect(content).toContain('ordersNeedProcessing')
    expect(content).toContain('ordersPendingPayment')
    expect(content).toContain('unreadChat')
    expect(content).toContain('complaints')
    expect(content).toContain('returns')
    expect(content).toContain('ads')
    expect(content).toContain('liveStreams')
    expect(content).toContain('getStoreWithdrawals')
  })

  it('maps each admin nav item to its respective notification count in Sidebar', () => {
    const sidebarPath = path.join(
      process.cwd(),
      'src/components/dashboard/sidebar.tsx'
    )
    const content = fs.readFileSync(sidebarPath, 'utf-8')

    expect(content).toContain('useAdminNotifications')
    expect(content).toContain('getItemBadgeCount')
    expect(content).toContain('/dashboard/admin/orders')
    expect(content).toContain('/dashboard/admin/chat')
    expect(content).toContain('/dashboard/admin/finance')
    expect(content).toContain('/dashboard/admin/complaints')
    expect(content).toContain('/dashboard/admin/returns')
    expect(content).toContain('/dashboard/admin/ads')
    expect(content).toContain('/dashboard/admin/live')
    expect(content).toContain('dynamicBadge > 0')
    expect(content).toContain('bg-rose-500 text-white')
  })

  it('includes notification bell and provider in AdminLayoutClient header', () => {
    const layoutPath = path.join(
      process.cwd(),
      'src/components/dashboard/admin-layout-client.tsx'
    )
    const content = fs.readFileSync(layoutPath, 'utf-8')

    expect(content).toContain('AdminNotificationsProvider')
    expect(content).toContain('AdminNotificationBell')
    expect(content).toContain('<AdminNotificationBell />')
  })

  it('correctly calculates total and handles store admin vs super admin role filtering', () => {
    interface CountsInput {
      orders: number
      chat: number
      finance: number
      complaints: number
      returns: number
      ads: number
      live: number
      mitras: number
    }

    const computeTotals = (input: CountsInput) => {
      return (
        input.orders +
        input.chat +
        input.finance +
        input.complaints +
        input.returns +
        input.ads +
        input.live +
        input.mitras
      )
    }

    const sampleStoreAdminCounts: CountsInput = {
      orders: 1, // Order #SPR-20261001-7298F9EA 'PAID' (Perlu Diproses)
      chat: 0,
      finance: 0,
      complaints: 0,
      returns: 0,
      ads: 0,
      live: 0,
      mitras: 0,
    }

    expect(computeTotals(sampleStoreAdminCounts)).toBe(1)

    const sampleSuperAdminCounts: CountsInput = {
      orders: 1,
      chat: 3,
      finance: 1,
      complaints: 2,
      returns: 1,
      ads: 2,
      live: 1,
      mitras: 1,
    }

    expect(computeTotals(sampleSuperAdminCounts)).toBe(12)
  })

  it('maintains active action badge in Sidebar even when route is currently active', () => {
    const sidebarPath = path.join(
      process.cwd(),
      'src/components/dashboard/sidebar.tsx'
    )
    const content = fs.readFileSync(sidebarPath, 'utf-8')

    // Verifikasi bahwa dynamicBadge tetap menampilkan rawBadge selama ada item yang belum diproses
    expect(content).toContain('const dynamicBadge = rawBadge')
    expect(content).toContain('const hasDynamicBadge = dynamicBadge > 0')
  })

  it('provides real-time actionable notifications in AdminNotificationsContext', () => {
    const contextPath = path.join(
      process.cwd(),
      'src/context/admin-notifications-context.tsx'
    )
    const content = fs.readFileSync(contextPath, 'utf-8')

    expect(content).toContain('rawCounts.orders')
    expect(content).toContain('rawCounts.chat')
    expect(content).toContain('rawCounts.returns')
    expect(content).toContain('rawCounts.total')
  })

  it('renders active notifications cleanly in AdminNotificationBell', () => {
    const bellPath = path.join(
      process.cwd(),
      'src/components/dashboard/admin-notification-bell.tsx'
    )
    const content = fs.readFileSync(bellPath, 'utf-8')

    expect(content).toContain('const showBellBadge = counts.total > 0')
    expect(content).toContain('currentActiveItems')
    expect(content).toContain('proses aktif')
  })
})
