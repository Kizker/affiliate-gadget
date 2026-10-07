import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Chat Bantuan CS Superadmin & Bantuan Store Admin', () => {
  const storeRoomRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/customer/chat/store-room/route.ts'
  )
  const adminRoomsRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/admin/chat/rooms/route.ts'
  )
  const adminRoomMessagesRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/admin/chat/rooms/[roomId]/messages/route.ts'
  )
  const customerChatPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/chat/page.tsx'
  )
  const adminChatPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/chat/page.tsx'
  )
  const mobileCustomerAccountPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-customer-account-view.tsx'
  )

  it('memvalidasi penanganan CS Superadmin pada store-room route dengan storeId null', () => {
    const content = fs.readFileSync(storeRoomRoutePath, 'utf-8')
    expect(content).toContain("reqStoreId === 'superadmin'")
    expect(content).toContain('storeId: null')
    expect(content).toContain('Customer Service (Superadmin)')
  })

  it('memvalidasi admin chat rooms route menyertakan room CS untuk Superadmin dan Store Admin', () => {
    const content = fs.readFileSync(adminRoomsRoutePath, 'utf-8')
    expect(content).toContain('isStoreHelpToSuperAdmin')
    expect(content).toContain('{ customerId: session.user.id, storeId: null }')
    expect(content).toContain('{ storeId: null }')
  })

  it('memvalidasi pengiriman pesan chat admin mengizinkan Superadmin dan pemohon bantuan', () => {
    const content = fs.readFileSync(adminRoomMessagesRoutePath, 'utf-8')
    expect(content).toContain('room.customerId === session.user.id')
    expect(content).toContain("user.role === 'SUPER_ADMIN'")
  })

  it('memvalidasi UI customer chat mendukung param type=cs', () => {
    const content = fs.readFileSync(customerChatPagePath, 'utf-8')
    expect(content).toContain("paramType === 'cs'")
    expect(content).toContain('CS Superadmin')
  })

  it('memvalidasi UI admin chat memiliki filter dan tab untuk CS Superadmin', () => {
    const content = fs.readFileSync(adminChatPagePath, 'utf-8')
    expect(content).toContain('Bantuan CS Superadmin')
    expect(content).toContain('STORE_HELP')
    expect(content).toContain('CUSTOMER_CS')
  })

  it('memvalidasi menu akun customer mengarahkan ke CS Superadmin', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')
    expect(content).toContain('Pusat Bantuan CS Superadmin')
    expect(content).toContain('/dashboard/customer/chat?type=cs')
  })
})
