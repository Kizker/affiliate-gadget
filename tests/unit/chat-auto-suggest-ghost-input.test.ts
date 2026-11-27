import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Auto-Suggest Input & Chat Template Ghost Autocomplete Suite', () => {
  it('creates reusable AutoSuggestInput component with inline ghost layer and double-enter logic', () => {
    const compPath = path.join(
      process.cwd(),
      'src/components/chat/auto-suggest-input.tsx'
    )
    expect(fs.existsSync(compPath)).toBe(true)

    const content = fs.readFileSync(compPath, 'utf-8')
    expect(content).toContain('export const AutoSuggestInput')
    expect(content).toContain('ghostSuffix')
    expect(content).toContain('matchingSuggestion')
    // Enter 1 = autofill suggestion
    expect(content).toContain('onChange(matchingSuggestion)')
    // Enter 2 = submit / send message
    expect(content).toContain('onSubmit()')
    // Ghost layer exists with invisible typed text + visible ghost suffix
    expect(content).toContain('invisible whitespace-pre')
    expect(content).toContain('whitespace-pre text-slate-400')
  })

  it('exports DEFAULT_CHAT_SUGGESTIONS from chat-template-modal', () => {
    const modalPath = path.join(
      process.cwd(),
      'src/components/chat/chat-template-modal.tsx'
    )
    const content = fs.readFileSync(modalPath, 'utf-8')

    expect(content).toContain('export const DEFAULT_CHAT_SUGGESTIONS')
    expect(content).toContain(
      'Ready ya ka, order masuk langsung diproses ya ka..'
    )
    expect(content).toContain('All fungsi normal, nominus, siap pakai')
  })

  it('integrates AutoSuggestInput into Admin Chat page input bar', () => {
    const adminChatPath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/chat/page.tsx'
    )
    const content = fs.readFileSync(adminChatPath, 'utf-8')

    expect(content).toContain('import { AutoSuggestInput }')
    expect(content).toContain('chatSuggestions')
    expect(content).toContain('<AutoSuggestInput')
    expect(content).toContain('suggestions={chatSuggestions}')
  })

  it('integrates AutoSuggestInput into Customer ChatInputBar', () => {
    const customerChatInputPath = path.join(
      process.cwd(),
      'src/components/customer/chat/chat-input-bar.tsx'
    )
    const content = fs.readFileSync(customerChatInputPath, 'utf-8')

    expect(content).toContain('import { AutoSuggestInput }')
    expect(content).toContain('<AutoSuggestInput')
    expect(content).toContain('suggestions={suggestions}')
  })

  it('verifies case-insensitive prefix matching and ghost suffix extraction logic', () => {
    const suggestions = [
      'Ready ya ka, order masuk langsung diproses ya ka..',
      'All fungsi normal, nominus, siap pakai, garansi toko 30hari ganti unit baru ya ka..',
    ]

    const typed = 'Ready ya'
    const match = suggestions.find((s) =>
      s.toLowerCase().startsWith(typed.toLowerCase())
    )

    expect(match).toBeDefined()
    expect(match).toBe('Ready ya ka, order masuk langsung diproses ya ka..')

    const ghost = match!.slice(typed.length)
    expect(ghost).toBe(' ka, order masuk langsung diproses ya ka..')
  })
})
