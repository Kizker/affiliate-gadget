import prisma from '@/lib/db'

/**
 * Script to fix rental order totals that were calculated without deposit
 * Run with: npx tsx prisma/fix-rental-orders.ts
 */

async function fixRentalOrders() {
  console.log('🔧 Starting to fix rental order totals...\n')

  // Find all orders with rental items
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          rentalItem: true,
        },
      },
    },
  })

  let fixedCount = 0
  let skippedCount = 0

  for (const order of orders) {
    const hasRentalItems = order.items.some((item) => item.type === 'RENTAL')

    if (!hasRentalItems) {
      skippedCount++
      continue
    }

    // Recalculate subtotal
    let newSubtotal = 0

    for (const item of order.items) {
      let itemPrice = 0

      if (item.type === 'PRODUCT' && item.productId) {
        itemPrice = item.price * item.quantity
      } else if (item.type === 'RENTAL' && item.rentalItem) {
        const days = item.rentalDays || 1
        const rentalFee = item.rentalItem.pricePerDay * days
        const deposit = item.rentalItem.depositAmount || 0
        itemPrice = (rentalFee + deposit) * item.quantity
      } else if (item.type === 'SERVICE') {
        itemPrice = item.price
      }

      newSubtotal += itemPrice
    }

    const newTotal = newSubtotal // No tax

    // Check if needs update
    if (order.total !== newTotal || order.subtotal !== newSubtotal) {
      console.log(`📝 Fixing Order ${order.orderNumber}:`)
      console.log(`   Old: Subtotal=${order.subtotal}, Total=${order.total}`)
      console.log(`   New: Subtotal=${newSubtotal}, Total=${newTotal}`)

      await prisma.order.update({
        where: { id: order.id },
        data: {
          subtotal: newSubtotal,
          tax: 0,
          total: newTotal,
        },
      })

      fixedCount++
    } else {
      skippedCount++
    }
  }

  console.log(`\n✅ Done!`)
  console.log(`   Fixed: ${fixedCount} orders`)
  console.log(
    `   Skipped: ${skippedCount} orders (already correct or no rental items)`
  )
}

fixRentalOrders()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
