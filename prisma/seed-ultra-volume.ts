import prisma from '../src/lib/db'
import {
  OrderStatus,
  CartItemType,
  PaymentMethod,
  PaymentStatus,
  ReviewType,
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
  d.setDate(d.getDate() - randomInt(1, daysBack))
  d.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59))
  return d
}

async function main() {
  console.log('⚡ MEMULAI SEED ULTRA VOLUME (BOOSTING PRODUK, ORDER, RETUR, KOMEN, KOMPLAIN)...')
  console.time('Ultra Volume Time')

  const stores = await prisma.store.findMany()
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' } })
  const existingProducts = await prisma.product.findMany({ include: { variants: true } })

  // 1. ADD 80 NEW PRODUCTS (GAMING PHONES, ACCESSORIES, WEARABLES, SMART AUDIO)
  console.log('📱 1. Menambahkan 75+ Model Gadget Tambahan & Ratusan Varian...')
  const gadgetCategories = [
    {
      brand: 'Asus ROG',
      modelPrefix: 'ROG Phone 8 Pro Edition',
      category: 'Smartphone',
      basePrice: 16999000,
      costPrice: 14500000,
      desc: 'Ponsel gaming bertenaga Snapdragon 8 Gen 3 dengan AniMe Vision LED & pendingin AeroActive Cooler X.',
      img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
      specs: { Chipset: 'Snapdragon 8 Gen 3', Layar: 'AMOLED 165Hz LTPO', Baterai: '5500 mAh 65W' },
      variantNames: ['16GB/512GB - Phantom Black', '24GB/1TB - Edition Pro'],
    },
    {
      brand: 'Xiaomi',
      modelPrefix: 'Xiaomi 14 Ultra Leica Optics',
      category: 'Smartphone',
      basePrice: 15499000,
      costPrice: 13200000,
      desc: 'Ponsel fotografi legendaris quad-camera Leica 1-inch sensor dengan aperture variabel kontinu f/1.63-f/4.0.',
      img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
      specs: { Kamera: 'Quad 50MP Leica Vario-Summilux', Layar: '6.73 inch WQHD+ AMOLED 120Hz', Baterai: '5000 mAh 90W' },
      variantNames: ['16GB/512GB - Black Leather', '16GB/512GB - White Ceramic'],
    },
    {
      brand: 'Vivo',
      modelPrefix: 'Vivo X100 Pro ZEISS Edition',
      category: 'Smartphone',
      basePrice: 14999000,
      costPrice: 12800000,
      desc: 'Kamera telefoto APO 100mm bersertifikasi ZEISS dengan chip imaging V3 dan Dimensity 9300 terkencang.',
      img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      specs: { Chipset: 'MediaTek Dimensity 9300', Kamera: 'ZEISS APO Telephoto 50MP', Layar: '6.78 inch LTPO AMOLED' },
      variantNames: ['16GB/512GB - Asteroid Black', '16GB/512GB - Sunset Orange'],
    },
    {
      brand: 'Sony',
      modelPrefix: 'Sony WH-1000XM5 Wireless Headphones',
      category: 'Audio',
      basePrice: 4799000,
      costPrice: 3900000,
      desc: 'Headphone peredam bising terbaik industri dengan prosesor ganda V1 dan HD Noise Cancelling Processor QN1.',
      img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      specs: { Baterai: '30 Jam ANC ON', Fitur: 'Auto NC Optimizer, LDAC High-Res', Berat: '250 gram' },
      variantNames: ['Black Matte', 'Silver Platinum', 'Midnight Blue'],
    },
    {
      brand: 'Apple',
      modelPrefix: 'AirPods Pro Gen 2 USB-C MagSafe',
      category: 'Audio',
      basePrice: 3499000,
      costPrice: 2850000,
      desc: 'TWS dengan Chip H2, Adaptive Audio peredam kebisingan 2x lipat lebih senyap, dan casing ber-port USB-C.',
      img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
      specs: { Chip: 'Apple H2', Fitur: 'Active Noise Cancellation, Transparency Mode', Port: 'USB-C MagSafe' },
      variantNames: ['Standard USB-C White'],
    },
    {
      brand: 'Samsung',
      modelPrefix: 'Galaxy Watch 6 Classic LTE 47mm',
      category: 'Smartwatch',
      basePrice: 5299000,
      costPrice: 4300000,
      desc: 'Smartwatch bezel putar ikonik berbahan stainless steel dengan sensor analisis komposisi tubuh BIA.',
      img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      specs: { Bezel: 'Rotating Bezel', Layar: 'Super AMOLED 1.5 inch Sapphire', Koneksi: 'LTE Standalone' },
      variantNames: ['Black 47mm', 'Silver 47mm'],
    },
    {
      brand: 'Anker',
      modelPrefix: 'Anker Prime 20,000mAh Powerbank 200W',
      category: 'Aksesoris',
      basePrice: 1799000,
      costPrice: 1350000,
      desc: 'Powerbank ultra kencang 200W output ganda USB-C yang sanggup mengisi daya 2 unit MacBook Pro sekaligus.',
      img: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=800&q=80',
      specs: { Kapasitas: '20,000mAh / 72Wh', Output: 'Single port maks 100W, Total 200W', Display: 'Smart Digital Display' },
      variantNames: ['Space Gray Anodized'],
    },
  ]

  for (let i = 0; i < 75; i++) {
    const template = gadgetCategories[i % gadgetCategories.length]
    const store = stores[i % stores.length]
    const prodNumber = i + 1
    const name = `${template.brand} ${template.modelPrefix} #${prodNumber}`
    const price = template.basePrice + (randomInt(-2, 5) * 100000)
    const costPrice = template.costPrice + (randomInt(-2, 4) * 100000)

    const createdProd = await prisma.product.create({
      data: {
        storeId: store.id,
        name,
        description: template.desc,
        category: template.category,
        brand: template.brand,
        model: template.modelPrefix,
        condition: 'BARU',
        price,
        costPrice,
        originalPrice: price * 1.15,
        stock: randomInt(15, 60),
        weightGram: randomInt(300, 1200),
        pricePerKg: 20000,
        images: [template.img],
        specs: template.specs,
        warrantyDays: 30,
        includesCharger: true,
        includesScreenProtector: true,
        includesCase: true,
        rating: 4.8 + Math.random() * 0.2,
        totalReview: randomInt(10, 50),
        isActive: true,
      } as any,
    })

    for (const vName of template.variantNames) {
      await prisma.productVariant.create({
        data: {
          productId: createdProd.id,
          name: vName,
          price,
          costPrice,
          stock: randomInt(5, 25),
          sku: `SKU-${createdProd.id.substring(0, 5)}-${randomInt(100, 999)}`,
        } as any,
      })
    }
  }

  // Refresh products list after adding new ones
  const allProducts = await prisma.product.findMany({ include: { variants: true } })
  console.log(`📦 Total Produk Sekarang: ${allProducts.length} Produk!`)

  // 2. CREATE 250 NEW ORDERS (TOTAL ~600 ORDERS)
  console.log('🛒 2. Menambahkan 250 Transaksi Pesanan Baru dengan Multi-Item...')
  const statuses: OrderStatus[] = [
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.SHIPPED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.PAID,
    OrderStatus.COMPLAINED,
    OrderStatus.CANCELLED,
    OrderStatus.PENDING_PAYMENT,
  ]

  const newOrdersCreated = []

  for (let i = 0; i < 250; i++) {
    const cust = randomElement(customers)
    const store = randomElement(stores)
    const status = randomElement(statuses)
    const prod1 = randomElement(allProducts)
    const prod2 = Math.random() > 0.5 ? randomElement(allProducts) : null

    const var1 = prod1.variants[0] || null
    const var2 = prod2 && prod2.variants.length > 0 ? prod2.variants[0] : null

    const qty1 = 1
    const qty2 = prod2 ? 1 : 0

    const subtotal = prod1.price * qty1 + (prod2 ? prod2.price * qty2 : 0)
    const dpp = Math.round(subtotal / 1.11)
    const vat = subtotal - dpp
    const commission = Math.round(subtotal * 0.02)
    const pph23 = Math.round(commission * 0.02)
    const shipping = randomElement([15000, 22000, 35000, 50000])
    const insurance = Math.round(subtotal * 0.002)
    const total = subtotal + shipping + insurance

    const orderDate = randomDate(120)
    const orderNumber = `ORD-MASIF-${Date.now().toString().slice(-6)}-${String(i + 1).padStart(4, '0')}`

    const ord = await prisma.order.create({
      data: {
        orderNumber,
        userId: cust.id,
        storeId: store.id,
        status,
        subtotal,
        tax: vat,
        dppAmount: dpp,
        vatRate: 11.0,
        taxTypeApplied: 'INCLUSIVE',
        commissionRate: 2.0,
        commissionAmount: commission,
        pph23Amount: pph23,
        pph23Rate: 2.0,
        shippingCost: shipping,
        insuranceRate: 0.2,
        insuranceFee: insurance,
        totalWeightGram: 1000,
        courierCode: randomElement(['JNE', 'GOJEK']),
        courierService: randomElement(['REG', 'YES', 'INSTANT']),
        trackingNumber: `AGY${randomInt(100000000, 999999999)}ID`,
        bonusChargerIncluded: true,
        bonusProtectorIncluded: true,
        bonusCaseIncluded: true,
        total,
        completedAt: status === OrderStatus.COMPLETED ? orderDate : null,
        createdAt: orderDate,
        updatedAt: orderDate,
      } as any,
    })

    newOrdersCreated.push(ord)

    // Items
    await prisma.orderItem.create({
      data: {
        orderId: ord.id,
        type: CartItemType.PRODUCT,
        productId: prod1.id,
        variantId: var1 ? var1.id : null,
        variantName: var1 ? var1.name : 'Standar',
        quantity: qty1,
        price: prod1.price,
        costPrice: (prod1 as any).costPrice,
        subtotal: prod1.price * qty1,
        createdAt: orderDate,
      } as any,
    })

    if (prod2) {
      await prisma.orderItem.create({
        data: {
          orderId: ord.id,
          type: CartItemType.PRODUCT,
          productId: prod2.id,
          variantId: var2 ? var2.id : null,
          variantName: var2 ? var2.name : 'Standar',
          quantity: qty2,
          price: prod2.price,
          costPrice: (prod2 as any).costPrice,
          subtotal: prod2.price * qty2,
          createdAt: orderDate,
        } as any,
      })
    }

    // Payment
    await prisma.payment.create({
      data: {
        orderId: ord.id,
        method: PaymentMethod.MANUAL_TRANSFER,
        status: ['PENDING_PAYMENT', 'CANCELLED'].includes(status) ? PaymentStatus.PENDING : PaymentStatus.VERIFIED,
        amount: total,
        verifiedAt: ['PENDING_PAYMENT', 'CANCELLED'].includes(status) ? null : orderDate,
        createdAt: orderDate,
      },
    })

    // Invoice
    await prisma.invoice.create({
      data: {
        orderId: ord.id,
        invoiceNumber: `INV/${ord.orderNumber}`,
        pdfUrl: `https://affiliategadget.com/invoices/${ord.orderNumber}.pdf`,
        createdAt: orderDate,
      },
    })

    // Warranty
    if (['COMPLETED', 'SHIPPED', 'IN_PROGRESS'].includes(status)) {
      const endDate = new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      await prisma.warranty.create({
        data: {
          orderId: ord.id,
          startDate: orderDate,
          endDate,
          isActive: endDate > new Date(),
          createdAt: orderDate,
        },
      })
    }
  }

  // 3. CREATE 80 MORE RETURN REQUESTS (TOTAL ~120)
  console.log('🔄 3. Menambahkan 80 Kasus Retur Garansi 30 Hari (ReturnRequest)...')
  const completedOrComplained = newOrdersCreated.filter(o => (['COMPLETED', 'COMPLAINED', 'SHIPPED'] as string[]).includes(o.status))

  const returnReasons = [
    'Layar sentuh tiba-tiba ghost touch di sudut kanan',
    'Baterai cepat panas dan drop dari 50% ke 10% dalam 15 menit',
    'Kamera belakang tidak bisa autofokus pada jarak dekat',
    'Speaker atas pecah saat panggilan telepon',
    'Port USB-C tidak merespons pengisian daya cepat',
    'Face ID gagal mengenali wajah setelah pembaruan sistem',
  ]

  for (let i = 0; i < Math.min(completedOrComplained.length, 80); i++) {
    const ord = completedOrComplained[i]
    const returnStatus = randomElement([
      ReturnStatus.PENDING,
      ReturnStatus.IN_REVIEW,
      ReturnStatus.APPROVED,
      ReturnStatus.COMPLETED,
      ReturnStatus.REJECTED,
    ])

    await prisma.returnRequest.create({
      data: {
        orderId: ord.id,
        userId: ord.userId,
        storeId: ord.storeId,
        type: Math.random() > 0.5 ? ReturnType.REPLACEMENT : ReturnType.REFUND,
        reason: randomElement(returnReasons),
        reasonLabel: 'Kerusakan Fungsi Hardware',
        description: 'Unit mengalami kendala teknis dalam masa proteksi garansi 30 hari tukar unit baru. Mohon diproses.',
        images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'],
        refundAmount: ord.total,
        status: returnStatus,
        storeResponse: returnStatus === ReturnStatus.APPROVED ? 'Pengajuan disetujui. Silakan kirimkan unit lengkap dengan kotak ke cabang kami.' : null,
        resolvedAt: ([ReturnStatus.COMPLETED, ReturnStatus.REJECTED] as ReturnStatus[]).includes(returnStatus) ? new Date() : null,
        createdAt: ord.createdAt,
      },
    })
  }

  // 4. CREATE 70 MORE COMPLAINTS (TOTAL ~110)
  console.log('⚠️ 4. Menambahkan 70 Komplain Layanan Pembeli (Complaint)...')
  for (let i = 0; i < Math.min(completedOrComplained.length, 70); i++) {
    const ord = completedOrComplained[i]
    const cStatus = randomElement([
      ComplaintStatus.OPEN,
      ComplaintStatus.IN_PROGRESS,
      ComplaintStatus.RESOLVED,
      ComplaintStatus.REJECTED,
    ])

    await prisma.complaint.create({
      data: {
        orderId: ord.id,
        userId: ord.userId,
        subject: `Keluhan Pengiriman & Aksesoris Pesanan #${ord.orderNumber.substring(0, 14)}`,
        description: 'Paket tiba dalam kondisi kardus luar penyok akibat kurir, mohon dicek asuransi pengirimannya.',
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'],
        status: cStatus,
        resolution: cStatus === ComplaintStatus.RESOLVED ? 'Klaim asuransi telah dicairkan dan penggantian bonus softcase telah dikirimkan ulang.' : null,
        resolvedAt: cStatus === ComplaintStatus.RESOLVED ? new Date() : null,
        createdAt: ord.createdAt,
      },
    })
  }

  // 5. CREATE 250 MORE LIVE STREAM COMMENTS (TOTAL ~340)
  console.log('💬 5. Menambahkan 250 Komentar Real-time Live Stream (LiveStreamComment)...')
  const liveStreams = await prisma.liveStream.findMany()
  if (liveStreams.length > 0) {
    const liveComments = [
      'Harga live stream ini berlaku sampai jam berapa min?',
      'Spill iPhone 15 Pro Max warna Blue Titanium dong kak!',
      'Udah checkout ya min, tolong langsung diproses via Gojek Instant!',
      'Dapat bonus case sama tempered glass juga ga kak kalau beli sekarang?',
      'Kamera zoom-nya jernih banget min!',
      'Bisa cicilan kartu kredit 0% ga min?',
      'Toko cabang Roxy Mas buka sampai jam berapa kak hari ini?',
      'Garansi 30 harinya bisa langsung klaim ke toko cabang terdekat kan ya?',
      'Apakah unitnya original garansi resmi iBox / SEIN min?',
      'Mantap min diskonnya, checkout 1 unit lagi buat kado adik!',
    ]

    const commentsToInsert = []
    for (let i = 0; i < 250; i++) {
      const stream = randomElement(liveStreams)
      const cust = randomElement(customers)
      commentsToInsert.push({
        streamId: stream.id,
        userName: cust.name || 'Penonton Setia',
        userAvatar: cust.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cust.name}`,
        message: randomElement(liveComments),
        isPinned: Math.random() > 0.95,
        createdAt: randomDate(2),
      })
    }
    await prisma.liveStreamComment.createMany({ data: commentsToInsert })
  }

  // 6. CREATE 150 MORE PRODUCT REVIEWS (TOTAL ~420)
  console.log('⭐ 6. Menambahkan 150 Ulasan Produk Bintang 5 Tambahan...')
  const reviewsToInsert = []
  for (let i = 0; i < 150; i++) {
    const prod = randomElement(allProducts)
    const cust = randomElement(customers)
    reviewsToInsert.push({
      userId: cust.id,
      productId: prod.id,
      storeId: prod.storeId,
      type: ReviewType.PRODUCT,
      rating: randomInt(4, 5),
      comment: 'Barang sampai dengan sangat aman, packing bubble wrap tebal dan kurir cepat. Kondisi mulus seperti baru keluar pabrik. Terima kasih!',
      variantName: 'Standar Resmi',
      sellerReply: 'Terima kasih atas kepercayaannya berbelanja di jaringan toko fisik Multi-PT kami kak! Selamat menikmati gadget barunya 🙏',
      sellerReplyAt: new Date(),
      helpfulCount: randomInt(2, 20),
      createdAt: randomDate(60),
    })
  }
  await prisma.review.createMany({ data: reviewsToInsert })

  // 7. CREATE 80 MORE CART ITEMS
  console.log('🛒 7. Menambah Isi Keranjang Belanja Pelanggan (CartItem)...')
  const carts = await prisma.cart.findMany()
  for (let i = 0; i < Math.min(carts.length, 50); i++) {
    const c = carts[i]
    const prod = randomElement(allProducts)
    await prisma.cartItem.create({
      data: {
        cartId: c.id,
        type: CartItemType.PRODUCT,
        productId: prod.id,
        quantity: randomInt(1, 3),
      },
    }).catch(() => {})
  }

  console.timeEnd('Ultra Volume Time')
  console.log('🚀 SEED ULTRA VOLUME SUKSES 100% TANPA KENDALA!')
}

main()
  .catch((e) => {
    console.error('❌ Error Ultra Volume:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
