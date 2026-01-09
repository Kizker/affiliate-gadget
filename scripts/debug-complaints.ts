import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  try {
    // Check specific order
    const orderNumber = 'SPR-1767553904192-WK5C82DS0'

    const order = await prisma.order.findFirst({
      where: { orderNumber },
      include: {
        claimedBy: { select: { name: true, email: true } },
        complaints: true,
      },
    })

    // Also check if any complaint exists for this order
    const complaints = await prisma.complaint.findMany({
      where: { order: { orderNumber } },
    })

    const output = {
      orderNumber,
      order: order
        ? {
            id: order.id,
            status: order.status,
            claimedById: order.claimedById,
            claimedByEmail: order.claimedBy?.email,
            complaintsCount: order.complaints.length,
            complaints: order.complaints,
          }
        : null,
      separateComplaintCheck: complaints,
    }

    fs.writeFileSync('debug-output.json', JSON.stringify(output, null, 2))
    console.log('Debug data written to debug-output.json')
    console.log(JSON.stringify(output, null, 2))
  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
