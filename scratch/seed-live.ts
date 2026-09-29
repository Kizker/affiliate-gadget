import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const stores = await prisma.store.findMany({
    take: 3,
    select: { id: true, name: true, slug: true },
  })
  const hosts = await prisma.user.findMany({
    where: { role: 'STORE_ADMIN' },
    take: 3,
    select: { id: true, name: true, storeId: true },
  })

  if (stores.length === 0) {
    console.log('No stores found')
    return
  }

  // Clean existing test streams
  await prisma.liveStream.deleteMany({
    where: { title: { contains: 'Flash Sale iPhone 15' } },
  })
  await prisma.liveStream.deleteMany({
    where: { title: { contains: 'Samsung Galaxy S25' } },
  })

  const live = await prisma.liveStream.create({
    data: {
      storeId: stores[0].id,
      hostId: hosts[0]?.id ?? null,
      title: 'Flash Sale iPhone 15 Pro Max - Diskon Hari Ini!',
      description:
        'Promo terbatas! iPhone 15 Pro Max 256GB Natural Titanium harga spesial + bonus 3-in-1 gratis',
      streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      coverImage:
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      status: 'LIVE',
      startedAt: new Date(),
      viewerCount: 127,
      featuredProductIds: [],
    },
  })

  if (stores[1]) {
    await prisma.liveStream.create({
      data: {
        storeId: stores[1].id,
        hostId: hosts[1]?.id ?? null,
        title: 'Samsung Galaxy S25 Ultra - Review & Demo LIVE',
        description:
          'Unboxing dan review langsung Samsung Galaxy S25 Ultra terbaru',
        streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        coverImage:
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        viewerCount: 0,
        featuredProductIds: [],
      },
    })
  }

  console.log('✅ Live streams seeded. Live ID:', live.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
