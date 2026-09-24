'use client'

import React from 'react'
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

export interface SelectOption {
  value: string
  label: string
  group?: string
  icon?: React.ReactNode
  badge?: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  icon?: React.ReactNode
  className?: string
  triggerClassName?: string
  contentClassName?: string
  align?: 'start' | 'center' | 'end'
  size?: 'sm' | 'md'
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  icon,
  className,
  triggerClassName,
  contentClassName,
  align = 'start',
  size = 'md',
}: CustomSelectProps) {
  // Check if options have groups
  const hasGroups = options.some((opt) => opt.group)

  const groupedOptions = React.useMemo(() => {
    if (!hasGroups) return null
    const groups: Record<string, SelectOption[]> = {}
    for (const opt of options) {
      const g = opt.group || 'Umum'
      if (!groups[g]) groups[g] = []
      groups[g].push(opt)
    }
    return groups
  }, [options, hasGroups])

  const heightClass = size === 'sm' ? 'h-8 px-2.5 py-1 text-xs' : 'h-10 px-3.5 py-2 text-xs sm:text-sm'

  return (
    <div className={cn('relative inline-block', className)}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            heightClass,
            'rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 font-medium text-slate-800 dark:text-slate-100 shadow-2xs hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-all',
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {icon && <span className="shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>}
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent align={align} className={cn('min-w-[12rem]', contentClassName)}>
          {hasGroups && groupedOptions ? (
            Object.entries(groupedOptions).map(([groupName, groupOpts], gIdx) => (
              <React.Fragment key={groupName}>
                {gIdx > 0 && <SelectSeparator />}
                <SelectGroup>
                  <SelectLabel>{groupName}</SelectLabel>
                  {groupOpts.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs sm:text-sm">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2 truncate">
                          {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {opt.badge && (
                          <span className="shrink-0 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </React.Fragment>
            ))
          ) : (
            options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs sm:text-sm">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {opt.badge && (
                    <span className="shrink-0 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      {opt.badge}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
