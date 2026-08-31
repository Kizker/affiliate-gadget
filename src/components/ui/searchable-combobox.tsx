'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Search, X, Loader2 } from 'lucide-react'

export interface ComboboxOption {
  id: string
  name: string
}

interface SearchableComboboxProps {
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  options: (string | ComboboxOption)[]
  value: string
  onChange: (value: string, selectedOption?: ComboboxOption) => void
  disabled?: boolean
  isLoading?: boolean
  className?: string
  required?: boolean
  allowCustomValue?: boolean
}

export function SearchableCombobox({
  label,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  options,
  value,
  onChange,
  disabled = false,
  isLoading = false,
  className = '',
  required = false,
  allowCustomValue = true,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Normalize options to ComboboxOption objects
  const normalizedOptions: ComboboxOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { id: opt, name: opt }
      }
      return opt
    })
  }, [options])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions
    const q = searchQuery.toLowerCase().trim()
    return normalizedOptions.filter((opt) => opt.name.toLowerCase().includes(q))
  }, [normalizedOptions, searchQuery])

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      setHighlightedIndex(0)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.name, opt)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleCustomSelect = () => {
    if (searchQuery.trim()) {
      onChange(searchQuery.trim())
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex])
      } else if (allowCustomValue && searchQuery.trim()) {
        handleCustomSelect()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="mb-1 block text-[11px] font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 rounded-full border border-slate-200/70 bg-slate-50/80 py-2 px-3.5 text-xs font-medium text-slate-900 outline-none transition duration-150 cursor-pointer ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100'
            : 'hover:bg-white hover:border-slate-300 focus:bg-white focus:border-slate-400 focus:shadow-xs'
        } ${isOpen ? 'bg-white border-slate-400 shadow-xs ring-1 ring-slate-400/20' : ''}`}
      >
        <span
          className={`truncate text-left ${
            value ? 'text-slate-950 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          {value || placeholder}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : (
            <>
              {value && !disabled && (
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange('')
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-slate-900' : ''
                }`}
              />
            </>
          )}
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-64 flex flex-col">
          
          {/* Search Input Box */}
          <div className="relative mb-1 flex items-center border-b border-slate-100 pb-1.5 px-1">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setHighlightedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-slate-300"
            />
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            className="flex-1 overflow-y-auto space-y-0.5 max-h-48 text-xs"
          >
            {isLoading ? (
              <li className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                <span>Memuat daftar wilayah...</span>
              </li>
            ) : filteredOptions.length === 0 ? (
              <li className="py-2 px-2 text-center text-xs">
                <p className="text-slate-400 font-medium mb-1.5">
                  Tidak ada hasil ditemukan
                </p>
                {allowCustomValue && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={handleCustomSelect}
                    className="w-full rounded-xl bg-slate-950 py-1.5 px-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                  >
                    Gunakan &quot;{searchQuery.trim()}&quot;
                  </button>
                )}
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.name.toLowerCase() === value.toLowerCase()
                const isHighlighted = index === highlightedIndex

                return (
                  <li
                    key={option.id + '-' + option.name}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-950 text-white'
                        : isHighlighted
                        ? 'bg-slate-100/90 text-slate-950'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{option.name}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-white" />
                    )}
                  </li>
                )
              })
            )}
          </ul>

        </div>
      )}
    </div>
  )
}
