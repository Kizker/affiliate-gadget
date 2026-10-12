import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Logout Confirmation Validation Suite', () => {
  const modalPath = path.resolve(
    process.cwd(),
    'src/components/auth/logout-confirm-modal.tsx'
  )
  const navbarPath = path.resolve(
    process.cwd(),
    'src/components/layouts/navbar.tsx'
  )
  const mobileAccountViewPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-customer-account-view.tsx'
  )
  const sidebarPath = path.resolve(
    process.cwd(),
    'src/components/dashboard/sidebar.tsx'
  )
  const mitraPendingPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/mitra/pending/page.tsx'
  )
  const teknisiDashboardPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/teknisi/page.tsx'
  )

  it('memverifikasi komponen LogoutConfirmModal memiliki struktur dialog aksesibel dan aksi validasi', () => {
    expect(fs.existsSync(modalPath)).toBe(true)
    const content = fs.readFileSync(modalPath, 'utf8')

    // Accessibility attributes
    expect(content).toContain('role="dialog"')
    expect(content).toContain('aria-modal="true"')
    expect(content).toContain('aria-labelledby="logout-modal-title"')

    // Action button labels (Validasi Setuju atau Tidak)
    expect(content).toContain("confirmText = 'Ya, Keluar'")
    expect(content).toContain("cancelText = 'Batal'")

    // Keyboard ESC listener
    expect(content).toContain("e.key === 'Escape'")

    // Body scroll lock
    expect(content).toContain("document.body.style.overflow = 'hidden'")

    // Portal rendering to document.body
    expect(content).toContain('createPortal(modalContent, document.body)')
  })

  it('memverifikasi Navbar mengintegrasikan validasi modal sebelum eksekusi signOut', () => {
    const content = fs.readFileSync(navbarPath, 'utf8')

    // Import modal
    expect(content).toContain('LogoutConfirmModal')

    // State konfirmasi modal
    expect(content).toContain('showLogoutModal')
    expect(content).toContain('setShowLogoutModal(true)')

    // Render modal
    expect(content).toContain('<LogoutConfirmModal')
    expect(content).toContain('isOpen={showLogoutModal}')
  })

  it('memverifikasi MobileCustomerAccountView mengintegrasikan validasi modal saat pengguna menekan Keluar dari Akun', () => {
    const content = fs.readFileSync(mobileAccountViewPath, 'utf8')

    expect(content).toContain('LogoutConfirmModal')
    expect(content).toContain('showLogoutModal')
    expect(content).toContain('setShowLogoutModal(true)')
    expect(content).toContain('<LogoutConfirmModal')
    expect(content).toContain('isOpen={showLogoutModal}')
  })

  it('memverifikasi Sidebar admin mengintegrasikan validasi modal saat pengguna menekan tombol Keluar', () => {
    const content = fs.readFileSync(sidebarPath, 'utf8')

    expect(content).toContain('LogoutConfirmModal')
    expect(content).toContain('showLogoutModal')
    expect(content).toContain('setShowLogoutModal(true)')
    expect(content).toContain('<LogoutConfirmModal')
    expect(content).toContain('isOpen={showLogoutModal}')
  })

  it('memverifikasi Halaman Mitra Pending & Teknisi mengintegrasikan validasi modal saat logout', () => {
    const mitraContent = fs.readFileSync(mitraPendingPath, 'utf8')
    expect(mitraContent).toContain('LogoutConfirmModal')
    expect(mitraContent).toContain('showLogoutModal')
    expect(mitraContent).toContain('setShowLogoutModal(true)')

    const teknisiContent = fs.readFileSync(teknisiDashboardPath, 'utf8')
    expect(teknisiContent).toContain('LogoutConfirmModal')
    expect(teknisiContent).toContain('showLogoutModal')
    expect(teknisiContent).toContain('setShowLogoutModal(true)')
  })
})
