'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  Printer,
  X,
  ShieldCheck,
  Gift,
  Truck,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import { ShippingBookingRecord } from '@/lib/shipping/biteship-client'

interface ThermalShippingLabelProps {
  data: ShippingBookingRecord
  onClose: () => void
  onBackToOrder?: () => void
}

export function ThermalShippingLabel({
  data,
  onClose,
  onBackToOrder,
}: ThermalShippingLabelProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useCallback(() => {
    try {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.setAttribute('aria-hidden', 'true')
      document.body.appendChild(iframe)

      const doc = iframe.contentWindow?.document
      if (!doc) {
        window.print()
        return
      }

      const isGojek = data.courierCode === 'GOJEK'
      const courierBg = isGojek ? '#059669' : '#1e40af'
      const courierBadge = isGojek ? 'GK' : 'JNE'
      const courierTitle = isGojek ? 'Gojek Instant' : 'JNE Express'
      const courierService =
        data.courierService || (isGojek ? 'INSTANT' : 'REG')
      const serviceType = isGojek ? 'LAYANAN KILAT' : 'NON-COD'

      const destName = data.destinationCustomer?.name || 'Customer'
      const destPhone = data.destinationCustomer?.phone || '-'
      const destAddress = data.destinationCustomer?.address || '-'
      const destCity = [
        data.destinationCustomer?.city,
        data.destinationCustomer?.province,
        data.destinationCustomer?.postalCode,
      ]
        .filter(Boolean)
        .join(', ')

      const originName = data.originStore?.name || 'Toko Cabang'
      const originCompany = data.originStore?.companyName || 'PT Pengirim'
      const originPhone = data.originStore?.phone || '-'
      const originAddress = data.originStore?.address || '-'
      const originCity = data.originStore?.city || ''

      const firstItem = data.items?.[0]
      const itemName = firstItem?.name || 'Gadget Smartphone'
      const itemQty = firstItem?.quantity || 1
      const itemWeight = firstItem?.weightGram || 500

      // 42 Barcode bars
      const barcodeBars = Array.from({ length: 42 })
        .map((_, i) => {
          const width = i % 3 === 0 ? '3.5px' : i % 5 === 0 ? '5px' : '1.5px'
          return `<div style="height: 100%; width: ${width}; background-color: #000000; flex-shrink: 0;"></div>`
        })
        .join('')

      const fullHtml = `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>Label Pengiriman - ${data.orderNumber}</title>
    <style>
      @page {
        size: 100mm 150mm;
        margin: 0;
      }
      * {
        box-sizing: border-box !important;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        width: 100%;
        background-color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #0f172a;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 6px;
      }
      .label-card {
        width: 100%;
        max-width: 400px;
        border: 2px dashed #0f172a;
        border-radius: 16px;
        background-color: #ffffff;
        padding: 16px;
        box-sizing: border-box;
        page-break-after: avoid;
        page-break-inside: avoid;
        break-inside: avoid;
      }
    </style>
  </head>
  <body>
    <div class="label-card">
      <!-- Section 1: Header (Courier & Service) -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; font-weight: 900; font-size: 14px; color: #ffffff; background-color: ${courierBg}; display: flex; align-items: center; justify-content: center;">
            ${courierBadge}
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; line-height: 1.1;">
              ${courierTitle}
            </div>
            <span style="display: inline-block; background-color: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin-top: 3px;">
              ${courierService}
            </span>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">
            ${serviceType}
          </span>
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; font-weight: 900; color: #0f172a;">
            ${data.orderNumber}
          </div>
        </div>
      </div>

      <!-- Section 2: Barcode & Resi -->
      <div style="padding: 12px 0; border-bottom: 2px solid #0f172a; text-align: center;">
        <div style="height: 48px; max-width: 320px; display: flex; align-items: stretch; justify-content: center; gap: 2px; margin: 0 auto; background: #ffffff; padding: 2px 0;">
          ${barcodeBars}
        </div>
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 16px; font-weight: 900; letter-spacing: 2px; color: #0f172a; margin-top: 4px;">
          ${data.trackingNumber}
        </div>
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 2px;">
          No. Resi / AWB Elektronik
        </div>
      </div>

      <!-- Section 3: Penerima & Pengirim (2 Kolom) -->
      <div style="display: flex; border-bottom: 2px solid #0f172a; padding: 12px 0; font-size: 11px;">
        <!-- Left: Penerima -->
        <div style="flex: 1; border-right: 1px solid #cbd5e1; padding-right: 10px;">
          <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 3px;">
            Kepada (Penerima):
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #0f172a;">
            ${destName}
          </div>
          <div style="font-size: 10px; font-weight: 600; color: #334155; margin-top: 2px;">
            ${destPhone}
          </div>
          <div style="font-size: 10px; color: #475569; line-height: 1.25; margin-top: 2px;">
            ${destAddress}
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #1e293b; text-transform: uppercase; margin-top: 2px;">
            ${destCity}
          </div>
        </div>

        <!-- Right: Pengirim -->
        <div style="flex: 1; padding-left: 10px;">
          <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 3px;">
            Dari (Pengirim PT):
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.2;">
            ${originName}
          </div>
          <div style="font-size: 9px; font-weight: 700; color: #334155; margin-top: 2px;">
            ${originCompany}
          </div>
          <div style="font-size: 10px; font-weight: 600; color: #334155; margin-top: 2px;">
            ${originPhone}
          </div>
          <div style="font-size: 9px; color: #475569; line-height: 1.25; margin-top: 2px;">
            ${originAddress}
          </div>
          <div style="font-size: 9px; font-weight: 700; color: #1e293b; text-transform: uppercase; margin-top: 2px;">
            ${originCity}
          </div>
        </div>
      </div>

      <!-- Section 4: Detail Barang, Asuransi, Fragile, Footer -->
      <div style="padding-top: 12px; font-size: 10px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #0f172a;">
          <span>Unit: ${itemName} (${itemQty}x)</span>
          <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">Berat: ${itemWeight} gr</span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; border: 1px solid #0f172a; background-color: #f1f5f9; border-radius: 8px; padding: 6px 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin-top: 8px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span>100% Terlindungi Asuransi Wajib (Ganti Unit Baru)</span>
        </div>

        <div style="display: flex; align-items: center; gap: 5px; font-size: 9px; font-weight: 500; color: #334155; margin-top: 6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
          <span>Paket Bonus 3-in-1 Termasuk (Charger, Antigores & Case)</span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; border: 2px solid #0f172a; border-radius: 6px; padding: 5px 8px; margin-top: 8px; text-transform: uppercase; color: #0f172a;">
          <span style="font-size: 11px; font-weight: 900; display: flex; align-items: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            FRAGILE
          </span>
          <span style="font-size: 10px; font-weight: 600;">JANGAN DIBANTING / HINDARKAN AIR</span>
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 8px; font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
          <span>E-Commerce Airwaybill</span>
          <span>Powered by Biteship Logistics</span>
        </div>
      </div>
    </div>
  </body>
</html>`

      doc.open()
      doc.write(fullHtml)
      doc.close()

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch (e) {
          console.error(
            'Iframe print error, falling back to window.print():',
            e
          )
          window.print()
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
          }, 3000)
        }
      }, 250)
    } catch (err) {
      console.error('Error initiating thermal label print:', err)
      window.print()
    }
  }, [data])

  // Cegah Ctrl+P membocorkan halaman dashboard, arahkan ke print iframe bersih
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        handlePrint()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrint])

  const isGojek = data.courierCode === 'GOJEK'
  const firstItem = data.items?.[0]

  return (
    <div
      id="thermal-modal-root"
      className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4"
    >
      {/* Container */}
      <div className="flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header Bar (Not printed) */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/60 print:hidden">
          <div className="flex items-center gap-2">
            <div className="shadow-xs flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                Label Pengiriman Thermal (100 × 150 mm)
              </h3>
              <p className="text-[10px] text-slate-500">
                Standar Ekspedisi Resmi E-Commerce Indonesia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onBackToOrder && (
              <button
                type="button"
                onClick={onBackToOrder}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Kembali ke Rincian</span>
                <span className="sm:hidden">Kembali</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Label</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Label Area */}
        <div className="overflow-y-auto p-5 print:overflow-visible print:p-0">
          <div
            ref={printRef}
            id="printable-shipping-label"
            className="mx-auto w-full max-w-[420px] rounded-2xl border-2 border-dashed border-slate-900 bg-white p-4 font-sans text-slate-950 shadow-sm print:max-w-[420px] print:rounded-2xl print:border-2 print:border-dashed print:border-slate-900 print:p-4 print:shadow-none"
          >
            {/* Top Row: Courier & Service */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg font-black text-white ${isGojek ? 'bg-emerald-600' : 'bg-blue-800'}`}
                >
                  {isGojek ? 'GK' : 'JNE'}
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">
                    {isGojek ? 'Gojek Instant' : 'JNE Express'}
                  </h4>
                  <span className="py-0.2 rounded bg-slate-100 px-1.5 text-[10px] font-black uppercase text-slate-900">
                    {data.courierService || (isGojek ? 'INSTANT' : 'REG')}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  {isGojek ? 'Layanan Kilat' : 'Non-COD'}
                </span>
                <p className="font-mono text-xs font-black">
                  {data.orderNumber}
                </p>
              </div>
            </div>

            {/* Barcode & AWB Code Area */}
            <div className="my-3 flex flex-col items-center justify-center border-b-2 border-slate-900 pb-3 text-center">
              {/* Simulated Code128 Barcode */}
              <div className="flex h-12 w-full max-w-[320px] items-stretch justify-center gap-[2px] bg-white px-2 py-1">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${i % 3 === 0 ? 'w-1 bg-black' : i % 5 === 0 ? 'w-1.5 bg-black' : 'w-0.5 bg-black'}`}
                  />
                ))}
              </div>
              <p className="mt-1 font-mono text-base font-black tracking-widest text-slate-950">
                {data.trackingNumber}
              </p>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                No. Resi / AWB Elektronik
              </span>
            </div>

            {/* Origin & Destination Grid */}
            <div className="grid grid-cols-2 gap-3 border-b-2 border-slate-900 pb-3 text-[11px]">
              {/* Penerima */}
              <div className="space-y-1 border-r border-slate-300 pr-2">
                <span className="block text-[9px] font-black uppercase text-slate-500">
                  Kepada (Penerima):
                </span>
                <p className="text-xs font-bold text-slate-950">
                  {data.destinationCustomer?.name || 'Customer'}
                </p>
                <p className="text-[10px] font-semibold text-slate-700">
                  {data.destinationCustomer?.phone || '-'}
                </p>
                <p className="line-clamp-3 text-[10px] leading-tight text-slate-600">
                  {data.destinationCustomer?.address || '-'}
                </p>
                <p className="text-[10px] font-bold uppercase text-slate-800">
                  {[
                    data.destinationCustomer?.city,
                    data.destinationCustomer?.province,
                    data.destinationCustomer?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>

              {/* Pengirim */}
              <div className="space-y-1 pl-1">
                <span className="block text-[9px] font-black uppercase text-slate-500">
                  Dari (Pengirim PT):
                </span>
                <p className="line-clamp-1 text-xs font-bold text-slate-950">
                  {data.originStore?.name || 'Toko Cabang'}
                </p>
                <p className="line-clamp-1 text-[9px] font-bold text-slate-700">
                  {data.originStore?.companyName || 'PT Pengirim'}
                </p>
                <p className="text-[10px] font-semibold text-slate-700">
                  {data.originStore?.phone || '-'}
                </p>
                <p className="line-clamp-2 text-[9px] leading-tight text-slate-600">
                  {data.originStore?.address || '-'}
                </p>
                <p className="text-[9px] font-bold uppercase text-slate-800">
                  {data.originStore?.city || ''}
                </p>
              </div>
            </div>

            {/* Goods Details & Insurance Callout */}
            <div className="space-y-2 pt-3 text-[10px]">
              <div className="flex items-center justify-between font-bold">
                <span>
                  Unit: {firstItem?.name || 'Gadget Smartphone'} (
                  {firstItem?.quantity || 1}x)
                </span>
                <span className="font-mono">
                  Berat: {firstItem?.weightGram || 500} gr
                </span>
              </div>

              {/* Mandatory Insurance Guarantee Badge */}
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-100 p-2 font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 shrink-0 text-slate-900" />
                <span className="text-[9px] uppercase tracking-tight">
                  100% Terlindungi Asuransi Wajib (Ganti Unit Baru)
                </span>
              </div>

              {/* Free 3-in-1 Bonus Package Notice */}
              <div className="flex items-center gap-1 text-[9px] font-medium text-slate-700">
                <Gift className="h-3 w-3 text-orange-600" />
                <span>
                  Paket Bonus 3-in-1 Termasuk (Charger, Antigores & Case)
                </span>
              </div>

              {/* Fragile Banner */}
              <div className="mt-2 flex items-center justify-between rounded border-2 border-slate-900 p-1.5 text-center text-xs font-black uppercase">
                <span className="flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5" /> FRAGILE
                </span>
                <span className="text-[10px] font-semibold">
                  JANGAN DIBANTING / HINDARKAN AIR
                </span>
              </div>

              {/* Thermal Label Footer / Gateway Notice */}
              <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-1 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                <span>E-Commerce Airwaybill</span>
                <span>Powered by Biteship Logistics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
