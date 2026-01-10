import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ role: 'TECHNICIAN' }, { technician: { isNot: null } }],
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      technician: {
        select: { id: true },
      },
    },
    take: 10,
  })

  console.log('Technicians in database:')
  console.log(JSON.stringify(users, null, 2))

  await prisma.$disconnect()
}

main().catch(console.error)
