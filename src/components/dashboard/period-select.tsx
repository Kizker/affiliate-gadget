'use client'

import React from 'react'
import { Calendar, Sparkles } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface PeriodSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const QUICK_PERIODS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'thisWeek', label: 'Minggu Ini' },
  { value: 'thisMonth', label: 'Bulan Ini' },
  { value: 'thisYear', label: 'Tahun Ini' },
]

const MONTHS = [
  { value: 'january', label: 'Januari' },
  { value: 'february', label: 'Februari' },
  { value: 'march', label: 'Maret' },
  { value: 'april', label: 'April' },
  { value: 'may', label: 'Mei' },
  { value: 'june', label: 'Juni' },
  { value: 'july', label: 'Juli' },
  { value: 'august', label: 'Agustus' },
  { value: 'september', label: 'September' },
  { value: 'october', label: 'Oktober' },
  { value: 'november', label: 'November' },
  { value: 'december', label: 'Desember' },
]

export function PeriodSelect({ value, onChange, className }: PeriodSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          'h-9 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all',
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <SelectValue placeholder="Pilih Periode" />
        </div>
      </SelectTrigger>
      <SelectContent className="w-56" align="end">
        <SelectGroup>
          <SelectLabel className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Rentang Cepat
          </SelectLabel>
          {QUICK_PERIODS.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectSeparator />

        <SelectGroup>
          <SelectLabel className="text-[10px] font-bold tracking-wider text-slate-400">
            Per Bulan (2026)
          </SelectLabel>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
