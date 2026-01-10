'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onSortChange?: (sort: string) => void
  sortOptions?: { value: string; label: string }[]
  debounceMs?: number
  defaultSort?: string
  defaultSearch?: string
}

export function SearchBar({
  placeholder = 'Cari produk...',
  onSearch,
  onSortChange,
  sortOptions = [
    { value: 'popular', label: 'Terpopuler' },
    { value: 'price-low', label: 'Harga Terendah' },
    { value: 'price-high', label: 'Harga Tertinggi' },
    { value: 'rating', label: 'Rating Tertinggi' },
  ],
  debounceMs = 300,
  defaultSort,
  defaultSearch = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultSearch)
  const [sort, setSort] = useState(
    defaultSort || sortOptions[0]?.value || 'popular'
  )
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  // Live search with debounce
  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      onSearch?.(query)
    }, debounceMs)

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, onSearch, debounceMs])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleSortChange = (value: string) => {
    setSort(value)
    onSortChange?.(value)
  }

  // Also support Enter key for immediate search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      onSearch?.(query)
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Search Input - Live Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sort Dropdown - Hidden on mobile */}
        <div className="hidden items-center gap-2 md:flex">
          <SlidersHorizontal className="h-5 w-5 text-gray-600" />
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
