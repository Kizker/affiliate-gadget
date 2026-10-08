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
  ariaLabel?: string
}

/**
 * Radix UI Select forbids <SelectItem value="" />.
 * We use an internal sentinel to allow options with value: ''
 * (such as "Semua Kota", "Semua Kategori", "All Stores") to work seamlessly.
 */
const EMPTY_VALUE_SENTINEL = '__RADIX_EMPTY_VALUE__'

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
  ariaLabel,
}: CustomSelectProps) {
  // Check if options have an empty value option (e.g. { value: '', label: 'Semua' })
  const hasEmptyValueOption = React.useMemo(
    () => options.some((opt) => opt.value === ''),
    [options]
  )

  const internalValue = React.useMemo(() => {
    if (value === '' && hasEmptyValueOption) {
      return EMPTY_VALUE_SENTINEL
    }
    return value
  }, [value, hasEmptyValueOption])

  const handleValueChange = (newVal: string) => {
    onChange(newVal === EMPTY_VALUE_SENTINEL ? '' : newVal)
  }

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

  const heightClass =
    size === 'sm'
      ? 'h-8 px-2.5 py-1 text-xs'
      : 'h-10 px-3.5 py-2 text-xs sm:text-sm'

  const renderOptionItem = (opt: SelectOption) => {
    const itemValue = opt.value === '' ? EMPTY_VALUE_SENTINEL : opt.value
    return (
      <SelectItem
        key={itemValue}
        value={itemValue}
        className="text-xs sm:text-sm"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
          </div>
          {opt.badge && (
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">
              {opt.badge}
            </span>
          )}
        </div>
      </SelectItem>
    )
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Select value={internalValue} onValueChange={handleValueChange}>
        <SelectTrigger
          aria-label={ariaLabel || placeholder || 'Pilih opsi'}
          className={cn(
            heightClass,
            'shadow-2xs rounded-2xl border-slate-200/90 bg-white/95 font-medium text-slate-800 transition-all hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800/60',
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {icon && (
              <span className="shrink-0 text-slate-400 dark:text-slate-500">
                {icon}
              </span>
            )}
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent
          align={align}
          className={cn('min-w-[12rem]', contentClassName)}
        >
          {hasGroups && groupedOptions
            ? Object.entries(groupedOptions).map(
                ([groupName, groupOpts], gIdx) => (
                  <React.Fragment key={groupName}>
                    {gIdx > 0 && <SelectSeparator />}
                    <SelectGroup>
                      <SelectLabel>{groupName}</SelectLabel>
                      {groupOpts.map(renderOptionItem)}
                    </SelectGroup>
                  </React.Fragment>
                )
              )
            : options.map(renderOptionItem)}
        </SelectContent>
      </Select>
    </div>
  )
}
