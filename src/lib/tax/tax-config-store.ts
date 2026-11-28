import fs from 'fs'
import path from 'path'

export type TaxTypeId =
  | 'PPH22_ECOMMERCE'
  | 'PPN_PMSE'
  | 'PPH_FINAL_UMKM'
  | 'PPH23_KOMISI'
  | 'PPH21_MITRA'
  | 'BEA_MATERAI'

export interface IndonesianTaxConfig {
  id: TaxTypeId
  code: string
  name: string
  shortName: string
  rate: number // dalam persen (atau nominal rupiah bila isFlatAmount = true)
  isFlatAmount?: boolean
  minTransactionThreshold?: number
  isEnabled: boolean
  basisLabel: string // e.g., "Subtotal Produk (Setelah Diskon)", "Komisi Platform", "Nilai Kontrak / Invoice >= Rp 5.000.000"
  legalBasis: string // Dasar Hukum UU / PMK
  purposeExplanation: string // Penjelasan untuk apa pajak ini dibuat sesuai UU
  mechanismExplanation: string // Cara pemotongan dan penyetoran
  moneyFlowExplanation: string // Alur uangnya kemana
  recipientAgency: string // Instansi penerima: Kas Negara (DJP Kemenkeu RI via e-Billing)
  ebillingKapKjs: string // Kode Akun Pajak (KAP) - Kode Jenis Setoran (KJS) resmi DJP
}

export interface TaxWithdrawalRecord {
  id: string
  refNumber: string
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
  requestedBy: string
  status: 'SUCCESS'
  createdAt: string
  notes?: string
}

export interface TaxRemittanceRecord {
  id: string
  periodLabel: string
  ntpnNumber: string
  billingCode: string
  amount: number
  taxTypes: string[]
  remittedBy: string
  remittedAt: string
  notes?: string
}

export interface TaxConfigStoreData {
  taxes: IndonesianTaxConfig[]
  withdrawals: TaxWithdrawalRecord[]
  remittances: TaxRemittanceRecord[]
  updatedAt: string
}

