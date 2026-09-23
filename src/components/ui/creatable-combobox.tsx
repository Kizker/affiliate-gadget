'use client'

import { useState, useRef, useEffect, useMemo, useId } from 'react'
import { Check, ChevronDown, Plus, X } from 'lucide-react'

export interface CreatableComboboxOption {
  value: string
  label?: string
}

interface CreatableComboboxProps {
  label?: string
  placeholder?: string
  options: (string | CreatableComboboxOption)[]
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md'
  required?: boolean
  allowCustom?: boolean
}

export function CreatableCombobox({
  label,
  placeholder = 'Pilih atau ketik...',
  options = [],
  value = '',
  onChange,
  disabled = false,
  className = '',
  size = 'md',
  required = false,
  allowCustom = true,
}: CreatableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || '')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  // Normalize options
  const normalizedOptions: CreatableComboboxOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt }
      }
      return { value: opt.value, label: opt.label || opt.value }
    })
  }, [options])

  // Filter options based on input text
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return normalizedOptions
    const query = inputValue.toLowerCase().trim()
    return normalizedOptions.filter(
      (opt) =>
        opt.value.toLowerCase().includes(query) ||
        (opt.label && opt.label.toLowerCase().includes(query))
    )
  }, [normalizedOptions, inputValue])

  // Check if input value already exists exactly in options
  const hasExactMatch = useMemo(() => {
    const q = inputValue.trim().toLowerCase()
    return normalizedOptions.some(
      (opt) =>
        opt.value.toLowerCase() === q ||
        (opt.label && opt.label.toLowerCase() === q)
    )
  }, [normalizedOptions, inputValue])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        // If user typed something and blurred, commit it if allowCustom
        if (allowCustom && inputValue.trim() !== value) {
          onChange(inputValue.trim())
        } else if (!allowCustom && !hasExactMatch) {
          setInputValue(value || '')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [inputValue, value, allowCustom, hasExactMatch, onChange])

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const activeElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelectOption = (optValue: string) => {
    setInputValue(optValue)
    onChange(optValue)
    setIsOpen(false)
  }

  const handleCreateCustom = () => {
    const trimmed = inputValue.trim()
    if (trimmed) {
      setInputValue(trimmed)
      onChange(trimmed)
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        setHighlightedIndex(0)
      }
      return
    }

    const totalItems =
      filteredOptions.length +
      (allowCustom && inputValue.trim() && !hasExactMatch ? 1 : 0)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, totalItems))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex].value)
      } else if (allowCustom && inputValue.trim()) {
        handleCreateCustom()
      } else if (filteredOptions.length > 0) {
        handleSelectOption(filteredOptions[0].value)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  const isSmall = size === 'sm'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-[10px] font-bold text-slate-500 dark:text-slate-400"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative flex items-center">
        <input
          id={id}
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputValue}
          required={required}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true)
            setHighlightedIndex(-1)
          }}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          className={`w-full font-medium text-slate-900 outline-none transition placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            isSmall
              ? 'h-9 rounded-xl border border-slate-200 bg-white px-3 pr-12 text-xs focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800'
              : 'h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 pr-14 text-xs font-medium focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900'
          } ${disabled ? 'cursor-not-allowed bg-slate-100 opacity-50 dark:bg-slate-900' : ''} ${
            isOpen ? 'border-slate-900 dark:border-slate-400' : ''
          }`}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                setInputValue('')
                onChange('')
                inputRef.current?.focus()
              }}
              className="cursor-pointer rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen)
                if (!isOpen) inputRef.current?.focus()
              }
            }}
            className="cursor-pointer rounded-full p-1 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-slate-900 dark:text-white' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-56 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl duration-150 animate-in fade-in zoom-in-95 dark:border-slate-700 dark:bg-slate-900">
          <ul
            ref={listRef}
            className="no-scrollbar max-h-52 space-y-0.5 overflow-y-auto text-xs"
          >
            {/* Custom option when no exact match */}
            {allowCustom && inputValue.trim() && !hasExactMatch && (
              <li>
                <button
                  type="button"
                  onClick={handleCreateCustom}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-left text-xs font-bold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:hover:bg-orange-900/40"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    Gunakan &quot;{inputValue.trim()}&quot; (Tambah Baru)
                  </span>
                </button>
              </li>
            )}

            {filteredOptions.length === 0 &&
              (!allowCustom || !inputValue.trim()) && (
                <li className="py-2.5 text-center text-xs font-medium text-slate-400">
                  Pilihan tidak ditemukan
                </li>
              )}

            {filteredOptions.map((opt, idx) => {
              const isSelected = opt.value.toLowerCase() === value.toLowerCase()
              const isHighlighted = idx === highlightedIndex

              return (
                <li key={opt.value + '-' + idx}>
                  <button
                    type="button"
                    onClick={() => handleSelectOption(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                      isSelected
                        ? 'bg-slate-900 font-bold text-white dark:bg-white dark:text-slate-900'
                        : isHighlighted
                          ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{opt.label || opt.value}</span>
                    {isSelected && (
                      <Check className="ml-2 h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
