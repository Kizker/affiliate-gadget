import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Resolusi Bug Room Chat Toko: Eliminasi Unique Constraint orderId pada AdminChatRoom', () => {
  const schemaPath = path.resolve('prisma/schema.prisma')
  const storeRoomRoutePath = path.resolve(
    'src/app/api/customer/chat/store-room/route.ts'
  )
  const adminRoomsRoutePath = path.resolve(
    'src/app/api/admin/chat/rooms/route.ts'
  )

  it('1. Schema Prisma: AdminChatRoom.orderId tidak lagi memiliki constraint @unique', () => {
    const schema = fs.readFileSync(schemaPath, 'utf8')
    const adminChatRoomModel = schema
      .split('model AdminChatRoom {')[1]
      .split('}')[0]

    // orderId harus String? tanpa @unique
    expect(adminChatRoomModel).toMatch(/orderId\s+String\?/)
    expect(adminChatRoomModel).not.toMatch(/orderId\s+String\?\s+@unique/)
  })

  it('2. Schema Prisma: Relasi Order ke AdminChatRoom adalah 1-to-many (adminChatRooms AdminChatRoom[])', () => {
    const schema = fs.readFileSync(schemaPath, 'utf8')
    const orderModel = schema.split('model Order {')[1].split('}')[0]

    expect(orderModel).toContain(
      'adminChatRooms                 AdminChatRoom[]'
    )
  })

  it('3. store-room API: Update order context terproteksi try-catch non-fatal untuk menjamin user selalu terhubung ke room', () => {
    const content = fs.readFileSync(storeRoomRoutePath, 'utf8')
    expect(content).toContain('Non-fatal error updating store room context')
    expect(content).toContain('Non-fatal error updating CS room context')
    expect(content).toContain('isReturnInquiry')
    expect(content).toContain('return_reference')
  })

  it('4. admin/chat/rooms API: Update context terproteksi try-catch non-fatal', () => {
    const content = fs.readFileSync(adminRoomsRoutePath, 'utf8')
    expect(content).toContain(
      'Non-fatal error updating admin chat room context'
    )
  })
})
