import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('UX Refinements: Product Share, Chat Navbar Removal & Payment Modal Clean', () => {
  const gadgetPagePath = path.resolve(
    process.cwd(),
    'src/app/gadget/[id]/page.tsx'
  )
  const productShareModalPath = path.resolve(
    process.cwd(),
    'src/components/gadget/product-share-modal.tsx'
  )
  const customerChatPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/chat/page.tsx'
  )
  const paymentModalPath = path.resolve(
    process.cwd(),
    'src/components/payment/custom-payment-modal.tsx'
  )

  it('memvalidasi gadget/[id]/page.tsx adalah Server Component dengan generateMetadata dinamis untuk OpenGraph & Twitter Card', () => {
    const content = fs.readFileSync(gadgetPagePath, 'utf-8')
    expect(content).not.toContain("'use client'")
    expect(content).toContain('export async function generateMetadata(')
    expect(content).toContain('openGraph:')
    expect(content).toContain('twitter:')
    expect(content).toContain("card: 'summary_large_image'")
    expect(content).toContain('formattedPrice')
    expect(content).toContain('Garansi 30 Hari Tukar Unit Baru')
  })

  it('memvalidasi product-share-modal.tsx menggunakan template share teks terstruktur cantik seperti live', () => {
    const content = fs.readFileSync(productShareModalPath, 'utf-8')
    expect(content).toContain('🔥 *${product.name}*')
    expect(content).toContain('💰 *Harga:* ${formattedPrice}')
    expect(content).toContain('🛡️ *Garansi:* 30 Hari Tukar Unit Baru Resmi')
    expect(content).toContain('🎁 *Bonus:* Paket Aksesoris 3-in-1 Lengkap')
    expect(content).toContain('🔗 *Lihat Detail & Pesan Unit:*')
  })

  it('memvalidasi halaman chat customer tidak lagi me-render MobileBottomNav agar input & konteks tidak tertutup', () => {
    const content = fs.readFileSync(customerChatPagePath, 'utf-8')
    expect(content).not.toContain('<MobileBottomNav')
    expect(content).not.toContain(
      'import { Navbar, MobileTopNav, MobileBottomNav }'
    )
  })

  it('memvalidasi custom-payment-modal.tsx tidak lagi memiliki tombol duplikat Ganti Metode Pembayaran Lain', () => {
    const content = fs.readFileSync(paymentModalPath, 'utf-8')
    expect(content).not.toContain('<span>Ganti Metode Pembayaran Lain</span>')
    // Tombol Ganti tetap ada di header
    expect(content).toContain('<span>Ganti</span>')
  })
})
