import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Chat Templates, Accurate Online/Offline Status, Simple Header, & Order Link in Bubble', () => {
  const chatTemplateModalPath = path.resolve(
    'src/components/chat/chat-template-modal.tsx'
  )
  const chatTemplatesApiPath = path.resolve(
    'src/app/api/admin/chat/templates/route.ts'
  )
  const adminChatPagePath = path.resolve(
    'src/app/dashboard/admin/chat/page.tsx'
  )
  const customerChatPagePath = path.resolve(
    'src/app/dashboard/customer/chat/page.tsx'
  )
  const chatHeaderPath = path.resolve(
    'src/components/customer/chat/chat-header.tsx'
  )
  const chatBubblePath = path.resolve(
    'src/components/customer/chat/chat-message-bubble.tsx'
  )
  const chatRoomCardPath = path.resolve(
    'src/components/customer/chat/chat-room-card.tsx'
  )

  it('1. Image 1 - Chat Template Modal: Mendukung balasan cepat, tambah, edit, hapus, dan integrasi admin chat', () => {
    const modalContent = fs.readFileSync(chatTemplateModalPath, 'utf8')
    expect(modalContent).toContain('Template Balasan Cepat')
    expect(modalContent).toContain('handleSaveTemplate')
    expect(modalContent).toContain('handleDeleteTemplate')
    expect(modalContent).toContain('onSelectTemplate')

    const apiContent = fs.readFileSync(chatTemplatesApiPath, 'utf8')
    expect(apiContent).toContain('DEFAULT_TEMPLATES')
    expect(apiContent).toContain('chat_templates')

    const adminChatContent = fs.readFileSync(adminChatPagePath, 'utf8')
    expect(adminChatContent).toContain('ChatTemplateModal')
    expect(adminChatContent).toContain('Template Chat')
  })

  it('2. Image 2 - Online/Offline Status Akurat: Menjadi abu-abu jika tidak aktif dan hijau hanya jika aktif', () => {
    const pageContent = fs.readFileSync(customerChatPagePath, 'utf8')
    // Memeriksa waktu pesan terakhir < 10 menit
    expect(pageContent).toContain('10 * 60 * 1000')

    const cardContent = fs.readFileSync(chatRoomCardPath, 'utf8')
    expect(cardContent).toContain('10 * 60 * 1000')
    expect(cardContent).toContain(
      "roomIsOnline ? 'bg-emerald-500' : 'bg-slate-300"
    )

    const headerContent = fs.readFileSync(chatHeaderPath, 'utf8')
    expect(headerContent).toContain('Offline')
    expect(headerContent).toContain('bg-slate-100')
    expect(headerContent).toContain('bg-slate-400')
  })

  it('3. Image 3 - Header Chat Purna Jual: Langsung menampilkan nama penanggung jawab tanpa deskripsi bertele-tele', () => {
    const pageContent = fs.readFileSync(customerChatPagePath, 'utf8')
    expect(pageContent).toContain(
      "selectedRoom?.claimedBy?.name || 'Budi Santoso (After Sales Roxy Group)'"
    )

    const headerContent = fs.readFileSync(chatHeaderPath, 'utf8')
    expect(headerContent).toContain('Layanan Purna Jual &amp; Garansi Terpusat')
    expect(headerContent).not.toContain('Admin After Sales: Budi Santoso')
  })

  it('4. Image 4 - Tombol "Rincian Pesanan" di Bubble Chat: Membawa pengguna langsung ke halaman rincian pesanan', () => {
    const bubbleContent = fs.readFileSync(chatBubblePath, 'utf8')
    expect(bubbleContent).toContain(
      '/dashboard/customer/orders/${orderId || orderNumber}'
    )
    expect(bubbleContent).toContain('Rincian Pesanan')
    expect(bubbleContent).toMatch(
      /<Link[\s\S]*href=\{`\/dashboard\/customer\/orders\/\$\{orderId \|\| orderNumber\}`\}[\s\S]*Rincian Pesanan/
    )
  })
})
