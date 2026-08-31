import { PrismaClient } from '@prisma/client'

// Local database
const prismaLocal = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/affiliate_gadget',
    },
  },
})

// Neon database
const prismaNeon = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_A1RSuEpmTU2q@ep-autumn-frost-a1cu3c3n-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
})

async function copyDatabase() {
  console.log('🔄 Starting database copy from local to Neon...\\n')

  try {
    // Copy Users
    console.log('📦 Copying Users...')
    const users = await prismaLocal.user.findMany()
    for (const user of users) {
      await prismaNeon.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      })
    }
    console.log(`✅ Copied ${users.length} users`)

    // Copy Technicians
    console.log('📦 Copying Technicians...')
    const technicians = await prismaLocal.technician.findMany()
    for (const tech of technicians) {
      await prismaNeon.technician.upsert({
        where: { id: tech.id },
        update: tech,
        create: tech,
      })
    }
    console.log(`✅ Copied ${technicians.length} technicians`)

    // Copy Services
    console.log('📦 Copying Services...')
    const services = await prismaLocal.service.findMany()
    for (const service of services) {
      await prismaNeon.service.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      })
    }
    console.log(`✅ Copied ${services.length} services`)

    // Copy Products
    console.log('📦 Copying Products...')
    const products = await prismaLocal.product.findMany()
    for (const product of products) {
      await prismaNeon.product.upsert({
        where: { id: product.id },
        update: product as any,
        create: product as any,
      })
    }
    console.log(`✅ Copied ${products.length} products`)

    // Copy Rental Items
    console.log('📦 Copying Rental Items...')
    const rentalItems = await prismaLocal.rentalItem.findMany()
    for (const item of rentalItems) {
      await prismaNeon.rentalItem.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      })
    }
    console.log(`✅ Copied ${rentalItems.length} rental items`)

    // Copy Mitras
    console.log('📦 Copying Mitras...')
    const mitras = await prismaLocal.mitra.findMany()
    for (const mitra of mitras) {
      await prismaNeon.mitra.upsert({
        where: { id: mitra.id },
        update: mitra,
        create: mitra,
      })
    }
    console.log(`✅ Copied ${mitras.length} mitras`)

    // Copy Mitra Services
    console.log('📦 Copying Mitra Services...')
    const mitraServices = await prismaLocal.mitraService.findMany()
    for (const service of mitraServices) {
      await prismaNeon.mitraService.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      })
    }
    console.log(`✅ Copied ${mitraServices.length} mitra services`)

    // Copy Articles
    console.log('📦 Copying Articles...')
    const articles = await prismaLocal.article.findMany()
    for (const article of articles) {
      await prismaNeon.article.upsert({
        where: { id: article.id },
        update: article,
        create: article,
      })
    }
    console.log(`✅ Copied ${articles.length} articles`)

    // Copy Orders
    console.log('📦 Copying Orders...')
    const orders = await prismaLocal.order.findMany()
    for (const order of orders) {
      await prismaNeon.order.upsert({
        where: { id: order.id },
        update: order,
        create: order,
      })
    }
    console.log(`✅ Copied ${orders.length} orders`)

    // Copy Order Items
    console.log('📦 Copying Order Items...')
    const orderItems = await prismaLocal.orderItem.findMany()
    for (const item of orderItems) {
      await prismaNeon.orderItem.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      })
    }
    console.log(`✅ Copied ${orderItems.length} order items`)

    // Copy Payments
    console.log('📦 Copying Payments...')
    const payments = await prismaLocal.payment.findMany()
    for (const payment of payments) {
      await prismaNeon.payment.upsert({
        where: { id: payment.id },
        update: payment,
        create: payment,
      })
    }
    console.log(`✅ Copied ${payments.length} payments`)

    // Copy Reviews
    console.log('📦 Copying Reviews...')
    const reviews = await prismaLocal.review.findMany()
    for (const review of reviews) {
      await prismaNeon.review.upsert({
        where: { id: review.id },
        update: review,
        create: review,
      })
    }
    console.log(`✅ Copied ${reviews.length} reviews`)

    console.log('\\n✅ Database copy completed successfully!')
  } catch (error) {
    console.error('❌ Error copying database:', error)
    throw error
  } finally {
    await prismaLocal.$disconnect()
    await prismaNeon.$disconnect()
  }
}

copyDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
