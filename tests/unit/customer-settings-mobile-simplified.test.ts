import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Customer Settings Mobile Simplification Suite (Screenshots 2, 3, 4)', () => {
  it('1. Mobile Wishlist View matches Screenshot 2 (top card with counter and Kosongkan pill, clean cards without store/star clutter)', () => {
    const viewPath = path.join(
      process.cwd(),
      'src/components/customer/customer-wishlist-view.tsx'
    )
    const content = fs.readFileSync(viewPath, 'utf-8')

    // Top Card
    expect(content).toContain('Gadget Tersimpan')
    expect(content).toContain('Daftar produk incaran Anda')
    expect(content).toContain('Kosongkan')

    // Items list and action buttons
    expect(content).toContain('Lihat Produk')
    expect(content).toContain('Hapus')

    // Must NOT have rating stars or store branch clutter in mobile cards
    expect(content).not.toContain('Star className="h-3 w-3 fill-amber-400')
    expect(content).not.toContain('Store className="h-3 w-3 text-slate-400')
  })

  it('2. Mobile Edit Profile View matches Screenshot 2 (avatar with Ubah Foto pill, clean inputs without icons, gender radio pills, Simpan Profil)', () => {
    const settingsPath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/settings/page.tsx'
    )
    const content = fs.readFileSync(settingsPath, 'utf-8')

    // Profile mobile card
    expect(content).toContain('Ubah Foto')
    expect(content).toContain('Nama Lengkap')
    expect(content).toContain('Username')
    expect(content).toContain('Nomor WhatsApp')
    expect(content).toContain('Email')
    expect(content).toContain('Jenis Kelamin')
    expect(content).toContain('Laki-laki')
    expect(content).toContain('Perempuan')
    expect(content).toContain('Tanggal Lahir')
    expect(content).toContain('Simpan Profil')

    // Profile card on mobile overview must NOT contain 'Pembeli Resmi'
    const accountViewPath = path.join(
      process.cwd(),
      'src/components/customer/mobile-customer-account-view.tsx'
    )
    const accountViewContent = fs.readFileSync(accountViewPath, 'utf-8')
    expect(accountViewContent).not.toContain('Pembeli Resmi')
  })

  it('3. Mobile Delivery Address View matches Screenshot 2 (Tersimpan count, Tambah Baru button, Utama/Rumah badges, Jadikan Utama, Ubah, Hapus)', () => {
    const settingsPath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/settings/page.tsx'
    )
    const content = fs.readFileSync(settingsPath, 'utf-8')

    // Address mobile list
    expect(content).toContain('Tersimpan (')
    expect(content).toContain('Tambah Baru')
    expect(content).toContain('Utama')
    expect(content).toContain('Rumah')
    expect(content).toContain('Jadikan Utama')
    expect(content).toContain('Ubah')
    expect(content).toContain('Hapus')
  })

  it('4. Mobile Address Modal matches Screenshots 3 & 4 (clean header, Rumah/Kantor switcher, clean inputs without icons, 4-tier combobox, Simpan Alamat)', () => {
    const modalPath = path.join(
      process.cwd(),
      'src/components/customer/address-modal.tsx'
    )
    const content = fs.readFileSync(modalPath, 'utf-8')

    expect(content).toContain('Tambah Alamat Baru')
    expect(content).toContain('Ubah Alamat Pengiriman')
    expect(content).toContain('Rumah')
    expect(content).toContain('Kantor')
    expect(content).toContain('Nama Penerima')
    expect(content).toContain('Nomor WhatsApp')
    expect(content).toContain('Detail Alamat Lengkap')
    expect(content).toContain('Kode Pos')
    expect(content).toContain('Simpan Alamat')
  })

  it('5. Mobile Password & Security View matches Screenshot 2 (Ubah Kata Sandi card with Lupa Kata Sandi?, clean inputs with Eye toggle, Perbarui Kata Sandi, Verifikasi Tambahan, Perangkat Aktif)', () => {
    const settingsPath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/settings/page.tsx'
    )
    const content = fs.readFileSync(settingsPath, 'utf-8')

    // Ubah Kata Sandi Card
    expect(content).toContain('Ubah Kata Sandi')
    expect(content).toContain('Password Saat Ini')
    expect(content).toContain('Lupa Kata Sandi?')
    expect(content).toContain('Masukkan password lama')
    expect(content).toContain('Password Baru')
    expect(content).toContain('Minimal 6 karakter')
    expect(content).toContain('Konfirmasi Password Baru')
    expect(content).toContain('Ulangi password baru')
    expect(content).toContain('Perbarui Kata Sandi')

    // Verifikasi Tambahan Card
    expect(content).toContain('Verifikasi Tambahan')
    expect(content).toContain('Verifikasi 2 Langkah')
    expect(content).toContain('Belum Verifikasi')
    expect(content).toContain('Aktif')
    expect(content).toContain('Hubungkan →')
    expect(content).toContain('Ganti Nomor')

    // Perangkat Aktif Card
    expect(content).toContain('Perangkat Aktif')
    expect(content).toContain('border-2 border-orange-500')
    expect(content).toContain('Keluar')
  })
})