export const DEFAULT_INDONESIAN_TAXES: IndonesianTaxConfig[] = [
  {
    id: 'PPH22_ECOMMERCE',
    code: 'PPh Pasal 22 PMSE',
    name: 'PPh Pasal 22 Perdagangan Melalui Sistem Elektronik (E-Commerce)',
    shortName: 'PPh 22 (0.5%)',
    rate: 0.5,
    isEnabled: true, // Default aktif sesuai kondisi saat ini
    basisLabel: '0.5% dari Subtotal Produk (Setelah Diskon)',
    legalBasis:
      'UU No. 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (UU HPP) & PMK No. 58/PMK.03/2022',
    purposeExplanation:
      'Dibuat oleh Pemerintah RI dan Direktorat Jenderal Pajak (DJP) untuk memungut Pajak Penghasilan di muka atas transaksi penjualan barang oleh merchant/toko melalui platform marketplace (Perdagangan Melalui Sistem Elektronik). Pajak ini bersifat kredit pajak (prepaid tax) yang dapat dikreditkan oleh Badan Usaha PT/CV toko pada SPT Tahunan PPh Badan.',
    mechanismExplanation:
      'Dipotong otomatis sebesar 0,5% dari nilai bruto/subtotal barang sebelum dana penjualan dicairkan dari Escrow ke Saldo Siap Cair Toko.',
    moneyFlowExplanation:
      'Dana dipotong dari penghasilan pesanan toko -> Masuk ke Kas Penampungan Pajak Platform (Tax Escrow) -> Disetorkan oleh Platform ke Kas Negara melalui e-Billing DJP setiap bulan (maksimal tanggal 15 bulan berikutnya) dengan Bukti Potong Unifikasi atas NPWP Toko.',
    recipientAgency: 'Kas Negara — Direktorat Jenderal Pajak (DJP Kemenkeu RI)',
    ebillingKapKjs: 'KAP 411122 - KJS 910 (Pemungutan PPh Pasal 22 PMSE)',
  },
  {
    id: 'PPN_PMSE',
    code: 'PPN PMSE / PKP',
    name: 'Pajak Pertambahan Nilai (PPN) Barang Kena Pajak E-Commerce',
    shortName: 'PPN (11%)',
    rate: 11,
    isEnabled: false,
    basisLabel: '11% dari Dasar Pengenaan Pajak (Subtotal Barang)',
    legalBasis:
      'UU No. 7 Tahun 2021 (UU HPP) Bab IV Pasal 7 & PMK No. 60/PMK.03/2022',
    purposeExplanation:
      'Merupakan pajak konsumsi tidak langsung atas penyerahan Barang Kena Pajak (gadget/elektronik) di dalam Daerah Pabean Indonesia oleh Pengusaha Kena Pajak (PKP). Bertujuan membiayai pembangunan nasional dari konsumsi barang bernilai tambah.',
    mechanismExplanation:
      'Jika diaktifkan sebagai potongan internal toko PKP, 11% dari nilai penjualan dialokasikan sebagai PPN Keluaran yang wajib dilaporkan dalam e-Faktur SPT Masa PPN.',
    moneyFlowExplanation:
      'Dipisahkan dari omzet penjualan kotor -> Masuk ke Kas Penampungan PPN Keluaran -> Disetorkan ke Kas Negara melalui e-Faktur & e-Billing DJP paling lambat akhir bulan berikutnya.',
    recipientAgency: 'Kas Negara — Direktorat Jenderal Pajak (DJP Kemenkeu RI)',
    ebillingKapKjs: 'KAP 411211 - KJS 100 (Setoran Masa PPN Dalam Negeri)',
  },
  {
    id: 'PPH_FINAL_UMKM',
    code: 'PPh Final PP 55/2022',
    name: 'PPh Final UMKM (Omzet Bruto di Bawah Rp 4,8 Miliar/Tahun)',
    shortName: 'PPh Final UMKM (0.5%)',
    rate: 0.5,
    isEnabled: false,
    basisLabel: '0.5% dari Peredaran Bruto (Omzet Penjualan)',
    legalBasis:
      'Peraturan Pemerintah (PP) No. 55 Tahun 2022 (Pengganti PP 23 Tahun 2018) & UU HPP',
    purposeExplanation:
      'Dibuat untuk memberikan kemudahan dan kesederhanaan perhitungan pajak bagi pelaku usaha mikro, kecil, dan menengah (baik PT, CV, maupun Perorangan) yang memiliki omzet di bawah Rp 4,8 Miliar per tahun agar tidak terbebani tarif PPh Badan normal 22%.',
    mechanismExplanation:
      'Dihitung sebesar 0,5% bersifat final dari omzet penjualan kotor setiap transaksi yang selesai.',
    moneyFlowExplanation:
      'Dipotong dari penghasilan toko -> Masuk ke Kas Penampungan Pajak Platform -> Disetorkan ke Kas Negara via e-Billing DJP dan langsung diakui lunas secara final tanpa perlu hitung ulang di akhir tahun.',
    recipientAgency: 'Kas Negara — Direktorat Jenderal Pajak (DJP Kemenkeu RI)',
    ebillingKapKjs: 'KAP 411128 - KJS 423 (PPh Final PP 55/2022 Pemungutan)',
  },
  {
    id: 'PPH23_KOMISI',
    code: 'PPh Pasal 23 Jasa',
    name: 'PPh Pasal 23 atas Jasa Perantara / Komisi Platform Marketplace',
    shortName: 'PPh 23 Komisi (2%)',
    rate: 2,
    isEnabled: false,
    basisLabel: '2% dari Nilai Komisi Platform (Bukan dari Harga Barang)',
    legalBasis:
      'UU No. 36 Tahun 2008 Pasal 23 Ayat (1) Huruf c & PMK No. 141/PMK.03/2015',
    purposeExplanation:
      'Dibuat untuk mengenakan pajak penghasilan atas imbalan jasa manajemen, jasa perantara, atau jasa penyelenggaraan sistem elektronik (komisi platform 1-3% yang dikenakan marketplace kepada toko cabang).',
    mechanismExplanation:
      'Dihitung sebesar 2% khusus dari nominal Biaya Komisi Platform (contoh: jika komisi platform Rp 400.000, maka PPh 23 hanya Rp 8.000).',
    moneyFlowExplanation:
      'Dicadangkan dari transaksi komisi -> Masuk ke Kas Penampungan Pajak -> Disetorkan ke Kas Negara via e-Bupot Unifikasi DJP.',
    recipientAgency: 'Kas Negara — Direktorat Jenderal Pajak (DJP Kemenkeu RI)',
    ebillingKapKjs: 'KAP 411124 - KJS 104 (PPh Pasal 23 atas Jasa Perantara)',
  },
  {
    id: 'PPH21_MITRA',
    code: 'PPh Pasal 21 Jasa',
    name: 'PPh Pasal 21 Tenaga Ahli / Teknisi & Mitra Perorangan',
    shortName: 'PPh 21 Mitra (2.5%)',
    rate: 2.5,
    isEnabled: false,
    basisLabel: '2.5% dari Imbalan Jasa (50% DPP × Tarif Pasal 17 5%)',
    legalBasis:
      'UU HPP Pasal 21, PP No. 58 Tahun 2023 & PMK No. 168 Tahun 2023',
    purposeExplanation:
      'Mengatur pemotongan pajak atas penghasilan sehubungan dengan pekerjaan, jasa reparasi/servis, atau kegiatan yang dilakukan oleh Wajib Pajak Orang Pribadi (Bukan Pegawai / Mitra Servis / Affiliate).',
    mechanismExplanation:
      'Tarif efektif lapisan pertama 2,5% (50% dari penghasilan bruto dikalikan tarif pasal 17 sebesar 5%).',
    moneyFlowExplanation:
      'Dipotong dari pembagian jasa -> Masuk ke Kas Penampungan Pajak Platform -> Disetor ke DJP dengan bukti potong 1721-VI.',
    recipientAgency: 'Kas Negara — Direktorat Jenderal Pajak (DJP Kemenkeu RI)',
    ebillingKapKjs: 'KAP 411121 - KJS 100 (Masa PPh Pasal 21 Bukan Pegawai)',
  },
  {
    id: 'BEA_MATERAI',
    code: 'Bea Materai Elektronik',
    name: 'Bea Materai Elektronik (e-Meterai) Dokumen Transaksi > Rp 5 Juta',
    shortName: 'e-Meterai (Rp 10.000)',
    rate: 10000,
    isFlatAmount: true,
    minTransactionThreshold: 5000000,
    isEnabled: false,
    basisLabel: 'Flat Rp 10.000 untuk Invoice Transaksi >= Rp 5.000.000',
    legalBasis:
      'UU No. 10 Tahun 2020 tentang Bea Meterai Pasal 3 Ayat (2) Huruf g',
    purposeExplanation:
      'Pajak atas dokumen elektronik (invoice/bukti transaksi e-commerce) yang menyebutkan penerimaan uang dengan nilai nominal lebih dari Rp 5.000.000 agar dokumen memiliki kekuatan pembuktian hukum perdata di pengadilan.',
    mechanismExplanation:
      'Dikenakan tarif tetap (flat) Rp 10.000 hanya pada pesanan yang memiliki subtotal di atas atau sama dengan Rp 5.000.000.',
    moneyFlowExplanation:
      'Dipotong Rp 10.000 dari transaksi >= Rp 5 Juta -> Masuk ke Kas Penampungan Pajak -> Disetorkan ke Peruri / DJP untuk pembubuhan e-Meterai resmi.',
    recipientAgency: 'Kas Negara — DJP Kemenkeu RI & Perum Peruri',
    ebillingKapKjs: 'KAP 411611 - KJS 100 (Bea Meterai Elektronik)',
  },
]

