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
})
