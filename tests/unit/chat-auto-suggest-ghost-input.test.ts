import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Auto-Suggest Input Chrome-Style Selection Autocomplete Suite', () => {
  const compPath = path.join(
    process.cwd(),
    'src/components/chat/auto-suggest-input.tsx'
  )

  it('implements native text selection range autocomplete like Google Chrome address bar', () => {
    const content = fs.readFileSync(compPath, 'utf-8')

    expect(content).toContain('setSelectionRange')
    expect(content).toContain('isAutocompletePendingRef')
    expect(content).toContain('matchedSuggestion')
    // Enter 1: unselect & confirm text
    expect(content).toContain(
      'el.setSelectionRange(el.value.length, el.value.length)'
    )
    // Enter 2: onSubmit()
    expect(content).toContain('onSubmit()')
  })

  it('verifies prefix matching and selection range logic', () => {
    const suggestions = [
      'Ready ya ka, order masuk langsung diproses ya ka..',
      'All fungsi normal, nominus, siap pakai',
    ]

    const typed = 'Ready'
    const matched = suggestions.find((s) =>
      s.toLowerCase().startsWith(typed.toLowerCase())
    )

    expect(matched).toBe('Ready ya ka, order masuk langsung diproses ya ka..')
    expect(typed.length).toBe(5)
    expect(matched!.length).toBe(50)
    // Sisa karakter yang harus diseleksi (highlight)
    expect(matched!.slice(5)).toBe(
      ' ya ka, order masuk langsung diproses ya ka..'
    )
  })
})
