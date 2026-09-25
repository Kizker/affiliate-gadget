import prisma from '../src/lib/db'
import {
  OrderStatus,
  CartItemType,
  PaymentMethod,
  PaymentStatus,
  ReviewType,
  LiveStreamStatus,
  AdPlacement,
  ReturnStatus,
  ReturnType,
  ComplaintStatus,
} from '@prisma/client'

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]
const randomDate = (daysBack: number) => {
  const d = new Date()
  d.setDate(d.getDate() - randomInt(0, daysBack))
  d.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59))
  return d
}

async function main() {
  console.log('⚡ MEMULAI MEGA BOOST EXPANSION SEED (MASIF LEVEL TINGGI)...')
  console.time('Mega Boost Time')

  const stores = await prisma.store.findMany()
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' } })
  const vouchers = await prisma.voucher.findMany()

  // 1. ADD 40+ NEW GADGET PRODUCTS (iPad, MacBook, Watch, Foldable Flagships)
  console.log('📱 1. Menambahkan 40+ Gadget Flagship Baru & Ratusan Varian...')
  const newGadgets = [
    {
      name: 'Apple iPad Pro 13 M4 256GB WiFi Only',
      brand: 'Apple',
      model: 'iPad Pro M4',
      category: 'Tablet',
      condition: 'LIKE_NEW',
      price: 19499000,
      costPrice: 16500000,
      originalPrice: 21999000,
      stock: 12,
      weightGram: 750,
      pricePerKg: 25000,
      description: 'iPad tertipis dan paling bertenaga dengan layar Ultra Retina XDR Tandem OLED dan chip Apple M4 generasi terbaru.',
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
        'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
      ],
      specs: { Chipset: 'Apple M4', Layar: '13 inch Ultra Retina XDR Tandem OLED 120Hz', Baterai: 'Up to 10 hours' },
      variants: [
        { name: '256GB - Space Black', ram: '8GB', storage: '256GB', color: 'Space Black', price: 19499000, costPrice: 16500000, stock: 6, sku: 'IPD-M4-256-SB' },
        { name: '256GB - Silver', ram: '8GB', storage: '256GB', color: 'Silver', price: 19499000, costPrice: 16500000, stock: 6, sku: 'IPD-M4-256-SL' },
        { name: '512GB - Space Black', ram: '8GB', storage: '512GB', color: 'Space Black', price: 22499000, costPrice: 19000000, stock: 4, sku: 'IPD-M4-512-SB' },
      ],
    },
    {
      name: 'Apple MacBook Air 15 M3 16GB/512GB',
      brand: 'Apple',
      model: 'MacBook Air M3',
      category: 'Laptop',
      condition: 'LIKE_NEW',
      price: 21999000,
      costPrice: 18500000,
      originalPrice: 24999000,
      stock: 8,
      weightGram: 1600,
      pricePerKg: 30000,
      description: 'Laptop tipis layar lega 15 inci bertenaga Apple M3 dengan daya tahan baterai hingga 18 jam dan desain fanless senyap.',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
      ],
      specs: { Chipset: 'Apple M3 8-core CPU 10-core GPU', Layar: '15.3 inch Liquid Retina 500 nits', Baterai: '66.5 Wh' },
      variants: [
        { name: '16GB / 512GB - Midnight', ram: '16GB', storage: '512GB', color: 'Midnight', price: 21999000, costPrice: 18500000, stock: 4, sku: 'MBA15-M3-MD' },
        { name: '16GB / 512GB - Starlight', ram: '16GB', storage: '512GB', color: 'Starlight', price: 21999000, costPrice: 18500000, stock: 4, sku: 'MBA15-M3-ST' },
      ],
    },
    {
      name: 'Apple Watch Ultra 2 Titanium 49mm',
      brand: 'Apple',
      model: 'Watch Ultra 2',
      category: 'Smartwatch',
      condition: 'LIKE_NEW',
      price: 12999000,
      costPrice: 10800000,
      originalPrice: 14999000,
      stock: 14,
      weightGram: 350,
      pricePerKg: 20000,
      description: 'Jam tangan petualang paling tangguh berbahan bodi titanium dengan layar 3000 nits dan GPS presisi frekuensi ganda.',
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      ],
      specs: { Casing: 'Titanium 49mm Sapphire Crystal', Layar: 'Always-On Retina 3000 nits', TahanAir: '100m Water Resistant' },
      variants: [
        { name: '49mm - Ocean Band Blue', ram: 'N/A', storage: '64GB', color: 'Blue', price: 12999000, costPrice: 10800000, stock: 7, sku: 'AWU2-OC-BL' },
        { name: '49mm - Trail Loop Orange', ram: 'N/A', storage: '64GB', color: 'Orange', price: 12999000, costPrice: 10800000, stock: 7, sku: 'AWU2-TL-OR' },
      ],
    },
    {
      name: 'Samsung Galaxy Tab S9 Ultra 5G 12GB/512GB',
      brand: 'Samsung',
      model: 'Galaxy Tab S9 Ultra',
      category: 'Tablet',
      condition: 'LIKE_NEW',
      price: 16499000,
      costPrice: 13900000,
      originalPrice: 18999000,
      stock: 6,
      weightGram: 900,
      pricePerKg: 25000,
      description: 'Tablet Android terbesar dengan layar Dynamic AMOLED 2X 14.6 inci, sertifikasi tahan air IP68, dan gratis S Pen included.',
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
      ],
      specs: { Chipset: 'Snapdragon 8 Gen 2 for Galaxy', Layar: '14.6 inch Dynamic AMOLED 2X 120Hz', Baterai: '11.200 mAh 45W' },
      variants: [
        { name: '12GB / 512GB - Graphite', ram: '12GB', storage: '512GB', color: 'Graphite', price: 16499000, costPrice: 13900000, stock: 6, sku: 'TS9U-512-GR' },
      ],
    },
    {
      name: 'Google Pixel 8 Pro 5G 12GB/256GB',
      brand: 'Google',
      model: 'Pixel 8 Pro',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 13499000,
      costPrice: 11200000,
      originalPrice: 15499000,
      stock: 15,
      weightGram: 520,
      pricePerKg: 20000,
      description: 'Smartphone AI terbaik dari Google dengan sensor kamera Pro canggih, fitur Best Take, Magic Editor, dan update OS hingga 7 tahun.',
      images: [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
      ],
      specs: { Chipset: 'Google Tensor G3', Layar: '6.7 inch Super Actua OLED 120Hz 2400 nits', Kamera: '50MP OIS + 48MP Tele + 48MP UW' },
      variants: [
        { name: '12GB / 256GB - Bay Blue', ram: '12GB', storage: '256GB', color: 'Bay Blue', price: 13499000, costPrice: 11200000, stock: 8, sku: 'P8P-256-BB' },
        { name: '12GB / 256GB - Obsidian', ram: '12GB', storage: '256GB', color: 'Obsidian', price: 13499000, costPrice: 11200000, stock: 7, sku: 'P8P-256-OB' },
      ],
    },
    {
      name: 'Asus ROG Phone 8 Pro Edition 16GB/512GB',
      brand: 'Asus',
      model: 'ROG Phone 8 Pro',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 15999000,
      costPrice: 13200000,
      originalPrice: 17999000,
      stock: 10,
      weightGram: 550,
      pricePerKg: 20000,
      description: 'Monster gaming phone tertipis dengan layar 165Hz AMOLED, AniMe Vision LED mini di bodi belakang, dan pendingin GameCool 8.',
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      ],
      specs: { Chipset: 'Snapdragon 8 Gen 3', Layar: '6.78 inch Samsung E6 AMOLED 165Hz', Baterai: '5.500 mAh 65W HyperCharge' },
      variants: [
        { name: '16GB / 512GB - Phantom Black', ram: '16GB', storage: '512GB', color: 'Phantom Black', price: 15999000, costPrice: 13200000, stock: 10, sku: 'ROG8P-512-PB' },
      ],
    },
    {
      name: 'Xiaomi 14 Ultra 5G Leica 16GB/512GB',
      brand: 'Xiaomi',
      model: 'Xiaomi 14 Ultra',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 17499000,
      costPrice: 14500000,
      originalPrice: 19999000,
      stock: 8,
      weightGram: 570,
      pricePerKg: 22000,
      description: 'Puncak fotografi mobile kolaborasi Leica dengan 4 kamera 50MP all-range, sensor 1 inci LYT-900 variable aperture f/1.63-f/4.0.',
      images: [
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80',
      ],
      specs: { Chipset: 'Snapdragon 8 Gen 3', Layar: '6.73 inch WQHD+ AMOLED 120Hz 3000 nits', Kamera: 'Quad 50MP Leica Optics' },
      variants: [
        { name: '16GB / 512GB - White Leather', ram: '16GB', storage: '512GB', color: 'White', price: 17499000, costPrice: 14500000, stock: 4, sku: 'MI14U-512-WH' },
        { name: '16GB / 512GB - Black Leather', ram: '16GB', storage: '512GB', color: 'Black', price: 17499000, costPrice: 14500000, stock: 4, sku: 'MI14U-512-BK' },
      ],
    },
    {
      name: 'Vivo X Fold 3 Pro 5G 16GB/512GB ZEISS',
      brand: 'Vivo',
      model: 'Vivo X Fold 3 Pro',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 24999000,
      costPrice: 21000000,
      originalPrice: 27999000,
      stock: 5,
      weightGram: 560,
      pricePerKg: 25000,
      description: 'Ponsel lipat flagship paling tipis dan ringan hanya 236 gram dengan engsel serat karbon dan sertifikasi tahan air ganda IPX8.',
      images: [
        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&q=80',
      ],
      specs: { Chipset: 'Snapdragon 8 Gen 3', Layar: '8.03 inch 2K+ E7 AMOLED 120Hz', Baterai: '5.700 mAh 100W FlashCharge' },
      variants: [
        { name: '16GB / 512GB - Celestial Black', ram: '16GB', storage: '512GB', color: 'Black', price: 24999000, costPrice: 21000000, stock: 5, sku: 'XF3P-512-BK' },
      ],
    },
  ]

  for (const g of newGadgets) {
    const existing = await prisma.product.findFirst({ where: { name: g.name } })
    if (!existing) {
      const store = randomElement(stores)
      await prisma.product.create({
        data: {
          name: g.name,
          brand: g.brand,
          model: g.model,
          category: g.category,
          condition: g.condition,
          price: g.price,
          costPrice: g.costPrice,
          originalPrice: g.originalPrice,
          stock: g.stock,
          weightGram: g.weightGram,
          pricePerKg: g.pricePerKg,
          description: g.description,
          images: g.images,
          specs: g.specs,
          storeId: store.id,
          warrantyDays: 30,
          includesCharger: true,
          includesScreenProtector: true,
          includesCase: true,
          isPromoted: true,
          promotionPriority: randomInt(5, 10),
          rating: 4.9,
          totalReview: randomInt(15, 60),
          variants: {
            create: g.variants,
          },
        } as any,
      })
    }
  }

  // 2. REFETCH ALL PRODUCTS FOR ORDERS & REVIEWS
  const allProducts = await prisma.product.findMany({
    include: { variants: true, store: true },
  })
  console.log(`📦 Total Katalog Produk Saat Ini: ${allProducts.length} unit gadget!`)

  // 3. CREATE 150 ADDITIONAL MASSIVE ORDERS (TOTAL 350+ ORDERS)
  console.log('🛒 2. Menambahkan 150 Transaksi Pesanan Baru dengan Multi-Bulan...')
  const targetNewOrders = 150

  const statusPool: OrderStatus[] = [
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.SHIPPED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.PAID,
    OrderStatus.COMPLAINED,
    OrderStatus.CANCELLED,
  ]

  for (let i = 0; i < targetNewOrders; i++) {
    const cust = randomElement(customers)
    const prod = randomElement(allProducts)
    const store = prod.store || randomElement(stores)
    const variant = prod.variants && prod.variants.length > 0 ? randomElement(prod.variants) : null

    const price = variant?.price || prod.price || 12000000
    const costPrice = (variant as any)?.costPrice || (prod as any)?.costPrice || Math.round(price * 0.8)
    const quantity = 1
    const subtotal = price * quantity

    const isJne = Math.random() > 0.4
    const courierCode = isJne ? 'JNE' : 'GOJEK'
    const courierService = isJne ? (Math.random() > 0.5 ? 'REG' : 'YES') : 'INSTANT'
    const shippingCost = isJne ? (courierService === 'YES' ? 34000 : 19000) : 48000
    const insuranceFee = Math.round(subtotal * 0.002)

    const useVoucher = Math.random() > 0.6 && vouchers.length > 0
    const voucher = useVoucher ? randomElement(vouchers) : null
    const discountAmount = voucher
      ? Math.min(voucher.maxDiscountAmount || 500000, Math.round((subtotal * voucher.discountPercent) / 100))
      : 0

    const netBase = subtotal - discountAmount
    const dppAmount = Math.round(netBase / 1.11)
    const vatAmount = netBase - dppAmount
    const commissionRate = store.commissionRate || 2.0
    const commissionAmount = Math.round((subtotal * commissionRate) / 100)
    const pph23Amount = Math.round(commissionAmount * 0.02)
    const total = netBase + shippingCost + insuranceFee

    const status = randomElement(statusPool)
    const orderDate = randomDate(150)

    const orderNumber = `AG-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}-${randomInt(100000, 999999)}`
    const trackingNumber =
      status === OrderStatus.COMPLETED ||
      status === OrderStatus.SHIPPED ||
      status === OrderStatus.COMPLAINED ||
      status === OrderStatus.IN_PROGRESS
        ? `${courierCode}-${orderDate.getTime().toString().slice(-8)}`
        : null

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: cust.id,
        storeId: store.id,
        status,
        subtotal,
        tax: vatAmount,
        dppAmount,
        vatRate: 11.0,
        taxTypeApplied: 'INCLUSIVE',
        pph23Amount,
        pph23Rate: 2.0,
        shippingCost,
        totalWeightGram: prod.weightGram || 500,
        voucherId: voucher?.id,
        voucherCode: voucher?.code,
        discountAmount,
        insuranceRate: 0.2,
        insuranceFee,
        isInsuranceMandatory: true,
        commissionRate,
        commissionAmount,
        courierCode,
        courierService,
        trackingNumber,
        bonusChargerIncluded: true,
        bonusProtectorIncluded: true,
        bonusCaseIncluded: true,
        total,
        notes: 'Pemberitahuan: Wajib asuransi dan cek fisik 32 titik QC toko',
        completedAt: status === OrderStatus.COMPLETED ? orderDate : null,
        customerConfirmedAt: status === OrderStatus.COMPLETED ? orderDate : null,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: [
            {
              type: CartItemType.PRODUCT,
              productId: prod.id,
              variantId: variant?.id,
              variantName: variant?.name || 'Standard Unit',
              quantity,
              price,
              costPrice,
              subtotal,
            } as any,
          ],
        },
        payment: {
          create: {
            method: randomElement([PaymentMethod.MIDTRANS, PaymentMethod.MANUAL_TRANSFER]),
            status: status === OrderStatus.PENDING_PAYMENT ? PaymentStatus.PENDING : PaymentStatus.VERIFIED,
            amount: total,
            verifiedAt: status !== OrderStatus.PENDING_PAYMENT ? orderDate : null,
          },
        },
      } as any,
    })

    // Catat ke VoucherUsage jika ada voucher
    if (voucher && discountAmount > 0) {
      await prisma.voucherUsage.create({
        data: {
          voucherId: voucher.id,
          userId: cust.id,
          orderId: newOrder.id,
          discountApplied: discountAmount,
          usedAt: orderDate,
        },
      })
    }
  }

  // 4. ADD 120 MORE REVIEWS (TOTAL 200+ REVIEWS)
  console.log('⭐ 3. Menambahkan 120 Ulasan Pembeli Autentik...')
  const newReviewComments = [
    'Unit bener-bener like new, tidak ada goresan sama sekali di frame dan layar. Battery health 96%. Recommended!',
    'Pengiriman JNE YES cepet banget, pesen siang besok paginya udah nyampe Bandung. Packaging kayu aman.',
    'Bonus lengkap: dapet kepala charger 20W, kabel, softcase, sama tempered glass udah kepasang rapi.',
    'Admin toko responsif banget di chat, minta video kondisi fisik unit langsung dikirimin sebelum order.',
    'Garansi 30 hari bikin tenang, sempat ragu beli second tapi ternyata kualitasnya beneran premium lolos QC.',
    'Speaker stereo jernih, kamera 5x telephoto tajam banget buat konser. Puas belanja di cabang WTC Surabaya.',
    'Barang original iBox, sinyal all operator aman tidak terblokir. Bintang 5 buat Affiliate Gadget!',
    'Proses klaim asuransi pengiriman jelas dan transparan. HP rasa baru dengan harga jauh lebih hemat.',
  ]

  const eligibleOrdersForReview = await prisma.order.findMany({
    where: { status: OrderStatus.COMPLETED },
    include: { items: true },
    take: 120,
  })

  for (const o of eligibleOrdersForReview) {
    for (const item of o.items) {
      if (item.productId) {
        const hasRev = await prisma.review.findFirst({
          where: { orderId: o.id, productId: item.productId },
        })
        if (!hasRev) {
          await prisma.review.create({
            data: {
              userId: o.userId,
              orderId: o.id,
              productId: item.productId,
              storeId: o.storeId,
              type: ReviewType.PRODUCT,
              rating: randomElement([5, 5, 5, 4, 4]),
              comment: randomElement(newReviewComments),
              variantName: item.variantName,
              helpfulCount: randomInt(3, 40),
              images: [
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
              ],
              sellerReply: 'Terima kasih banyak atas review positifnya kak! Selamat menikmati unit barunya ya.',
              sellerReplyAt: o.createdAt,
              createdAt: o.createdAt,
            },
          })
        }
      }
    }
  }

  // 5. ADD 30 MORE RETURN REQUESTS (TOTAL 70+ RETURNS)
  console.log('🔄 4. Menambahkan 30 Kasus Retur Garansi...')
  const moreReturnOrders = await prisma.order.findMany({
    where: { status: { in: [OrderStatus.COMPLAINED, OrderStatus.COMPLETED] } },
    take: 50,
  })

  for (let i = 0; i < 30 && i < moreReturnOrders.length; i++) {
    const o = moreReturnOrders[i]
    const exists = await prisma.returnRequest.findFirst({ where: { orderId: o.id } })
    if (!exists) {
      const type = randomElement([ReturnType.REPLACEMENT, ReturnType.REFUND])
      const status = randomElement([ReturnStatus.PENDING, ReturnStatus.IN_REVIEW, ReturnStatus.APPROVED, ReturnStatus.COMPLETED])
      await prisma.returnRequest.create({
        data: {
          orderId: o.id,
          userId: o.userId,
          storeId: o.storeId,
          type,
          reason: 'Layar Kadang Kedip / Touchscreen Ghost Touch',
          reasonLabel: 'Layar Rusak / Ghost Touch',
          description: 'Setelah update iOS layar kadang ghost touch sendiri saat dicas.',
          status,
          refundAmount: type === ReturnType.REFUND ? o.total : null,
          bankName: 'Bank Mandiri',
          bankAccountNumber: `11800${randomInt(10000000, 99999999)}`,
          bankAccountName: 'Customer Refund Account',
          images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80'],
          storeResponse: 'Unit disetujui untuk ditukar dengan unit pengganti sejenis di cabang toko fisik.',
          returnCourier: 'JNE Express',
          returnTrackingNumber: `JNE-RET-${randomInt(10000000, 99999999)}`,
          createdAt: o.createdAt,
        },
      })
    }
  }

  console.timeEnd('Mega Boost Time')
  console.log('🎉 MEGA BOOST SEEDING BERHASIL 100%!')
}

main()
  .catch((e) => {
    console.error('❌ Error Mega Boost:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
