import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Finding duplicate complaints (same orderId)...')

    // Get all complaints grouped by orderId
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Group by orderId
    const grouped: Record<string, typeof complaints> = {}
    for (const c of complaints) {
      if (!grouped[c.orderId]) {
        grouped[c.orderId] = []
      }
      grouped[c.orderId].push(c)
    }

    // Find orders with more than 1 complaint
    const duplicates: string[] = []
    for (const [orderId, comps] of Object.entries(grouped)) {
      if (comps.length > 1) {
        console.log(`Order ${orderId} has ${comps.length} complaints`)
        // Keep the first one (newest, since ordered by createdAt desc)
        // Delete the rest
        for (let i = 1; i < comps.length; i++) {
          duplicates.push(comps[i].id)
        }
      }
    }

    if (duplicates.length === 0) {
      console.log('No duplicate complaints found!')
      return
    }

    console.log(`Deleting ${duplicates.length} duplicate complaints...`)

    // Delete duplicates
    const result = await prisma.complaint.deleteMany({
      where: { id: { in: duplicates } },
    })

    console.log(`Deleted ${result.count} duplicate complaints!`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
