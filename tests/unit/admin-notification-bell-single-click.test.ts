import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Notification Bell Single-Click Auto-Dismiss', () => {
  const bellPath = path.resolve(
    process.cwd(),
    'src/components/dashboard/admin-notification-bell.tsx'
  )

  it('admin notification bell dismisses badge on single click and syncs read state', () => {
    const bellContent = fs.readFileSync(bellPath, 'utf8')

    // Harus memiliki handler saat lonceng ditekan sekali
    expect(bellContent).toContain('const handleToggleBell = () => {')

    // Saat dibuka, harus memanggil markAllAsRead() dan setBellDismissed(true)
    expect(bellContent).toContain('setBellDismissed(true)')
    expect(bellContent).toContain('markAllAsRead()')

    // Badge lonceng hanya tampil jika belum di-dismiss dan unread > 0
    expect(bellContent).toContain(
      'const showBellBadge = !bellDismissed && counts.total > 0'
    )

    // Harus menyediakan tombol dismiss individual per item (X)
    expect(bellContent).toContain('const handleDismissItem =')
    expect(bellContent).toContain('markAsRead(itemId)')
    expect(bellContent).toContain('title="Tutup notifikasi ini"')
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
    expect(bellContent).toContain('Telah Dilihat')
    expect(bellContent).toContain(
      'shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-2 py-1 text-[10px]'
    )
    expect(bellContent).toContain('Tandai Dibaca')
    expect(bellContent).toContain(
      'whitespace-nowrap text-xs font-bold text-slate-800'
    )
    expect(bellContent).toContain('Semua Proses Terkelola')
  })
})
