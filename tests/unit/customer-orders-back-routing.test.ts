import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Customer Orders Back Routing & Status Tab Preservation Suite', () => {
  const ordersClientPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/orders/orders-client.tsx'
  )
  const mobileOrdersViewPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-orders-view.tsx'
  )
  const orderDetailClientPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
  )
  const orderDetailPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/orders/[orderId]/page.tsx'
  )

  it('memvalidasi orders-client.tsx memperbarui URL saat tab status dipilih dan meneruskan context ke detail', () => {
    const content = fs.readFileSync(ordersClientPath, 'utf-8')

    // 1. Sinkronisasi status param ke URL
    expect(content).toContain('const handleStatusChange = (status: string) =>')
    expect(content).toContain("status === 'ALL'")
    expect(content).toContain("'/dashboard/customer/orders'")
    expect(content).toContain('`/dashboard/customer/orders?status=${status}`')
    expect(content).toContain('router.replace(newUrl, { scroll: false })')

    // 2. Filter tabs desktop memicu handleStatusChange
    expect(content).toContain('onClick={() => handleStatusChange(opt.value)}')

    // 3. MobileOrdersView menerima activeTab dan onTabChange
    expect(content).toContain('activeTab={selectedStatus}')
    expect(content).toContain('onTabChange={handleStatusChange}')

    // 4. Link rincian pesanan desktop menyertakan ?fromStatus=${selectedStatus}
    expect(content).toContain(
      '`/dashboard/customer/orders/${order.id}?fromStatus=${selectedStatus}`'
    )
  })

  it('memvalidasi mobile-orders-view.tsx mendukung controlled activeTab, onTabChange, dan link membawa ?fromStatus', () => {
    const content = fs.readFileSync(mobileOrdersViewPath, 'utf-8')

    // 1. Props interface
    expect(content).toContain('activeTab?: string')
    expect(content).toContain('onTabChange?: (tab: string) => void')

    // 2. Tab click memicu handleTabClick
    expect(content).toContain('onClick={() => handleTabClick(tab.key)}')
    expect(content).toContain('onTabChange(tabKey)')

    // 3. Link rincian pesanan mobile membawa status aktif
    expect(content).toContain('getOrderDetailHref')
    expect(content).toContain(
      '`/dashboard/customer/orders/${orderId}?fromStatus=${currentTab}`'
    )
    expect(content).toContain('href={getOrderDetailHref(order.id)}')
  })

  it('memvalidasi order-detail-client.tsx membaca fromStatus dan mengarahkan kembali ke tab status yang sesuai', () => {
    const content = fs.readFileSync(orderDetailClientPath, 'utf-8')

    // 1. Membaca fromStatus dari searchParams
    expect(content).toContain('useSearchParams')
    expect(content).toContain(
      "searchParams?.get('fromStatus') || searchParams?.get('status')"
    )

    // 2. Resolusi backHref akurat berbasis fromStatus dan fallback cerdas
    expect(content).toContain('const backHref = useMemo(() =>')
    expect(content).toContain("if (fromStatus === 'ALL')")
    expect(content).toContain(
      '`/dashboard/customer/orders?status=${fromStatus}`'
    )
    expect(content).toContain("order.status === 'SHIPPED'")
    expect(content).toContain("'/dashboard/customer/orders?status=SHIPPED'")

    // 3. handleNavigateBack dan MobileTopNav menggunakan backHref
    expect(content).toContain('router.push(backHref)')
    expect(content).toContain('backHref={backHref}')
    expect(content).toContain('href={backHref}')
  })

  it('memvalidasi page.tsx detail pesanan membungkus Suspense dan menangani fallback 404 dengan backHref yang sesuai', () => {
    const content = fs.readFileSync(orderDetailPagePath, 'utf-8')

    // 1. Props menyertakan searchParams
    expect(content).toContain(
      'searchParams?: Promise<{ fromStatus?: string; status?: string }>'
    )

    // 2. Fallback 404 membaca status
    expect(content).toContain('notFoundBackHref')
    expect(content).toContain('backHref={notFoundBackHref}')

    // 3. Dibungkus Suspense
    expect(content).toContain('<Suspense fallback={null}>')
    expect(content).toContain('<OrderDetailClient order={orderData} />')
  })
})
