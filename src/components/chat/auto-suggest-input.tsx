'use client'

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react'

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
 * Native Text-Selection Autocomplete Input (Persis Seperti Address Bar Google Chrome / Edge)
 *
 * Cara Kerja:
 * 1. User mengetik "Ready" (atau "sh")
 * 2. Sistem mencocokkan ke suggestion "Ready ya ka, order masuk langsung diproses ya ka.."
 * 3. Nilai input menjadi teks lengkap: "Ready ya ka, order masuk langsung diproses ya ka.."
 *    dengan bagian sisa (" ya ka, order masuk langsung diproses ya ka..") DALAM KEADAAN TERSELEKSI (HIGHLIGHT BIRU/ORANYE SEPERTI GOOGLE)
 * 4. Jika user terus mengetik karakter baru: seleksi otomatis terhapus dan digantikan ketikan user
 * 5. Jika user tekan Backspace/Delete: seleksi terhapus dan kembali ke teks asli yang diketik
 * 6. Jika user tekan Enter pertama: seleksi diterima (unselect) sehingga teks komplit
 * 7. Jika user tekan Enter kedua: pesan dikirimkan!
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
  const isAutocompletePendingRef = useRef(false)
  const lastTypedTextRef = useRef(value)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    inputElement: inputRef.current,
  }))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = inputRef.current
    if (!el) return

    const hasSelection =
      el.selectionStart !== null &&
      el.selectionEnd !== null &&
      el.selectionStart < el.selectionEnd

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      // Jika ada teks yang sedang terseleksi (sedang ada bayangan autofill):
      // Enter pertama = konfirmasi pilihan (pindahkan kursor ke paling akhir tanpa kirim)
      if (hasSelection && isAutocompletePendingRef.current) {
        el.setSelectionRange(el.value.length, el.value.length)
        isAutocompletePendingRef.current = false
        lastTypedTextRef.current = el.value
        return
      }

      // Enter kedua (atau tanpa seleksi bayangan) = KIRIM PESAN!
      isAutocompletePendingRef.current = false
      onSubmit()
      return
    }

    // Tombol Tab atau Panah Kanan juga mengonfirmasi bayangan autofill
    if (
      (e.key === 'Tab' || e.key === 'ArrowRight') &&
      hasSelection &&
      isAutocompletePendingRef.current
    ) {
      e.preventDefault()
      el.setSelectionRange(el.value.length, el.value.length)
      isAutocompletePendingRef.current = false
      lastTypedTextRef.current = el.value
      return
    }

    // Backspace saat ada bayangan seleksi: hapus bayangan seleksi dan biarkan ketikan asli
    if (
      e.key === 'Backspace' &&
      hasSelection &&
      isAutocompletePendingRef.current
    ) {
      e.preventDefault()
      const typed = lastTypedTextRef.current
      isAutocompletePendingRef.current = false
      onChange(typed)
      requestAnimationFrame(() => {
        el.value = typed
        el.setSelectionRange(typed.length, typed.length)
      })
      return
    }

    // Jika tombol karakter biasa ditekan saat ada seleksi:
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      isAutocompletePendingRef.current = false
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    lastTypedTextRef.current = rawVal

    // Cari suggestion yang cocok (case-insensitive prefix match)
    const trimmed = rawVal.trimStart()
    let matchedSuggestion: string | null = null

    if (trimmed.length >= 2) {
      const lowerTyped = trimmed.toLowerCase()
      matchedSuggestion =
        suggestions.find((s) => {
          const lowerS = s.trim().toLowerCase()
          return lowerS.startsWith(lowerTyped) && lowerS !== lowerTyped
        }) || null
    }

    if (matchedSuggestion && inputRef.current) {
      // Rekonstruksi kalimat lengkap dengan prefix spasi asli
      const prefixSpaces = rawVal.match(/^\s*/)?.[0] || ''
      const fullText = prefixSpaces + matchedSuggestion
      const typedLength = rawVal.length

      isAutocompletePendingRef.current = true
      onChange(fullText)

      // Seleksi teks bagian bayangan seperti Google Chrome Address Bar
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.value = fullText
          inputRef.current.setSelectionRange(typedLength, fullText.length)
        }
      })
    } else {
      isAutocompletePendingRef.current = false
      onChange(rawVal)
    }
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label={ariaLabel || placeholder}
        placeholder={placeholder}
        className={`w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:text-white ${inputClassName}`}
      />
    </div>
  )
})
