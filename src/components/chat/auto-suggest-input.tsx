'use client'

import React, { useRef, useImperativeHandle, forwardRef } from 'react'

export interface AutoSuggestInputHandle {
  focus: () => void
  blur: () => void
  inputElement: HTMLInputElement | null
}

interface AutoSuggestInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  suggestions: string[]
  placeholder?: string
  className?: string
  inputClassName?: string
  disabled?: boolean
  autoFocus?: boolean
  ariaLabel?: string
  onFocus?: () => void
  onBlur?: () => void
}

/**
 * Reusable Auto-Suggest Input with Google-style Inline Ghost Autocomplete
 *
 * Behavior:
 * 1. User types characters (e.g. "Ready ya").
 * 2. Matches against suggestions list (case-insensitive prefix match).
 * 3. Shows gray ghost text immediately after typed text (" ka, order masuk langsung diproses ya ka..").
 * 4. Pressing Enter (or Tab / ArrowRight at end of text) auto-completes the input with the suggestion.
 * 5. Once completed, pressing Enter again sends / submits the message!
 */
export const AutoSuggestInput = forwardRef<
  AutoSuggestInputHandle,
  AutoSuggestInputProps
>(function AutoSuggestInput(
  {
    value,
    onChange,
    onSubmit,
    suggestions = [],
    placeholder = 'Ketik pesan...',
    className = '',
    inputClassName = '',
    disabled = false,
    autoFocus = false,
    ariaLabel,
    onFocus,
    onBlur,
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    inputElement: inputRef.current,
  }))

  // Calculate best matching suggestion
  const trimmed = value.trimStart()
  const matchingSuggestion = React.useMemo(() => {
    if (!trimmed || trimmed.length < 2) return null
    const lowerTyped = trimmed.toLowerCase()

    // Cari suggestion yang diawali dengan teks yang diketik (prefix match)
    const exactPrefix = suggestions.find((s) => {
      const lowerS = s.trim().toLowerCase()
      return lowerS.startsWith(lowerTyped) && lowerS !== lowerTyped
    })
    if (exactPrefix) return exactPrefix

    // Fallback: pencocokan kata pertama / token
    const firstWord = lowerTyped.split(/\s+/)[0]
    if (firstWord.length >= 3) {
      const wordMatch = suggestions.find((s) => {
        const lowerS = s.trim().toLowerCase()
        return lowerS.startsWith(firstWord) && lowerS !== lowerTyped
      })
      if (wordMatch && wordMatch.toLowerCase().startsWith(lowerTyped)) {
        return wordMatch
      }
    }

    return null
  }, [trimmed, suggestions])

  // Ghost suffix (teks bayang-bayang di belakang teks yang sedang diketik)
  const ghostSuffix = React.useMemo(() => {
    if (!matchingSuggestion || !trimmed) return ''
    if (matchingSuggestion.toLowerCase().startsWith(trimmed.toLowerCase())) {
      return matchingSuggestion.slice(trimmed.length)
    }
    return ''
  }, [matchingSuggestion, trimmed])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Jika ada bayang-bayang saran (ghost suggestion) yang cocok:
      // Enter pertama = PILIH & AUTOFILL suggestion ke input
      if (ghostSuffix && matchingSuggestion) {
        e.preventDefault()
        onChange(matchingSuggestion)
        return
      }

      // Enter kedua (atau tanpa suggestion) = SUBMIT / KIRIM PESAN!
      e.preventDefault()
      onSubmit()
      return
    }

    // Tombol Tab atau Panah Kanan di ujung teks juga bisa menerima suggestion
    if (
      (e.key === 'Tab' || e.key === 'ArrowRight') &&
      ghostSuffix &&
      matchingSuggestion
    ) {
      const isAtEnd =
        inputRef.current &&
        inputRef.current.selectionStart === inputRef.current.value.length
      if (e.key === 'Tab' || isAtEnd) {
        e.preventDefault()
        onChange(matchingSuggestion)
      }
    }
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Background Ghost Layer (Menampilkan bayangan abu-abu persis di posisi kursor/teks) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden px-4 py-2 text-xs font-medium ${inputClassName}`}
        style={{
          border: '1px solid transparent',
          background: 'transparent',
        }}
      >
        {/* Bagian teks yang diketik dibuat transparan */}
        <span className="invisible whitespace-pre">{value}</span>
        {/* Bagian bayangan abu-abu Google-style */}
        {ghostSuffix && (
          <span className="whitespace-pre text-slate-400/80 dark:text-slate-500/80">
            {ghostSuffix}
          </span>
        )}
      </div>

      {/* Foreground Real Input Element */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label={ariaLabel || placeholder}
        placeholder={placeholder}
        className={`relative z-10 w-full rounded-full border border-slate-200 bg-transparent px-4 py-2 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-transparent dark:border-slate-700 dark:text-white ${inputClassName}`}
      />
    </div>
  )
})
