import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('👤 Creating single Super Admin account...')
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@affiliategadget.com' },
    update: {
      name: 'Super Admin',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      email: 'superadmin@affiliategadget.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      phone: '081289001122',
      isActive: true,
      emailVerified: new Date(),
    },
  })

  console.log(
    `✅ Super Admin created: ${superAdmin.email} (Role: ${superAdmin.role})`
  )
}

main()
  .catch((e) => {
    console.error('❌ Error creating Super Admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
