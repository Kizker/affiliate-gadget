import fs from 'fs'
import path from 'path'
import prisma from '../src/lib/db'
import { getEtalases } from '../src/lib/etalase-db'

async function main() {
  await prisma.$executeRawUnsafe('DELETE FROM "etalase_products"')
  await prisma.$executeRawUnsafe('DELETE FROM "etalases"')

  const list = await getEtalases({ onlyActive: true })
  const slimList = list
    .slice(0, 24)
    .map(({ etalaseItems, defaultProduct, ...rest }) => rest)
  fs.writeFileSync(
    path.resolve('src/lib/initial-gadgets.json'),
    JSON.stringify(slimList, null, 2)
  )
  console.log('Seeded Etalases & Updated initial-gadgets.json:', list.length)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
