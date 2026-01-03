import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating Budi Teknisi profile image...')

  // Update Budi Teknisi user with profile image
  const updated = await prisma.user.updateMany({
    where: {
      email: 'teknisi@test.com',
    },
    data: {
      image:
        'https://ui-avatars.com/api/?name=Budi+Teknisi&background=3b82f6&color=fff&size=200',
    },
  })

  console.log(`✅ Updated ${updated.count} user(s)`)
  console.log('🎉 Profile image update completed!')
}

main()
  .catch((e) => {
    console.error('❌ Update error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
