export interface TransactionMutation {
  id: string
  refNumber: string
  title: string
  subtitle: string
  type: 'INCOME' | 'EXPENSE' | 'ESCROW' | 'PAYOUT'
  category: 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'ESCROW' | 'GATEWAY'
  categoryLabel: string
  amount: number
  date: string
  status: 'SETTLED' | 'PENDING' | 'SUCCESS'
  statusLabel: string
  orderStatus?: string
  courierInfo?: string
  trackingNumber?: string | null
}

export interface CourierBreakdown {
  paidCount: number
  inProgressCount: number
  shippedCount: number
  complainedCount: number
  totalEscrowOrders: number
}

export interface FinanceStats {
  availableBalance: number
  grossRevenue: number
  storeGMV?: number
  platformCommission: number
  escrowBalance: number
  totalUnitsSold: number
  totalWithdrawn: number
  completedNetRevenue: number
  totalVatOutput?: number
  totalVatOnCommission?: number
  totalGatewayFees?: number
  gatewayFeePerTransaction?: number
  totalCompletedOrders?: number
  platformCommissionRate?: number
  courierBreakdown: CourierBreakdown
}

export interface StoreInfo {
  id: string
  name: string
  companyName: string
  taxId: string
  city: string
  phone?: string
  whatsapp?: string
  bankAccount: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  bankAccountUpdatedAt?: string | null
  cooldownStatus?: {
    isLocked: boolean
    remainingHours: number
    remainingMinutes: number
    remainingSeconds: number
    lockedUntil: string | null
  }
}

export interface StoreOption {
  id: string
  name: string
  companyName: string
  city: string
}

export interface ReportRecentActivityItem {
  id: string
  orderNumber: string
  createdAt: string
  total: number
  status: string
  user?: {
    name: string | null
    email: string | null
  }
  financials?: {
    grossRevenue: number
    cogs: number
    grossProfit: number
    grossMarginPct: number
    platformCommission: number
    packingCost: number
    voucherDiscount: number
    gatewayFee?: number
    netProfit: number
    netMarginPct: number
  }
}

export interface ReportTopSellingProduct {
  id: string
  name: string
  totalSold: number
  revenue: number
  stock: number
  image: string | null
}

export interface ReportLowStockProduct {
  id: string
  name: string
  stock: number
  images: string[]
}

export interface ReportTopRatedStore {
  id: string
  name?: string
  businessName?: string
  companyName?: string
  city: string
  rating: number
  totalReview?: number
  totalSales?: number
  commissionRate?: number
  isOwnerStore?: boolean
}

export interface ReportData {
  isSuperAdmin?: boolean
  userRole?: string
  selectedStoreId?: string
  allStores?: StoreOption[]
  financials?: {
    grossRevenue: number
    cogs: number
    grossProfit: number
    grossMarginPct: number
    totalCompletedUnits?: number
    storeNetProfit?: number
    platformCommission?: number
    operationalExpenses: {
      platformCommission: number
      gatewayFee?: number
      packingCost: number
      voucherDiscount: number
      shipping: number
      insurance: number
      total: number
    }
    netProfit: number
    netMarginPct: number
    totalPph23Withheld?: number
    totalVatOutput?: number
  }
  salesTrend?: Array<{
    date: string
    label: string
    grossRevenue: number
    netProfit: number
    ordersCount: number
  }>
  revenue: {
    total: number
    grossRevenue?: number
    cogs?: number
    grossProfit?: number
    grossMarginPct?: number
    netProfit?: number
    netMarginPct?: number
    byCategory: {
      JASA: number
      SPAREPART: number
      SEWA: number
    }
    storeCount?: number
  }
  orders: {
    total: number
    byStatus: Record<string, number>
  }
  recentActivity?: ReportRecentActivityItem[]
  customers: {
    total: number
    new: number
    withOrders: number
    activeRate: string
  }
  products: {
    topSelling: ReportTopSellingProduct[]
    lowStock: ReportLowStockProduct[]
    total: number
    lowStockCount: number
    outOfStockCount: number
  }
  stores?: {
    total: number
    active: number
    topRated: ReportTopRatedStore[]
  }
  mitras: {
    total: number
    approved: number
    pending: number
    topRated: Array<{
      id: string
      businessName: string
      city: string
      rating: number
      totalSales?: number
    }>
  }
}

export type MainFinanceView = 'REPORTS' | 'MUTATIONS' | 'ESCROW'

export type MutationCategoryTab =
  | 'ALL'
  | 'SALE'
  | 'COMMISSION'
  | 'WITHDRAWAL'
  | 'ESCROW'
  | 'GATEWAY'

export type WithdrawStep = 'STEP_1_INPUT' | 'STEP_2_OTP' | 'SUCCESS'

export interface WithdrawalSuccessData {
  refNumber: string
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
  requestedBy: string
  date: string
}

export interface WithdrawalErrorState {
  code?: string
  message: string
}

export function maskPhone(phone: string): string {
  if (!phone) return '0812****1122'
  const clean = phone.replace(/[^0-9]/g, '')
  if (clean.length < 8) return phone
  return clean.replace(/(\d{4})\d+(\d{3})/, '$1****$2')
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getDateRange(range: string): {
  startDate: string
  endDate: string
} {
  const now = new Date()
  let startDate: Date
  let endDate: Date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  )

  switch (range) {
    case 'today': {
      const d = new Date(now.getTime())
      d.setHours(0, 0, 0, 0)
      startDate = d
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      )
      break
    }
    case 'thisWeek': {
      const d = new Date(now.getTime())
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      d.setDate(diff)
      d.setHours(0, 0, 0, 0)
      startDate = d
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      )
      break
    }
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
      break
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      break
    case 'january':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 1, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'february':
      startDate = new Date(now.getFullYear(), 1, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 2, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'march':
      startDate = new Date(now.getFullYear(), 2, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 3, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'april':
      startDate = new Date(now.getFullYear(), 3, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 4, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'may':
      startDate = new Date(now.getFullYear(), 4, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 5, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'june':
      startDate = new Date(now.getFullYear(), 5, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 6, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'july':
      startDate = new Date(now.getFullYear(), 6, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 7, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'august':
      startDate = new Date(now.getFullYear(), 7, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 8, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'september':
      startDate = new Date(now.getFullYear(), 8, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 9, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'october':
      startDate = new Date(now.getFullYear(), 9, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 10, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'november':
      startDate = new Date(now.getFullYear(), 10, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 11, 0, 23, 59, 59, 999).getTime()
      )
      break
    case 'december':
      startDate = new Date(now.getFullYear(), 11, 1)
      endDate.setTime(
        new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999).getTime()
      )
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}
