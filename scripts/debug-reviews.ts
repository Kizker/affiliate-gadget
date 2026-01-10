import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check reviews
  const reviews = await prisma.review.findMany({
    where: { type: 'TECHNICIAN' },
    include: {
      order: {
        select: {
          technicianId: true,
          technician: {
            select: {
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  console.log('Total TECHNICIAN reviews:', reviews.length)
  console.log('\nReviews by technician:')

  const byTech: Record<
    string,
    { name: string | null | undefined; count: number; ratings: number[] }
  > = {}
  reviews.forEach((r) => {
    const techId = r.order?.technicianId
    const techName = r.order?.technician?.user?.name
    if (techId) {
      if (!byTech[techId]) {
        byTech[techId] = { name: techName, count: 0, ratings: [] }
      }
      byTech[techId].count++
      byTech[techId].ratings.push(r.rating)
    }
  })

  // Sort by count desc
  const sorted = Object.entries(byTech).sort((a, b) => b[1].count - a[1].count)

  sorted.forEach(([id, data]) => {
    const avg = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
    console.log(
      `${data.name}: ${data.count} reviews, avg rating: ${avg.toFixed(1)}`
    )
  })

  await prisma.$disconnect()
}

main().catch(console.error)
