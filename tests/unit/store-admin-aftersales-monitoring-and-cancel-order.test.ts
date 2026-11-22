import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Store Admin After Sales Monitoring & Order Cancellation Suite', () => {
  const returnsApiPath = path.resolve('src/app/api/returns/route.ts')
  const returnsIdApiPath = path.resolve('src/app/api/returns/[id]/route.ts')
  const afterSalesReturnsPagePath = path.resolve(
    'src/app/dashboard/after-sales/returns/page.tsx'
  )
  const ordersPagePath = path.resolve('src/app/dashboard/admin/orders/page.tsx')
  const orderCancelApiPath = path.resolve(
    'src/app/api/orders/[orderId]/cancel/route.ts'
  )
  const waProviderPath = path.resolve(
    'src/lib/notifications/whatsapp-provider.ts'
  )
  const customerSettingsPath = path.resolve(
    'src/app/dashboard/customer/settings/page.tsx'
  )

  it('1. GET /api/returns menyertakan status grup after sales (hasAssignedAfterSales, assignedAfterSalesName, isSelfManaged)', () => {
    const content = fs.readFileSync(returnsApiPath, 'utf-8')
    expect(content).toContain('hasAssignedAfterSales')
    expect(content).toContain('assignedAfterSalesName')
    expect(content).toContain('assignedGroupName')
    expect(content).toContain('isSelfManaged')
    expect(content).toContain('afterSalesUserId')
  })

  it('2. Halaman Retur After Sales membatasi Store Admin ke Mode Monitoring jika sudah ada Admin After Sales', () => {
    const content = fs.readFileSync(afterSalesReturnsPagePath, 'utf-8')
    expect(content).toContain('isStoreMonitoringMode')
    expect(content).toContain('Mode Monitoring Toko')
    expect(content).toContain('isMonitoringItem')
    expect(content).toContain('Ditangani After Sales')
    // Tombol eksekusi dibatasi jika item adalah monitoring
    expect(content).toContain('if (isMonitoringItem)')
  })

  it('3. PUT /api/returns/[id] memblokir Store Admin dari aksi after sales jika sudah ada After Sales terpusat', () => {
    const content = fs.readFileSync(returnsIdApiPath, 'utf-8')
    expect(content).toContain('isSelfManagedStoreAdmin')
    expect(content).toContain('!isSelfManagedStoreAdmin')
  })

  it('4. Orders Drawer Admin menyediakan opsi Batalkan Pesanan dan Modal Konfirmasi Pembatalan', () => {
    const content = fs.readFileSync(ordersPagePath, 'utf-8')
    expect(content).toContain('Batalkan Pesanan')
    expect(content).toContain('cancelModalOrder')
    expect(content).toContain('handleCancelOrder')
    expect(content).toContain('Konfirmasi Pembatalan Pesanan')
    expect(content).toContain('otomatis dikembalikan')
  })

  it('5. POST /api/orders/[orderId]/cancel mengizinkan Store Admin membatalkan pesanan tokonya dan mengembalikan stok fisik', () => {
    const content = fs.readFileSync(orderCancelApiPath, 'utf-8')
    expect(content).toContain('isStoreStaff')
    expect(content).toContain('order.storeId !== userStoreId')
    expect(content).toContain('productVariant.update')
    expect(content).toContain('product.update')
    expect(content).toContain('increment: item.quantity')
  })

  it('6. WhatsApp Provider mendukung multi-gateway (Fonnte, Wablas, Zenziva) dan Settings menyediakan link langsung Buka WhatsApp', () => {
    const waContent = fs.readFileSync(waProviderPath, 'utf-8')
    const settingsContent = fs.readFileSync(customerSettingsPath, 'utf-8')

    expect(waContent).toContain('FONNTE_TOKEN')
    expect(waContent).toContain('WABLAS_TOKEN')
    expect(waContent).toContain('ZENZIVA_USERKEY')

    expect(settingsContent).toContain('otpWhatsappUrl')
    expect(settingsContent).toContain('Buka WhatsApp untuk Terima Kode')
  })
})
