'use client'

import { X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroup {
  title: string
  options: FilterOption[]
  type: 'checkbox' | 'radio'
}

interface FilterSidebarProps {
  filters: FilterGroup[]
  onFilterChange?: (filters: Record<string, string[]>) => void
  onClearFilters?: () => void
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
}: FilterSidebarProps) {
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({})

  // Track if this is the first render to avoid calling onFilterChange on mount
  const isFirstRender = useState(true)

  // Call onFilterChange when selectedFilters changes (but not on mount)
  useEffect(() => {
    if (isFirstRender[0]) {
      isFirstRender[1](false)
      return
    }
    onFilterChange?.(selectedFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters])

  const handleFilterToggle = (
    groupTitle: string,
    value: string,
    type: 'checkbox' | 'radio'
  ) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev }

      if (type === 'radio') {
        newFilters[groupTitle] = [value]
      } else {
        const current = newFilters[groupTitle] || []
        if (current.includes(value)) {
          newFilters[groupTitle] = current.filter((v) => v !== value)
        } else {
          newFilters[groupTitle] = [...current, value]
        }
      }

      return newFilters
    })
  }

  const handleClearAll = () => {
    setSelectedFilters({})
    onClearFilters?.()
  }

  const hasActiveFilters = Object.values(selectedFilters).some(
    (arr) => arr.length > 0
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Filter</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
            Hapus Semua
          </button>
        )}
      </div>

      {/* Filter Groups */}
      <div className="space-y-6">
        {filters.map((group) => (
          <div key={group.title}>
            <h4 className="mb-3 font-semibold text-gray-900">{group.title}</h4>
            <div className="space-y-2">
              {group.options.map((option) => {
                const isSelected =
                  selectedFilters[group.title]?.includes(option.value) || false

                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <input
                      type={group.type}
                      name={group.title}
                      value={option.value}
                      checked={isSelected}
                      onChange={() =>
                        handleFilterToggle(
                          group.title,
                          option.value,
                          group.type
                        )
                      }
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1 text-sm text-gray-700">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-500">
                        ({option.count})
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
