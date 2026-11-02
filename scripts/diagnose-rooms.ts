import 'dotenv/config'
import prisma from '../src/lib/db'

async function main() {
  const rooms = await prisma.adminChatRoom.findMany({
    where: {
      id: { in: ['cmvzfz1w70001uyg8kfnv1hsu', 'cmtsu0pbh0001uyc8q5l0vqf6'] },
    },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      store: true,
      order: true,
      claimedBy: true,
      customer: true,
    },
  })

  rooms.forEach((r) => {
    console.log(`\n=== Room ID: ${r.id} ===`)
    console.log(`  createdAt: ${r.createdAt.toISOString()}`)
    console.log(`  updatedAt: ${r.updatedAt.toISOString()}`)
    console.log(`  lastMessageAt: ${r.lastMessageAt?.toISOString()}`)
    console.log(
      `  customerId: ${r.customerId} (${r.customer.name} - ${r.customer.email})`
    )
    console.log(`  storeId: ${r.storeId} (${r.store?.name})`)
    console.log(`  orderId: ${r.orderId} (${r.order?.orderNumber})`)
    console.log(`  claimedById: ${r.claimedById} (${r.claimedBy?.name})`)
    console.log(`  messages (${r.messages.length}):`)
    r.messages.forEach((m) => {
      console.log(
        `    [${m.createdAt.toISOString()}] sender: ${m.senderId === r.customerId ? 'CUSTOMER' : 'ADMIN/STORE'}: ${m.messageType} - ${m.content.slice(0, 70)}`
      )
    })
  })
}

main().finally(() => prisma.$disconnect())
