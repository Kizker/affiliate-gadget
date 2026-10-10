'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check, Store } from 'lucide-react'

export interface StoreOption {
  storeId: string
  storeName: string
  city?: string | null
  subtotal: number
}

interface StoreVoucherSelectorProps {
  stores: StoreOption[]
  selectedStoreId: string | null
  onSelectStore: (storeId: string) => void
  label?: string
  disabled?: boolean
}

export function StoreVoucherSelector({
  stores,
  selectedStoreId,
  onSelectStore,
  label = 'Pilih pesanan toko yang menerima voucher:',
  disabled = false,
}: StoreVoucherSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedStore =
    stores.find((s) => s.storeId === selectedStoreId) || stores[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!stores || stores.length === 0) return null

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white p-2.5 text-left text-xs transition-all dark:bg-slate-800 ${
            isOpen
              ? 'border-orange-500 shadow-sm ring-2 ring-orange-500/15'
              : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
          } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-bold text-slate-900 dark:text-white">
                  {selectedStore?.storeName || 'Pilih Toko'}
                </span>
                {selectedStore?.city && (
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    {selectedStore.city}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Subtotal:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Rp {selectedStore?.subtotal.toLocaleString('id-ID')}
                </span>
              </p>
            </div>
          </div>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-orange-500' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Popover */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-1 shadow-lg shadow-slate-900/10 animate-in fade-in-50 zoom-in-95 dark:border-slate-700 dark:bg-slate-800"
          >
            {stores.map((store) => {
              const isSelected = store.storeId === selectedStore?.storeId
              return (
                <button
                  key={store.storeId}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    onSelectStore(store.storeId)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-orange-50 font-bold text-orange-900 dark:bg-orange-950/40 dark:text-orange-200'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Store
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isSelected
                          ? 'text-orange-500'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{store.storeName}</span>
                        {store.city && (
                          <span className="shrink-0 text-[10px] font-normal text-slate-400">
                            • {store.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`text-[11px] tabular-nums ${
                        isSelected
                          ? 'font-bold text-orange-600 dark:text-orange-400'
                          : 'font-semibold text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Rp {store.subtotal.toLocaleString('id-ID')}
                    </span>
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <div className="h-3.5 w-3.5" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
