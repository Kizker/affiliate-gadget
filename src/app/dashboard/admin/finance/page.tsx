'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { usePageGuard } from '@/hooks/use-page-guard'
import { toast } from 'sonner'
import {
  TransactionMutation,
  FinanceStats,
  StoreInfo,
  StoreOption,
  ReportData,
  MainFinanceView,
  MutationCategoryTab,
  WithdrawStep,
  WithdrawalSuccessData,
  WithdrawalErrorState,
  maskPhone,
  getDateRange,
  FinanceHeader,
  FinanceKpiCards,
  ReportsView,
  MutationsView,
  EscrowView,
  WithdrawalModal,
} from '@/components/admin/finance'

export default function UnifiedFinanceAndReportsPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/finance'
  )
  const { data: session } = useSession()

  // Main unified tab navigation
  const [mainView, setMainView] = useState<MainFinanceView>('REPORTS')

  // Sub-filter tabs for mutations ledger
  const [activeTab, setActiveTab] = useState<MutationCategoryTab>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // 2-Step Withdrawal Modal & Security Gate States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('STEP_1_INPUT')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawOtpCode, setWithdrawOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false)
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300)
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0)
  const [withdrawalSuccessData, setWithdrawalSuccessData] =
    useState<WithdrawalSuccessData | null>(null)
  const [withdrawalError, setWithdrawalError] =
    useState<WithdrawalErrorState | null>(null)

  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingOrders, setIsExportingOrders] = useState(false)
  const [dateRange, setDateRange] = useState('thisMonth')

  // Timer countdown untuk kedaluwarsa OTP & cooldown kirim ulang
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isWithdrawModalOpen && withdrawStep === 'STEP_2_OTP') {
      timer = setInterval(() => {
        setOtpExpirySeconds((prev) => Math.max(0, prev - 1))
        setOtpCooldownSeconds((prev) => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isWithdrawModalOpen, withdrawStep])

  // Pagination for mutations
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)
  const [isLoadingMoreMobile, setIsLoadingMoreMobile] = useState(false)
  const mobileSentinelRef = useRef<HTMLDivElement | null>(null)

  // Pagination for order activity in reports view
  const [orderCurrentPage, setOrderCurrentPage] = useState(1)
  const orderItemsPerPage = 10

  // Multi-Store Selector (Superadmin)
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [allStores, setAllStores] = useState<StoreOption[]>([])

  // Finance API State
  const [stats, setStats] = useState<FinanceStats>({
    availableBalance: 0,
    grossRevenue: 0,
    storeGMV: 0,
    platformCommission: 0,
    escrowBalance: 0,
    totalUnitsSold: 0,
    totalWithdrawn: 0,
    completedNetRevenue: 0,
    totalGatewayFees: 0,
    gatewayFeePerTransaction: 4000,
    totalCompletedOrders: 0,
    platformCommissionRate: 0.02,
    courierBreakdown: {
      paidCount: 0,
      inProgressCount: 0,
      shippedCount: 0,
      complainedCount: 0,
      totalEscrowOrders: 0,
    },
  })
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [transactions, setTransactions] = useState<TransactionMutation[]>([])

  // Reports API State
  const [reportData, setReportData] = useState<ReportData>({
    revenue: {
      total: 0,
      byCategory: { JASA: 0, SPAREPART: 0, SEWA: 0 },
    },
    orders: {
      total: 0,
      byStatus: {},
    },
    customers: { total: 0, new: 0, withOrders: 0, activeRate: '0.0' },
    products: {
      topSelling: [],
      lowStock: [],
      total: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    },
    mitras: { total: 0, approved: 0, pending: 0, topRated: [] },
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Fetch data dari Finance API & Reports API secara paralel
  const fetchUnifiedData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true)
        setIsRefreshing(true)

        const { startDate, endDate } = getDateRange(dateRange)
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (selectedStoreId && selectedStoreId !== 'ALL') {
          params.append('storeId', selectedStoreId)
        }

        const [financeRes, reportsRes] = await Promise.all([
          fetch(`/api/admin/finance?${params.toString()}`),
          fetch(`/api/admin/reports?${params.toString()}`),
        ])

        if (!financeRes.ok) {
          throw new Error('Gagal mengambil data keuangan')
        }

        const financeJson = await financeRes.json()
        if (financeJson.success) {
          setStats(financeJson.stats)
          setStore(financeJson.store)
          setTransactions(financeJson.transactions || [])
          if (financeJson.allStores) {
            setAllStores(financeJson.allStores)
          }
        }

        if (reportsRes.ok) {
          const reportsJson = await reportsRes.json()
          const payload = reportsJson?.data || reportsJson
          if (payload) {
            setReportData({
              financials: payload.financials,
              salesTrend: payload.salesTrend,
              recentActivity: payload.recentActivity || [],
              revenue: payload.revenue || {
                total: 0,
                byCategory: { JASA: 0, SPAREPART: 0, SEWA: 0 },
              },
              orders: payload.orders || { total: 0, byStatus: {} },
              customers: payload.customers || {
                total: 0,
                new: 0,
                withOrders: 0,
                activeRate: '0.0',
              },
              products: payload.products || {
                topSelling: [],
                lowStock: [],
                total: 0,
                lowStockCount: 0,
                outOfStockCount: 0,
              },
              stores: payload.stores,
              mitras: payload.mitras || {
                total: 0,
                approved: 0,
                pending: 0,
                topRated: [],
              },
            })
          }
        }

        const nowStr = new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date())
        setLastUpdated(nowStr)
      } catch (err: any) {
        console.error('Error loading unified finance data:', err)
        toast.error(
          err.message || 'Gagal menyinkronkan data keuangan & laporan'
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [selectedStoreId, dateRange]
  )

  useEffect(() => {
    fetchUnifiedData(true)

    // Auto sync berkala setiap 30 detik
    const interval = setInterval(() => {
      fetchUnifiedData(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchUnifiedData])

  // Filter Transactions untuk Tab Mutasi
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesTab = activeTab === 'ALL' || tx.category === activeTab
      const matchesSearch =
        searchQuery.trim() === '' ||
        tx.refNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.trackingNumber &&
          tx.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesTab && matchesSearch
    })
  }, [transactions, activeTab, searchQuery])

  // Mobile lazy loading calculations
  const mobileHasMore = mobileVisibleCount < filteredTransactions.length

  const loadMoreMobile = useCallback(() => {
    if (isLoadingMoreMobile || !mobileHasMore) return
    setIsLoadingMoreMobile(true)
    setTimeout(() => {
      setMobileVisibleCount((prev) =>
        Math.min(prev + 8, filteredTransactions.length)
      )
      setIsLoadingMoreMobile(false)
    }, 250)
  }, [isLoadingMoreMobile, mobileHasMore, filteredTransactions.length])

  useEffect(() => {
    if (!mobileHasMore || isLoading) return
    const sentinel = mobileSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreMobile()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [mobileHasMore, isLoading, loadMoreMobile])

  // 2-Step Withdrawal Handlers
  const withdrawalTargetPhone = useMemo(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      return (
        (session?.user as any)?.phone ||
        store?.whatsapp ||
        store?.phone ||
        '081289001122'
      )
    }
    return store?.whatsapp || store?.phone || '081289001122'
  }, [session, store])

  const handleProceedToOtpStep = async () => {
    const numericAmount = Number(withdrawAmount.replace(/[^0-9]/g, ''))
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Masukkan nominal penarikan yang valid')
      return
    }
    if (numericAmount < 50000) {
      toast.error('Batas minimum penarikan adalah Rp 50.000')
      return
    }
    if (numericAmount > stats.availableBalance) {
      toast.error(
        `Saldo siap cair tidak mencukupi (Maks Rp ${stats.availableBalance.toLocaleString('id-ID')})`
      )
      return
    }
    if (store?.cooldownStatus?.isLocked) {
      toast.error(
        `Penarikan terkunci cooling-down 24 jam. Sisa waktu: ${store.cooldownStatus.remainingHours} jam ${store.cooldownStatus.remainingMinutes} menit.`
      )
      return
    }

    try {
      setIsSendingOtp(true)
      setWithdrawalError(null)

      const res = await fetch('/api/admin/finance/withdraw/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          storeId: store?.id,
          identifier: withdrawalTargetPhone,
        }),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        throw new Error(`Respon server tidak valid (HTTP ${res.status})`)
      }

      if (!res.ok) {
        setWithdrawalError({
          code: data.code,
          message: data.error || 'Gagal mengirim kode verifikasi OTP',
        })
        throw new Error(data.error || 'Gagal mengirim OTP')
      }

      toast.success(
        `Kode OTP 6-digit berhasil dikirim via WhatsApp ke ${maskPhone(withdrawalTargetPhone)}`
      )
      setWithdrawStep('STEP_2_OTP')
      setOtpExpirySeconds(300)
      setOtpCooldownSeconds(60)
    } catch (err: any) {
      console.error('Error sending withdraw OTP:', err)
      toast.error(err.message || 'Gagal mengirim kode verifikasi OTP')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleResendWithdrawOtp = async () => {
    if (otpCooldownSeconds > 0) return
    const numericAmount = Number(withdrawAmount.replace(/[^0-9]/g, ''))
    if (!numericAmount) return

    try {
      setIsSendingOtp(true)
      setWithdrawalError(null)

      const res = await fetch('/api/admin/finance/withdraw/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          storeId: store?.id,
          identifier: withdrawalTargetPhone,
        }),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        throw new Error(`Respon server tidak valid (HTTP ${res.status})`)
      }

      if (!res.ok) {
        setWithdrawalError({
          code: data.code,
          message: data.error || 'Gagal mengirim ulang OTP',
        })
        throw new Error(data.error || 'Gagal mengirim ulang OTP')
      }

      toast.success('Kode OTP baru telah dikirimkan ke WhatsApp resmi PT')
      setOtpExpirySeconds(300)
      setOtpCooldownSeconds(60)
    } catch (err: any) {
      console.error('Error resending OTP:', err)
      toast.error(err.message || 'Gagal mengirim ulang kode OTP')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleSubmitWithdrawVerification = async () => {
    const numericAmount = Number(withdrawAmount.replace(/[^0-9]/g, ''))
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Nominal penarikan tidak valid')
      return
    }
    if (!withdrawOtpCode || withdrawOtpCode.trim().length !== 6) {
      toast.error('Masukkan 6 digit kode OTP verifikasi')
      return
    }

    try {
      setIsSubmittingWithdraw(true)
      setWithdrawalError(null)

      const res = await fetch('/api/admin/finance/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          storeId: store?.id,
          otpCode: withdrawOtpCode.trim(),
          identifier: withdrawalTargetPhone,
        }),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        throw new Error(`Respon server tidak valid (HTTP ${res.status})`)
      }

      if (!res.ok) {
        setWithdrawalError({
          code: data.code,
          message: data.error || 'Gagal memproses penarikan saldo',
        })

        if (data.code === 'COOLING_DOWN') {
          await fetchUnifiedData(false)
        }
        throw new Error(data.error || 'Gagal memproses penarikan saldo')
      }

      toast.success(
        data.message || 'Pencairan saldo PT berhasil diverifikasi dan diproses!'
      )
      setWithdrawalSuccessData({
        refNumber: data.data.refNumber,
        amount: data.data.amount,
        bankName: data.data.bankName,
        accountNumber: data.data.accountNumber,
        accountName: data.data.accountName,
        requestedBy: data.data.requestedBy,
        date: new Date().toLocaleString('id-ID'),
      })
      setWithdrawStep('SUCCESS')

      // Refresh saldo langsung
      await fetchUnifiedData(false)
    } catch (err: any) {
      console.error('Error withdrawing:', err)
      toast.error(err.message || 'Gagal memproses penarikan dana')
    } finally {
      setIsSubmittingWithdraw(false)
    }
  }

  const handleCloseWithdrawModal = () => {
    setIsWithdrawModalOpen(false)
    setWithdrawStep('STEP_1_INPUT')
    setWithdrawAmount('')
    setWithdrawOtpCode('')
    setWithdrawalError(null)
    setWithdrawalSuccessData(null)
  }

  // Handle Export Laporan Keuangan (Excel)
  const handleExportFinancialExcel = async () => {
    try {
      setIsExportingExcel(true)
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({
        type: 'financials',
        format: 'xlsx',
      })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId)
      }

      const res = await fetch(`/api/admin/reports/export?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Gagal mengekspor laporan keuangan')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10)
      const prefix = store?.companyName
        ? store.companyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        : 'laporan'
      a.download = `laporan-keuangan-${prefix}-${dateRange}-${dateStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Laporan Keuangan berhasil diunduh!')
    } catch (err: any) {
      console.error('Error exporting financial report:', err)
      toast.error(err.message || 'Gagal mengekspor laporan keuangan toko')
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Handle Export Pesanan Toko (Excel)
  const handleExportOrdersExcel = async () => {
    try {
      setIsExportingOrders(true)
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({
        type: 'orders',
        format: 'xlsx',
      })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId)
      }

      const res = await fetch(`/api/admin/reports/export?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Gagal mengekspor rekap pesanan')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10)
      const prefix = store?.companyName
        ? store.companyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        : 'pesanan'
      a.download = `rekap-pesanan-${prefix}-${dateRange}-${dateStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Rekap Pesanan berhasil diunduh!')
    } catch (err: any) {
      console.error('Error exporting orders report:', err)
      toast.error(err.message || 'Gagal mengekspor rekap pesanan')
    } finally {
      setIsExportingOrders(false)
    }
  }

  // Export Mutasi Kas (CSV)
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data mutasi untuk diekspor')
      return
    }

    const headers = [
      'No. Referensi',
      'Tanggal',
      'Kategori',
      'Deskripsi',
      'Keterangan',
      'Tipe Arus',
      'Nominal (Rp)',
      'Status',
    ]

    const rows = filteredTransactions.map((tx) => [
      `"${tx.refNumber}"`,
      `"${tx.date}"`,
      `"${tx.categoryLabel}"`,
      `"${tx.title.replace(/"/g, '""')}"`,
      `"${tx.subtitle.replace(/"/g, '""')}"`,
      `"${tx.type}"`,
      tx.amount,
      `"${tx.statusLabel}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    const companyClean = (store?.companyName || 'Store')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
    link.setAttribute(
      'download',
      `buku-kas-${companyClean}-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Rekap kas (CSV) berhasil diunduh!')
  }

  // Render Skeleton Loading
  if (isLoading && !lastUpdated) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-6 pb-16">
        <div className="h-14 rounded-3xl bg-slate-200/80 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 rounded-3xl bg-slate-200/70 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="h-96 rounded-3xl bg-slate-200/70 dark:bg-slate-800" />
      </div>
    )
  }

  const isConsolidated =
    session?.user?.role === 'SUPER_ADMIN' &&
    (!selectedStoreId || selectedStoreId === 'ALL')

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      {/* 1. TOP HEADER & UNIFIED CONTROL BAR */}
      <FinanceHeader
        store={store}
        mainView={mainView}
        setMainView={setMainView}
        onOpenWithdrawModal={() => {
          setWithdrawStep('STEP_1_INPUT')
          setIsWithdrawModalOpen(true)
        }}
        onExportFinancialExcel={handleExportFinancialExcel}
        onExportOrdersExcel={handleExportOrdersExcel}
        isExportingExcel={isExportingExcel}
        isExportingOrders={isExportingOrders}
        allStores={allStores}
        selectedStoreId={selectedStoreId}
        setSelectedStoreId={setSelectedStoreId}
        dateRange={dateRange}
        setDateRange={setDateRange}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchUnifiedData(false)}
        transactionsCount={transactions.length}
        totalEscrowOrders={stats.courierBreakdown.totalEscrowOrders}
      />

      {/* 2. TOP 5 UNIFIED FINANCIAL BENTO METRIC CARDS */}
      <FinanceKpiCards
        stats={stats}
        reportData={reportData}
        isConsolidated={isConsolidated}
        onOpenWithdrawModal={() => {
          setWithdrawStep('STEP_1_INPUT')
          setIsWithdrawModalOpen(true)
        }}
      />

      {/* 3. MAIN TAB CONTENT: 1) LAPORAN LABA RUGI & ANALITIK */}
      {mainView === 'REPORTS' && (
        <ReportsView
          reportData={reportData}
          stats={stats}
          isConsolidated={isConsolidated}
          orderCurrentPage={orderCurrentPage}
          setOrderCurrentPage={setOrderCurrentPage}
          orderItemsPerPage={orderItemsPerPage}
        />
      )}

      {/* 4. MAIN TAB CONTENT: 2) BUKU KAS & MUTASI TRANSAKSI */}
      {mainView === 'MUTATIONS' && (
        <MutationsView
          filteredTransactions={filteredTransactions}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleExportCSV={handleExportCSV}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          mobileVisibleCount={mobileVisibleCount}
          isLoadingMoreMobile={isLoadingMoreMobile}
          mobileHasMore={mobileHasMore}
          loadMoreMobile={loadMoreMobile}
          mobileSentinelRef={mobileSentinelRef}
          store={store}
          onOpenWithdrawModal={() => {
            setWithdrawStep('STEP_1_INPUT')
            setIsWithdrawModalOpen(true)
          }}
        />
      )}

      {/* 5. MAIN TAB CONTENT: 3) PROTEKSI SALDO ESCROW & KURIR */}
      {mainView === 'ESCROW' && (
        <EscrowView courierBreakdown={stats.courierBreakdown} />
      )}

      {/* 6. MODAL DIALOG: PENARIKAN DANA (2-STEP SECURITY GATE) */}
      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={handleCloseWithdrawModal}
        withdrawStep={withdrawStep}
        setWithdrawStep={setWithdrawStep}
        withdrawAmount={withdrawAmount}
        setWithdrawAmount={setWithdrawAmount}
        withdrawOtpCode={withdrawOtpCode}
        setWithdrawOtpCode={setWithdrawOtpCode}
        isSendingOtp={isSendingOtp}
        isSubmittingWithdraw={isSubmittingWithdraw}
        otpExpirySeconds={otpExpirySeconds}
        otpCooldownSeconds={otpCooldownSeconds}
        withdrawalSuccessData={withdrawalSuccessData}
        withdrawalError={withdrawalError}
        availableBalance={stats.availableBalance}
        store={store}
        withdrawalTargetPhone={withdrawalTargetPhone}
        onProceedToOtpStep={handleProceedToOtpStep}
        onResendWithdrawOtp={handleResendWithdrawOtp}
        onSubmitWithdrawVerification={handleSubmitWithdrawVerification}
      />
    </div>
  )
}
