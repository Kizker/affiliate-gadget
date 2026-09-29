import fs from 'fs'
import path from 'path'
import os from 'os'

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

const DEFAULT_DATA_DIR = path.join(process.cwd(), '.data')
let activeDataDir = DEFAULT_DATA_DIR

function getDataDir(): string {
  try {
    if (!fs.existsSync(activeDataDir)) {
      fs.mkdirSync(activeDataDir, { recursive: true })
    }
    const testFile = path.join(activeDataDir, `.test-write-${process.pid}`)
    fs.writeFileSync(testFile, 'ok', 'utf-8')
    fs.unlinkSync(testFile)
    return activeDataDir
  } catch {
    const fallbackDir = path.join(os.tmpdir(), 'affiliate-gadget-data')
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true })
      }
    } catch {}
    activeDataDir = fallbackDir
    return activeDataDir
  }
}

function getWithdrawalsFile(): string {
  return path.join(getDataDir(), 'store-withdrawals.json')
}

const inMemoryWithdrawals: StoreWithdrawalRecord[] = []

function ensureDirAndFile() {
  const file = getWithdrawalsFile()
  if (!fs.existsSync(file)) {
    try {
      fs.writeFileSync(file, JSON.stringify([]), 'utf-8')
    } catch (err) {
      console.warn('Notice writing store-withdrawals.json:', err)
    }
  }
}

export function getStoreWithdrawals(storeId?: string): StoreWithdrawalRecord[] {
  try {
    ensureDirAndFile()
    const file = getWithdrawalsFile()
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8')
      const list: StoreWithdrawalRecord[] = JSON.parse(content || '[]')
      if (storeId) {
        return list.filter((w) => w.storeId === storeId)
      }
      return list
    }
    return inMemoryWithdrawals
  } catch (error) {
    console.warn(
      'Notice reading store withdrawals, using in-memory list:',
      error
    )
    return inMemoryWithdrawals
  }
}

export function getTotalWithdrawn(storeId?: string): number {
  const list = getStoreWithdrawals(storeId)
  return list
    .filter((w) => w.status === 'SUCCESS')
    .reduce((sum, w) => sum + w.amount, 0)
}

export function createStoreWithdrawal(
  record: Omit<StoreWithdrawalRecord, 'id' | 'refNumber' | 'createdAt'>
): StoreWithdrawalRecord {
  ensureDirAndFile()
  const list = getStoreWithdrawals()
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const newRecord: StoreWithdrawalRecord = {
    ...record,
    id: `wd-${Date.now()}-${randomSuffix}`,
    refNumber: `WD-${dateStr}-${randomSuffix}`,
    createdAt: now.toISOString(),
    completedAt: now.toISOString(),
  }
  list.unshift(newRecord)
  try {
    fs.writeFileSync(
      getWithdrawalsFile(),
      JSON.stringify(list, null, 2),
      'utf-8'
    )
  } catch (writeErr) {
    console.warn('Notice saving store withdrawal, stored in-memory:', writeErr)
    inMemoryWithdrawals.unshift(newRecord)
  }
  return newRecord
}
