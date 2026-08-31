'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Wallet,
  TrendingUp,
  Percent,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  FileText,
  X,
  Loader2,
  RefreshCw,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

interface TransactionMutation {
  id: string
  refNumber: string
  title: string
  subtitle: string
  type: 'INCOME' | 'EXPENSE' | 'ESCROW' | 'PAYOUT'
  category: 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'ESCROW'
  categoryLabel: string
  amount: number
  date: string
  status: 'SETTLED' | 'PENDING' | 'SUCCESS'
  statusLabel: string
}

export default function StoreAdminFinancePage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'ESCROW'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false)
  const [withdrawSuccessToast, setWithdrawSuccessToast] = useState(false)

  // Financial Stats for Store Admin (PT Gadget Jaya Sentosa - Roxy Mas Pusat)
  const [availableBalance, setAvailableBalance] = useState(184250000)
  const grossRevenue = 245800000
  const platformCommission = 6145000
  const escrowBalance = 55405000

  // Ledger Mutations
  const [transactions, setTransactions] = useState<TransactionMutation[]>([
    {
      id: 'tx-1',
      refNumber: 'ORD-20260825-01',
      title: 'Penjualan iPhone 15 Pro Titanium 128GB',
      subtitle: 'Customer: Budi Santoso · JNE YES Terproteksi',
      type: 'INCOME',
      category: 'SALE',
      categoryLabel: 'Penjualan Gadget',
      amount: 19029000,
      date: '26 Agu 2026, 11:45',
      status: 'SETTLED',
      statusLabel: 'Masuk Saldo',
    },
    {
      id: 'tx-2',
      refNumber: 'FEE-20260825-01',
      title: 'Bagi Hasil Platform (2.5% Komisi)',
      subtitle: 'Dipotong otomatis untuk pesanan #ORD-20260825-01',
      type: 'EXPENSE',
      category: 'COMMISSION',
      categoryLabel: 'Komisi Platform',
      amount: 475725,
      date: '26 Agu 2026, 11:45',
      status: 'SETTLED',
      statusLabel: 'Terpotong',
    },
    {
      id: 'tx-3',
      refNumber: 'ORD-20260825-02',
      title: 'Penjualan Samsung Galaxy S24 Ultra 512GB',
      subtitle: 'Customer: Maya Kartika · Gojek Instant',
      type: 'ESCROW',
      category: 'ESCROW',
      categoryLabel: 'Dana Tertahan (Escrow)',
      amount: 21999000,
      date: '26 Agu 2026, 10:15',
      status: 'PENDING',
      statusLabel: 'Kurir Perjalanan',
    },
    {
      id: 'tx-4',
      refNumber: 'WD-20260824-09',
      title: 'Pencairan Dana ke Rekening Mandiri PT',
      subtitle: 'Transfer ke Bank Mandiri 1180019283741 a.n. PT Gadget Jaya Sentosa',
      type: 'PAYOUT',
      category: 'WITHDRAWAL',
      categoryLabel: 'Pencairan Saldo',
      amount: 100000000,
      date: '24 Agu 2026, 16:30',
      status: 'SUCCESS',
      statusLabel: 'Berhasil Ditransfer',
    },
    {
      id: 'tx-5',
      refNumber: 'ORD-20260825-03',
      title: 'Penjualan Xiaomi 14 Leica 256GB Black',
      subtitle: 'Customer: Reza Fahlevi · JNE Reguler',
      type: 'INCOME',
      category: 'SALE',
      categoryLabel: 'Penjualan Gadget',
      amount: 11999000,
      date: '25 Agu 2026, 14:20',
      status: 'SETTLED',
      statusLabel: 'Masuk Saldo',
    },
    {
      id: 'tx-6',
      refNumber: 'ORD-20260825-04',
      title: 'Penjualan Samsung Galaxy Z Fold 6 256GB',
      subtitle: 'Customer: Siti Aminah · JNE YES Terproteksi',
      type: 'INCOME',
      category: 'SALE',
      categoryLabel: 'Penjualan Gadget',
      amount: 26499000,
      date: '25 Agu 2026, 09:10',
      status: 'SETTLED',
      statusLabel: 'Masuk Saldo',
    },
  ])

  // Filter Transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesTab = activeTab === 'ALL' || tx.category === activeTab
    const matchesSearch =
      searchQuery.trim() === '' ||
      tx.refNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  // Handle Withdrawal Submission
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseInt(withdrawAmount.replace(/[^0-9]/g, ''), 10)
    if (!numericAmount || numericAmount <= 0) return
    if (numericAmount > availableBalance) return

    setIsSubmittingWithdraw(true)

    setTimeout(() => {
      setAvailableBalance((prev) => prev - numericAmount)

      const newTx: TransactionMutation = {
        id: `tx-${Date.now()}`,
        refNumber: `WD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
          10 + Math.random() * 90
        )}`,
        title: 'Pencairan Dana ke Rekening Mandiri PT',
        subtitle: 'Transfer ke Bank Mandiri 1180019283741 a.n. PT Gadget Jaya Sentosa',
        type: 'PAYOUT',
        category: 'WITHDRAWAL',
        categoryLabel: 'Pencairan Saldo',
        amount: numericAmount,
        date: 'Baru Saja',
        status: 'SUCCESS',
        statusLabel: 'Berhasil Ditransfer',
      }

      setTransactions([newTx, ...transactions])
      setIsSubmittingWithdraw(false)
      setIsWithdrawModalOpen(false)
      setWithdrawAmount('')
      setWithdrawSuccessToast(true)

      setTimeout(() => setWithdrawSuccessToast(false), 4000)
    }, 1000)
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {withdrawSuccessToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-950 px-5 py-3.5 text-xs font-bold text-white shadow-2xl transition-all dark:bg-white dark:text-slate-950 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>Pengajuan penarikan dana berhasil diproses ke Bank Mandiri PT!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. UNIFIED CONTROL BAR (Tabs, Search & Export)                            */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl dark:bg-slate-800/80 overflow-x-auto">
          {[
            { key: 'ALL', label: 'Semua Arus' },
            { key: 'SALE', label: 'Penjualan' },
            { key: 'COMMISSION', label: 'Bagi Hasil' },
            { key: 'WITHDRAWAL', label: 'Pencairan' },
            { key: 'ESCROW', label: 'Dana Tertahan' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi, order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 pl-9 pr-8 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:border-slate-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 whitespace-nowrap dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Tarik Saldo</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 4 FINANCIAL KPI CARDS (Bento Grid)                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Siap Cair */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Saldo Siap Cair
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">Rp</span>
              <p className="text-xl font-bold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {availableBalance.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                ● Siap Transfer
              </span>
              <span className="text-[11px] text-slate-400">ke Rekening PT</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pendapatan Kotor */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Pendapatan Kotor
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">Rp</span>
              <p className="text-xl font-bold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {grossRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                +18.2%
              </span>
              <span className="text-[11px] text-slate-400">· 152 Unit Terjual</span>
            </div>
          </div>
        </div>

        {/* Card 3: Bagi Hasil Platform */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Bagi Hasil Platform
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100/60 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/60">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">Rp</span>
              <p className="text-xl font-bold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {platformCommission.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                2.5% Rate
              </span>
              <span className="text-[11px] text-slate-400">· Terpotong otomatis</span>
            </div>
          </div>
        </div>

        {/* Card 4: Dana Tertahan (Escrow) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Dana Tertahan (Escrow)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">Rp</span>
              <p className="text-xl font-bold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {escrowBalance.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                2 Pesanan
              </span>
              <span className="text-[11px] text-slate-400">· Menunggu Kurir Tiba</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 2-COLUMN BENTO GRID (Ledger Mutations & Corporate Bank Account)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: BUKU KAS & MUTASI ARUS TRANSAKSI (8 COLS) */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white">
                  Buku Kas & Mutasi Transaksi
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Arus kas riil penjualan, pemotongan komisi platform, dan pencairan saldo
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {filteredTransactions.length} Mutasi
              </span>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada transaksi ditemukan</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau tab filter</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-2">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3.5 flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon based on mutation type */}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl border shrink-0 ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-50 border-emerald-100/60 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400'
                            : tx.type === 'EXPENSE'
                            ? 'bg-orange-50 border-orange-100/60 text-orange-600 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-400'
                            : tx.type === 'PAYOUT'
                            ? 'bg-blue-50 border-blue-100/60 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-400'
                            : 'bg-amber-50 border-amber-100/60 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-400'
                        }`}
                      >
                        {tx.type === 'INCOME' && <ArrowDownLeft className="h-5 w-5 stroke-[2.5]" />}
                        {tx.type === 'EXPENSE' && <Percent className="h-5 w-5 stroke-[2.5]" />}
                        {tx.type === 'PAYOUT' && <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />}
                        {tx.type === 'ESCROW' && <Clock className="h-5 w-5 stroke-[2.5]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {tx.refNumber}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[9px] font-bold border ${
                              tx.category === 'SALE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : tx.category === 'COMMISSION'
                                ? 'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-400'
                                : tx.category === 'WITHDRAWAL'
                                ? 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400'
                                : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}
                          >
                            {tx.categoryLabel}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                          {tx.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {tx.date} · <span className="text-slate-500 dark:text-slate-400">{tx.subtitle}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-bold tabular-nums ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'EXPENSE' || tx.type === 'PAYOUT'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {tx.type === 'INCOME' && '+'}
                        {tx.type === 'EXPENSE' || tx.type === 'PAYOUT' ? '-' : ''}
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </p>
                      <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-slate-400">
                        {tx.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CORPORATE BANK ACCOUNT & TAX SUMMARY (4 COLS) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Authentic Bank Mandiri Corporate Card Visual */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Rekening Penampungan PT
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Terverifikasi
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 text-white shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black tracking-wider uppercase text-amber-400">
                  BANK MANDIRI
                </span>
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>

              <div className="space-y-1 mb-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Nomor Rekening PT</p>
                <p className="font-mono text-base font-black tracking-widest text-white">
                  1180 0192 8374 1
                </p>
              </div>

              <div className="flex items-end justify-between border-t border-slate-800/80 pt-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Nama Pemilik Rekening</p>
                  <p className="text-xs font-bold text-slate-200">PT Gadget Jaya Sentosa</p>
                </div>
                <span className="text-[9px] font-semibold text-slate-400">Cab. Roxy Mas</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Tarik Saldo ke Rekening PT</span>
            </button>
          </div>

          {/* Legalitas PT & NPWP Summary */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Pajak & Legalitas PT</h3>
                <p className="text-[10px] text-slate-400">Faktur pajak resmi per cabang</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">NPWP Cabang PT</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                  01.428.910.4-015.000
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Faktur Pajak</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                  Otomatis Terbit
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Periode Tutup Buku</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                  Akhir Bulan (Tgl 30/31)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Laporan mutasi arus kas format CSV berhasil diunduh!')}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Rekap Kas (CSV)</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL DIALOG: PENARIKAN DANA (WITHDRAWAL)                               */}
      {/* ========================================================================= */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    Tarik Saldo ke Rekening PT
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pencairan langsung ke rekening mandiri resmi cabang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleWithdrawSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Rekening Tujuan Pencairan
                </label>
                <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Bank Mandiri · PT Gadget Jaya Sentosa</p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">1180 0192 8374 1</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Nominal Penarikan
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Maks:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      Rp {availableBalance.toLocaleString('id-ID')}
                    </strong>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    max={availableBalance}
                    min={100000}
                    placeholder="misal: 50000000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/80 bg-white pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-slate-950 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {[10000000, 50000000, 100000000, availableBalance].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWithdrawAmount(preset.toString())}
                      className="rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {preset === availableBalance
                        ? 'Tarik Semua'
                        : `${preset / 1000000} Jt`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50/80 border border-amber-200/60 p-3 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Dana penarikan akan langsung diproses ke rekening Bank Mandiri PT cabang dalam estimasi 1–5 menit tanpa biaya administrasi.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || !withdrawAmount}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  {isSubmittingWithdraw ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wallet className="h-3.5 w-3.5" />
                  )}
                  <span>Konfirmasi Penarikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
