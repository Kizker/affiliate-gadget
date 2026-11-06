import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  GET as getProduct,
  PATCH as patchProduct,
  DELETE as deleteProduct,
} from '@/app/api/products/[id]/route'
import {
  GET as getAdminProduct,
  PATCH as patchAdminProduct,
  DELETE as deleteAdminProduct,
} from '@/app/api/admin/products/[id]/route'
import { PATCH as bulkColorUpdate } from '@/app/api/admin/products/variants/bulk-color-update/route'

// Mock next-auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/auth'

describe('Uji Celah IDOR: Isolasi Produk Toko A vs Toko B di Seluruh Endpoint', () => {
  const storeAId = 'store-roxy-jakarta-001'
  const storeBId = 'store-wtc-surabaya-002'

  const userTokoA = {
    id: 'user-toko-a-idor-test',
    email: 'admin.toko.a.idor@testcorp.id',
    role: 'STORE_ADMIN',
    storeId: storeAId,
  }

  const userTokoB = {
    id: 'user-toko-b-idor-test',
    email: 'admin.toko.b.idor@testcorp.id',
    role: 'STORE_ADMIN',
    storeId: storeBId,
  }

  const superAdminUser = {
    id: 'user-super-admin-idor-test',
    email: 'superadmin.idor@testcorp.id',
    role: 'SUPER_ADMIN',
    storeId: null,
  }

  let productTokoAId = 'prod-a-test'
  let productTokoBId = 'prod-b-test'
  let variantTokoBId = 'var-b-test'

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup dummy stores and products in database
    await prisma.store.upsert({
      where: { id: storeAId },
      update: {},
      create: {
        id: storeAId,
        name: 'Toko Roxy Jakarta',
        companyName: 'PT Gadget Jaya Sentosa',
        slug: 'toko-roxy-jakarta',
        address: 'Jl. Roxy Mas',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        phone: '08123456781',
      },
    })

    await prisma.store.upsert({
      where: { id: storeBId },
      update: {},
      create: {
        id: storeBId,
        name: 'Toko WTC Surabaya',
        companyName: 'PT Sinar Gadget Nusantara',
        slug: 'toko-wtc-surabaya',
        address: 'Jl. Pemuda WTC',
        city: 'Surabaya',
        province: 'Jawa Timur',
        phone: '08123456782',
      },
    })

    await prisma.user.upsert({
      where: { email: userTokoA.email },
      update: { storeId: storeAId, role: 'STORE_ADMIN' },
      create: {
        id: userTokoA.id,
        email: userTokoA.email,
        name: 'Admin Toko A',
        role: 'STORE_ADMIN',
        storeId: storeAId,
      },
    })

    // Upsert product milik Toko A
    const prodA = await prisma.product.upsert({
      where: { id: productTokoAId },
      update: { storeId: storeAId, name: 'iPhone 15 Toko A' },
      create: {
        id: productTokoAId,
        name: 'iPhone 15 Toko A',
        brand: 'Apple',
        category: 'Smartphone',
        price: 15000000,
        costPrice: 12000000,
        stock: 10,
        storeId: storeAId,
        isActive: true,
      },
    })
    productTokoAId = prodA.id

    // Upsert product & variant milik Toko B
    const prodB = await prisma.product.upsert({
      where: { id: productTokoBId },
      update: { storeId: storeBId, name: 'Samsung S24 Toko B' },
      create: {
        id: productTokoBId,
        name: 'Samsung S24 Toko B',
        brand: 'Samsung',
        category: 'Smartphone',
        price: 19000000,
        costPrice: 16000000,
        stock: 5,
        storeId: storeBId,
        isActive: true,
      },
    })
    productTokoBId = prodB.id

    const varB = await prisma.productVariant.upsert({
      where: { id: variantTokoBId },
      update: {
        productId: productTokoBId,
        color: 'Titanium Gray',
        price: 19000000,
      },
      create: {
        id: variantTokoBId,
        productId: productTokoBId,
        name: '256GB Titanium Gray',
        ram: '12GB',
        storage: '256GB',
        color: 'Titanium Gray',
        price: 19000000,
        costPrice: 16000000,
        stock: 5,
      },
    })
    variantTokoBId = varB.id
  })

  // Skenario 1: Admin Toko A memanggil GET /api/products/[id] terhadap produk Toko B
  it('1. GET /api/products/[id]: Toko A ditolak 404 saat membuka produk Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    const req = new NextRequest(
      `http://localhost:3000/api/products/${productTokoBId}`
    )
    const res = await getProduct(req, {
      params: Promise.resolve({ id: productTokoBId }),
    })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Product not found')
  })

  // Skenario 2: Admin Toko A memanggil GET /api/products/[id] terhadap produk tokonya sendiri (Toko A)
  it('2. GET /api/products/[id]: Toko A berhasil (200 OK) saat membuka produk miliknya sendiri', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    const req = new NextRequest(
      `http://localhost:3000/api/products/${productTokoAId}`
    )
    const res = await getProduct(req, {
      params: Promise.resolve({ id: productTokoAId }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe(productTokoAId)
    expect(json.storeId).toBe(storeAId)
  })

  // Skenario 3: Admin Toko A memanggil PATCH /api/products/[id] terhadap produk Toko B
  it('3. PATCH /api/products/[id]: Toko A ditolak 404 saat mencoba mengedit produk Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    const req = new NextRequest(
      `http://localhost:3000/api/products/${productTokoBId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Hacked by Toko A', price: '1000' }),
      }
    )
    const res = await patchProduct(req, {
      params: Promise.resolve({ id: productTokoBId }),
    })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Product not found')

    // Verifikasi produk Toko B di database tidak berubah
    const dbProdB = await prisma.product.findUnique({
      where: { id: productTokoBId },
    })
    expect(dbProdB?.name).toBe('Samsung S24 Toko B')
  })

  // Skenario 4: Admin Toko A memanggil DELETE /api/products/[id] terhadap produk Toko B
  it('4. DELETE /api/products/[id]: Toko A ditolak 404 saat mencoba menghapus produk Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    const req = new NextRequest(
      `http://localhost:3000/api/products/${productTokoBId}`,
      {
        method: 'DELETE',
      }
    )
    const res = await deleteProduct(req, {
      params: Promise.resolve({ id: productTokoBId }),
    })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Product not found')

    // Verifikasi produk Toko B masih ada di database
    const dbProdB = await prisma.product.findUnique({
      where: { id: productTokoBId },
    })
    expect(dbProdB).not.toBeNull()
  })

  // Skenario 5: Admin Toko A memanggil GET /api/admin/products/[id] terhadap produk Toko B
  it('5. GET /api/admin/products/[id]: Toko A ditolak 404 pada endpoint admin saat membaca produk Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    const req = new NextRequest(
      `http://localhost:3000/api/admin/products/${productTokoBId}`
    )
    const res = await getAdminProduct(req, {
      params: Promise.resolve({ id: productTokoBId }),
    })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Product not found')
  })

  // Skenario 6: Admin Toko A memanggil PATCH /api/admin/products/[id] terhadap produk Toko B
  it('6. PATCH /api/admin/products/[id]: Toko A ditolak 404 pada endpoint admin saat mengedit produk Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    const req = new NextRequest(
      `http://localhost:3000/api/admin/products/${productTokoBId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ price: 1000, stock: 99 }),
      }
    )
    const res = await patchAdminProduct(req, {
      params: Promise.resolve({ id: productTokoBId }),
    })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Product not found')
  })

  // Skenario 7: Admin Toko A memanggil bulk-color-update terhadap varian milik produk Toko B
  it('7. PATCH bulk-color-update: Toko A ditolak 404 saat mencoba mengubah stok/harga varian Toko B', async () => {
    vi.mocked(auth).mockResolvedValue({ user: userTokoA } as any)

    const req = new Request(
      'http://localhost:3000/api/admin/products/variants/bulk-color-update',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantIds: [variantTokoBId],
          newStock: 0,
        }),
      }
    )
    const res = await bulkColorUpdate(req)

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Product not found')

    // Verifikasi varian Toko B di database tidak berubah
    const dbVarB = await prisma.productVariant.findUnique({
      where: { id: variantTokoBId },
    })
    expect(dbVarB?.stock).toBe(5)
  })

  // Skenario 8: Superadmin dapat melihat produk toko manapun
  it('8. Superadmin tetap memiliki akses resmi ke seluruh produk', async () => {
    vi.mocked(auth).mockResolvedValue({ user: superAdminUser } as any)

    const req = new NextRequest(
      `http://localhost:3000/api/products/${productTokoBId}`
    )
    const res = await getProduct(req, {
      params: Promise.resolve({ id: productTokoBId }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe(productTokoBId)
  })
})
