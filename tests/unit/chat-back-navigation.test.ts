import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Customer Chat Back Navigation Suite', () => {
  const rootDir = process.cwd()
  const chatPagePath = path.join(
    rootDir,
    'src',
    'app',
    'dashboard',
    'customer',
    'chat',
    'page.tsx'
  )
  const chatHeaderPath = path.join(
    rootDir,
    'src',
    'components',
    'customer',
    'chat',
    'chat-header.tsx'
  )

  const chatPageContent = fs.readFileSync(chatPagePath, 'utf-8')
  const chatHeaderContent = fs.readFileSync(chatHeaderPath, 'utf-8')

  it('1. tracks whether chat was opened directly via external page parameters (mitraId, storeId, etc)', () => {
    expect(chatPageContent).toContain('isDirectEntryRef = useRef<boolean>')
    expect(chatPageContent).toContain('paramMitraId')
    expect(chatPageContent).toContain(
      'originMitraIdRef = useRef<string | null>'
    )
  })

  it('2. verifies handleBackToList navigates back to previous page when opened directly from external page', () => {
    expect(chatPageContent).toContain('if (isDirectEntryRef.current) {')
    expect(chatPageContent).toContain('router.back()')
    expect(chatPageContent).toContain(
      '/rekomendasi/${originMitraIdRef.current}'
    )
  })

  it('3. verifies room list header back button navigates back to previous page instead of hardcoded Link to /dashboard/customer/settings', () => {
    expect(chatPageContent).not.toContain(
      '<Link\n                    href="/dashboard/customer/settings"\n                    aria-label="Kembali ke Pengaturan"'
    )
    expect(chatPageContent).toContain('router.back()')
    expect(chatPageContent).toContain('onClick={() => {')
  })

  it('4. verifies ChatHeader button invokes onBackToList', () => {
    expect(chatHeaderContent).toContain('onClick={onBackToList}')
    expect(chatHeaderContent).toContain('<ChevronLeft className="h-5 w-5" />')
  })
})
