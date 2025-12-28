import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMonthlyOrders() {
  console.log('🔄 Seeding monthly orders for charts...\n')

  // Get existing users, technicians, products, services, rental items
  const users = await prisma.user.findMany({ where: { role: 'CUSTOMER' } })
  const technicians = await prisma.technician.findMany()
  const products = await prisma.product.findMany({ where: { isActive: true } })
  const services = await prisma.service.findMany()
  const rentalItems = await prisma.rentalItem.findMany({
    where: { isActive: true },
  })

  if (users.length === 0) {
    console.log('❌ No users found. Please run user seed first.')
    return
  }

  // Generate orders for the last 12 months
  const now = new Date()
  const ordersToCreate = []

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const monthDate = new Date(now)
    monthDate.setMonth(monthDate.getMonth() - monthsAgo)

    // Random number of orders per month (15-40)
    const ordersThisMonth = Math.floor(Math.random() * 26) + 15

    for (let i = 0; i < ordersThisMonth; i++) {
      // Random day in the month
      const randomDay = Math.floor(Math.random() * 28) + 1
      const orderDate = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        randomDay
      )

      const user = users[Math.floor(Math.random() * users.length)]
      const orderType = Math.random()

      let orderItems: any[] = []
      let technicianId = null
      let subtotal = 0

      if (orderType < 0.4 && services.length > 0) {
        // Service order (40%)
        const service = services[Math.floor(Math.random() * services.length)]
        const technician = technicians.find(
          (t) => t.id === service.technicianId
        )
        technicianId = technician?.id || null

        subtotal = service.price
        orderItems = [
          {
            type: 'JASA',
            serviceId: service.id,
            quantity: 1,
            price: service.price,
            subtotal: service.price,
          },
        ]
      } else if (orderType < 0.75 && products.length > 0) {
        // Product order (35%)
        const numProducts = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < numProducts; j++) {
          const product = products[Math.floor(Math.random() * products.length)]
          const quantity = Math.floor(Math.random() * 3) + 1
          const itemSubtotal = product.price * quantity

          subtotal += itemSubtotal
          orderItems.push({
            type: 'SPAREPART',
            productId: product.id,
            quantity,
            price: product.price,
            subtotal: itemSubtotal,
          })
        }
      } else if (rentalItems.length > 0) {
        // Rental order (25%)
        const rental =
          rentalItems[Math.floor(Math.random() * rentalItems.length)]
        const days = [3, 7, 14, 30][Math.floor(Math.random() * 4)]
        const itemSubtotal = rental.pricePerDay * days

        subtotal = itemSubtotal
        orderItems = [
          {
            type: 'SEWA',
            rentalItemId: rental.id,
            quantity: 1,
            rentalDays: days,
            price: rental.pricePerDay,
            subtotal: itemSubtotal,
          },
        ]
      }

      if (orderItems.length === 0) continue

      const tax = subtotal * 0.11
      const total = subtotal + tax

      // 80% of orders are PAID/COMPLETED, 20% are PENDING/IN_PROGRESS
      const statusRand = Math.random()
      let status: 'PENDING_PAYMENT' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED'
      let paymentStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' = 'PENDING'

      if (statusRand < 0.6) {
        status = 'COMPLETED'
        paymentStatus = 'VERIFIED'
      } else if (statusRand < 0.8) {
        status = 'PAID'
        paymentStatus = 'VERIFIED'
      } else if (statusRand < 0.9) {
        status = 'IN_PROGRESS'
        paymentStatus = 'VERIFIED'
      } else {
        status = 'PENDING_PAYMENT'
        paymentStatus = 'PENDING'
      }

      ordersToCreate.push({
        userId: user.id,
        technicianId,
        orderNumber: `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        status,
        subtotal,
        tax,
        total,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: orderItems,
        payment: {
          amount: total,
          method: ['TRANSFER', 'QRIS', 'COD'][
            Math.floor(Math.random() * 3)
          ] as any,
          status: paymentStatus,
          createdAt: orderDate,
          updatedAt: orderDate,
        },
      })
    }
  }

  console.log(
    `📊 Creating ${ordersToCreate.length} orders across 12 months...\n`
  )

  // Create orders in batches
  let created = 0
  for (const orderData of ordersToCreate) {
    try {
      await prisma.order.create({
        data: {
          userId: orderData.userId,
          technicianId: orderData.technicianId,
          orderNumber: orderData.orderNumber,
          status: orderData.status,
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          total: orderData.total,
          createdAt: orderData.createdAt,
          updatedAt: orderData.updatedAt,
          items: {
            create: orderData.items,
          },
          payment: {
            create: orderData.payment,
          },
        },
      })
      created++

      if (created % 50 === 0) {
        console.log(`  ✓ Created ${created}/${ordersToCreate.length} orders...`)
      }
    } catch (error) {
      console.error(`  ✗ Error creating order ${orderData.orderNumber}:`, error)
    }
  }

  console.log(`\n✅ Successfully created ${created} orders!`)

  // Show monthly breakdown
  const monthlyStats = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
    },
    _sum: { total: true },
    _count: true,
  })

  const monthlyData: Record<string, { count: number; revenue: number }> = {}
  monthlyStats.forEach((stat) => {
    const monthKey = new Date(stat.createdAt).toISOString().slice(0, 7)
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, revenue: 0 }
    }
    monthlyData[monthKey].count += stat._count
    monthlyData[monthKey].revenue += stat._sum.total || 0
  })

  console.log('\n📈 Monthly Breakdown:')
  Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, data]) => {
      console.log(
        `  ${month}: ${data.count} orders, Rp ${(data.revenue / 1000000).toFixed(2)}jt`
      )
    })
}

seedMonthlyOrders()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('❌ Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
