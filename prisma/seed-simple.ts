import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting simple seed...')

  // Create Super Admin
  const adminPassword = await bcrypt.hash('admin123', 12)

  try {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@affiliategadget.com',
        name: 'Admin Affiliate Gadget',
        password: adminPassword,
        role: 'SUPER_ADMIN',
        phone: '081234567890',
      },
    })
    console.log('✅ Created super admin:', admin.email)
  } catch (error) {
    console.log('ℹ️ Admin already exists, skipping...')
  }

  console.log('🎉 Simple seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
