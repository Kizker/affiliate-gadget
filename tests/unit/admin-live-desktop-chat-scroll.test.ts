import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Live Desktop Chat Scroll & Height Constraint Verification', () => {
  it('verifies that live-stream-broadcaster.tsx locks desktop grid height and uses min-h-0 and overflow-hidden', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/live/live-stream-broadcaster.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Grid studio atas harus mengunci max-height
    expect(content).toContain('lg:max-h-[calc(100vh-140px)]')
    expect(content).toContain(
      'lg:col-span-2 lg:h-full lg:max-h-none lg:min-h-0 lg:overflow-hidden'
    )
    expect(content).toContain(
      'lg:col-span-1 lg:h-full lg:max-h-full lg:min-h-0 lg:overflow-hidden'
    )
  })

  it('verifies that live-chat-panel.tsx uses min-h-0 and auto-scrolls to bottom on new messages', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/live/live-chat-panel.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Root panel & messages scroll area
    expect(content).toContain('max-h-full min-h-0 flex-col overflow-hidden')
    expect(content).toContain(
      'flex-1 min-h-0 max-h-full space-y-2 overflow-y-auto'
    )

    // Header & Input bars harus shrink-0
    expect(content).toContain(
      'flex shrink-0 items-center justify-between border-b'
    )
    expect(content).toContain('relative z-10 shrink-0 border-t')

    // Auto-scroll logic
    expect(content).toContain('scrollToBottom')
    expect(content).toContain('chatScrollRef.current.scrollTo')
    expect(content).toContain("scrollToBottom('smooth')")
  })
})
