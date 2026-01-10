import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check teknisi@test.com account
  const teknisi = await prisma.user.findFirst({
    where: { email: 'teknisi@test.com' },
    include: {
      technician: { select: { id: true } },
    },
  })

  console.log('teknisi@test.com:')
  console.log(`  Name: ${teknisi?.name}`)
  console.log(`  Role: ${teknisi?.role}`)
  console.log(`  Has Technician: ${!!teknisi?.technician}`)

  // Total counts
  const userCount = await prisma.user.count()
  const technicianCount = await prisma.technician.count()
  const orderCount = await prisma.order.count()

  console.log(`\nTotal counts:`)
  console.log(`  Users: ${userCount}`)
  console.log(`  Technicians: ${technicianCount}`)
  console.log(`  Orders: ${orderCount}`)

  await prisma.$disconnect()
}

main().catch(console.error)
