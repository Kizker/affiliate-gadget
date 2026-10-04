import { test, expect } from '@playwright/test'

/**
 * End-to-End Test Suite: Auth Lifecycle & Button Coverage
 * Menguji seluruh tombol, kontrol form, validasi, dan alur pendaftaran hingga login.
 */

test.describe('Login Page Button & Form Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
  })

  test('TC-LOG-01: Header Navigation Buttons (Logo & Kembali ke Beranda)', async ({
    page,
  }) => {
    // 1. Klik tombol logo brand
    const brandLogo = page.locator(
      'header a[aria-label="Affiliate Gadget Beranda"]'
    )
    await expect(brandLogo).toBeVisible()
    await expect(brandLogo).toHaveAttribute('href', '/')

    // 2. Klik link "Kembali ke Beranda"
    const backHomeBtn = page.getByRole('link', { name: /Kembali ke Beranda/i })
    await expect(backHomeBtn).toBeVisible()
    await expect(backHomeBtn).toHaveAttribute('href', '/')
  })

  test('TC-LOG-02: Password Visibility Toggle Button', async ({ page }) => {
    const passwordInput = page.locator('input#password')
    const toggleBtn = page.locator(
      'button[aria-label="Toggle password visibility"]'
    )

    await passwordInput.fill('Rahasia123!')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Klik tombol toggle show password
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Klik kembali toggle hide password
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('TC-LOG-03: Quick Navigation Links (Bantuan Sandi & Daftar Akun)', async ({
    page,
  }) => {
    // 1. Link Bantuan Sandi tanpa email
    const forgotLink = page.getByRole('link', { name: /Bantuan Sandi\?/i })
    await expect(forgotLink).toBeVisible()
    await expect(forgotLink).toHaveAttribute('href', '/forgot-password')

    // 2. Isi email lalu cek apakah link bantuan sandi membawa query param email
    await page.locator('input#email').fill('user.test@example.com')
    await expect(
      page.getByRole('link', { name: /Bantuan Sandi\?/i })
    ).toHaveAttribute('href', '/forgot-password?email=user.test%40example.com')

    // 3. Link Daftar Sekarang
    const registerLink = page.getByRole('link', { name: /Daftar sekarang/i })
    await expect(registerLink).toBeVisible()
    await registerLink.click()
    await expect(page).toHaveURL(/\/register/)
  })

  test('TC-LOG-04: Google Sign-In Button State', async ({ page }) => {
    const googleBtn = page.getByRole('button', {
      name: /Lanjutkan dengan Google/i,
    })
    await expect(googleBtn).toBeVisible()
    await expect(googleBtn).toBeEnabled()
  })

  test('TC-LOG-05: Empty Submission and Invalid Credentials Error Handling', async ({
    page,
  }) => {
    const submitBtn = page.getByRole('button', { name: /Masuk ke Akun/i })

    // Klik submit tanpa isi (HTML5 validation trigger)
    await submitBtn.click()
    const emailInput = page.locator('input#email')
    expect(
      await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity())
    ).toBeFalsy()

    // Isi email & password salah
    await emailInput.fill('user_salah@testing.com')
    await page.locator('input#password').fill('PasswordSalah123!')
    await submitBtn.click()

    // Harap muncul banner error kredensial tidak cocok
    const errorBanner = page.locator('text=/tidak cocok|gagal|salah|kendala/i')
    await expect(errorBanner).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Register Page Button & Form Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')
  })

  test('TC-REG-01: Header Navigation Buttons (Logo & Kembali)', async ({
    page,
  }) => {
    const brandLogo = page.locator(
      'header a[aria-label="Affiliate Gadget Beranda"]'
    )
    await expect(brandLogo).toBeVisible()
    await expect(brandLogo).toHaveAttribute('href', '/')

    const backHomeBtn = page.getByRole('link', { name: /Kembali ke Beranda/i })
    await expect(backHomeBtn).toBeVisible()
    await expect(backHomeBtn).toHaveAttribute('href', '/')
  })

  test('TC-REG-02: Account Type Selector Buttons (Customer vs Mitra Toko)', async ({
    page,
  }) => {
    const customerCardBtn = page.getByRole('button', { name: /Customer/i })
    const mitraCardBtn = page.getByRole('button', { name: /Mitra Toko/i })

    await expect(customerCardBtn).toBeVisible()
    await expect(mitraCardBtn).toBeVisible()

    // Klik tombol Mitra Toko
    await mitraCardBtn.click()
    await expect(
      page.locator('text=/Pendaftaran toko memerlukan kelengkapan profil/i')
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Lanjut ke Informasi Toko/i })
    ).toBeVisible()

    // Klik kembali tombol Customer
    await customerCardBtn.click()
    await expect(
      page.getByRole('button', { name: /Daftar Akun Sekarang/i })
    ).toBeVisible()
  })

  test('TC-REG-03: Password & Confirm Password Eye Toggle Buttons', async ({
    page,
  }) => {
    const pwdInput = page.locator('input#password')
    const confirmPwdInput = page.locator('input#confirmPassword')
    const pwdToggle = page.locator(
      'button[aria-label="Toggle password visibility"]'
    )
    const confirmPwdToggle = page.locator(
      'button[aria-label="Toggle confirm password visibility"]'
    )

    await pwdInput.fill('Testing123!')
    await confirmPwdInput.fill('Testing123!')

    // Toggle utama
    await pwdToggle.click()
    await expect(pwdInput).toHaveAttribute('type', 'text')
    await pwdToggle.click()
    await expect(pwdInput).toHaveAttribute('type', 'password')

    // Toggle konfirmasi
    await confirmPwdToggle.click()
    await expect(confirmPwdInput).toHaveAttribute('type', 'text')
    await confirmPwdToggle.click()
    await expect(confirmPwdInput).toHaveAttribute('type', 'password')
  })

  test('TC-REG-04: Password Strength Criteria Evaluation & Submit Button Disabled State', async ({
    page,
  }) => {
    const pwdInput = page.locator('input#password')
    const submitBtn = page.getByRole('button', {
      name: /Daftar Akun Sekarang/i,
    })

    await expect(submitBtn).toBeDisabled()

    await pwdInput.focus()
    await expect(page.locator('text=/Kekuatan Kata Sandi/i')).toBeVisible()
    await expect(page.locator('text=/Min. 8 karakter/i')).toBeVisible()
    await expect(page.locator('text=/Huruf besar \\(A-Z\\)/i')).toBeVisible()
    await expect(page.locator('text=/Huruf kecil \\(a-z\\)/i')).toBeVisible()
    await expect(page.locator('text=/Angka \\(0-9\\)/i')).toBeVisible()
    await expect(page.locator('text=/Karakter simbol/i')).toBeVisible()

    // Password lemah
    await pwdInput.fill('passwordlemah')
    await expect(submitBtn).toBeDisabled()

    // Password kuat
    await pwdInput.fill('PasswordKuat123!')
    await page.locator('input#confirmPassword').fill('PasswordKuat123!')
    await page.locator('input#name').fill('Budi Pengujian')
    await page.locator('input#email').fill('budi.test@example.com')

    await expect(submitBtn).toBeEnabled()
  })

  test('TC-REG-05: Link Navigasi ke Halaman Login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /Masuk di sini/i })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL(/\/login/)
  })
})
