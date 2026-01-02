import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function importToNeon() {
  console.log('🔄 Starting import to Neon database...\\n')

  const exportFile = path.join(
    process.cwd(),
    'database-exports',
    'halotekno_export_2026-01-02T13-32-12.sql'
  )

  if (!fs.existsSync(exportFile)) {
    console.error(`❌ Export file not found: ${exportFile}`)
    process.exit(1)
  }

  const sqlContent = fs.readFileSync(exportFile, 'utf8')

  try {
    console.log('📦 Importing data to Neon...')

    // Execute SQL directly
    await prisma.$executeRawUnsafe(sqlContent)

    console.log('\\n✅ Import completed successfully!')
  } catch (error) {
    console.error('❌ Error importing database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importToNeon()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
