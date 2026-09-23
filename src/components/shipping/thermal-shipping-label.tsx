'use client'

import { useRef } from 'react'
import {
  Printer,
  X,
  ShieldCheck,
  Gift,
  Truck,
  AlertTriangle,
} from 'lucide-react'
import { ShippingBookingRecord } from '@/lib/shipping/biteship-client'

interface ThermalShippingLabelProps {
  data: ShippingBookingRecord
  onClose: () => void
}

export function ThermalShippingLabel({
  data,
  onClose,
}: ThermalShippingLabelProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const isGojek = data.courierCode === 'GOJEK'
  const firstItem = data.items?.[0]

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4">
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
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Label</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Label Area */}
        <div className="overflow-y-auto p-5 print:p-0">
          <div
            ref={printRef}
            id="printable-shipping-label"
            className="mx-auto w-full max-w-[420px] rounded-2xl border-2 border-dashed border-slate-900 bg-white p-4 font-sans text-slate-950 shadow-sm print:max-w-none print:border-none print:p-2 print:shadow-none"
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
                  {data.destinationCustomer.name}
                </p>
                <p className="text-[10px] font-semibold text-slate-700">
                  {data.destinationCustomer.phone}
                </p>
                <p className="line-clamp-3 text-[10px] leading-tight text-slate-600">
                  {data.destinationCustomer.address}
                </p>
                <p className="text-[10px] font-bold uppercase text-slate-800">
                  {data.destinationCustomer.city},{' '}
                  {data.destinationCustomer.province}{' '}
                  {data.destinationCustomer.postalCode || ''}
                </p>
              </div>

              {/* Pengirim */}
              <div className="space-y-1 pl-1">
                <span className="block text-[9px] font-black uppercase text-slate-500">
                  Dari (Pengirim PT):
                </span>
                <p className="line-clamp-1 text-xs font-bold text-slate-950">
                  {data.originStore.name}
                </p>
                <p className="line-clamp-1 text-[9px] font-bold text-slate-700">
                  {data.originStore.companyName}
                </p>
                <p className="text-[10px] font-semibold text-slate-700">
                  {data.originStore.phone}
                </p>
                <p className="line-clamp-2 text-[9px] leading-tight text-slate-600">
                  {data.originStore.address}
                </p>
                <p className="text-[9px] font-bold uppercase text-slate-800">
                  {data.originStore.city}
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