const DATA_DIR = path.join(process.cwd(), '.data')
const TAX_STORE_FILE = path.join(DATA_DIR, 'tax-config.json')

let memoryCache: TaxConfigStoreData | null = null

export function getTaxConfigData(): TaxConfigStoreData {
  try {
    if (fs.existsSync(TAX_STORE_FILE)) {
      const raw = fs.readFileSync(TAX_STORE_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.taxes)) {
        // Merge with DEFAULT_INDONESIAN_TAXES so all metadata stays fresh
        const mergedTaxes = DEFAULT_INDONESIAN_TAXES.map((defTax) => {
          const saved = parsed.taxes.find((t: any) => t.id === defTax.id)
          if (saved) {
            return {
              ...defTax,
              isEnabled: Boolean(saved.isEnabled),
              rate:
                typeof saved.rate === 'number' && saved.rate >= 0
                  ? saved.rate
                  : defTax.rate,
            }
          }
          return defTax
        })

        memoryCache = {
          taxes: mergedTaxes,
          withdrawals: Array.isArray(parsed.withdrawals)
            ? parsed.withdrawals
            : [],
          remittances: Array.isArray(parsed.remittances)
            ? parsed.remittances
            : [],
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        }
        return memoryCache
      }
    }
  } catch (err) {
    console.warn('[TaxConfigStore] Warning reading tax config file:', err)
  }

  if (memoryCache) return memoryCache

  memoryCache = {
    taxes: DEFAULT_INDONESIAN_TAXES,
    withdrawals: [],
    remittances: [],
    updatedAt: new Date().toISOString(),
  }
  return memoryCache
}

