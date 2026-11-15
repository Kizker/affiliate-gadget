import prisma from '../src/lib/db'
import { syncAllProductsTo1to1Etalases } from '../src/lib/etalase-db'

async function main() {
  console.log('🔄 Memulai sinkronisasi seluruh produk ke etalase 1:1...')

  // 1. Update coordinates for Andri Cell in Ogan Komering Ulu
  await prisma.$executeRawUnsafe(`
    UPDATE "stores" 
    SET "latitude" = -4.1300, "longitude" = 104.1700 
    WHERE "name" ILIKE '%Andri Cell%' OR "city" ILIKE '%OGAN KOMERING ULU%';
  `)
  console.log(
    '✅ Koordinat toko Andri Cell berhasil diperbarui ke Ogan Komering Ulu (-4.13, 104.17)'
  )

  // 2. Sync all products to 1:1 Etalases
  const result = await syncAllProductsTo1to1Etalases()
  console.log(
    `✅ Sinkronisasi etalase selesai! ${result.count} produk kini memiliki etalase 1:1.`
  )

  const etalaseCount = await prisma.etalase.count()
  console.log(`📊 Total Etalase di Database: ${etalaseCount}`)
}

main()
  .catch((e) => {
    console.error('Error syncing etalases:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
