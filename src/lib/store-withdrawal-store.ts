import prisma from '@/lib/db'
import { PrismaClient } from '@prisma/client'

export interface StoreWithdrawalRecord {
  id: string
  refNumber: string
  storeId: string
  storeName: string
  companyName: string
  bankName: string
  accountNumber: string
  accountName: string
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'REJECTED'
  requestedBy: string
  createdAt: string
  completedAt?: string
}

function getWithdrawalDelegate() {
  const delegate = (prisma as any)?.storeWithdrawal
  if (delegate) return delegate

  // Fallback: jika singleton lama di memori proses dev server belum menyegarkan delegasinya
  try {
    const freshClient = new PrismaClient()
    if ((freshClient as any)?.storeWithdrawal) {
      ;(prisma as any).storeWithdrawal = (freshClient as any).storeWithdrawal
      return (freshClient as any).storeWithdrawal
    }
  } catch (err) {
    console.warn('[StoreWithdrawalStore] Fallback fresh client failed:', err)
  }

  return null
}

/**
 * Mengambil daftar riwayat penarikan saldo toko dari tabel PostgreSQL
 */
export async function getStoreWithdrawals(
  storeId?: string
): Promise<StoreWithdrawalRecord[]> {
  try {
    const delegate = getWithdrawalDelegate()
    if (!delegate) {
      let sql = 'SELECT * FROM store_withdrawals'
      const params: any[] = []
      if (storeId && storeId !== 'ALL') {
        sql += ' WHERE "storeId" = $1'
        params.push(storeId)
      }
      sql += ' ORDER BY "createdAt" DESC'
      const rows = await (prisma as any).$queryRawUnsafe(sql, ...params)
      return (rows || []).map((w: any) => ({
        id: w.id,
        refNumber: w.refNumber,
        storeId: w.storeId || (storeId === 'ALL' ? 'ALL' : ''),
        storeName: w.storeName,
        companyName: w.companyName,
        bankName: w.bankName,
        accountNumber: w.accountNumber,
        accountName: w.accountName,
        amount: Number(w.amount) || 0,
        status: w.status as 'PENDING' | 'SUCCESS' | 'REJECTED',
        requestedBy: w.requestedBy,
        createdAt:
          w.createdAt instanceof Date
            ? w.createdAt.toISOString()
            : String(w.createdAt),
        completedAt: w.completedAt
          ? w.completedAt instanceof Date
            ? w.completedAt.toISOString()
            : String(w.completedAt)
          : undefined,
      }))
    }

    const where: any = {}
    if (storeId && storeId !== 'ALL') {
      where.storeId = storeId
    }
    const list = await delegate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return list.map((w: any) => ({
      id: w.id,
      refNumber: w.refNumber,
      storeId: w.storeId || (storeId === 'ALL' ? 'ALL' : ''),
      storeName: w.storeName,
      companyName: w.companyName,
      bankName: w.bankName,
      accountNumber: w.accountNumber,
      accountName: w.accountName,
      amount: w.amount,
      status: w.status as 'PENDING' | 'SUCCESS' | 'REJECTED',
      requestedBy: w.requestedBy,
      createdAt:
        w.createdAt instanceof Date
          ? w.createdAt.toISOString()
          : String(w.createdAt),
      completedAt: w.completedAt
        ? w.completedAt instanceof Date
          ? w.completedAt.toISOString()
          : String(w.completedAt)
        : undefined,
    }))
  } catch (error) {
    console.error(
      '[StoreWithdrawalStore] Error fetching withdrawals from PostgreSQL:',
      error
    )
    return []
  }
}

/**
 * Menghitung total dana yang sudah ditarik (status SUCCESS) via PostgreSQL aggregation
 */
