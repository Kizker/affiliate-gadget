import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Store Groups & After Sales User...')

  const passwordHash = await bcrypt.hash('Password123!', 10)

  // 1. Create or update After Sales user
  const afterSalesUser = await prisma.user.upsert({
    where: { email: 'aftersales.roxy@affiliategadget.com' },
    update: {
      role: 'AFTER_SALES',
      name: 'Budi Santoso (After Sales Roxy Group)',
      isActive: true,
    },
    create: {
      email: 'aftersales.roxy@affiliategadget.com',
      name: 'Budi Santoso (After Sales Roxy Group)',
      password: passwordHash,
      role: 'AFTER_SALES',
      phone: '081234567899',
      isActive: true,
    },
  })

  console.log(
    `Ensured After Sales user: ${afterSalesUser.email} (${afterSalesUser.id})`
  )

  // 2. Find Roxy Mas store
  let store = await prisma.store.findFirst({
    where: {
      OR: [{ id: 'cmtqt76ar0002tzfoe4tev6sx' }, { slug: 'roxy-mas-jakarta' }],
    },
  })

  if (!store) {
    store = await prisma.store.findFirst()
  }

  if (!store) {
    console.log('No store available to attach to group.')
    return
  }

  // 3. Upsert StoreGroup
  let group = await prisma.storeGroup.findFirst({
    where: { afterSalesUserId: afterSalesUser.id },
  })

  if (!group) {
    group = await prisma.storeGroup.create({
      data: {
        name: 'Grup Roxy Mas & Jakarta',
        description:
          'Ekosistem cabang Roxy Mas dan sekitarnya di bawah layanan purna jual terpusat',
        afterSalesUserId: afterSalesUser.id,
      },
    })
    console.log(`Created StoreGroup: ${group.name} (${group.id})`)
  } else {
    group = await prisma.storeGroup.update({
      where: { id: group.id },
      data: {
        name: 'Grup Roxy Mas & Jakarta',
        description:
          'Ekosistem cabang Roxy Mas dan sekitarnya di bawah layanan purna jual terpusat',
      },
    })
    console.log(`Updated StoreGroup: ${group.name}`)
  }

  // 4. Attach store to this group
  await prisma.store.update({
    where: { id: store.id },
    data: { groupId: group.id },
  })
  console.log(`Attached store "${store.name}" to group "${group.name}"`)

  console.log('Store Group & After Sales Seeding Complete!')
}

main()
  .catch((e) => {
    console.error('Error seeding store groups:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
