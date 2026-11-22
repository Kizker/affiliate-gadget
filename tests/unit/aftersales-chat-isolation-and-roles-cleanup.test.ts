import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('After Sales Chat Isolation, Right-Left Alignment & Role Options Cleanup', () => {
  const roomsApiPath = path.resolve('src/app/api/admin/chat/rooms/route.ts')
  const messagesApiPath = path.resolve(
    'src/app/api/admin/chat/rooms/[roomId]/messages/route.ts'
  )
  const chatPagePath = path.resolve('src/app/dashboard/admin/chat/page.tsx')
  const editUserModalPath = path.resolve(
    'src/components/admin/edit-user-modal.tsx'
  )
  const createUserModalPath = path.resolve(
    'src/components/admin/create-user-modal.tsx'
  )
  const usersPagePath = path.resolve('src/app/dashboard/admin/users/page.tsx')

  it('1. GET /api/admin/chat/rooms mengembalikan data kosong [] jika After Sales belum ditugaskan ke grup toko manapun', () => {
    const content = fs.readFileSync(roomsApiPath, 'utf-8')
    expect(content).toContain("user.role === 'AFTER_SALES'")
    expect(content).toContain('if (storeIds.length === 0)')
    expect(content).toContain(
      'return NextResponse.json({ success: true, data: [] })'
    )
  })

  it('2. GET & POST /api/admin/chat/rooms/[roomId]/messages memblokir After Sales jika storeIds kosong atau room di luar grup', () => {
    const content = fs.readFileSync(messagesApiPath, 'utf-8')
    expect(content).toContain(
      'Anda belum ditugaskan ke grup cabang toko manapun'
    )
    expect(content).toContain('Akses percakapan grup cabang lain ditolak')
  })

  it('3. Perataan chat bubble diatur Kanan-Kiri: Customer di KIRI dan Toko/Staf/After Sales di KANAN', () => {
    const content = fs.readFileSync(chatPagePath, 'utf-8')
    expect(content).toContain(
      'isRightAligned = isSentByMe || !isCustomerSender'
    )
    expect(content).toContain('const isAdmin = isRightAligned')
    expect(content).toContain("isAdmin ? 'justify-end' : 'justify-start'")
    expect(content).toContain("isAdmin ? 'ml-auto' : 'mr-auto'")
  })

  it('4. EditUserModal dan CreateUserModal menghapus role STORE_SALES, ADMIN, FINANCE_ADMIN', () => {
    const editContent = fs.readFileSync(editUserModalPath, 'utf-8')
    const createContent = fs.readFileSync(createUserModalPath, 'utf-8')

    expect(editContent).not.toContain('Staff Sales Toko')
    expect(editContent).not.toContain('Admin Platform (Pengelola)')
    expect(editContent).not.toContain('Admin Keuangan')
    expect(editContent).not.toContain("'STORE_SALES'")
    expect(editContent).not.toContain("'FINANCE_ADMIN'")

    expect(createContent).not.toContain('Admin Platform (Pengelola)')
    expect(createContent).not.toContain("'STORE_SALES'")
    expect(createContent).not.toContain("'FINANCE_ADMIN'")
  })

  it('5. Halaman Users menghapus tab Admin Platform dan menyederhanakan kartu Superadmin', () => {
    const content = fs.readFileSync(usersPagePath, 'utf-8')
    expect(content).not.toContain("{ id: 'ADMIN', label: 'Admin Platform' }")
    expect(content).toContain("label: 'Superadmin'")
  })
})
