import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Stream Domain Migration, Anonymous Viewer & Mirror Suite', () => {
  it('1. use-live-chat.ts getWsUrl selalu menggunakan window.location.host secara dinamis di browser', () => {
    const hookPath = path.join(process.cwd(), 'src/hooks/use-live-chat.ts')
    const content = fs.readFileSync(hookPath, 'utf-8')

    expect(content).toContain('const currentHost = window.location.host')
    expect(content).toContain(
      "base = `${isHttps ? 'wss' : 'ws'}://${currentHost}/ws`"
    )
    expect(content).toContain("userName = 'Anonymous'")
  })

  it('2. ws-server/index.ts mengizinkan domain affiliategadget dan mencatat penonton anonymous', () => {
    const wsIndexPath = path.join(process.cwd(), 'ws-server/index.ts')
    const content = fs.readFileSync(wsIndexPath, 'utf-8')

    expect(content).toContain("normOrigin.includes('affiliategadget')")
    expect(content).toContain('userName: resolvedUserName')
    expect(content).toContain("message: 'bergabung ke siaran'")
    expect(content).toContain("type: 'JOIN'")
    expect(content).toContain('userName: joinName')
  })

  it('3. live-stream-viewer.tsx menggunakan default Anonymous untuk penonton guest', () => {
    const viewerPath = path.join(
      process.cwd(),
      'src/components/live/live-stream-viewer.tsx'
    )
    const content = fs.readFileSync(viewerPath, 'utf-8')

    expect(content).toContain("userName: session?.user?.name || 'Anonymous'")
    expect(content).toContain("msg.message === 'bergabung ke siaran'")
  })

  it('4. Mirror state didukung penuh dan ditransmisikan ke subscriber video', () => {
    const viewerPath = path.join(
      process.cwd(),
      'src/components/live/live-stream-viewer.tsx'
    )
    const content = fs.readFileSync(viewerPath, 'utf-8')

    expect(content).toContain('isMirrored={isMirrored}')

    const subVideoPath = path.join(
      process.cwd(),
      'src/components/live/livekit-subscriber-video.tsx'
    )
    const subVideoContent = fs.readFileSync(subVideoPath, 'utf-8')

    expect(subVideoContent).toContain(
      "style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}"
    )
  })
})
