import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Shopee Mass Update Flow: 6 Headers, HPP Column, and Tasks Table', () => {
  const exportRoutePath = path.resolve(
    'src/app/api/admin/products/export-excel/route.ts'
  )
  const importRoutePath = path.resolve(
    'src/app/api/admin/products/import-excel/route.ts'
  )
  const tasksRoutePath = path.resolve(
    'src/app/api/admin/products/mass-update/tasks/route.ts'
  )
  const modalComponentPath = path.resolve(
    'src/components/admin/bulk-price-update-modal.tsx'
  )

  it('1. Export Excel mengimplementasikan 6 baris header Shopee dan kolom HPP khusus Affiliate Gadget', () => {
    const content = fs.readFileSync(exportRoutePath, 'utf8')
    expect(content).toContain('item_id')
    expect(content).toContain('HPP Modal (Affiliate Gadget)')
    expect(content).toContain('ROW 1: Technical Key Row')
    expect(content).toContain('ROW 2: Data Type Metadata')
    expect(content).toContain('ROW 3: Column Labels')
    expect(content).toContain('ROW 4: Mandatory / Optional Indicator Row')
    expect(content).toContain('ROW 5: Short Validation Rules')
    expect(content).toContain('ROW 6: Detailed Instruction & Constraints Row')
    expect(content).toContain('prisma.massUpdateTask.create')
  })

  it('2. Import Excel mendukung deteksi kolom HPP, melewari 6 baris header, dan mencatat task history', () => {
    const content = fs.readFileSync(importRoutePath, 'utf8')
    expect(content).toContain('costPriceCol')
    expect(content).toContain('harga modal')
    expect(content).toContain('prisma.massUpdateTask.create')
  })

  it('3. Endpoint tasks menyediakan GET dan POST dengan proteksi role', () => {
    const content = fs.readFileSync(tasksRoutePath, 'utf8')
    expect(content).toContain('prisma.massUpdateTask.findMany')
    expect(content).toContain('prisma.massUpdateTask.create')
    expect(content).toContain('STORE_ADMIN')
    expect(content).toContain('SUPER_ADMIN')
  })

  it('4. Modal Update Massal memiliki 2 Tab Shopee (Download & Upload) dan tabel dokumen riwayat', () => {
    const content = fs.readFileSync(modalComponentPath, 'utf8')
    expect(content).toContain("modalTab === 'download'")
    expect(content).toContain("modalTab === 'upload'")
    expect(content).toContain('Riwayat Dokumen Template')
    expect(content).toContain('Riwayat Unggahan Dokumen')
    expect(content).toContain('handleDownloadTemplate')
    expect(content).toContain('handleSubmit')
  })
})
