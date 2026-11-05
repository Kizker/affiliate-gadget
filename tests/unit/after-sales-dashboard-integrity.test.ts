import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('After Sales Dashboard Endpoint & Protection Integrity', () => {
  const routePath = path.resolve('src/app/api/after-sales/dashboard/route.ts')
  const pagePath = path.resolve('src/app/dashboard/after-sales/page.tsx')

  it('1. Endpoint /api/after-sales/dashboard dikonfigurasi dengan force-dynamic dan NO_CACHE_HEADERS', () => {
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain("export const dynamic = 'force-dynamic'")
    expect(content).toContain('export const revalidate = 0')
    expect(content).toContain("export const fetchCache = 'force-no-store'")
    expect(content).toContain('NO_CACHE_HEADERS')
    expect(content).toContain('no-store, no-cache, must-revalidate')
  })

  it('2. Endpoint memiliki fallback aman untuk StoreGroup dan null safety pada customer', () => {
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('prisma.storeGroup.findFirst')
    // Memastikan fallback group jika user belum di-assign spesifik
    expect(content).toContain('if (!group)')
    // Memastikan null safety pada customer mapping
    expect(content).toContain('r.customer?.name || r.customer?.email')
  })

  it('3. Halaman frontend after-sales menggunakan cache buster dan header anti-cache', () => {
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('/api/after-sales/dashboard?_t=')
    expect(content).toContain("cache: 'no-store'")
  })
})
