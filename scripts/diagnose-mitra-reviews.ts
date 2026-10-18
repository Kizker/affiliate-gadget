import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const mitras = await prisma.mitra.findMany({
    select: {
      id: true,
      businessName: true,
      phone: true,
      rating: true,
      totalReview: true,
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  })

  console.log('--- ALL MITRAS ---')
  for (const m of mitras) {
    console.log(
      `ID: ${m.id} | Name: ${m.businessName} | Phone: ${m.phone} | rating: ${m.rating} | totalReview (col): ${m.totalReview} | actual reviews in DB: ${m._count.reviews}`
    )
  }

  const allReviewsCount = await prisma.review.count()
  console.log(`\nTotal reviews across all types: ${allReviewsCount}`)

  const reviewsByMitra = await prisma.review.groupBy({
    by: ['mitraId'],
    _count: { _all: true },
  })
  console.log('Reviews grouped by mitraId:', reviewsByMitra)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
