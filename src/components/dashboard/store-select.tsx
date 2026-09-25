'use client'

import React from 'react'
import { Building2, Store as StoreIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface StoreItem {
  id: string
  companyName: string
  city: string
  name?: string
}

interface StoreSelectProps {
  value: string
  onChange: (value: string) => void
  stores: StoreItem[]
  className?: string
}

export function StoreSelect({ value, onChange, stores, className }: StoreSelectProps) {
  const selectedStore = stores.find((st) => st.id === value)

  return (
    <Select value={value || 'ALL'} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          'h-9 w-auto min-w-[220px] max-w-[380px] sm:max-w-[460px] rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all',
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <SelectValue placeholder="Pilih Cabang PT">
            {value === 'ALL' || !value
              ? 'Semua Cabang (Konsolidasi Multi-PT)'
              : selectedStore
                ? selectedStore.companyName
                : 'Pilih Cabang PT'}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="w-[420px] max-w-[95vw] sm:w-[460px]" align="start">
        <SelectItem value="ALL" className="text-xs font-bold text-blue-600 dark:text-blue-400 py-2">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="font-bold">Semua Cabang (Konsolidasi Multi-PT)</span>
            </div>
            <span className="shrink-0 rounded-md bg-blue-100/70 dark:bg-blue-900/50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
              Pusat
            </span>
          </div>
        </SelectItem>
        {stores.map((st) => (
          <SelectItem key={st.id} value={st.id} className="text-xs py-2">
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <StoreIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                  {st.companyName}
                </span>
              </div>
              <span className="shrink-0 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {st.city}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
