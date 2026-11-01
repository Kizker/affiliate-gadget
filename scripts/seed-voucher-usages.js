import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Roxy Mas Vouchers & Usages...')

  // Find store Roxy Mas
  let store = await prisma.store.findFirst({
    where: {
      OR: [{ id: 'cmtqt76ar0002tzfoe4tev6sx' }, { slug: 'roxy-mas-jakarta' }],
    },
  })

  if (!store) {
    store = await prisma.store.findFirst()
  }

  if (!store) {
    console.error('No store found to attach vouchers!')
    process.exit(1)
  }

  const storeId = store.id
  console.log(`Using store: ${store.name} (${storeId})`)

  const voucherTemplates = [
    {
      code: 'DISKON100',
      description: 'Diskon 99% Spesial Peluncuran Toko Cabang Roxy Mas',
      discountType: 'PERCENTAGE',
      discountPercent: 99,
      maxDiscountAmount: 10000000,
      minimumPurchase: 0,
      totalQuota: 1,
      usedCount: 0,
      isActive: true,
    },
    {
      code: 'ROXYHEMAT10',
      description: 'Potongan Belanja 10% Khusus Unit Android & Tablet',
      discountType: 'PERCENTAGE',
      discountPercent: 10,
      maxDiscountAmount: 300000,
      minimumPurchase: 1000000,
      totalQuota: 50,
      usedCount: 3,
      isActive: true,
    },
    {
      code: 'ROXYCASH50',
      description:
        'Cashback Langsung Rp 50.000 untuk Pembelian Aksesoris & Gadget',
      discountType: 'FIXED_AMOUNT',
      discountAmount: 50000,
      discountPercent: 0,
      minimumPurchase: 500000,
      totalQuota: 100,
      usedCount: 12,
      isActive: true,
    },
    {
      code: 'GAJIANROXY',
      description: 'Spesial Promo Gajian Diskon 15% All Item',
      discountType: 'PERCENTAGE',
      discountPercent: 15,
      maxDiscountAmount: 500000,
      minimumPurchase: 2000000,
      totalQuota: 30,
      usedCount: 8,
      isActive: true,
    },
    {
      code: 'ROXYMEGAPROMO',
      description: 'Potongan Mega Promo Rp 250.000 Pembelian Gadget Flagship',
      discountType: 'FIXED_AMOUNT',
      discountAmount: 250000,
      discountPercent: 0,
      minimumPurchase: 3000000,
      totalQuota: 20,
      usedCount: 5,
      isActive: true,
    },
    {
      code: 'IPHONEROXY',
      description: 'Voucher Khusus Lini Apple iPhone Second Bergaransi 30 Hari',
      discountType: 'PERCENTAGE',
      discountPercent: 5,
      maxDiscountAmount: 350000,
      minimumPurchase: 5000000,
      totalQuota: 40,
      usedCount: 1,
      isActive: true,
    },
    {
      code: 'SAMSUNGROXY',
      description: 'Potongan Belanja Samsung Galaxy Series Rp 100.000',
      discountType: 'FIXED_AMOUNT',
      discountAmount: 100000,
      discountPercent: 0,
      minimumPurchase: 2000000,
      totalQuota: 50,
      usedCount: 7,
      isActive: true,
    },
    {
      code: 'ROXYFLASH',
      description: 'Flash Sale Diskon 20% Akhir Pekan',
      discountType: 'PERCENTAGE',
      discountPercent: 20,
      maxDiscountAmount: 300000,
      minimumPurchase: 1500000,
      totalQuota: 25,
      usedCount: 15,
      isActive: true,
    },
    {
      code: 'WEEKENDROXY',
      description: 'Voucher Belanja Santai Weekend Potongan Rp 75.000',
      discountType: 'FIXED_AMOUNT',
      discountAmount: 75000,
      discountPercent: 0,
      minimumPurchase: 1000000,
      totalQuota: 80,
      usedCount: 22,
      isActive: true,
    },
    {
      code: 'ROXYVIP',
      description: 'Eksklusif Diskon Member VIP 12%',
      discountType: 'PERCENTAGE',
      discountPercent: 12,
      maxDiscountAmount: 1000000,
      minimumPurchase: 7500000,
      totalQuota: 15,
      usedCount: 2,
      isActive: true,
    },
    {
      code: 'HEMATROXY',
      description: 'Potongan Belanja Ringan Rp 30.000',
      discountType: 'FIXED_AMOUNT',
      discountAmount: 30000,
      discountPercent: 0,
      minimumPurchase: 300000,
      totalQuota: 200,
      usedCount: 45,
      isActive: true,
    },
    {
      code: 'SUPERROXY',
      description: 'Super Diskon Gadget Mewah 25%',
      discountType: 'PERCENTAGE',
      discountPercent: 25,
      maxDiscountAmount: 1500000,
      minimumPurchase: 4000000,
      totalQuota: 20,
      usedCount: 0,
      isActive: true,
    },
    {
      code: 'ROXYONGKIR',
      description: 'Subsidi Potongan Ongkir & Belanja Rp 20.000',
      discountType: 'FIXED_AMOUNT',
      discountAmount: 20000,
      discountPercent: 0,
      minimumPurchase: 100000,
      totalQuota: 150,
      usedCount: 60,
      isActive: true,
    },
    {
      code: 'TUKARTAMBAH',
      description: 'Bonus Potongan Tukar Tambah Unit Lama Rp 150.000',
      discountType: 'FIXED_AMOUNT',
      discountAmount: 150000,
      discountPercent: 0,
      minimumPurchase: 2500000,
      totalQuota: 30,
      usedCount: 4,
      isActive: true,
    },
    {
      code: 'ROXYNEWYEAR',
      description: 'Kupon Promo Menuju Tahun Baru Diskon 8%',
      discountType: 'PERCENTAGE',
      discountPercent: 8,
      maxDiscountAmount: 400000,
      minimumPurchase: 1200000,
      totalQuota: 50,
      usedCount: 0,
      isActive: false,
    },
  ]

  const validFrom = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  for (const t of voucherTemplates) {
    const existing = await prisma.voucher.findFirst({
      where: { code: t.code, storeId },
    })

    if (!existing) {
      await prisma.voucher.create({
        data: {
          code: t.code,
          description: t.description,
          discountType: t.discountType,
          discountPercent: t.discountPercent,
          discountAmount: t.discountAmount || null,
          maxDiscountAmount: t.maxDiscountAmount || null,
          minimumPurchase: t.minimumPurchase,
          totalQuota: t.totalQuota,
          usedCount: t.usedCount,
          usagePerUser: 1,
          applicableOrderType: 'PRODUCT',
          storeId,
          isActive: t.isActive,
          validFrom,
          validUntil,
        },
      })
      console.log(`Created voucher ${t.code}`)
    }
  }

  // Ensure buyers exist
  const buyersData = [
    { email: 'customer@test.com', name: 'Rian Pratama', phone: '087827323427' },
    {
      email: 'siti.aminah@gmail.com',
      name: 'Siti Aminah',
      phone: '081298765432',
    },
    {
      email: 'dimas.setiawan@gmail.com',
      name: 'Dimas Setiawan',
      phone: '081377889900',
    },
    {
      email: 'maya.kartika@gmail.com',
      name: 'Maya Kartika',
      phone: '081234567891',
    },
    {
      email: 'budi.santoso@gmail.com',
      name: 'Budi Santoso',
      phone: '081234567892',
    },
    {
      email: 'eka.saputra@gmail.com',
      name: 'Eka Saputra',
      phone: '081234567893',
    },
  ]

  const users = []
  for (const b of buyersData) {
    const u = await prisma.user.upsert({
      where: { email: b.email },
      update: { name: b.name, phone: b.phone },
      create: {
        email: b.email,
        name: b.name,
        phone: b.phone,
        role: 'CUSTOMER',
      },
    })
    users.push(u)
  }

  const vouchers = await prisma.voucher.findMany({
    where: { storeId, usedCount: { gt: 0 } },
  })

  let totalUsagesCreated = 0

  for (const v of vouchers) {
    const existingCount = await prisma.voucherUsage.count({
      where: { voucherId: v.id },
    })

    const needed = v.usedCount - existingCount
    if (needed <= 0) continue

    const discountVal =
      v.discountType === 'FIXED_AMOUNT'
        ? v.discountAmount || 50000
        : Math.round(
            ((v.minimumPurchase || 2000000) * (v.discountPercent || 10)) / 100
          )

    for (let i = 0; i < needed; i++) {
      const user = users[(i + v.code.length) % users.length]
      const orderNum = `SPR-${Date.now().toString(36).toUpperCase()}-${v.code.slice(0, 4)}${i + 1}`
      const subtotal = Math.max(
        v.minimumPurchase || 1500000,
        2000000 + i * 500000
      )
      const total = subtotal - discountVal + 15000

      const daysAgo = (i % 7) + 1
      const usedDate = new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000 + i * 3600000
      )

      const order = await prisma.order.create({
        data: {
          orderNumber: orderNum,
          userId: user.id,
          storeId: storeId,
          status: 'COMPLETED',
          subtotal: subtotal,
          discountAmount: discountVal,
          voucherId: v.id,
          voucherCode: v.code,
          total: total,
          createdAt: usedDate,
          completedAt: usedDate,
        },
      })

      await prisma.voucherUsage.create({
        data: {
          voucherId: v.id,
          userId: user.id,
          orderId: order.id,
          discountApplied: discountVal,
          usedAt: usedDate,
        },
      })

      totalUsagesCreated++
    }
  }

  console.log(`Seeding complete. New usages created: ${totalUsagesCreated}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
