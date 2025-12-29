import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load from .env.local
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Creating admin accounts...')

  const hashedPassword = await bcrypt.hash('admin123', 12)

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@halotekno.com' },
    update: {
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email: 'admin@halotekno.com',
      name: 'Admin HaloTekno',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  })

  console.log('✅ Super Admin:', superAdmin.email)

  // Admin Chat 1
  const adminChat1 = await prisma.user.upsert({
    where: { email: 'adminchat1@halotekno.com' },
    update: {},
    create: {
      email: 'adminchat1@halotekno.com',
      name: 'Admin Chat 1',
      password: hashedPassword,
      role: UserRole.ADMIN,
      phone: '081234567891',
      isActive: true,
    },
  })

  console.log('✅ Admin Chat 1:', adminChat1.email)

  // Admin Chat 2
  const adminChat2 = await prisma.user.upsert({
    where: { email: 'adminchat2@halotekno.com' },
    update: {},
    create: {
      email: 'adminchat2@halotekno.com',
      name: 'Admin Chat 2',
      password: hashedPassword,
      role: UserRole.ADMIN,
      phone: '081234567892',
      isActive: true,
    },
  })

  console.log('✅ Admin Chat 2:', adminChat2.email)

  console.log('\n🎉 All accounts created with password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
