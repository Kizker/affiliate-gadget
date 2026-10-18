import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log(
    '🚀 Seeding pesanan pembelian dengan garansi kadaluarsa (> 30 hari)...'
  )

  // 1. Ambil Toko dan Produk aktif
  const store = await prisma.store.findFirst({
    where: { isActive: true },
    include: {
      products: {
        where: { isActive: true },
        include: { variants: true },
      },
    },
  })

  if (!store || store.products.length === 0) {
    throw new Error('Toko atau produk aktif tidak ditemukan!')
  }

  const product = store.products[0]
  const variant = product.variants[0]
  const itemPrice = variant?.price || product.price || 15499000
  const costPrice =
    variant?.costPrice || product.costPrice || Math.round(itemPrice * 0.85)
  const variantName = variant?.name || '256GB Titanium Gray'

  // 2. Daftar akun customer target (customer@test.com dan fauzan223360@gmail.com)
  const targetCustomers = await prisma.user.findMany({
    where: {
      OR: [{ email: 'customer@test.com' }, { email: 'fauzan223360@gmail.com' }],
    },
  })

  if (targetCustomers.length === 0) {
    throw new Error('Customer target tidak ditemukan di database!')
  }

  // Waktu: Pembelian 1 September 2026, Selesai 3 September 2026, Garansi 30 Hari Habis pada 3 Oktober 2026
  // Hari ini (pertengahan Oktober 2026) -> Garansi sudah lewat > 14 hari!
  const orderCreated = new Date('2026-09-01T08:30:00.000Z')
  const orderCompleted = new Date('2026-09-03T15:00:00.000Z')
  const warrantyExpired = new Date('2026-10-03T15:00:00.000Z')

  for (const customer of targetCustomers) {
    const orderNumber =
      customer.email === 'customer@test.com'
        ? 'SPR-20260901-EXPWARR1'
        : 'SPR-20260901-EXPWARR2'

    // Hapus data lama jika sudah pernah di-seed agar idempotent
    await prisma.orderItem.deleteMany({
      where: { order: { orderNumber } },
    })
    await prisma.payment.deleteMany({
      where: { order: { orderNumber } },
    })
    await prisma.warranty.deleteMany({
      where: { order: { orderNumber } },
    })
    await prisma.order.deleteMany({
      where: { orderNumber },
    })

    const subtotal = itemPrice
    const shippingCost = 35000
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
        courierCode: 'JNE',
        courierService: 'REG',
        trackingNumber: 'JNE901122334455',
        notes: 'Pesanan Gadget Selesai dengan Garansi Habis (> 30 hari)',
        createdAt: orderCreated,
        updatedAt: orderCompleted,
        completedAt: orderCompleted,
        customerConfirmedAt: orderCompleted,
        warrantyExpiryDate: warrantyExpired,
        payment: {
          create: {
            amount: total,
            method: 'MIDTRANS',
            status: 'VERIFIED',
            verifiedAt: orderCreated,
            notes: 'Pembayaran Lunas Otomatis - Seed Expired Warranty Order',
          },
        },
        warranty: {
          create: {
            startDate: orderCompleted,
            endDate: warrantyExpired,
            isActive: false,
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
            notes: `${product.name} (${variantName}) - Unit Resmi Toko`,
          },
        },
      },
      include: {
        items: { include: { product: true } },
        payment: true,
        warranty: true,
      },
    })

    console.log(
      `✅ Berhasil seed order garansi kadaluarsa untuk ${customer.email}:`
    )
    console.log(`   - Order Number        : ${newOrder.orderNumber}`)
    console.log(`   - Status              : ${newOrder.status}`)
    console.log(
      `   - Tanggal Selesai     : ${newOrder.completedAt?.toISOString()}`
    )
    console.log(
      `   - Masa Garansi Habis  : ${newOrder.warrantyExpiryDate?.toISOString()}`
    )
    console.log(
      `   - Total               : Rp ${newOrder.total.toLocaleString('id-ID')}`
    )
    console.log(
      `   - Produk              : ${newOrder.items[0]?.product?.name}\n`
    )
  }

  console.log('🎉 Selesai seeding order dengan garansi kadaluarsa (> 30 hari)!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
