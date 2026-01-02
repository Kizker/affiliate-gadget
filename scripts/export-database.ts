import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function exportDatabase() {
  console.log('🔄 Exporting database...\n')

  try {
    // Export all data from existing models
    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    }

    // Users (tanpa password untuk keamanan - default password akan digenerate saat seed)
    console.log('   Exporting users...')
    data.users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        isActive: true,
        mitraStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Technicians - export all fields
    console.log('   Exporting technicians...')
    data.technicians = await prisma.technician.findMany({
      select: {
        id: true,
        userId: true,
        bio: true,
        experience: true,
        specialties: true,
        rating: true,
        totalReview: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Products (Spareparts) - include category
    console.log('   Exporting products...')
    data.products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        brand: true,
        model: true,
        price: true,
        stock: true,
        images: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Services - include all correct fields
    console.log('   Exporting services...')
    data.services = await prisma.service.findMany({
      select: {
        id: true,
        technicianId: true,
        name: true,
        description: true,
        category: true,
        price: true,
        duration: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Rental Items
    console.log('   Exporting rental items...')
    data.rentalItems = await prisma.rentalItem.findMany()

    // Orders with items
    console.log('   Exporting orders...')
    data.orders = await prisma.order.findMany({
      include: {
        items: true,
      },
    })

    // Payments
    console.log('   Exporting payments...')
    data.payments = await prisma.payment.findMany()

    // Reviews
    console.log('   Exporting reviews...')
    data.reviews = await prisma.review.findMany()

    // Mitras with services and images
    console.log('   Exporting mitras...')
    data.mitras = await prisma.mitra.findMany({
      include: {
        services: true,
        images: true,
      },
    })

    // Articles (Blog)
    console.log('   Exporting articles...')
    data.articles = await prisma.article.findMany()

    // Bank Accounts
    console.log('   Exporting bank accounts...')
    data.bankAccounts = await prisma.bankAccount.findMany()

    // Carts with items
    console.log('   Exporting carts...')
    data.carts = await prisma.cart.findMany({
      include: {
        items: true,
      },
    })

    // Chat Rooms with messages
    console.log('   Exporting chat rooms...')
    data.chatRooms = await prisma.chatRoom.findMany({
      include: {
        messages: true,
      },
    })

    // Notifications
    console.log('   Exporting notifications...')
    data.notifications = await prisma.notification.findMany()

    // Save to file
    const outputPath = path.join(process.cwd(), 'prisma', 'seed-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

    console.log('\n✅ Database exported successfully!')
    console.log(`📁 Output file: ${outputPath}`)
    console.log('\n📊 Export summary:')

    const getLength = (arr: unknown) => (Array.isArray(arr) ? arr.length : 0)

    console.log(`   - Users: ${getLength(data.users)}`)
    console.log(`   - Technicians: ${getLength(data.technicians)}`)
    console.log(`   - Products: ${getLength(data.products)}`)
    console.log(`   - Services: ${getLength(data.services)}`)
    console.log(`   - Rental Items: ${getLength(data.rentalItems)}`)
    console.log(`   - Orders: ${getLength(data.orders)}`)
    console.log(`   - Payments: ${getLength(data.payments)}`)
    console.log(`   - Reviews: ${getLength(data.reviews)}`)
    console.log(`   - Mitras: ${getLength(data.mitras)}`)
    console.log(`   - Articles: ${getLength(data.articles)}`)
    console.log(`   - Bank Accounts: ${getLength(data.bankAccounts)}`)
    console.log(`   - Carts: ${getLength(data.carts)}`)
    console.log(`   - Chat Rooms: ${getLength(data.chatRooms)}`)
    console.log(`   - Notifications: ${getLength(data.notifications)}`)

    console.log('\n💡 Catatan untuk teman Anda:')
    console.log('   1. Copy file prisma/seed-data.json ke project mereka')
    console.log('   2. Jalankan: npx tsx prisma/seed-from-backup.ts')
    console.log('   3. Default password untuk semua user: password123')
  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

exportDatabase()
