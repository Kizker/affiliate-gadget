import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Notification Bell Active Actions Real-Time Suite', () => {
  const bellPath = path.resolve(
    process.cwd(),
    'src/components/dashboard/admin-notification-bell.tsx'
  )

  it('admin notification bell toggles dropdown and maintains active badges while actions pending', () => {
    const bellContent = fs.readFileSync(bellPath, 'utf8')

    // Harus memiliki handler saat lonceng ditekan
    expect(bellContent).toContain('const handleToggleBell = () => {')

    // Badge lonceng selalu aktif jika unread / proses aktif > 0
    expect(bellContent).toContain('const showBellBadge = counts.total > 0')

    // Dropdown menyajikan list item yang memerlukan tindakan
    expect(bellContent).toContain('currentActiveItems')
    expect(bellContent).toContain('proses aktif')
  })

  it('verifies notification dropdown has mobile anti-overflow positioning and single-line text', () => {
    const bellContent = fs.readFileSync(bellPath, 'utf8')

    // 1. Mobile anti-overflow positioning (fixed left-3 right-3, centered, not offset off-screen)
    expect(bellContent).toContain('fixed left-3 right-3 top-16 z-50')
    expect(bellContent).toContain(
      'sm:absolute sm:inset-x-auto sm:right-0 sm:top-full'
    )

    // 2. Single-line locking on small texts & badges
    expect(bellContent).toContain(
      'shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px]'
    )
    expect(bellContent).toContain('proses aktif')
    expect(bellContent).toContain('Semua Proses Terkelola')
  })
})
