import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Menyiapkan seeder pesanan berstatus COMPLETED...')

  // 1. Ambil customer utama customer@test.com
  const customer = await prisma.user.findUnique({
    where: { email: 'customer@test.com' },
    include: { addresses: true },
  })

  if (!customer) {
    throw new Error('Customer customer@test.com tidak ditemukan!')
  }

  // 2. Ambil toko-toko aktif
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    include: {
      products: {
        where: { isActive: true },
        include: { variants: true },
      },
    },
    take: 5,
  })

  if (stores.length === 0) {
    throw new Error('Tidak ada toko aktif ditemukan!')
  }

  console.log(
    `✅ Ditemukan ${stores.length} toko aktif untuk seeding pesanan selesai.`
  )

  const now = new Date()
  const createdOrders: any[] = []

  // Buat pesanan selesai di setiap toko aktif
  for (const store of stores) {
    if (!store.products || store.products.length === 0) continue

    // Buat 2 pesanan selesai per toko
    for (let i = 0; i < Math.min(2, store.products.length); i++) {
      const product = store.products[i]
      const variant = product.variants?.[0]
      const itemPrice =
        variant?.price || product.price || 12000000 + i * 2500000
      const costPrice =
        variant?.costPrice || product.costPrice || Math.round(itemPrice * 0.85)
      const variantName = variant?.name || 'Varian Resmi'

      const completedHoursAgo = (createdOrders.length + 1) * 2
      const completedAt = new Date(
        now.getTime() - completedHoursAgo * 3600 * 1000
      )
      const orderCreated = new Date(completedAt.getTime() - 24 * 3600 * 1000)
      const warrantyExpired = new Date(
        completedAt.getTime() + 30 * 24 * 3600 * 1000
      )

      const storeCode = (store.city || store.name || 'GADGET')
        .replace(/[^A-Z0-9]/gi, '')
        .slice(0, 4)
        .toUpperCase()
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const orderNumber = `SPR-${dateStr}-${storeCode}${randomSuffix}`

      const subtotal = itemPrice
      const shippingCost = 25000
      const insuranceFee = Math.round(subtotal * 0.0025)
      const total = subtotal + shippingCost + insuranceFee

      const isInstant = i % 2 === 0
      const courierCode = isInstant ? 'GOJEK' : 'JNE'
      const courierService = isInstant ? 'INSTANT' : 'REG'
      const trackingNumber = `${courierCode}${Math.floor(100000000000 + Math.random() * 900000000000)}`

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
          courierCode,
          courierService,
          trackingNumber,
          notes: `Pesanan Selesai Diterima - ${store.name} (Garansi 30 Hari Aktif)`,
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
              notes: 'Pembayaran Lunas via Midtrans Escrow',
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
              notes: `${product.name} (${variantName}) - Unit Baru Bergaransi Toko 30 Hari`,
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
  }

  console.log('\n======================================================')
  console.log(
    `✅ BERHASIL SEED ${createdOrders.length} PESANAN STATUS COMPLETED:`
  )
  console.log('======================================================')
  createdOrders.forEach((ord, idx) => {
    console.log(
      `\n📦 [${idx + 1}/${createdOrders.length}] Pesanan #${ord.orderNumber}:`
    )
    console.log(`   - ID             : ${ord.id}`)
    console.log(`   - Toko           : ${ord.store?.name} (${ord.store?.city})`)
    console.log(
      `   - Produk         : ${ord.items[0]?.product?.name} (${ord.items[0]?.variantName})`
    )
    console.log(`   - Status         : ${ord.status} (Selesai Diterima)`)
    console.log(
      `   - Kurir & Resi   : ${ord.courierCode} - ${ord.trackingNumber}`
    )
    console.log(
      `   - Garansi 30 Hari: Aktif s/d ${ord.warrantyExpiryDate?.toLocaleString('id-ID')}`
    )
    console.log(`   - Total          : Rp ${ord.total.toLocaleString('id-ID')}`)
    console.log(`   - Link Detail    : /dashboard/customer/orders/${ord.id}`)
  })
  console.log('======================================================\n')
}

main()
  .catch((err) => {
    console.error('❌ Error seeding completed orders:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
