import fs from 'fs'
import path from 'path'
import prisma from '../../src/lib/db'

async function migrateWithdrawals() {
  console.log(
    '[Migration] Starting migration from .data/store-withdrawals.json...'
  )
  const filePath = path.join(process.cwd(), '.data', 'store-withdrawals.json')

  if (!fs.existsSync(filePath)) {
    console.log(
      '[Migration] File .data/store-withdrawals.json not found, skipping.'
    )
    return
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const records = JSON.parse(raw || '[]')
  console.log(`[Migration] Found ${records.length} records in JSON.`)

  // Get all existing store IDs in database to validate foreign keys
  const existingStores = await prisma.store.findMany({
    select: { id: true },
  })
  const storeIdSet = new Set(existingStores.map((s) => s.id))

  let successCount = 0
  let skippedCount = 0

  for (const w of records) {
    const validStoreId =
      w.storeId && storeIdSet.has(w.storeId) ? w.storeId : null

    try {
      await (prisma as any).storeWithdrawal.upsert({
        where: { refNumber: w.refNumber },
        update: {
          storeId: validStoreId,
          storeName: w.storeName || 'Toko Cabang',
          companyName: w.companyName || 'PT Toko Cabang',
          bankName: w.bankName || 'Bank Mandiri',
          accountNumber: w.accountNumber || '',
          accountName: w.accountName || '',
          amount: Number(w.amount) || 0,
          status:
            w.status === 'REJECTED'
              ? 'REJECTED'
              : w.status === 'PENDING'
                ? 'PENDING'
                : 'SUCCESS',
          requestedBy: w.requestedBy || 'Admin',
          completedAt: w.completedAt
            ? new Date(w.completedAt)
            : new Date(w.createdAt || Date.now()),
          createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
        },
        create: {
          id: w.id && !w.id.startsWith('wd-') ? w.id : undefined,
          refNumber: w.refNumber,
          storeId: validStoreId,
          storeName: w.storeName || 'Toko Cabang',
          companyName: w.companyName || 'PT Toko Cabang',
          bankName: w.bankName || 'Bank Mandiri',
          accountNumber: w.accountNumber || '',
          accountName: w.accountName || '',
          amount: Number(w.amount) || 0,
          status:
            w.status === 'REJECTED'
              ? 'REJECTED'
              : w.status === 'PENDING'
                ? 'PENDING'
                : 'SUCCESS',
          requestedBy: w.requestedBy || 'Admin',
          completedAt: w.completedAt
            ? new Date(w.completedAt)
            : new Date(w.createdAt || Date.now()),
          createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
        },
      })
      successCount++
    } catch (err: any) {
      console.warn(
        `[Migration] Failed migrating ref ${w.refNumber}:`,
        err.message
      )
      skippedCount++
    }
  }

  console.log(
    `[Migration] Complete! Successfully migrated: ${successCount}, Failed/Skipped: ${skippedCount}`
  )

  // Create backup
  const backupPath = path.join(
    process.cwd(),
    '.data',
    'store-withdrawals.json.bak'
  )
  fs.copyFileSync(filePath, backupPath)
  console.log(`[Migration] Backed up original file to ${backupPath}`)
}

migrateWithdrawals()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[Migration] Error:', e)
    process.exit(1)
  })
