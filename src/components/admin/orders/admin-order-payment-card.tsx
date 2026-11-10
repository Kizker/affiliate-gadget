'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Gift,
} from 'lucide-react'
import {
  calculateOrderFinancials,
  formatVariantCode,
  FinancialCalculationInput,
} from '@/lib/order-payment-utils'

interface OrderItemDisplay {
  id: string
  quantity: number
  price: number
  subtotal?: number
  variantId?: string | null
  variantName?: string | null
  notes?: string | null
  product?: {
    id?: string
    name: string
    brand?: string | null
    images?: string[] | null
    sku?: string | null
    model?: string | null
    category?: string | null
    weightGram?: number | null
  } | null
  service?: {
    name: string
    category?: string | null
  } | null
  rentalItem?: {
    name: string
    images?: string[] | null
  } | null
}
interface AdminOrderPaymentCardProps {
  order: FinancialCalculationInput & {
    id: string
    orderNumber: string
    items?: OrderItemDisplay[]
    courierCode?: string | null
    courierService?: string | null
    voucherCode?: string | null
    bonusChargerIncluded?: boolean
    bonusProtectorIncluded?: boolean
    bonusCaseIncluded?: boolean
  }
}
export function AdminOrderPaymentCard({ order }: AdminOrderPaymentCardProps) {
  const fin = calculateOrderFinancials(order)
  const items = order.items || []

  // State untuk kontrol akordion buka-tutup
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    subtotal: false,
    logistics: false,
    platform: false,
    service: false,
    tax: true, // Default terbuka seperti di referensi gambar
    netIncome: false,
  })

  // State untuk tooltips / modal info bantuan tanda tanya (?)
  const [activeHelp, setActiveHelp] = useState<string | null>(null)

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleHelp = (key: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActiveHelp((prev) => (prev === key ? null : key))
  }

  return (
    <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      {/* ── 1. HEADER INFORMASI PEMBAYARAN ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
            <CreditCard className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
            Informasi Pembayaran
          </h3>
        </div>

        <Link
          href={`/dashboard/admin/finance?search=${order.orderNumber}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>Lihat riwayat transaksi</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── 2. TABEL DAFTAR PRODUK YANG TERJUAL ─────────────────── */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <th className="w-8 pb-2 text-center">No.</th>
              <th className="min-w-[200px] pb-2">Produk</th>
              <th className="pb-2 text-right">Harga Satuan</th>
              <th className="w-16 pb-2 text-center">Jumlah</th>
              <th className="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item, idx) => {
              const itemImg =
                item.product?.images?.[0] ||
                item.rentalItem?.images?.[0] ||
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'
              const itemName =
                item.product?.name ||
                item.service?.name ||
                item.rentalItem?.name ||
                'Unit Gadget'
              const variantCode = formatVariantCode(item)
              const itemSubtotal = item.subtotal || item.price * item.quantity

              return (
                <tr key={item.id || idx} className="align-top">
                  <td className="py-3 text-center font-medium text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex items-start gap-2.5">
                      <img
                        src={itemImg}
                        alt={itemName}
                        className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-cover dark:border-slate-800 dark:bg-slate-800"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium text-slate-900 dark:text-white">
                          {itemName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Variasi: {item.variantName || 'Original'}
                        </p>
                        <p className="font-mono text-[10.5px] text-slate-400 dark:text-slate-500">
                          Kode Variasi: {variantCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {item.price.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                    {itemSubtotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── 3. PEMBUKUAN RINCIAN POTONGAN & PENGHASILAN BERSIH ── */}
      <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
        {/* Pos 1: Subtotal Pesanan */}
        <div>
          <div
            onClick={() => toggleSection('subtotal')}
            className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="font-medium">Subtotal Pesanan</span>
              <button
                type="button"
                onClick={(e) => toggleHelp('subtotal', e)}
                title="Bantuan Subtotal"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                Rp{fin.subtotal.toLocaleString('id-ID')}
              </span>
              <span className="text-slate-400">
                {openSections.subtotal ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </div>
          {openSections.subtotal && (
            <div className="ml-2 mt-1 rounded-lg border-l-2 border-slate-200 bg-slate-50/70 p-2.5 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
              <p>
                Total nilai kotor transaksi penjualan seluruh produk (
                {items.length} item) sebelum dikenakan komisi platform, biaya
                layanan, dan pajak.
              </p>
            </div>
          )}
          {activeHelp === 'subtotal' && (
            <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50/80 p-2 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Akumulasi harga satuan dikalikan jumlah unit dari seluruh produk
              yang dipesan pembeli.
            </div>
          )}
        </div>

        {/* Pos 2: Pemisahan Biaya Ongkir & Asuransi (Kurir Pass-Through) */}
        <div>
          <div
            onClick={() => toggleSection('logistics')}
            className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="font-medium">Ongkos Kirim & Asuransi</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Kurir Rekanan
              </span>
              <button
                type="button"
                onClick={(e) => toggleHelp('logistics', e)}
                title="Penjelasan Biaya Logistik"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-500 dark:text-slate-400">
                Rp
                {(fin.shippingCost + fin.insuranceFee).toLocaleString('id-ID')}
              </span>
              <span className="text-slate-400">
                {openSections.logistics ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </div>
          {openSections.logistics && (
            <div className="ml-2 mt-1 space-y-1.5 rounded-lg border-l-2 border-slate-300 bg-slate-50/70 p-2.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>
                  Ongkir Kurir ({order.courierCode || 'JNE'}{' '}
                  {order.courierService || ''}):
                </span>
                <span className="font-mono font-semibold">
                  Rp{fin.shippingCost.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Asuransi Pengiriman Gadget (0.2%):</span>
                <span className="font-mono font-semibold">
                  Rp{fin.insuranceFee.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="mt-1 border-t border-slate-200/60 pt-1 text-[10.5px] italic text-slate-500 dark:border-slate-700/60">
                * Biaya ongkir & asuransi dibayarkan pembeli dan disalurkan
                penuh ke ekspedisi kurir resmi (Biteship JNE / Gojek) sehingga
                tidak menjadi omzet maupun potongan saldo toko.
              </p>
            </div>
          )}
          {activeHelp === 'logistics' && (
            <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50/80 p-2 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Biaya logistik pengiriman & asuransi adalah dana pass-through
              kurir. Dana ini langsung diteruskan ke kurir ekspedisi dan tidak
              memotong pendapatan bersih toko.
            </div>
          )}
        </div>

        {/* Pos 3: Biaya Platform */}
        <div>
          <div
            onClick={() => toggleSection('platform')}
            className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="font-medium">Biaya Platform</span>
              <button
                type="button"
                onClick={(e) => toggleHelp('platform', e)}
                title="Penjelasan Biaya Platform"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                -Rp{fin.platformFee.toLocaleString('id-ID')}
              </span>
              <span className="text-slate-400">
                {openSections.platform ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </div>
          {openSections.platform && (
            <div className="ml-2 mt-1 rounded-lg border-l-2 border-amber-300 bg-amber-50/40 p-2.5 text-[11px] text-slate-600 dark:border-amber-700 dark:bg-amber-950/30 dark:text-slate-300">
              <p>
                Bagi hasil komisi platform marketplace resmi (
                {fin.platformFeeRate}% dari subtotal pesanan produk).
              </p>
            </div>
          )}
          {activeHelp === 'platform' && (
            <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50/80 p-2 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Komisi operasional platform marketplace atas layanan etalase
              multi-PT, sistem garansi 30 hari, dan integrasi logistik kurir
              terproteksi.
            </div>
          )}
        </div>

        {/* Pos 4: Biaya Layanan */}
        <div>
          <div
            onClick={() => toggleSection('service')}
            className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="font-medium">Biaya Layanan</span>
              <button
                type="button"
                onClick={(e) => toggleHelp('service', e)}
                title="Penjelasan Biaya Layanan"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                -Rp{fin.serviceFee.toLocaleString('id-ID')}
              </span>
              <span className="text-slate-400">
                {openSections.service ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </div>
          {openSections.service && (
            <div className="ml-2 mt-1 rounded-lg border-l-2 border-indigo-300 bg-indigo-50/40 p-2.5 text-[11px] text-slate-600 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-slate-300">
              <p>
                Biaya transaksi payment gateway Midtrans ({fin.serviceFeeLabel}
                ).
              </p>
            </div>
          )}
          {activeHelp === 'service' && (
            <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50/80 p-2 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Biaya pemrosesan transaksi perbankan dan saluran pembayaran resmi
              (Virtual Account Bank Mandiri / BCA / BRI / BNI atau QRIS).
            </div>
          )}
        </div>

        {/* Pos 5: Pajak (PPh 22) */}
        <div>
          <div
            onClick={() => toggleSection('tax')}
            className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="font-medium">Pajak</span>
              <button
                type="button"
                onClick={(e) => toggleHelp('tax', e)}
                title="Penjelasan Pajak E-Commerce"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                -Rp{fin.pph22Amount.toLocaleString('id-ID')}
              </span>
              <span className="text-slate-400">
                {openSections.tax ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </div>
          {openSections.tax && (
            <div className="ml-4 mt-1 space-y-1 rounded-lg border-l-2 border-slate-300 bg-slate-50/60 p-2.5 text-[11px] dark:border-slate-700 dark:bg-slate-800/30">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <span>PPh 22 ({fin.pph22Rate}%)</span>
                  <button
                    type="button"
                    onClick={(e) => toggleHelp('pph22', e)}
                    title="Bantuan PPh 22"
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </div>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  -Rp{fin.pph22Amount.toLocaleString('id-ID')}
                </span>
              </div>
              {activeHelp === 'pph22' && (
                <p className="mt-1 text-[10.5px] text-blue-600 dark:text-blue-400">
                  Pemungutan PPh Pasal 22 e-commerce (0.5% dari subtotal produk)
                  sesuai regulasi Kementerian Keuangan PMK & UU HPP.
                </p>
              )}
            </div>
          )}
          {activeHelp === 'tax' && (
            <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50/80 p-2 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Kewajiban pemotongan pajak penghasilan atas transaksi perdagangan
              melalui sistem elektronik (e-commerce) di Indonesia.
            </div>
          )}
        </div>

        {/* Pos Diskon Voucher (Jika ada) */}
        {fin.discountAmount > 0 && (
          <div className="flex items-center justify-between py-1 text-emerald-600 dark:text-emerald-400">
            <span className="font-medium">
              Diskon Voucher {order.voucherCode ? `(${order.voucherCode})` : ''}
            </span>
            <span className="font-mono font-semibold">
              -Rp{fin.discountAmount.toLocaleString('id-ID')}
            </span>
          </div>
        )}

        {/* ── 4. ESTIMASI TOTAL PENGHASILAN BERSIH TOKO ────────── */}
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t-2 border-slate-100 pt-3.5 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">
              Estimasi Total Penghasilan
            </span>
            <button
              type="button"
              onClick={(e) => toggleHelp('netIncome', e)}
              title="Penjelasan Estimasi Total Penghasilan"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-right">
            <span className="font-mono text-xl font-black tabular-nums text-orange-600 dark:text-orange-500 sm:text-2xl">
              Rp{fin.estimatedNetIncome.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {activeHelp === 'netIncome' && (
          <div className="mt-1 rounded-lg border border-orange-200 bg-orange-50/80 p-2.5 text-[11px] text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300">
            Dana bersih yang sah masuk ke saldo siap cair dompet toko Anda
            setelah pesanan dikonfirmasi selesai oleh pembeli (Subtotal produk
            dikurangi biaya platform, biaya layanan, dan pajak PPh 22).
          </div>
        )}
      </div>
    </div>
  )
}
