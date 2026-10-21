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
  triggerClassName?: string
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
  triggerClassName,
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
      const activeElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement
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
        className={
          triggerClassName
            ? `flex w-full cursor-pointer items-center justify-between gap-2 border outline-none transition duration-150 ${triggerClassName} ${
                disabled
                  ? 'cursor-not-allowed bg-slate-100 opacity-50'
                  : 'focus:shadow-xs hover:border-slate-300 hover:bg-white focus:border-slate-400 focus:bg-white'
              } ${isOpen ? 'shadow-xs border-slate-400 bg-white ring-1 ring-slate-400/20' : ''}`
            : `flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border border-slate-200/70 bg-slate-50/80 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none transition duration-150 ${
                disabled
                  ? 'cursor-not-allowed bg-slate-100 opacity-50'
                  : 'focus:shadow-xs hover:border-slate-300 hover:bg-white focus:border-slate-400 focus:bg-white'
              } ${isOpen ? 'shadow-xs border-slate-400 bg-white ring-1 ring-slate-400/20' : ''}`
        }
      >
        <span
          className={`truncate text-left ${
            value ? 'font-bold text-slate-950' : 'font-medium text-slate-400'
          }`}
        >
          {value || placeholder}
        </span>

        <div className="flex shrink-0 items-center gap-1">
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
                  className="cursor-pointer rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
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
        <div className="absolute left-0 right-0 z-50 mt-1.5 flex max-h-64 flex-col rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl duration-150 animate-in fade-in zoom-in-95">
          {/* Search Input Box */}
          <div className="relative mb-1 flex items-center border-b border-slate-100 px-1 pb-1.5">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
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
              className="w-full rounded-xl bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-300"
            />
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            className="max-h-48 flex-1 space-y-0.5 overflow-y-auto text-xs"
          >
            {isLoading ? (
              <li className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                <span>Memuat daftar wilayah...</span>
              </li>
            ) : filteredOptions.length === 0 ? (
              <li className="px-2 py-2 text-center text-xs">
                <p className="mb-1.5 font-medium text-slate-400">
                  Tidak ada hasil ditemukan
                </p>
                {allowCustomValue && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={handleCustomSelect}
                    className="shadow-xs w-full cursor-pointer rounded-xl bg-slate-950 px-2 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    Gunakan &quot;{searchQuery.trim()}&quot;
                  </button>
                )}
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected =
                  option.name.toLowerCase() === value.toLowerCase()
                const isHighlighted = index === highlightedIndex

                return (
                  <li
                    key={option.id + '-' + option.name}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
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
