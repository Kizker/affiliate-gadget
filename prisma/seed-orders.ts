import {
  PrismaClient,
  CartItemType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ReviewType,
} from '@prisma/client'

const prisma = new PrismaClient()

// Helper functions
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number) =>
  Math.random() * (max - min) + min
const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]
const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

// Generate order number
const generateOrderNumber = (prefix: string, index: number, date: Date) => {
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${prefix}${year}${month}${String(index).padStart(5, '0')}`
}

// Review comments
const positiveComments = [
  'Pelayanan sangat memuaskan! Teknisi sangat profesional dan ramah.',
  'Sangat puas dengan hasilnya, HP saya kembali normal seperti baru.',
  'Proses cepat dan harga terjangkau. Recommended!',
  'Teknisi sangat ahli, menjelaskan masalah dengan detail.',
  'Pengerjaan rapi dan cepat, tidak perlu menunggu lama.',
  'Barang original dan berkualitas, sesuai deskripsi.',
  'Pengiriman cepat, packaging aman.',
  'Alat berfungsi dengan baik, kondisi prima.',
  'Deposit dikembalikan tepat waktu, proses mudah.',
  'Service center terpercaya, sudah langganan.',
  'Kualitas sparepart bagus, garansi jelas.',
  'Harga bersaing, kualitas tidak diragukan.',
  'Respons cepat, koordinasi mudah.',
  'Teknisi datang tepat waktu, sangat profesional.',
  'Hasil servis memuaskan, HP jadi lebih kencang.',
]

const neutralComments = [
  'Pelayanan cukup baik, hasil sesuai ekspektasi.',
  'Proses agak lama tapi hasilnya oke.',
  'Standar sih, tidak ada yang istimewa.',
  'Harga sedikit lebih mahal dari tempat lain.',
  'Teknisi cukup kompeten.',
  'Barang sesuai deskripsi.',
  'Pengiriman normal, tidak ada kendala.',
]

const negativeComments = [
  'Waktu pengerjaan lebih lama dari estimasi.',
  'Komunikasi kurang responsif.',
  'Ada sedikit masalah tapi sudah diselesaikan.',
]

const getComment = (rating: number): string => {
  if (rating >= 4) return randomElement(positiveComments)
  if (rating >= 3) return randomElement(neutralComments)
  return randomElement(negativeComments)
}

// Notes for orders
const serviceNotes = [
  'HP mati total, tidak bisa dinyalakan',
  'Layar retak, touchscreen masih berfungsi',
  'Baterai cepat habis, perlu penggantian',
  'Speaker tidak bunyi',
  'Kamera blur, lensa kotor',
  'Port charging longgar',
  'HP sering restart sendiri',
  'Wifi tidak bisa connect',
  'Layar bergaris-garis',
  'Fingerprint error',
  'Face ID tidak berfungsi',
  'HP jatuh ke air',
  'Tombol power rusak',
  'HP lemot, perlu optimasi',
  'Update software gagal',
]

const productNotes = [
  'Mohon packaging yang aman',
  'Kirim secepatnya ya',
  'Minta bubble wrap ekstra',
  'Warna sesuai foto ya',
  'Untuk cadangan, tidak buru-buru',
]

const rentalNotes = [
  'Untuk project 3 hari',
  'Sewa untuk workshop',
  'Butuh untuk training',
  'Penggunaan pribadi',
  'Sewa untuk toko servis',
]

async function seedOrders() {
  console.log('🚀 Starting order seeding...')

  // Get existing data
  const users = await prisma.user.findMany({ where: { role: 'CUSTOMER' } })
  const technicians = await prisma.technician.findMany({
    include: { user: true, services: true },
  })
  const products = await prisma.product.findMany({ where: { isActive: true } })
  const rentalItems = await prisma.rentalItem.findMany({
    where: { isActive: true },
  })
  const mitras = await prisma.mitra.findMany({
    where: { isApproved: true, isActive: true },
  })

  if (users.length === 0) {
    console.log('❌ No customers found. Please seed users first.')
    return
  }

  console.log(
    `Found: ${users.length} customers, ${technicians.length} technicians, ${products.length} products, ${rentalItems.length} rental items, ${mitras.length} mitras`
  )

  const startDate = new Date('2023-06-01')
  const endDate = new Date('2024-12-27')

  const orderStatuses: OrderStatus[] = [
    'PENDING_PAYMENT',
    'PAID',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ]
  const completedStatuses: OrderStatus[] = ['COMPLETED']

  let serviceOrderCount = 0
  let productOrderCount = 0
  let rentalOrderCount = 0
  let reviewCount = 0

  // ===============================
  // SERVICE ORDERS (Technician)
  // ===============================
  console.log('\n📱 Creating service orders...')

  for (let i = 0; i < 80; i++) {
    const user = randomElement(users)
    const technician =
      technicians.length > 0 ? randomElement(technicians) : null
    if (!technician || technician.services.length === 0) continue

    const orderDate = randomDate(startDate, endDate)
    // More completed orders for realism
    const status =
      Math.random() < 0.7 ? 'COMPLETED' : randomElement(orderStatuses)
    const service = randomElement(technician.services)
    const quantity = randomInt(1, 2)
    const subtotal = service.price * quantity
    const tax = Math.round(subtotal * 0.11)
    const total = subtotal + tax

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(
            'SRV',
            serviceOrderCount + 1,
            orderDate
          ),
          userId: user.id,
          technicianId: technician.id,
          status,
          subtotal,
          tax,
          total,
          notes: randomElement(serviceNotes),
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: {
              type: CartItemType.SERVICE,
              serviceId: service.id,
              quantity,
              price: service.price,
              subtotal: service.price * quantity,
            },
          },
          payment:
            status !== 'PENDING_PAYMENT' && status !== 'CANCELLED'
              ? {
                  create: {
                    method:
                      Math.random() < 0.7
                        ? PaymentMethod.MANUAL_TRANSFER
                        : PaymentMethod.MIDTRANS,
                    status:
                      status === 'COMPLETED'
                        ? PaymentStatus.VERIFIED
                        : PaymentStatus.PENDING,
                    amount: total,
                    createdAt: orderDate,
                    updatedAt: orderDate,
                  },
                }
              : undefined,
        },
      })

      serviceOrderCount++

      // Create review for completed orders (80% chance)
      if (status === 'COMPLETED' && Math.random() < 0.8) {
        const rating = randomInt(3, 5)
        await prisma.review.create({
          data: {
            userId: user.id,
            orderId: order.id,
            type: ReviewType.TECHNICIAN,
            rating,
            comment: getComment(rating),
            createdAt: new Date(
              orderDate.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000
            ),
          },
        })
        reviewCount++

        // Update technician rating
        const techReviews = await prisma.review.findMany({
          where: {
            order: { technicianId: technician.id },
            type: ReviewType.TECHNICIAN,
          },
        })
        const avgRating =
          techReviews.reduce((sum, r) => sum + r.rating, 0) / techReviews.length
        await prisma.technician.update({
          where: { id: technician.id },
          data: { rating: avgRating, totalReview: techReviews.length },
        })
      }

      if (serviceOrderCount % 20 === 0)
        console.log(`  Created ${serviceOrderCount} service orders...`)
    } catch (error) {
      console.log(`  Skip duplicate order ${i}`)
    }
  }

  // ===============================
  // PRODUCT ORDERS (Sparepart)
  // ===============================
  console.log('\n🛒 Creating product orders...')

  for (let i = 0; i < 100; i++) {
    if (products.length === 0) break

    const user = randomElement(users)
    const orderDate = randomDate(startDate, endDate)
    const status =
      Math.random() < 0.75 ? 'COMPLETED' : randomElement(orderStatuses)

    // Random 1-4 products per order
    const numProducts = randomInt(1, 4)
    const selectedProducts = []
    for (let j = 0; j < numProducts; j++) {
      const product = randomElement(products)
      const quantity = randomInt(1, 3)
      selectedProducts.push({ product, quantity })
    }

    const subtotal = selectedProducts.reduce(
      (sum, p) => sum + p.product.price * p.quantity,
      0
    )
    const tax = Math.round(subtotal * 0.11)
    const total = subtotal + tax

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(
            'PRD',
            productOrderCount + 1,
            orderDate
          ),
          userId: user.id,
          status,
          subtotal,
          tax,
          total,
          notes: Math.random() < 0.3 ? randomElement(productNotes) : null,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: selectedProducts.map((p) => ({
              type: CartItemType.PRODUCT,
              productId: p.product.id,
              quantity: p.quantity,
              price: p.product.price,
              subtotal: p.product.price * p.quantity,
            })),
          },
          payment:
            status !== 'PENDING_PAYMENT' && status !== 'CANCELLED'
              ? {
                  create: {
                    method:
                      Math.random() < 0.5
                        ? PaymentMethod.MANUAL_TRANSFER
                        : PaymentMethod.MIDTRANS,
                    status:
                      status === 'COMPLETED'
                        ? PaymentStatus.VERIFIED
                        : PaymentStatus.PENDING,
                    amount: total,
                    createdAt: orderDate,
                    updatedAt: orderDate,
                  },
                }
              : undefined,
        },
      })

      productOrderCount++

      // Create review for completed orders (70% chance)
      if (status === 'COMPLETED' && Math.random() < 0.7) {
        const rating = randomInt(3, 5)
        await prisma.review.create({
          data: {
            userId: user.id,
            orderId: order.id,
            type: ReviewType.PRODUCT,
            rating,
            comment: getComment(rating),
            createdAt: new Date(
              orderDate.getTime() + randomInt(3, 14) * 24 * 60 * 60 * 1000
            ),
          },
        })
        reviewCount++
      }

      if (productOrderCount % 25 === 0)
        console.log(`  Created ${productOrderCount} product orders...`)
    } catch (error) {
      console.log(`  Skip duplicate order ${i}`)
    }
  }

  // ===============================
  // RENTAL ORDERS (Sewa Alat)
  // ===============================
  console.log('\n🔧 Creating rental orders...')

  for (let i = 0; i < 60; i++) {
    if (rentalItems.length === 0) break

    const user = randomElement(users)
    const orderDate = randomDate(startDate, endDate)
    const status =
      Math.random() < 0.65 ? 'COMPLETED' : randomElement(orderStatuses)

    const rentalItem = randomElement(rentalItems)
    const rentalDays = randomElement([1, 2, 3, 5, 7, 14, 30])

    // Apply discount based on rental duration
    let dailyRate = rentalItem.pricePerDay
    if (rentalDays >= 30) dailyRate *= 1 - rentalItem.monthlyDiscountPct / 100
    else if (rentalDays >= 7)
      dailyRate *= 1 - rentalItem.weeklyDiscountPct / 100

    const subtotal = dailyRate * rentalDays
    const tax = Math.round(subtotal * 0.11)
    const deposit = rentalItem.depositAmount || 0
    const total = subtotal + tax + deposit

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(
            'RNT',
            rentalOrderCount + 1,
            orderDate
          ),
          userId: user.id,
          status,
          subtotal: subtotal + deposit,
          tax,
          total,
          notes: randomElement(rentalNotes),
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: {
              type: CartItemType.RENTAL,
              rentalItemId: rentalItem.id,
              quantity: 1,
              rentalDays,
              price: dailyRate,
              subtotal: subtotal,
            },
          },
          payment:
            status !== 'PENDING_PAYMENT' && status !== 'CANCELLED'
              ? {
                  create: {
                    method: PaymentMethod.MANUAL_TRANSFER,
                    status:
                      status === 'COMPLETED'
                        ? PaymentStatus.VERIFIED
                        : PaymentStatus.PENDING,
                    amount: total,
                    createdAt: orderDate,
                    updatedAt: orderDate,
                  },
                }
              : undefined,
        },
      })

      rentalOrderCount++

      // Create review for completed orders (60% chance)
      if (status === 'COMPLETED' && Math.random() < 0.6) {
        const rating = randomInt(3, 5)
        await prisma.review.create({
          data: {
            userId: user.id,
            orderId: order.id,
            type: ReviewType.RENTAL,
            rating,
            comment: getComment(rating),
            createdAt: new Date(
              orderDate.getTime() +
                rentalDays * 24 * 60 * 60 * 1000 +
                randomInt(1, 3) * 24 * 60 * 60 * 1000
            ),
          },
        })
        reviewCount++
      }

      if (rentalOrderCount % 15 === 0)
        console.log(`  Created ${rentalOrderCount} rental orders...`)
    } catch (error) {
      console.log(`  Skip duplicate order ${i}`)
    }
  }

  // ===============================
  // MITRA REVIEWS
  // ===============================
  console.log('\n🏪 Creating mitra reviews...')

  let mitraReviewCount = 0
  for (const mitra of mitras) {
    const numReviews = randomInt(5, 25)
    for (let i = 0; i < numReviews; i++) {
      const user = randomElement(users)
      const rating = Math.random() < 0.8 ? randomInt(4, 5) : randomInt(2, 3)
      const reviewDate = randomDate(startDate, endDate)

      try {
        await prisma.review.create({
          data: {
            userId: user.id,
            mitraId: mitra.id,
            type: ReviewType.MITRA,
            rating,
            comment: getComment(rating),
            createdAt: reviewDate,
          },
        })
        mitraReviewCount++
      } catch (error) {
        // Skip if duplicate
      }
    }

    // Update mitra rating
    const mitraReviews = await prisma.review.findMany({
      where: { mitraId: mitra.id, type: ReviewType.MITRA },
    })
    if (mitraReviews.length > 0) {
      const avgRating =
        mitraReviews.reduce((sum, r) => sum + r.rating, 0) / mitraReviews.length
      await prisma.mitra.update({
        where: { id: mitra.id },
        data: { rating: avgRating, totalReview: mitraReviews.length },
      })
    }
  }

  console.log('\n✅ Seeding completed!')
  console.log(`📊 Summary:`)
  console.log(`   - Service Orders: ${serviceOrderCount}`)
  console.log(`   - Product Orders: ${productOrderCount}`)
  console.log(`   - Rental Orders: ${rentalOrderCount}`)
  console.log(
    `   - Total Orders: ${serviceOrderCount + productOrderCount + rentalOrderCount}`
  )
  console.log(`   - Order Reviews: ${reviewCount}`)
  console.log(`   - Mitra Reviews: ${mitraReviewCount}`)
  console.log(`   - Total Reviews: ${reviewCount + mitraReviewCount}`)
}

async function main() {
  try {
    await seedOrders()
  } catch (error) {
    console.error('Error seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
