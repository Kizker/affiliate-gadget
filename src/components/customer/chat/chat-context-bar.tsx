'use client'

import React from 'react'
import { RotateCcw, Package, Wrench, MapPin, X } from 'lucide-react'
import {
  ActiveOrderContext,
  ActiveServiceContext,
  ActiveProductContext,
} from './chat-types'

interface ChatOrderContextBarProps {
  activeOrderContext: ActiveOrderContext
  messageInput: string
  onSendMessage: (msgToSend: string) => void
  onDismiss: () => void
}

export function ChatOrderContextBar({
  activeOrderContext,
  messageInput,
  onSendMessage,
  onDismiss,
}: ChatOrderContextBarProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-t px-4 py-2.5 ${
        activeOrderContext.returnRequest
          ? 'border-purple-200/80 bg-gradient-to-r from-purple-50/90 via-orange-50/40 to-white dark:border-purple-900/40 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900'
          : 'border-blue-100 bg-blue-50/80 dark:border-blue-900/40 dark:bg-blue-950/30'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {activeOrderContext.productImage ? (
          <img
            src={activeOrderContext.productImage}
            alt=""
            width={44}
            height={44}
            loading="lazy"
            decoding="async"
            className={`h-11 w-11 shrink-0 rounded-xl border bg-white object-cover p-0.5 ${
              activeOrderContext.returnRequest
                ? 'border-purple-200 dark:border-purple-800'
                : 'border-blue-200 dark:border-blue-800'
            }`}
          />
        ) : (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              activeOrderContext.returnRequest
                ? 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
            }`}
          >
            {activeOrderContext.returnRequest ? (
              <RotateCcw className="h-5 w-5" />
            ) : (
              <Package className="h-5 w-5" />
            )}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider ${
                activeOrderContext.returnRequest
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
              }`}
            >
              {activeOrderContext.returnRequest ? 'Pengajuan Retur' : 'Pesanan'}
            </span>
            {activeOrderContext.orderNumber && (
              <span className="truncate font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                #{activeOrderContext.orderNumber}
              </span>
            )}
          </div>
          {activeOrderContext.productName && (
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
              {activeOrderContext.productName}
            </p>
          )}
          {activeOrderContext.returnRequest ? (
            <p className="truncate text-[11px] font-medium text-purple-700 dark:text-purple-300">
              Kendala:{' '}
              {activeOrderContext.returnRequest.reason || 'Kendala Unit'} •
              Status:{' '}
              {activeOrderContext.returnRequest.status === 'APPROVED'
                ? 'Disetujui'
                : activeOrderContext.returnRequest.status === 'REJECTED'
                  ? 'Ditolak'
                  : activeOrderContext.returnRequest.status === 'COMPLETED'
                    ? 'Selesai'
                    : 'Menunggu Verifikasi Toko'}
            </p>
          ) : activeOrderContext.total ? (
            <p className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400">
              Rp {activeOrderContext.total.toLocaleString('id-ID')}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            const defaultMsg = activeOrderContext.returnRequest
              ? `Tanya Status Retur #${activeOrderContext.orderNumber || ''}`
              : `Tanya Pesanan #${activeOrderContext.orderNumber || ''}`
            const msgToSend = messageInput.trim() || defaultMsg
            onSendMessage(msgToSend)
          }}
          className={`shadow-2xs cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-[10.5px] font-bold transition sm:inline-flex ${
            activeOrderContext.returnRequest
              ? 'border-purple-300 bg-purple-600 text-white hover:bg-purple-700'
              : 'border-blue-300 bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <span>
            {activeOrderContext.returnRequest
              ? 'Tanya Status Retur'
              : 'Tanya Pesanan'}
          </span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup ringkasan pesanan"
          className="p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          title="Tutup ringkasan"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface ChatServiceContextBarProps {
  activeServiceContext: ActiveServiceContext
  messageInput: string
  onSendMessage: (msgToSend: string) => void
  onDismiss: () => void
}

export function ChatServiceContextBar({
  activeServiceContext,
  messageInput,
  onSendMessage,
  onDismiss,
}: ChatServiceContextBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-emerald-100 bg-emerald-50/80 px-4 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
      <div className="flex min-w-0 items-center gap-2.5">
        {activeServiceContext.mitraImage ? (
          <img
            src={activeServiceContext.mitraImage}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 rounded-xl border border-emerald-200/80 bg-white object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
            <Wrench className="h-5 w-5 text-emerald-600" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
              Konsultasi Servis:
            </span>
            <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {activeServiceContext.mitraName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {activeServiceContext.mitraCity && (
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <MapPin className="h-3 w-3 text-slate-400" />
                {activeServiceContext.mitraCity}
              </span>
            )}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              • Booking & Estimasi Servis
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            const defaultMsg = `Konsultasi Servis: ${activeServiceContext.mitraName}`
            const msgToSend = messageInput.trim() || defaultMsg
            onSendMessage(msgToSend)
          }}
          className="shadow-2xs hidden cursor-pointer items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10.5px] font-bold text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300 sm:inline-flex"
        >
          <span>Tanya Servis</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup ringkasan servis"
          className="p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          title="Tutup ringkasan"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface ChatProductContextBarProps {
  activeProductContext: ActiveProductContext
  messageInput: string
  onSendMessage: (msgToSend: string) => void
  onDismiss: () => void
}

export function ChatProductContextBar({
  activeProductContext,
  messageInput,
  onSendMessage,
  onDismiss,
}: ChatProductContextBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-orange-100 bg-orange-50/80 px-4 py-2.5 dark:border-orange-900/40 dark:bg-orange-950/30">
      <div className="flex min-w-0 items-center gap-2.5">
        {activeProductContext.productImage ? (
          <img
            src={activeProductContext.productImage}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 rounded-xl border border-orange-200/80 bg-white object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">
              Membahas:
            </span>
            <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {activeProductContext.productName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {activeProductContext.variantName && (
              <span className="truncate text-slate-500 dark:text-slate-400">
                Varian: {activeProductContext.variantName}
              </span>
            )}
            {activeProductContext.productPrice !== undefined && (
              <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                Rp {activeProductContext.productPrice.toLocaleString('id-ID')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            const defaultMsg = `Tanya Unit: ${activeProductContext.productName}${activeProductContext.variantName ? ` (${activeProductContext.variantName})` : ''}`
            const msgToSend = messageInput.trim() || defaultMsg
            onSendMessage(msgToSend)
          }}
          className="shadow-2xs hidden cursor-pointer items-center gap-1 rounded-full border border-orange-200 bg-white px-3 py-1 text-[10.5px] font-bold text-orange-600 transition hover:bg-orange-50 dark:border-orange-900 dark:bg-slate-900 dark:text-orange-300 sm:inline-flex"
        >
          <span>Tanya Unit</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup ringkasan produk"
          className="p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          title="Tutup ringkasan"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