export function saveTaxConfigData(
  updates: Partial<{
    taxes: { id: TaxTypeId; isEnabled: boolean; rate?: number }[]
    newWithdrawal?: Omit<
      TaxWithdrawalRecord,
      'id' | 'refNumber' | 'status' | 'createdAt'
    >
    newRemittance?: Omit<TaxRemittanceRecord, 'id' | 'remittedAt'>
  }>
): TaxConfigStoreData {
  const current = getTaxConfigData()

  let updatedTaxes = [...current.taxes]
  if (Array.isArray(updates.taxes)) {
    updatedTaxes = current.taxes.map((tax) => {
      const match = updates.taxes!.find((u) => u.id === tax.id)
      if (match) {
        return {
          ...tax,
          isEnabled: Boolean(match.isEnabled),
          rate:
            typeof match.rate === 'number' && match.rate >= 0
              ? match.rate
              : tax.rate,
        }
      }
      return tax
    })
  }

  const updatedWithdrawals = [...current.withdrawals]
  if (updates.newWithdrawal) {
    const timestamp = Date.now()
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase()
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const refNumber = `TAX-WD-${dateStr}-${randomHex}`

    updatedWithdrawals.unshift({
      ...updates.newWithdrawal,
      id: `twd-${timestamp}`,
      refNumber,
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
    })
  }

  const updatedRemittances = [...current.remittances]
  if (updates.newRemittance) {
    updatedRemittances.unshift({
      ...updates.newRemittance,
      id: `remit-${Date.now()}`,
      remittedAt: new Date().toISOString(),
    })
  }

  const nextData: TaxConfigStoreData = {
    taxes: updatedTaxes,
    withdrawals: updatedWithdrawals,
    remittances: updatedRemittances,
    updatedAt: new Date().toISOString(),
  }

  memoryCache = nextData

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(TAX_STORE_FILE, JSON.stringify(nextData, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[TaxConfigStore] Warning writing tax config file:', err)
  }

  return nextData
}

export interface OrderTaxLineItem {
  id: TaxTypeId
  code: string
  name: string
  shortName: string
  rate: number
  isFlatAmount?: boolean
  amount: number
  ebillingKapKjs: string
}

/**
 * Menghitung potongan pajak untuk sebuah pesanan berdasarkan pajak yang sedang AKTIF (isEnabled === true).
 */
export function calculateActiveTaxesForOrder(params: {
  subtotalAfterDiscount: number
  platformCommissionAmount: number
  activeTaxes?: IndonesianTaxConfig[]
}): {
  items: OrderTaxLineItem[]
  totalTaxAmount: number
  pph22Amount: number
  pph22Rate: number
} {
  const taxes = params.activeTaxes || getTaxConfigData().taxes
  const subtotal = Math.max(0, Math.round(params.subtotalAfterDiscount || 0))
  const commission = Math.max(
    0,
    Math.round(params.platformCommissionAmount || 0)
  )

  const items: OrderTaxLineItem[] = []
  let totalTaxAmount = 0
  let pph22Amount = 0
  let pph22Rate = 0.5

  for (const tax of taxes) {
    if (!tax.isEnabled) continue

    let amount = 0
    if (tax.id === 'PPH22_ECOMMERCE') {
      pph22Rate = tax.rate
      amount = Math.round((subtotal * tax.rate) / 100)
      pph22Amount = amount
    } else if (tax.id === 'PPN_PMSE') {
      amount = Math.round((subtotal * tax.rate) / 100)
    } else if (tax.id === 'PPH_FINAL_UMKM') {
      amount = Math.round((subtotal * tax.rate) / 100)
    } else if (tax.id === 'PPH23_KOMISI') {
      amount = Math.round((commission * tax.rate) / 100)
    } else if (tax.id === 'PPH21_MITRA') {
      amount = Math.round((subtotal * tax.rate) / 100)
    } else if (tax.id === 'BEA_MATERAI') {
      const threshold = tax.minTransactionThreshold || 5000000
      if (subtotal >= threshold) {
        amount = Math.round(tax.rate)
      }
    }

    if (amount > 0) {
      items.push({
        id: tax.id,
        code: tax.code,
        name: tax.name,
        shortName: tax.shortName,
        rate: tax.rate,
        isFlatAmount: tax.isFlatAmount,
        amount,
        ebillingKapKjs: tax.ebillingKapKjs,
      })
      totalTaxAmount += amount
    }
  }

  return {
    items,
    totalTaxAmount,
    pph22Amount,
    pph22Rate,
  }
}
