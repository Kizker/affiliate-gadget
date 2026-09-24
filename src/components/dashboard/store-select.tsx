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
  return (
    <Select value={value || 'ALL'} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          'h-9 max-w-[280px] rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all',
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <SelectValue placeholder="Pilih Cabang PT" />
        </div>
      </SelectTrigger>
      <SelectContent className="w-72" align="start">
        <SelectItem value="ALL" className="text-xs font-bold text-blue-600 dark:text-blue-400">
          <div className="flex items-center gap-2 py-0.5">
            <Building2 className="h-3.5 w-3.5" />
            <span>Semua Cabang (Konsolidasi Multi-PT)</span>
          </div>
        </SelectItem>
        {stores.map((st) => (
          <SelectItem key={st.id} value={st.id} className="text-xs">
            <div className="flex items-center justify-between gap-2 py-0.5 w-full">
              <div className="flex items-center gap-2 truncate">
                <StoreIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate font-medium">{st.companyName}</span>
              </div>
              <span className="shrink-0 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                {st.city}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
