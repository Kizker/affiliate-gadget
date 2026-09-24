import prisma from '../src/lib/db'

async function fix() {
  await prisma.$executeRawUnsafe(`UPDATE products SET "costPrice" = ROUND("price" * 0.82) WHERE "costPrice" >= "price" OR "costPrice" <= 0`)
  await prisma.$executeRawUnsafe(`UPDATE product_variants SET "costPrice" = ROUND("price" * 0.82) WHERE "costPrice" >= "price" OR "costPrice" <= 0`)
  await prisma.$executeRawUnsafe(`UPDATE order_items SET "costPrice" = ROUND("price" * 0.82) WHERE "costPrice" > "price" OR "costPrice" <= 0`)
  console.log('HPP Fixed!')
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
