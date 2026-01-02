import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_A1RSuEpmTU2q@ep-autumn-frost-a1cu3c3n-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
})

async function fixAvailability() {
  console.log('🔧 Fixing availability flags in Neon database...\n')

  try {
    // Update all technicians to be available
    const techUpdate = await prisma.technician.updateMany({
      data: {
        isAvailable: true,
      },
    })
    console.log(
      `✅ Updated ${techUpdate.count} technicians to isAvailable = true`
    )

    // Update all products to be active
    const productUpdate = await prisma.product.updateMany({
      data: {
        isActive: true,
      },
    })
    console.log(`✅ Updated ${productUpdate.count} products to isActive = true`)

    // Update all rental items to be active
    const rentalUpdate = await prisma.rentalItem.updateMany({
      data: {
        isActive: true,
      },
    })
    console.log(
      `✅ Updated ${rentalUpdate.count} rental items to isActive = true`
    )

    // Update all mitras to be approved and active
    const mitraUpdate = await prisma.mitra.updateMany({
      data: {
        isApproved: true,
        isActive: true,
      },
    })
    console.log(
      `✅ Updated ${mitraUpdate.count} mitras to isApproved = true, isActive = true`
    )

    console.log('\n🎉 All availability flags fixed!')
  } catch (error) {
    console.error('❌ Error fixing availability:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixAvailability()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
