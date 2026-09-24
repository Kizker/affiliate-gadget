import prisma from '../src/lib/db'

async function benchmark() {
  console.log('⚡ MEMULAI BENCHMARK PERFORMA WEBSITE (DATA MASIF)...\n')

  const results: { test: string; durationMs: number; rowCount: number; status: string }[] = []

  // Test 1: Katalog Produk & Varian (Frontend Listing)
  const t1 = performance.now()
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: true,
      store: { select: { id: true, name: true, city: true, rating: true } },
    },
    take: 50,
  })
  const d1 = performance.now() - t1
  results.push({ test: 'Katalog Produk (take 50, include variants & store)', durationMs: Math.round(d1), rowCount: products.length, status: d1 < 200 ? 'SANGAT CEPAT ⚡' : 'NORMAL' })

  // Test 2: Riwayat Pesanan Customer & Admin (Heavy Relation)
  const t2 = performance.now()
  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: true } },
      user: { select: { name: true, email: true } },
      store: { select: { name: true, city: true } },
      returnRequests: true,
      complaints: true,
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
  })
  const d2 = performance.now() - t2
  results.push({ test: 'Daftar Pesanan Admin (take 50, items, store, retur, komplain)', durationMs: Math.round(d2), rowCount: orders.length, status: d2 < 200 ? 'SANGAT CEPAT ⚡' : 'NORMAL' })

  // Test 3: Agregasi Keuangan & Laporan Multi-PT (Konsolidasi 600 Pesanan)
  const t3 = performance.now()
  const revenueAgg = await prisma.order.aggregate({
    _sum: {
      total: true,
      subtotal: true,
      commissionAmount: true,
      tax: true,
    },
    _count: { _all: true },
  })
  const d3 = performance.now() - t3
  const orderCount = revenueAgg._count?._all ?? 0
  results.push({ test: 'Agregasi Finansial Laporan (SUM omzet, komisi, PPN)', durationMs: Math.round(d3), rowCount: orderCount, status: d3 < 100 ? 'INSTAN ⚡' : 'NORMAL' })

  // Test 4: Modul Retur Garansi 30 Hari
  const t4 = performance.now()
  const returns = await prisma.returnRequest.findMany({
    include: {
      order: { select: { orderNumber: true, total: true, status: true } },
      user: { select: { name: true, phone: true } },
      store: { select: { name: true } },
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
  })
  const d4 = performance.now() - t4
  results.push({ test: 'Pusat Klaim Retur Garansi (take 50)', durationMs: Math.round(d4), rowCount: returns.length, status: d4 < 150 ? 'SANGAT CEPAT ⚡' : 'NORMAL' })

  // Test 5: Ulasan & Rating Produk
  const t5 = performance.now()
  const reviews = await prisma.review.findMany({
    where: { type: 'PRODUCT' },
    include: {
      user: { select: { name: true } },
      product: { select: { name: true, brand: true } },
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
  })
  const d5 = performance.now() - t5
  results.push({ test: 'Feed Ulasan & Komentar Produk (take 50)', durationMs: Math.round(d5), rowCount: reviews.length, status: d5 < 150 ? 'SANGAT CEPAT ⚡' : 'NORMAL' })

  // Test 6: Live Streaming Hub & Chat Komentar
  const t6 = performance.now()
  const streamWithComments = await prisma.liveStream.findMany({
    include: {
      comments: { take: 30, orderBy: { createdAt: 'desc' } },
      store: { select: { name: true } },
    },
  })
  const d6 = performance.now() - t6
  results.push({ test: 'Live Streaming Hub + Live Comments', durationMs: Math.round(d6), rowCount: streamWithComments.length, status: d6 < 150 ? 'SANGAT CEPAT ⚡' : 'NORMAL' })

  console.log('='.repeat(80))
  console.log('HASIL BENCHMARK KECEPATAN WEBSITE (DATA MASIF)')
  console.log('='.repeat(80))
  for (const r of results) {
    console.log(`${r.test.padEnd(55)} | ${String(r.durationMs).padStart(4)} ms | ${r.status}`)
  }
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

benchmark().catch(console.error)
