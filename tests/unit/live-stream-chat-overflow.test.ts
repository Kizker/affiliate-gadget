import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Stream Chat Bubble Anti-Overflow Verification', () => {
  it('verifies that live-stream-viewer.tsx has min-w-0, overflow-wrap:anywhere, and break-words on comment bubbles', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/live/live-stream-viewer.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Floating comments bubble
    expect(content).toContain('[overflow-wrap:anywhere]')
    expect(content).toContain('[word-break:break-word]')
    expect(content).toContain('min-w-0 flex-1')
  })

  it('verifies that live-stream-broadcaster.tsx has min-w-0 and overflow-wrap protection', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/live/live-stream-broadcaster.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('[overflow-wrap:anywhere]')
    expect(content).toContain('break-all')
    expect(content).toContain('min-w-0 flex-1')
  })

  it('verifies that live-chat-panel.tsx has min-w-0 and overflow-wrap anywhere', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/live/live-chat-panel.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('[overflow-wrap:anywhere]')
    expect(content).toContain('[word-break:break-word]')
  })
})
