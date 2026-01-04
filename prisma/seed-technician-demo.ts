import { PrismaClient, ServiceCategory, OrderStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding technician demo data...')

  // Find teknisi@test.com
  const technicianUser = await prisma.user.findUnique({
    where: { email: 'teknisi@test.com' },
    include: { technician: true },
  })

  if (!technicianUser || !technicianUser.technician) {
    console.error('❌ User teknisi@test.com or technician profile not found!')
    console.log(
      'Please create this user first or update the email in the script.'
    )
    return
  }

  const technicianId = technicianUser.technician.id
  console.log(`✅ Found technician: ${technicianUser.name} (${technicianId})`)

  // Create diverse services
  console.log('\n📦 Creating services...')

  const serviceData: {
    name: string
    description: string
    category: ServiceCategory
    price: number
    duration: number
  }[] = [
    {
      name: 'Install Ulang Windows 11',
      description:
        'Instalasi ulang Windows 11 lengkap dengan driver dan aplikasi dasar',
      category: ServiceCategory.SERVIS_LENGKAP,
      price: 150000,
      duration: 120,
    },
    {
      name: 'Konsultasi Masalah Laptop',
      description: 'Konsultasi dan diagnosa masalah laptop/komputer',
      category: ServiceCategory.KONSULTASI,
      price: 50000,
      duration: 30,
    },
    {
      name: 'Pembersihan Laptop Menyeluruh',
      description:
        'Pembersihan internal laptop, ganti thermal paste, dan optimasi performa',
      category: ServiceCategory.SERVIS_LENGKAP,
      price: 200000,
      duration: 180,
    },
    {
      name: 'Cek dan Bongkar Laptop',
      description:
        'Pemeriksaan hardware dan pembongkaran untuk identifikasi masalah',
      category: ServiceCategory.CEK_BONGKAR,
      price: 75000,
      duration: 60,
    },
    {
      name: 'Upgrade RAM & SSD',
      description:
        'Instalasi dan konfigurasi RAM/SSD baru (harga belum termasuk komponen)',
      category: ServiceCategory.SERVIS_LENGKAP,
      price: 100000,
      duration: 90,
    },
    {
      name: 'Perbaikan Keyboard Laptop',
      description: 'Servis keyboard laptop yang rusak atau tidak responsif',
      category: ServiceCategory.SERVIS_LENGKAP,
      price: 175000,
      duration: 120,
    },
    {
      name: 'Recovery Data Hardisk',
      description: 'Pemulihan data dari hardisk/SSD yang rusak',
      category: ServiceCategory.SERVIS_LENGKAP,
      price: 300000,
      duration: 240,
    },
    {
      name: 'Instalasi Software & Driver',
      description: 'Instalasi berbagai software dan driver yang dibutuhkan',
      category: ServiceCategory.KONSULTASI,
      price: 80000,
      duration: 60,
    },
    {
      name: 'Servis Layar LCD/LED',
      description: 'Perbaikan atau penggantian layar laptop yang rusak',
      category: ServiceCategory.SERVIS_LENGKAP,
      price: 250000,
      duration: 150,
    },
    {
      name: 'Optimasi Performa Laptop',
      description: 'Tuning dan optimasi sistem untuk performa maksimal',
      category: ServiceCategory.KONSULTASI,
      price: 100000,
      duration: 90,
    },
    {
      name: 'Perbaikan Motherboard',
      description: 'Diagnosa dan perbaikan masalah motherboard laptop',
      category: ServiceCategory.CEK_BONGKAR,
      price: 350000,
      duration: 300,
    },
    {
      name: 'Instalasi Dual Boot OS',
      description: 'Instalasi dual boot Windows dan Linux',
      category: ServiceCategory.SERVIS_LENGKAP,
      price: 180000,
      duration: 150,
    },
  ]

  const createdServices = []
  for (const service of serviceData) {
    const created = await prisma.service.create({
      data: {
        ...service,
        technicianId,
      },
    })
    createdServices.push(created)
    console.log(`  ✓ ${service.name}`)
  }

  // Create demo customer users for orders
  console.log('\n👥 Creating demo customers...')

  const customerData = [
    { name: 'Budi Santoso', email: 'budi.demo@test.com' },
    { name: 'Siti Nurhaliza', email: 'siti.demo@test.com' },
    { name: 'Andi Wijaya', email: 'andi.demo@test.com' },
    { name: 'Dewi Lestari', email: 'dewi.demo@test.com' },
    { name: 'Rudi Hartono', email: 'rudi.demo@test.com' },
  ]

  const customers = []
  for (const customer of customerData) {
    const existing = await prisma.user.findUnique({
      where: { email: customer.email },
    })
    if (existing) {
      customers.push(existing)
      console.log(`  ↻ ${customer.name} (already exists)`)
    } else {
      const created = await prisma.user.create({
        data: {
          ...customer,
          role: 'CUSTOMER',
          phone: `08${Math.floor(Math.random() * 1000000000)}`,
          address: 'Jl. Demo No. ' + Math.floor(Math.random() * 100),
          city: 'Jakarta',
        },
      })
      customers.push(created)
      console.log(`  ✓ ${customer.name}`)
    }
  }

  // Create diverse orders
  console.log('\n📋 Creating orders...')

  const orderStatuses: OrderStatus[] = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PAID,
    OrderStatus.IN_PROGRESS,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ]
  const now = new Date()

  const orderData = []

  // Generate 25 orders with varied dates and statuses
  for (let i = 0; i < 25; i++) {
    const randomCustomer =
      customers[Math.floor(Math.random() * customers.length)]
    const randomService =
      createdServices[Math.floor(Math.random() * createdServices.length)]
    const randomStatus =
      orderStatuses[Math.floor(Math.random() * orderStatuses.length)]

    // Vary the creation date (last 30 days)
    const daysAgo = Math.floor(Math.random() * 30)
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - daysAgo)
    createdAt.setHours(Math.floor(Math.random() * 24))
    createdAt.setMinutes(Math.floor(Math.random() * 60))

    const quantity = 1
    const subtotal = randomService.price * quantity
    const tax = subtotal * 0.11 // 11% PPN
    const total = subtotal + tax

    orderData.push({
      customer: randomCustomer,
      service: randomService,
      status: randomStatus,
      quantity,
      subtotal,
      tax,
      total,
      createdAt,
    })
  }

  // Sort by date (newest first)
  orderData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  let orderCounter = 1
  for (const order of orderData) {
    const orderNumber = `ORD-DEMO-${Date.now()}-${orderCounter.toString().padStart(3, '0')}`

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: order.customer.id,
        technicianId,
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        createdAt: order.createdAt,
        items: {
          create: {
            type: 'SERVICE',
            serviceId: order.service.id,
            quantity: order.quantity,
            price: order.service.price,
            subtotal: order.subtotal,
          },
        },
      },
    })

    console.log(
      `  ✓ ${orderNumber} - ${order.status} - ${order.customer.name} - Rp ${order.total.toLocaleString('id-ID')}`
    )
    orderCounter++
  }

  console.log('\n✅ Seeding completed successfully!')
  console.log(`\n📊 Summary:`)
  console.log(`   - Services created: ${createdServices.length}`)
  console.log(`   - Customers created/used: ${customers.length}`)
  console.log(`   - Orders created: ${orderData.length}`)
  console.log(
    `\n🎨 You can now view the dashboard at: http://localhost:3000/dashboard/teknisi`
  )
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
