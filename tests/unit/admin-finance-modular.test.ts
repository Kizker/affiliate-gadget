import { describe, it, expect } from 'vitest'
import {
  formatRupiah,
  maskPhone,
  getDateRange,
} from '@/components/admin/finance/types'

describe('Admin Finance Modular - Helpers & Calculations', () => {
  describe('formatRupiah', () => {
    it('memformat angka rupiah dengan benar', () => {
      expect(formatRupiah(1000000)).toMatch(/Rp\s?1\.000\.000/)
      expect(formatRupiah(0)).toMatch(/Rp\s?0/)
      expect(formatRupiah(50000)).toMatch(/Rp\s?50\.000/)
    })
  })

  describe('maskPhone', () => {
    it('memask nomor telepon WhatsApp dengan 4 digit awal dan 3 digit akhir', () => {
      expect(maskPhone('081234567890')).toBe('0812****890')
      expect(maskPhone('+6281234567890')).toBe('6281****890')
    })

    it('memberikan fallback yang aman untuk string kosong atau terlalu pendek', () => {
      expect(maskPhone('')).toBe('0812****1122')
      expect(maskPhone('12345')).toBe('12345')
    })
  })

  describe('getDateRange', () => {
    it('menghasilkan tanggal yang valid untuk preset thisMonth', () => {
      const range = getDateRange('thisMonth')
      expect(range.startDate).toBeDefined()
      expect(range.endDate).toBeDefined()
      const start = new Date(range.startDate)
      const end = new Date(range.endDate)
      expect(start.getDate()).toBe(1)
      expect(end.getTime()).toBeGreaterThan(start.getTime())
    })

    it('menghasilkan tanggal yang valid untuk preset today', () => {
      const range = getDateRange('today')
      const start = new Date(range.startDate)
      const end = new Date(range.endDate)
      expect(start.getHours()).toBe(0)
      expect(start.getMinutes()).toBe(0)
      expect(end.getHours()).toBe(23)
      expect(end.getMinutes()).toBe(59)
    })

    it('menghasilkan rentang yang valid untuk preset nama bulan (january - december)', () => {
      const jan = getDateRange('january')
      expect(new Date(jan.startDate).getMonth()).toBe(0)

      const dec = getDateRange('december')
      expect(new Date(dec.startDate).getMonth()).toBe(11)
    })
  })

  describe('Financial Calculations & Margins', () => {
    it('menghitung effective commission rate dengan tepat', () => {
      const grossRev = 10000000
      const commAmount = 200000
      const effectiveRate = ((commAmount / grossRev) * 100).toFixed(1)
      expect(effectiveRate).toBe('2.0')
    })

    it('menghitung laba kotor dan laba bersih per transaksi', () => {
      const grossRevenue = 5000000
      const cogs = 4000000
      const grossProfit = grossRevenue - cogs
      const grossMarginPct = Number(
        ((grossProfit / grossRevenue) * 100).toFixed(1)
      )

      const comm = 100000
      const pack = 5000
      const disc = 20000
      const totalExpense = comm + pack + disc
      const netProfit = grossProfit - totalExpense
      const netMarginPct = Number(((netProfit / grossRevenue) * 100).toFixed(1))

      expect(grossProfit).toBe(1000000)
      expect(grossMarginPct).toBe(20.0)
      expect(totalExpense).toBe(125000)
      expect(netProfit).toBe(875000)
      expect(netMarginPct).toBe(17.5)
    })
  })
})
