'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { Printer, X } from 'lucide-react'
import { generateTaxInvoiceNumber } from '@/lib/tax/tax-engine'

export interface TaxInvoiceOrderData {
  id: string
  orderNumber: string
  createdAt: string | Date
  subtotal: number
  tax?: number
  dppAmount?: number
  vatRate?: number
  taxTypeApplied?: string
  pph23Amount?: number
  pph23Rate?: number
  shippingCost?: number
  insuranceFee?: number
  discountAmount?: number
  total: number
  status: string
  user?: {
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
  } | null
  store?: {
    id?: string
    name?: string
    companyName?: string
    taxId?: string
    address?: string
    city?: string
    province?: string
    postalCode?: string
    kppPratama?: string
  } | null
  items: Array<{
    id?: string
    price: number
    quantity: number
    variantName?: string | null
    product?: {
      name: string
      brand?: string | null
    } | null
    service?: {
      name: string
    } | null
    rentalItem?: {
      name: string
    } | null
  }>
}

interface TaxInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  order: TaxInvoiceOrderData | null
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(num || 0)
}

export default function TaxInvoiceModal({
  isOpen,
  onClose,
  order,
}: TaxInvoiceModalProps) {
  const printableRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const orderDate = order ? new Date(order.createdAt) : new Date()
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(orderDate)

  const nsfp = order ? generateTaxInvoiceNumber(order.orderNumber, orderDate) : ''

  useEffect(() => {
    if (!nsfp) return
    const verifyUrl = `https://efaktur.pajak.go.id/validasi/${nsfp.replace(/\D/g, '')}`
    QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setQrCodeDataUrl)
      .catch(() => {})
  }, [nsfp])

  // Identitas PKP Penjual
  const sellerCompany = (
    order?.store?.companyName ||
    order?.store?.name ||
    'PT GADGET JAYA SENTOSA'
  ).toUpperCase()
  const sellerNpwp = order?.store?.taxId || '01.428.910.4-015.000'
  const sellerAddress =
    [order?.store?.address, order?.store?.city, order?.store?.province]
      .filter(Boolean)
      .join(', ') ||
    'ITC Roxy Mas Lt. 2 No. 15-17, Jl. KH Hasyim Ashari, Gambir, Jakarta Pusat'
  const sellerCity = (order?.store?.city || 'JAKARTA PUSAT').toUpperCase()

  // Identitas Pembeli
  const buyerName = (order?.user?.name || 'KONSUMEN AKHIR').toUpperCase()
  const buyerNpwp = '00.000.000.0-000.000' // Standar default retail/B2C jika NIK belum diinput
  const buyerAddress =
    [order?.user?.address, order?.user?.city, order?.user?.province]
      .filter(Boolean)
      .join(', ') || 'Alamat Terdaftar di Aplikasi'

  // Perhitungan Pajak Sesuai UU HPP No. 7 Tahun 2021 & PER-03/PJ/2022
  const subtotalGross = order?.subtotal || 0
  const discount = order?.discountAmount || 0
  const subtotalNet = Math.max(0, subtotalGross - discount)
  const vatRate = order?.vatRate || 11.0

  const dppAmount =
    order?.dppAmount && order.dppAmount > 0
      ? order.dppAmount
      : Math.round(subtotalNet / (1 + vatRate / 100))
  const vatAmount =
    order?.tax && order.tax > 0 ? order.tax : subtotalNet - dppAmount

  // Reset scroll on beforeprint
  useEffect(() => {
    const handleBeforePrint = () => {
      if (printableRef.current) {
        printableRef.current.scrollTop = 0
      }
    }
    window.addEventListener('beforeprint', handleBeforePrint)
    return () => window.removeEventListener('beforeprint', handleBeforePrint)
  }, [])

  // Fungsi cetak dokumen isolasi via hidden iframe (mencegah cut-off, scroll offset, & spillover 2 halaman)
  const handlePrint = useCallback(() => {
    if (!order) return

    if (printableRef.current) {
      printableRef.current.scrollTop = 0
    }

    const itemsHtml = order.items
      .map((item, idx) => {
        const itemName =
          item.product?.name ||
          item.service?.name ||
          item.rentalItem?.name ||
          'Gadget Smartphone'
        const variantDesc = item.variantName ? ` (${item.variantName})` : ''
        const itemTotal = item.price * (item.quantity || 1)
        return `
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="padding: 3.5px 5px; text-align: center; border-right: 1px solid #000; vertical-align: top; font-family: monospace;">${idx + 1}</td>
            <td style="padding: 3.5px 8px; border-right: 1px solid #000; vertical-align: top;">
              <div style="font-weight: 600; color: #000;">${itemName}${variantDesc}</div>
              <div style="font-size: 8.5px; color: #475569; font-family: monospace; margin-top: 1px;">
                ${item.quantity || 1} Unit x Rp ${formatNumber(item.price)}
              </div>
            </td>
            <td style="padding: 3.5px 8px; text-align: right; vertical-align: top; font-family: monospace; font-weight: 500;">
              ${formatNumber(itemTotal)}
            </td>
          </tr>
        `
      })
      .join('')

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>Faktur-Pajak-${order.orderNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 7mm 9mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #000000;
              background: #ffffff;
              font-size: 9.5px;
              line-height: 1.25;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .tax-box {
              border: 1.5px solid #000000;
              width: 100%;
              margin: 0 auto;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .header {
              text-align: center;
              padding: 6px 4px;
              border-bottom: 1.5px solid #000000;
            }
            .header h1 {
              font-size: 13.5px;
              font-weight: bold;
              letter-spacing: 1px;
              margin-bottom: 2px;
              line-height: 1.1;
            }
            .header p {
              font-size: 9.5px;
              font-weight: 600;
              font-family: monospace;
            }
            .section-title {
              background-color: #f1f5f9;
              font-weight: bold;
              font-size: 9px;
              padding: 2.5px 8px;
              border-bottom: 1px solid #000000;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
            }
            .info-table td {
              padding: 1.5px 4px;
              font-size: 9px;
              vertical-align: top;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
            }
            .items-table th {
              background-color: #f1f5f9;
              border-bottom: 1px solid #000000;
              padding: 3.5px 6px;
              font-weight: bold;
            }
            .recap-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
            }
            .recap-table td {
              padding: 2px 8px;
              border-bottom: 1px solid #000000;
            }
            .sign-table {
              width: 100%;
              border-collapse: collapse;
            }
            .sign-table td {
              padding: 5px 8px;
              vertical-align: top;
            }
            .footer-notice {
              border-top: 1px solid #000000;
              background-color: #f8fafc;
              padding: 3px 8px;
              text-align: center;
              font-size: 8px;
              font-style: italic;
              color: #334155;
            }
          </style>
        </head>
        <body>
          <div class="tax-box">
            <!-- Header Dokumen -->
            <div class="header">
              <h1>FAKTUR PAJAK</h1>
              <p>Kode dan Nomor Seri Faktur Pajak : ${nsfp}</p>
            </div>

            <!-- Bagian 1: Pengusaha Kena Pajak -->
            <div style="border-bottom: 1px solid #000000;">
              <div class="section-title">Pengusaha Kena Pajak</div>
              <div style="padding: 3px 6px;">
                <table class="info-table">
                  <tr>
                    <td style="width: 85px; font-weight: 500;">Nama</td>
                    <td style="width: 12px; text-align: center;">:</td>
                    <td style="font-weight: bold;">${sellerCompany}</td>
                  </tr>
                  <tr>
                    <td style="width: 85px; font-weight: 500;">Alamat</td>
                    <td style="width: 12px; text-align: center;">:</td>
                    <td>${sellerAddress}</td>
                  </tr>
                  <tr>
                    <td style="width: 85px; font-weight: 500;">NPWP</td>
                    <td style="width: 12px; text-align: center;">:</td>
                    <td style="font-family: monospace; font-weight: 600;">${sellerNpwp}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Bagian 2: Pembeli BKP / Penerima JKP -->
            <div style="border-bottom: 1px solid #000000;">
              <div class="section-title">Pembeli Barang Kena Pajak / Penerima Jasa Kena Pajak</div>
              <div style="padding: 3px 6px;">
                <table class="info-table">
                  <tr>
                    <td style="width: 85px; font-weight: 500;">Nama</td>
                    <td style="width: 12px; text-align: center;">:</td>
                    <td style="font-weight: bold;">${buyerName}</td>
                  </tr>
                  <tr>
                    <td style="width: 85px; font-weight: 500;">Alamat</td>
                    <td style="width: 12px; text-align: center;">:</td>
                    <td>${buyerAddress}</td>
                  </tr>
                  <tr>
                    <td style="width: 85px; font-weight: 500;">NPWP / NIK</td>
                    <td style="width: 12px; text-align: center;">:</td>
                    <td style="font-family: monospace; font-weight: 600;">${buyerNpwp}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Bagian 3: Tabel Penyerahan BKP / JKP -->
            <div style="border-bottom: 1px solid #000000;">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 35px; text-align: center; border-right: 1px solid #000000;">No.</th>
                    <th style="text-align: left; border-right: 1px solid #000000; padding-left: 8px;">
                      Nama Barang Kena Pajak / Jasa Kena Pajak
                    </th>
                    <th style="width: 190px; text-align: right; padding-right: 8px;">
                      Harga Jual / Penggantian / Uang Muka / Termin (Rp)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Bagian 4: Rekapitulasi Perhitungan Pajak Standar DJP -->
            <div style="border-bottom: 1px solid #000000;">
              <table class="recap-table">
                <tr>
                  <td>Harga Jual / Penggantian</td>
                  <td style="width: 190px; text-align: right; font-family: monospace;">Rp ${formatNumber(subtotalGross)}</td>
                </tr>
                <tr>
                  <td>Dikurangi Potongan Harga</td>
                  <td style="text-align: right; font-family: monospace;">Rp ${formatNumber(discount)}</td>
                </tr>
                <tr>
                  <td>Dikurangi Uang Muka yang telah diterima</td>
                  <td style="text-align: right; font-family: monospace;">Rp 0</td>
                </tr>
                <tr style="background-color: #f8fafc; font-weight: bold;">
                  <td>Dasar Pengenaan Pajak</td>
                  <td style="text-align: right; font-family: monospace;">Rp ${formatNumber(dppAmount)}</td>
                </tr>
                <tr style="font-weight: bold;">
                  <td>PPN = ${vatRate}% × Dasar Pengenaan Pajak</td>
                  <td style="text-align: right; font-family: monospace;">Rp ${formatNumber(vatAmount)}</td>
                </tr>
                <tr>
                  <td>Total PPnBM (Pajak Penjualan atas Barang Mewah)</td>
                  <td style="text-align: right; font-family: monospace;">Rp 0</td>
                </tr>
              </table>
            </div>

            <!-- Bagian 5: Tanda Tangan Elektronik & QR Code Validasi DJP -->
            <div>
              <table class="sign-table">
                <tr>
                  <td style="width: 58%; padding-right: 10px;">
                    <p style="font-size: 8px; font-style: italic; color: #334155; line-height: 1.35; margin-bottom: 4px;">
                      Sesuai dengan ketentuan yang berlaku, Direktorat Jenderal Pajak mengatur bahwa Faktur Pajak ini telah ditandatangani secara elektronik sehingga tidak diperlukan tanda tangan basah pada Faktur Pajak ini.
                    </p>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                      ${
                        qrCodeDataUrl
                          ? `<img src="${qrCodeDataUrl}" style="width: 52px; height: 52px; border: 1px solid #cbd5e1; padding: 1px; display: block;" alt="QR Validasi DJP" />`
                          : ''
                      }
                      <div style="font-size: 8px; font-family: monospace; line-height: 1.3;">
                        <div style="font-weight: bold; color: #000;">VALIDASI DJP</div>
                        <div style="color: #475569;">Scan QR untuk verifikasi NSFP</div>
                        <div style="color: #64748b; font-size: 7.5px;">Ref: #${order.orderNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td style="width: 42%; text-align: right; font-size: 9px; line-height: 1.35;">
                    <div>${sellerCity}, ${formattedDate}</div>
                    <div style="font-weight: bold; margin-top: 1px;">${sellerCompany}</div>
                    <div style="margin: 5px 0;">
                      <span style="border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 2px 5px; font-size: 7.5px; font-family: monospace; color: #475569;">
                        [DITANDATANGANI SECARA ELEKTRONIK]
                      </span>
                    </div>
                    <div style="font-size: 8px; font-family: monospace; color: #475569;">
                      NPWP: ${sellerNpwp}
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Bagian 6: Pemberitahuan Legal Footer Standar DJP -->
            <div class="footer-notice">
              PEMBERITAHUAN: Faktur Pajak ini telah dilaporkan ke Direktorat Jenderal Pajak dan telah memperoleh persetujuan sesuai dengan ketentuan peraturan perpajakan yang berlaku.
            </div>
          </div>
        </body>
      </html>
    `

    try {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)

      const doc = iframe.contentWindow?.document
      if (!doc) {
        window.print()
        return
      }

      doc.open()
      doc.write(fullHtml)
      doc.close()

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch (e) {
          console.error('Iframe print failed, calling window.print()', e)
          window.print()
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
          }, 2500)
        }
      }, 250)
    } catch (err) {
      console.error('Error initiating print:', err)
      window.print()
    }
  }, [
    order,
    sellerCompany,
    sellerNpwp,
    sellerAddress,
    sellerCity,
    buyerName,
    buyerNpwp,
    buyerAddress,
    subtotalGross,
    discount,
    dppAmount,
    vatRate,
    vatAmount,
    formattedDate,
    nsfp,
    qrCodeDataUrl,
  ])

  if (!isOpen || !order || !mounted) return null

  return createPortal(
    <div
      id="tax-invoice-portal-root"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/75 p-2 sm:p-4 backdrop-blur-xs duration-200 animate-in fade-in overflow-y-auto pointer-events-auto print:static print:inset-auto print:z-auto print:block print:p-0 print:bg-white print:overflow-visible"
      onClick={onClose}
    >
      {/* Fallback Print Stylesheet jika user menekan shortcut browser Ctrl+P */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 7mm 9mm;
              }
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                height: auto !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
              }
              body > *:not(#tax-invoice-portal-root) {
                display: none !important;
              }
              #tax-invoice-portal-root {
                display: block !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                overflow: visible !important;
              }
              .print-hide {
                display: none !important;
              }
              .tax-invoice-modal-card {
                display: block !important;
                position: static !important;
                width: 100% !important;
                max-width: 100% !important;
                max-height: none !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                background: #ffffff !important;
                overflow: visible !important;
              }
              .tax-invoice-scroll-area {
                display: block !important;
                overflow: visible !important;
                height: auto !important;
                max-height: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .tax-invoice-box {
                display: block !important;
                position: static !important;
                width: 100% !important;
                border: 1.5px solid #000000 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #000000 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                overflow: visible !important;
              }
              .tax-invoice-box table {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .tax-invoice-box tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `,
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="tax-invoice-modal-card pointer-events-auto relative my-auto flex max-h-[88vh] w-full max-w-2xl sm:max-w-[760px] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 print:max-h-none print:w-full print:rounded-none print:border-none print:bg-white print:p-0 print:shadow-none"
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="print-hide flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-100/90 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Format Standar DJP RI (PER-03/PJ/2022)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="shadow-xs inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / Unduh PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              title="Tutup Faktur Pajak"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas (Format Resmi Lampiran PER-03/PJ/2022) */}
        <div
          ref={printableRef}
          className="tax-invoice-scroll-area flex-1 overflow-y-auto p-4 sm:p-7 font-sans text-xs text-black bg-white dark:bg-white dark:text-black print:overflow-visible print:p-0"
        >
          {/* Box Terluar Standar Dokumen DJP */}
          <div className="tax-invoice-box border border-black">
            {/* Header: FAKTUR PAJAK & NSFP */}
            <div className="p-2 sm:p-2.5 text-center border-b border-black">
              <h1 className="text-base sm:text-lg font-bold tracking-wider uppercase text-black">
                FAKTUR PAJAK
              </h1>
              <p className="mt-0.5 font-mono text-[11px] sm:text-xs font-semibold text-black">
                Kode dan Nomor Seri Faktur Pajak : {nsfp}
              </p>
            </div>

            {/* Bagian 1: Pengusaha Kena Pajak (Penjual) */}
            <div className="border-b border-black">
              <div className="bg-slate-100 px-3 py-1 font-bold text-[10px] sm:text-[11px] border-b border-black text-black">
                Pengusaha Kena Pajak
              </div>
              <div className="p-2.5 text-[10px] sm:text-[11px] text-black font-sans">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td style={{ width: '90px' }} className="py-0.5 align-top font-medium text-slate-800">Nama</td>
                      <td style={{ width: '15px' }} className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top font-bold text-black">{sellerCompany}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '90px' }} className="py-0.5 align-top font-medium text-slate-800">Alamat</td>
                      <td style={{ width: '15px' }} className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top text-black">{sellerAddress}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '90px' }} className="py-0.5 align-top font-medium text-slate-800">NPWP</td>
                      <td style={{ width: '15px' }} className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top font-mono font-semibold text-black">{sellerNpwp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian 2: Pembeli Barang Kena Pajak / Penerima Jasa Kena Pajak */}
            <div className="border-b border-black">
              <div className="bg-slate-100 px-3 py-1 font-bold text-[10px] sm:text-[11px] border-b border-black text-black">
                Pembeli Barang Kena Pajak / Penerima Jasa Kena Pajak
              </div>
              <div className="p-2.5 text-[10px] sm:text-[11px] text-black font-sans">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td style={{ width: '90px' }} className="py-0.5 align-top font-medium text-slate-800">Nama</td>
                      <td style={{ width: '15px' }} className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top font-bold text-black">{buyerName}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '90px' }} className="py-0.5 align-top font-medium text-slate-800">Alamat</td>
                      <td style={{ width: '15px' }} className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top text-black">{buyerAddress}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '90px' }} className="py-0.5 align-top font-medium text-slate-800">NPWP / NIK</td>
                      <td style={{ width: '15px' }} className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top font-mono font-semibold text-black">{buyerNpwp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian 3: Tabel Penyerahan BKP / JKP */}
            <div className="border-b border-black">
              <table className="w-full text-[10px] sm:text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-black bg-slate-100 text-black text-center font-bold">
                    <th style={{ width: '38px' }} className="py-1.5 px-2 border-r border-black">No.</th>
                    <th className="py-1.5 px-3 border-r border-black text-left">
                      Nama Barang Kena Pajak / Jasa Kena Pajak
                    </th>
                    <th style={{ width: '210px' }} className="py-1.5 px-3 text-right">
                      Harga Jual / Penggantian / Uang Muka / Termin (Rp)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const itemName =
                      item.product?.name ||
                      item.service?.name ||
                      item.rentalItem?.name ||
                      'Gadget Smartphone'
                    const variantDesc = item.variantName
                      ? ` (${item.variantName})`
                      : ''
                    const itemTotal = item.price * (item.quantity || 1)

                    return (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="py-1.5 px-2 border-r border-black text-center align-top font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 border-r border-black align-top">
                          <p className="font-semibold text-black">
                            {itemName}
                            {variantDesc}
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-mono">
                            {item.quantity || 1} Unit x Rp{' '}
                            {formatNumber(item.price)}
                          </p>
                        </td>
                        <td className="py-1.5 px-3 text-right align-top font-mono font-medium text-black">
                          {formatNumber(itemTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Bagian 4: Rekapitulasi Perhitungan Pajak Standar DJP */}
            <div className="border-b border-black text-[10px] sm:text-[11px]">
              <table className="w-full border-collapse">
                <tbody className="divide-y divide-black">
                  <tr>
                    <td className="px-3 py-1 font-medium text-black">
                      Harga Jual / Penggantian
                    </td>
                    <td style={{ width: '210px' }} className="px-3 py-1 text-right font-mono font-medium text-black">
                      Rp {formatNumber(subtotalGross)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-medium text-black">
                      Dikurangi Potongan Harga
                    </td>
                    <td style={{ width: '210px' }} className="px-3 py-1 text-right font-mono font-medium text-black">
                      Rp {formatNumber(discount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-medium text-black">
                      Dikurangi Uang Muka yang telah diterima
                    </td>
                    <td style={{ width: '210px' }} className="px-3 py-1 text-right font-mono font-medium text-black">
                      Rp 0
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="px-3 py-1 text-black">
                      Dasar Pengenaan Pajak
                    </td>
                    <td style={{ width: '210px' }} className="px-3 py-1 text-right font-mono text-black">
                      Rp {formatNumber(dppAmount)}
                    </td>
                  </tr>
                  <tr className="font-bold">
                    <td className="px-3 py-1 text-black">
                      PPN = {vatRate}% × Dasar Pengenaan Pajak
                    </td>
                    <td style={{ width: '210px' }} className="px-3 py-1 text-right font-mono text-black">
                      Rp {formatNumber(vatAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-medium text-black">
                      Total PPnBM (Pajak Penjualan atas Barang Mewah)
                    </td>
                    <td style={{ width: '210px' }} className="px-3 py-1 text-right font-mono font-medium text-black">
                      Rp 0
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bagian 5: Tanda Tangan Elektronik & QR Code Validasi DJP */}
            <div className="p-2.5">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td style={{ width: '58%' }} className="align-top pr-3">
                      <p className="text-[9px] sm:text-[9.5px] leading-relaxed text-slate-700 italic">
                        Sesuai dengan ketentuan yang berlaku, Direktorat Jenderal Pajak
                        mengatur bahwa Faktur Pajak ini telah ditandatangani secara
                        elektronik sehingga tidak diperlukan tanda tangan basah pada
                        Faktur Pajak ini.
                      </p>
                      <div className="flex items-center gap-2 pt-2">
                        {qrCodeDataUrl ? (
                          <img
                            src={qrCodeDataUrl}
                            alt="DJP Validation QR Code"
                            className="h-16 w-16 sm:h-18 sm:w-18 border border-slate-300 p-0.5 object-contain"
                          />
                        ) : (
                          <div className="h-16 w-16 border border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                            QR DJP
                          </div>
                        )}
                        <div className="text-[9px] space-y-0.5 font-mono">
                          <p className="font-bold text-black">VALIDASI DJP</p>
                          <p className="text-slate-600">Scan QR Code untuk verifikasi</p>
                          <p className="text-[8.5px] text-slate-500">
                            Ref: #{order.orderNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td style={{ width: '42%' }} className="align-top text-right text-[10px] sm:text-[11px] space-y-1">
                      <p className="text-black">
                        {sellerCity}, {formattedDate}
                      </p>
                      <p className="font-bold text-black">{sellerCompany}</p>
                      <div className="py-1.5 flex justify-end">
                        <span className="border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8.5px] font-mono text-slate-600">
                          [DITANDATANGANI SECARA ELEKTRONIK]
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                        NPWP: {sellerNpwp}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bagian 6: Pemberitahuan Legal Footer Standar DJP */}
            <div className="border-t border-black bg-slate-50 px-2 py-1.5 text-center text-[9px] sm:text-[9.5px] italic text-slate-700">
              PEMBERITAHUAN: Faktur Pajak ini telah dilaporkan ke Direktorat
              Jenderal Pajak dan telah memperoleh persetujuan sesuai dengan
              ketentuan peraturan perpajakan yang berlaku.
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
