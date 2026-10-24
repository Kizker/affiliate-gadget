import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { playChatNotificationSound } from '@/lib/chat-notification-sound'

describe('Chat Notification Latency & Thermal Shipping Label Header Fix', () => {
  const rootDir = process.cwd()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete (global as any).window
  })

  it('playChatNotificationSound should execute safely with Web Audio API in window environment', () => {
    const mockStart = vi.fn()
    const mockStop = vi.fn()
    const mockSetValueAtTime = vi.fn()
    const mockExponentialRampToValueAtTime = vi.fn()
    const mockConnect = vi.fn()
    const mockClose = vi.fn().mockResolvedValue(undefined)
    const mockResume = vi.fn().mockResolvedValue(undefined)

    const mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: mockSetValueAtTime },
      connect: mockConnect,
      start: mockStart,
      stop: mockStop,
    }

    const mockGain = {
      gain: {
        setValueAtTime: mockSetValueAtTime,
        exponentialRampToValueAtTime: mockExponentialRampToValueAtTime,
      },
      connect: mockConnect,
    }

    class MockAudioContext {
      currentTime = 0
      state = 'suspended'
      destination = {}
      createOscillator() {
        return mockOscillator
      }
      createGain() {
        return mockGain
      }
      close = mockClose
      resume = mockResume
    }

    ;(global as any).window = {
      AudioContext: MockAudioContext,
    }

    expect(() => playChatNotificationSound()).not.toThrow()
    expect(mockStart).toHaveBeenCalled()
    expect(mockStop).toHaveBeenCalled()
    expect(mockResume).toHaveBeenCalled()
  })

  it('playChatNotificationSound should gracefully handle missing AudioContext or SSR without throwing', () => {
    ;(global as any).window = undefined

    expect(() => playChatNotificationSound()).not.toThrow()
  })

  it('Thermal shipping label modal header should have sm:max-w-xl, flexible min-h, and unclipped subtitle', () => {
    const thermalFile = path.join(
      rootDir,
      'src',
      'components',
      'shipping',
      'thermal-shipping-label.tsx'
    )
    const content = fs.readFileSync(thermalFile, 'utf-8')

    // 1. Container width expanded to prevent squishing
    expect(content).toContain('sm:max-w-xl')

    // 2. Flexible header height
    expect(content).toContain('min-h-[3.75rem]')
    expect(content).toContain('sm:min-h-[4rem]')

    // 3. Subtitle whitespace-nowrap preventing awkward multiline text cut-off
    expect(content).toContain('whitespace-nowrap')
    expect(content).toContain('Standar Ekspedisi Resmi E-Commerce Indonesia')

    // 4. Insurance wording compliance
    expect(content).toContain('100% Terlindungi Asuransi')
  })

  it('Admin notifications context should poll every 2.5s and trigger chime on new chat messages', () => {
    const adminContextFile = path.join(
      rootDir,
      'src',
      'context',
      'admin-notifications-context.tsx'
    )
    const content = fs.readFileSync(adminContextFile, 'utf-8')

    // Reduced polling interval from 15000 to 2500
    expect(content).toContain('setInterval(fetchCounts, 2500)')
    expect(content).toContain('playChatNotificationSound()')
    expect(content).toContain('prevChatCountRef')
    expect(content).toContain(
      "window.addEventListener('focus', handleCustomRefresh)"
    )
  })

  it('Customer and Admin chat pages should have real-time fast polling intervals (1.5s - 2s)', () => {
    const customerChatFile = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'customer',
      'chat',
      'page.tsx'
    )
    const customerContent = fs.readFileSync(customerChatFile, 'utf-8')

    // Customer active messages polling 1500ms
    expect(customerContent).toContain('1500')
    // Customer rooms list polling 2000ms
    expect(customerContent).toContain('2000')
    expect(customerContent).toContain('playChatNotificationSound()')

    const adminChatFile = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'admin',
      'chat',
      'page.tsx'
    )
    const adminContent = fs.readFileSync(adminChatFile, 'utf-8')

    // Admin rooms list polling 2000ms
    expect(adminContent).toContain('setInterval(() => {')
    expect(adminContent).toContain('2000')
    expect(adminContent).toContain('playChatNotificationSound()')
  })
})