export async function getTotalWithdrawn(storeId?: string): Promise<number> {
  try {
    const delegate = getWithdrawalDelegate()
    if (!delegate) {
      let sql =
        "SELECT COALESCE(SUM(amount), 0) as total FROM store_withdrawals WHERE status = 'SUCCESS'"
      const params: any[] = []
      if (storeId && storeId !== 'ALL') {
        sql += ' AND "storeId" = $1'
        params.push(storeId)
      }
      const result: any = await (prisma as any).$queryRawUnsafe(sql, ...params)
      return Number(result?.[0]?.total || 0)
    }

    const where: any = { status: 'SUCCESS' }
    if (storeId && storeId !== 'ALL') {
      where.storeId = storeId
    }
    const aggregate = await delegate.aggregate({
      _sum: { amount: true },
      where,
    })
    return aggregate?._sum?.amount || 0
  } catch (error) {
    console.error(
      '[StoreWithdrawalStore] Error aggregating total withdrawn:',
      error
    )
    return 0
  }
}

/**
 * Mencatat transaksi penarikan saldo baru ke tabel PostgreSQL
 */
export async function createStoreWithdrawal(
  record: Omit<StoreWithdrawalRecord, 'id' | 'refNumber' | 'createdAt'>
): Promise<StoreWithdrawalRecord> {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const refNumber = `WD-${dateStr}-${randomSuffix}`

  const delegate = getWithdrawalDelegate()
  if (!delegate) {
    const newId = `wd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const insertSql = `
      INSERT INTO store_withdrawals (
        id, "refNumber", "storeId", "storeName", "companyName", "bankName",
        "accountNumber", "accountName", amount, status, "requestedBy",
        "completedAt", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::"WithdrawalStatus", $11, $12, $13, $14
      )
    `
    await (prisma as any).$executeRawUnsafe(
      insertSql,
      newId,
      refNumber,
      record.storeId || null,
      record.storeName || 'Toko Cabang',
      record.companyName || 'PT Toko Cabang',
      record.bankName || 'Bank Mandiri',
      record.accountNumber || '',
      record.accountName || '',
      record.amount,
      (record.status as any) || 'SUCCESS',
      record.requestedBy || 'Admin Toko',
      now,
      now,
      now
    )

    return {
      id: newId,
      refNumber,
      storeId: record.storeId || '',
      storeName: record.storeName || 'Toko Cabang',
      companyName: record.companyName || 'PT Toko Cabang',
      bankName: record.bankName || 'Bank Mandiri',
      accountNumber: record.accountNumber || '',
      accountName: record.accountName || '',
      amount: record.amount,
      status: (record.status as any) || 'SUCCESS',
      requestedBy: record.requestedBy || 'Admin Toko',
      createdAt: now.toISOString(),
      completedAt: now.toISOString(),
    }
  }

  const created = await delegate.create({
    data: {
      refNumber,
      storeId: record.storeId || null,
      storeName: record.storeName || 'Toko Cabang',
      companyName: record.companyName || 'PT Toko Cabang',
      bankName: record.bankName || 'Bank Mandiri',
      accountNumber: record.accountNumber || '',
      accountName: record.accountName || '',
      amount: record.amount,
      status: (record.status as any) || 'SUCCESS',
      requestedBy: record.requestedBy || 'Admin Toko',
      completedAt: now,
      createdAt: now,
    },
  })

  return {
    id: created.id,
    refNumber: created.refNumber,
    storeId: created.storeId || record.storeId || '',
    storeName: created.storeName,
    companyName: created.companyName,
    bankName: created.bankName,
    accountNumber: created.accountNumber,
    accountName: created.accountName,
    amount: created.amount,
    status: created.status as 'PENDING' | 'SUCCESS' | 'REJECTED',
    requestedBy: created.requestedBy,
    createdAt:
      created.createdAt instanceof Date
        ? created.createdAt.toISOString()
        : String(created.createdAt),
    completedAt: created.completedAt
      ? created.completedAt instanceof Date
        ? created.completedAt.toISOString()
        : String(created.completedAt)
      : undefined,
  }
}
