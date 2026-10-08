import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Service Page Mobile Hero Removal', () => {
  const serviceViewPath = path.resolve(
    process.cwd(),
    'src/components/service/integrated-service-view.tsx'
  )

  it('memvalidasi banner hero servis disembunyikan di mobile dan hanya tampil di desktop', () => {
    const content = fs.readFileSync(serviceViewPath, 'utf-8')
    // Hero section harus memiliki class hidden md:block agar tidak tampil di mobile
    expect(content).toContain(
      'section className="relative hidden pb-2 pt-20 md:block md:pb-3 md:pt-24"'
    )
    expect(content).toContain('LAYANAN SERVIS RESMI &amp; TERSTANDARISASI LAB')
  })

  it('memvalidasi section search dan filter langsung tampil di atas pada tampilan mobile', () => {
    const content = fs.readFileSync(serviceViewPath, 'utf-8')
    expect(content).toMatch(
      /section className="[^"]*max-w-7xl[^"]*pt-20[^"]*md:pt-0[^"]*"/
    )
    expect(content).toContain(
      'placeholder="Cari nama mitra, layanan, atau kota..."'
    )
  })
})
