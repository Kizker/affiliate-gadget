import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log(
    '🚀 Seeding 3 pesanan baru selesai (Roxy Mas Jakarta, Garansi 30 Hari Aktif)...'
  )

  // 1. Dapatkan Customer Rian Prata (customer@test.com)
  const customer = await prisma.user.findUnique({
    where: { email: 'customer@test.com' },
    include: { addresses: true },
  })

  if (!customer) {
    throw new Error('Customer customer@test.com tidak ditemukan!')
  }

  // 2. Ambil Toko Affiliate Gadget - Roxy Mas Jakarta
  const store = await prisma.store.findFirst({
    where: {
      isActive: true,
      name: { contains: 'Roxy', mode: 'insensitive' },
    },
    include: {
      products: {
        where: { isActive: true },
        include: { variants: true },
        take: 3,
      },
    },
  })

  if (!store) {
    throw new Error('Toko Affiliate Gadget - Roxy Mas Jakarta tidak ditemukan!')
  }

  console.log(`✅ Toko Terpilih: ${store.name} (${store.city})`)

  if (!store.products || store.products.length === 0) {
    throw new Error('Tidak ada produk aktif pada toko Roxy Mas Jakarta!')
  }

  const now = new Date()

  // Buat 3 pesanan dengan gadget berbeda
  const createdOrders = []

  for (let i = 0; i < 3; i++) {
    // Ambil produk ke-i atau fallback
    const product = store.products[i % store.products.length]
    const variant = product.variants?.[0]
    const itemPrice = variant?.price || product.price || 15000000 + i * 3000000
    const costPrice =
      variant?.costPrice || product.costPrice || Math.round(itemPrice * 0.85)
    const variantName = variant?.name || 'Varian Resmi 256GB'

    // Waktu selesai: bertahap beberapa jam lalu agar urutan rapi
    const completedAt = new Date(now.getTime() - (i + 1) * 3600 * 1000)
    const orderCreated = new Date(completedAt.getTime() - 24 * 3600 * 1000)
    const warrantyExpired = new Date(
      completedAt.getTime() + 30 * 24 * 3600 * 1000
    )

    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const orderNumber = `SPR-${dateStr}-ROXY${i + 1}${randomSuffix}`

    const subtotal = itemPrice
    const shippingCost = 25000
    const insuranceFee = Math.round(subtotal * 0.0025)
    const total = subtotal + shippingCost + insuranceFee

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        storeId: store.id,
        status: 'COMPLETED',
        subtotal,
        shippingCost,
        insuranceFee,
        total,
        courierCode: i === 0 ? 'GOJEK' : 'JNE',
        courierService: i === 0 ? 'INSTANT' : 'REG',
        trackingNumber: `${i === 0 ? 'GK' : 'JNE'}${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        notes: `Pesanan #${i + 1} Roxy Mas - Garansi 30 Hari Aktif (Siap Retur / Klaim Garansi)`,
        createdAt: orderCreated,
        updatedAt: completedAt,
        completedAt: completedAt,
        customerConfirmedAt: completedAt,
        warrantyExpiryDate: warrantyExpired,
        payment: {
          create: {
            amount: total,
            method: 'MIDTRANS',
            status: 'VERIFIED',
            verifiedAt: orderCreated,
            notes: 'Pembayaran Lunas via Midtrans',
          },
        },
        warranty: {
          create: {
            startDate: completedAt,
            endDate: warrantyExpired,
            isActive: true,
          },
        },
        items: {
          create: {
            type: 'PRODUCT',
            productId: product.id,
            variantId: variant?.id || null,
            variantName,
            quantity: 1,
            price: itemPrice,
            costPrice,
            subtotal: itemPrice,
            notes: `${product.name} (${variantName}) - Unit Baru Garansi Resmi Toko 30 Hari`,
          },
        },
      },
      include: {
        items: { include: { product: true } },
        store: true,
      },
    })

    createdOrders.push(newOrder)
  }

  console.log('\n======================================================')
  console.log('✅ BERHASIL SEED 3 PESANAN ROXY MAS JAKARTA:')
  console.log('======================================================')
  createdOrders.forEach((ord, idx) => {
    console.log(`\n📦 Pesanan #${idx + 1}:`)
    console.log(`   - Order Number     : #${ord.orderNumber}`)
    console.log(`   - Order ID         : ${ord.id}`)
    console.log(
      `   - Toko             : ${ord.store?.name} (${ord.store?.city})`
    )
    console.log(
      `   - Produk           : ${ord.items[0]?.product?.name} (${ord.items[0]?.variantName})`
    )
    console.log(`   - Status           : ${ord.status} (Selesai Diterima)`)
    console.log(
      `   - Waktu Selesai    : ${ord.completedAt?.toLocaleString('id-ID')}`
    )
    console.log(
      `   - Garansi Berlaku  : s/d ${ord.warrantyExpiryDate?.toLocaleString('id-ID')} (Aktif 30 Hari)`
    )
    console.log(
      `   - Total            : Rp ${ord.total.toLocaleString('id-ID')}`
    )
    console.log(`   - Link Detail      : /dashboard/customer/orders/${ord.id}`)
  })
  console.log('======================================================\n')
}

main()
  .catch((err) => {
    console.error('❌ Error seeding orders:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
