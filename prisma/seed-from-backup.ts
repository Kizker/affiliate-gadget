import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Default password for all users
const DEFAULT_PASSWORD = 'password123'

// Flexible interface to handle different export formats
interface SeedData {
  exportedAt: string
  version: string
  users: Array<Record<string, unknown>>
  technicians: Array<Record<string, unknown>>
  products: Array<Record<string, unknown>>
  services: Array<Record<string, unknown>>
  rentalItems: unknown[]
  orders: Array<Record<string, unknown>>
  payments: unknown[]
  reviews: Array<Record<string, unknown>>
  mitras: unknown[]
  articles: unknown[]
  bankAccounts: unknown[]
  carts: unknown[]
  chatRooms: Array<Record<string, unknown>>
  notifications: unknown[]
}

async function seedFromBackup() {
  console.log('🌱 Seeding database from backup...\n')

  try {
    // Read seed data
    const dataPath = path.join(process.cwd(), 'prisma', 'seed-data.json')

    if (!fs.existsSync(dataPath)) {
      console.error('❌ Error: prisma/seed-data.json not found!')
      console.log(
        '   Please copy the seed-data.json file to the prisma folder first.'
      )
      process.exit(1)
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8')
    const data: SeedData = JSON.parse(rawData)

    console.log(`📅 Backup from: ${data.exportedAt}`)
    console.log(`📦 Version: ${data.version}\n`)

    // Hash default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...')
    await prisma.chatMessage.deleteMany()
    await prisma.chatRoom.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.review.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.mitraImage.deleteMany()
    await prisma.mitraService.deleteMany()
    await prisma.mitra.deleteMany()
    await prisma.service.deleteMany()
    await prisma.product.deleteMany()
    await prisma.rentalItem.deleteMany()
    await prisma.technician.deleteMany()
    await prisma.article.deleteMany()
    await prisma.bankAccount.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
    console.log('   ✓ Existing data cleared\n')

    // Seed Users
    console.log('👤 Seeding users...')
    for (const user of data.users) {
      await prisma.user.create({
        data: {
          id: user.id as string,
          name: user.name as string | null,
          email: user.email as string,
          password: hashedPassword,
          image: user.image as string | null,
          role: user.role as string as
            | 'CUSTOMER'
            | 'ADMIN'
            | 'SUPER_ADMIN'
            | 'MITRA',
          phone: user.phone as string | null,
          address: user.address as string | null,
          city: user.city as string | null,
          province: user.province as string | null,
          postalCode: user.postalCode as string | null,
          isActive: user.isActive as boolean,
          mitraStatus: user.mitraStatus as
            | 'PENDING'
            | 'APPROVED'
            | 'REJECTED'
            | null,
          createdAt: new Date(user.createdAt as string),
          updatedAt: new Date(user.updatedAt as string),
        },
      })
    }
    console.log(`   ✓ ${data.users.length} users seeded`)

    // Seed Technicians
    console.log('🔧 Seeding technicians...')
    for (const tech of data.technicians) {
      await prisma.technician.create({
        data: {
          id: tech.id as string,
          userId: tech.userId as string,
          bio: (tech.bio ?? tech.about ?? null) as string | null,
          experience: (tech.experience ?? 0) as number,
          specialties: (tech.specialties ?? tech.skills ?? []) as string[],
          rating: (tech.rating ?? 0) as number,
          totalReview: (tech.totalReview ?? tech.totalReviews ?? 0) as number,
          isAvailable: (tech.isAvailable ?? true) as boolean,
        },
      })
    }
    console.log(`   ✓ ${data.technicians.length} technicians seeded`)

    // Seed Products
    console.log('📦 Seeding products...')
    for (const product of data.products) {
      await prisma.product.create({
        data: {
          id: product.id as string,
          name: product.name as string,
          description: product.description as string | null,
          category: (product.category ?? 'Lainnya') as string,
          brand: product.brand as string | null,
          model: product.model as string | null,
          price: product.price as number,
          stock: (product.stock ?? 0) as number,
          images: (product.images ?? []) as string[],
          isActive: (product.isActive ?? true) as boolean,
        },
      })
    }
    console.log(`   ✓ ${data.products.length} products seeded`)

    // Seed Services
    console.log('🛠️  Seeding services...')
    for (const service of data.services) {
      // Only seed if technicianId exists
      const technicianId = service.technicianId as string | null
      if (!technicianId) {
        console.log(`   ⚠ Skipping service ${service.name} - no technicianId`)
        continue
      }

      await prisma.service.create({
        data: {
          id: service.id as string,
          technicianId: technicianId,
          name: service.name as string,
          description: service.description as string | null,
          category: (service.category ?? 'SERVIS_LENGKAP') as
            | 'KONSULTASI'
            | 'CEK_BONGKAR'
            | 'SERVIS_LENGKAP',
          price: service.price as number,
          duration:
            typeof service.duration === 'number' ? service.duration : null,
          isActive: (service.isActive ?? true) as boolean,
        },
      })
    }
    console.log(`   ✓ Services seeded`)

    // Seed Orders
    console.log('📋 Seeding orders...')
    for (const order of data.orders) {
      await prisma.order.create({
        data: {
          id: order.id as string,
          orderNumber: order.orderNumber as string,
          userId: order.userId as string,
          technicianId: order.technicianId as string | null,
          status: order.status as string as
            | 'PENDING_PAYMENT'
            | 'PAID'
            | 'IN_PROGRESS'
            | 'COMPLETED'
            | 'CANCELLED',
          subtotal: order.subtotal as number,
          tax: order.tax as number,
          total: order.total as number,
          notes: order.notes as string | null,
          createdAt: new Date(order.createdAt as string),
          updatedAt: new Date(order.updatedAt as string),
        },
      })

      // Seed Order Items
      const items = order.items as Array<Record<string, unknown>>
      for (const item of items) {
        await prisma.orderItem.create({
          data: {
            id: item.id as string,
            orderId: item.orderId as string,
            type: item.type as string as 'SERVICE' | 'PRODUCT' | 'RENTAL',
            serviceId: item.serviceId as string | null,
            productId: item.productId as string | null,
            rentalItemId: item.rentalItemId as string | null,
            quantity: (item.quantity ?? 1) as number,
            rentalDays: item.rentalDays as number | null,
            price: item.price as number,
            subtotal: item.subtotal as number,
          },
        })
      }
    }
    console.log(`   ✓ ${data.orders.length} orders seeded`)

    // Seed Reviews
    console.log('⭐ Seeding reviews...')
    for (const review of data.reviews) {
      await prisma.review.create({
        data: {
          id: review.id as string,
          userId: review.userId as string,
          orderId: review.orderId as string | null,
          mitraId: review.mitraId as string | null,
          type: review.type as string as
            | 'TECHNICIAN'
            | 'PRODUCT'
            | 'RENTAL'
            | 'MITRA',
          rating: review.rating as number,
          comment: review.comment as string | null,
          createdAt: new Date(review.createdAt as string),
          updatedAt: new Date(review.updatedAt as string),
        },
      })
    }
    console.log(`   ✓ ${data.reviews.length} reviews seeded`)

    // Seed Chat Rooms and Messages
    console.log('💬 Seeding chat rooms...')
    for (const room of data.chatRooms) {
      await prisma.chatRoom.create({
        data: {
          id: room.id as string,
          customerId: room.customerId as string,
          technicianId: room.technicianId as string,
          lastMessageAt: new Date(room.lastMessageAt as string),
          createdAt: new Date(room.createdAt as string),
          updatedAt: new Date(room.updatedAt as string),
        },
      })

      // Seed Messages
      const messages = room.messages as Array<Record<string, unknown>>
      for (const msg of messages) {
        await prisma.chatMessage.create({
          data: {
            id: msg.id as string,
            roomId: msg.roomId as string,
            senderId: msg.senderId as string,
            content: msg.content as string,
            isRead: (msg.isRead ?? false) as boolean,
            createdAt: new Date(msg.createdAt as string),
          },
        })
      }
    }
    console.log(`   ✓ ${data.chatRooms.length} chat rooms seeded`)

    console.log('\n✅ Database seeded successfully!')
    console.log('\n🔐 Login credentials:')
    console.log('   Default password for all users: password123')
    console.log('\n   Users:')
    for (const user of data.users) {
      console.log(`   - ${user.email} (${user.role})`)
    }
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedFromBackup()
