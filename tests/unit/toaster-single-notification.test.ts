import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Toaster Non-Stacking Configuration', () => {
  it('should configure SonnerToaster globally with visibleToasts={1} and expand={false}', () => {
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx')
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8')

    // Verify SonnerToaster has visibleToasts={1}
    expect(layoutContent).toContain('visibleToasts={1}')
    // Verify expand={false} to disable stacked deck expansion
    expect(layoutContent).toContain('expand={false}')
    // Verify SonnerToaster is positioned
    expect(layoutContent).toContain('position="top-right"')
  })

  it('should enforce single toast limit in use-toast.ts for Radix Toaster', () => {
    const useToastPath = path.join(
      process.cwd(),
      'src',
      'hooks',
      'use-toast.ts'
    )
    const useToastContent = fs.readFileSync(useToastPath, 'utf-8')

    // Verify TOAST_LIMIT is 1
    expect(useToastContent).toContain('const TOAST_LIMIT = 1')
  })
  it('should enforce single-line row layout without flex-col in Toaster component', () => {
    const toasterPath = path.join(
      process.cwd(),
      'src',
      'components',
      'ui',
      'toaster.tsx'
    )
    const toasterContent = fs.readFileSync(toasterPath, 'utf-8')

    // Verify absence of vertical stacking flex-col
    expect(toasterContent).not.toContain('flex flex-col')
    // Verify single-line row flex container
    expect(toasterContent).toContain('items-center')
    expect(toasterContent).toContain('min-w-0')
    expect(toasterContent).toContain('text-xs')
  })

  it('should format customer settings OTP verification toast as clean 1-line notification', () => {
    const settingsPath = path.join(
      process.cwd(),
      'src',
      'app',
      'dashboard',
      'customer',
      'settings',
      'page.tsx'
    )
    const settingsContent = fs.readFileSync(settingsPath, 'utf-8')

    // Verify OTP toasts use clean single-line title and no bulky description
    expect(settingsContent).toContain("title: 'Kode OTP WhatsApp dikirim'")
    expect(settingsContent).not.toContain("title: 'Verifikasi Diperlukan'")
  })
})
