import prisma from '../src/lib/db'

async function extendAds() {
  const now = new Date()
  const extendedDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 hari ke depan

  // Update semua iklan PROMOTED_LIST yang statusnya APPROVED agar aktif
  const res = await prisma.internalAd.updateMany({
    where: {
      placement: 'PROMOTED_LIST',
      status: 'APPROVED',
    },
    data: {
      isActive: true,
      startDate: now,
      endDate: extendedDate,
    },
  })

  console.log(
    `Successfully extended ${res.count} PROMOTED_LIST ads to ${extendedDate.toISOString()}`
  )
}

extendAds()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
