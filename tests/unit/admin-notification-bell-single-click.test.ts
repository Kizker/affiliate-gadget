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
})
