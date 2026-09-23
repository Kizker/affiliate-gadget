import fs from 'fs'
import path from 'path'

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

const DATA_DIR = path.join(process.cwd(), '.data')
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'store-withdrawals.json')

function ensureDirAndFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(WITHDRAWALS_FILE)) {
    fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify([]), 'utf-8')
  }
}

export function getStoreWithdrawals(storeId?: string): StoreWithdrawalRecord[] {
  try {
    ensureDirAndFile()
    const content = fs.readFileSync(WITHDRAWALS_FILE, 'utf-8')
    const list: StoreWithdrawalRecord[] = JSON.parse(content || '[]')
    if (storeId) {
      return list.filter((w) => w.storeId === storeId)
    }
    return list
  } catch (error) {
    console.error('Error reading store withdrawals:', error)
    return []
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
  fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify(list, null, 2), 'utf-8')
  return newRecord
}
