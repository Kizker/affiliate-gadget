import prisma from '../src/lib/db'

async function countAll() {
  console.log('=== JUMLAH DATA SELURUH TABEL DATABASE ===')
  const models = Object.keys(prisma).filter(
    (k) => !k.startsWith('$') && !k.startsWith('_') && k !== 'constructor'
  ).sort()

  const stats: { model: string; count: number | string }[] = []

  for (const m of models) {
    try {
      const count = await (prisma as any)[m].count()
      stats.push({ model: m, count })
    } catch (e: any) {
      stats.push({ model: m, count: `ERR: ${e.message}` })
    }
  }

  for (const s of stats) {
    console.log(`${s.model.padEnd(25)}: ${s.count}`)
  }

  await prisma.$disconnect()
}

countAll().catch(console.error)
