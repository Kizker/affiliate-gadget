import { test, expect } from '@playwright/test'
import path from 'path'

/**
 * Affiliate Gadget - Withdrawal Security Gate & Modal Browser E2E Tests
 * Validates the full browser end-to-end flow:
 * 1. Unauthenticated protection guards (Route & API).
 * 2. Store Admin login and corporate bank card display.
 * 3. 2-Step withdrawal modal interaction (Nominal -> OTP -> Success).
 * 4. Error feedback handling for security gates (Cooling-down 24 Jam).
 * 5. Step 3 Success receipt confirmation modal dialog.
 * 6. Dashboard Cooling-down 24 Jam warning banner and locked button state.
 */

const authFile = path.join(process.cwd(), 'tests', '.auth', 'admin-auth.json')

test.describe.configure({ mode: 'serial' })

test.describe('Withdrawal Security Gate & Modal Flow', () => {
  test.setTimeout(60000)

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60000)
    const context = await browser.newContext()
    const page = await context.newPage()

    // Bypass login 2FA challenge for clean automated testing
    await page.route('**/api/auth/login-2fa', async (route) => {
      const body = route.request().postDataJSON()
      if (body?.action === 'check') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ requires2FA: false }),
        })
      } else {
        await route.continue()
      }
    })

    // Perform login once
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin.roxy@affiliategadget.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait until redirect away from login completes
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 30000,
    })

    // Save session storage state for all authenticated tests
    await context.storageState({ path: authFile })
    await context.close()
  })

  test('1. Unauthenticated user cannot access finance dashboard or withdraw API', async ({
    browser,
    request,
  }) => {
    // Create isolated context without storageState
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/dashboard/admin/finance')
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/login/)
    await context.close()

    // Direct POST API without auth returns 401
    const res = await request.post('/api/admin/finance/withdraw', {
      data: { amount: 500000, storeId: 'store-1', otpCode: '123456' },
    })
    expect(res.status()).toBe(401)
  })

  test('2. Store Admin can view corporate bank details on finance dashboard', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: authFile })
    const page = await context.newPage()

    await page.goto('/dashboard/admin/finance')
    await page.waitForLoadState('domcontentloaded')

    // Verify corporate bank card elements
    await expect(page.locator('text=Rekening Penampungan PT')).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByText('Bank Mandiri', { exact: true })).toBeVisible()
    await expect(page.locator('text=1180019283741').first()).toBeVisible()

    // Verify button exists
    const actionBtn = page.locator(
      'button:has-text("Tarik Saldo"), button:has-text("Terkunci")'
    )
    await expect(actionBtn.first()).toBeVisible()

    await context.close()
  })

  test('3. Step 1: Modal nominal validation and cancel action', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: authFile })
    const page = await context.newPage()

    // Mock finance API to ensure store is unlocked and has balance
    await page.route('**/api/admin/finance*', async (route) => {
      const response = await route.fetch()
      const json = await response.json()
      if (json.store) {
        json.store.cooldownStatus = {
          isLocked: false,
          remainingHours: 0,
          remainingMinutes: 0,
        }
      }
      if (json.stats) {
        json.stats.availableBalance = 15000000
      }
      await route.fulfill({ json })
    })

    await page.goto('/dashboard/admin/finance')
    await page.waitForLoadState('domcontentloaded')

    // Open withdrawal modal
    const withdrawBtn = page.locator(
      'button:has-text("Tarik Saldo ke Rekening PT")'
    )
    await expect(withdrawBtn).toBeVisible({ timeout: 20000 })
    await withdrawBtn.click()

    // Verify Modal Step 1 UI
    await expect(page.locator('text=Tahap 1/2')).toBeVisible()
    await expect(page.locator('text=Rekening Tujuan Pencairan')).toBeVisible()

    const nominalInput = page.locator('input[placeholder="misal: 50000000"]')
    await expect(nominalInput).toBeVisible()

    const proceedBtn = page.locator(
      'button:has-text("Lanjutkan ke Verifikasi OTP")'
    )
    // Without input, proceed button should be disabled
    await expect(proceedBtn).toBeDisabled()

    // Test typing invalid nominal (< 100.000)
    await nominalInput.fill('50000')
    await expect(proceedBtn).toBeDisabled()

    // Fill valid nominal
    await nominalInput.fill('500000')
    await expect(proceedBtn).toBeEnabled()

    // Cancel modal
    await page.click('button:has-text("Batal")')
    await expect(page.locator('text=Tahap 1/2')).not.toBeVisible()

    await context.close()
  })

  test('4. Step 2: OTP Challenge, countdown, and back to Step 1', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: authFile })
    const page = await context.newPage()

    // Mock send-otp API
    await page.route('**/api/auth/send-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'OTP sent',
          expiresIn: 300,
          cooldown: 60,
        }),
      })
    })

    await page.route('**/api/admin/finance*', async (route) => {
      const response = await route.fetch()
      const json = await response.json()
      if (json.store) {
        json.store.cooldownStatus = {
          isLocked: false,
          remainingHours: 0,
          remainingMinutes: 0,
        }
      }
      if (json.stats) {
        json.stats.availableBalance = 15000000
      }
      await route.fulfill({ json })
    })

    await page.goto('/dashboard/admin/finance')
    await page.waitForLoadState('domcontentloaded')

    // Open modal & proceed to Step 2
    const withdrawBtn = page.locator(
      'button:has-text("Tarik Saldo ke Rekening PT")'
    )
    await expect(withdrawBtn).toBeVisible({ timeout: 20000 })
    await withdrawBtn.click()

    await page.fill('input[placeholder="misal: 50000000"]', '1000000')
    await page.click('button:has-text("Lanjutkan ke Verifikasi OTP")')

    // Verify Step 2 UI
    await expect(page.locator('text=Tahap 2/2')).toBeVisible()
    await expect(
      page.locator('text=Verifikasi Keamanan OTP (2FA)')
    ).toBeVisible()
    await expect(page.locator('text=Kode OTP 6 Digit Terkirim')).toBeVisible()

    // Verify OTP input field
    const otpInput = page.locator('input[placeholder="• • • • • •"]')
    await expect(otpInput).toBeVisible()

    // Verify submit button disabled until 6 digits entered
    const submitBtn = page.locator(
      'button:has-text("Konfirmasi & Cairkan Dana")'
    )
    await expect(submitBtn).toBeDisabled()

    await otpInput.fill('12345')
    await expect(submitBtn).toBeDisabled()

    await otpInput.fill('123456')
    await expect(submitBtn).toBeEnabled()

    // Test back button "Ubah Nominal"
    await page.click('button:has-text("Ubah Nominal")')
    await expect(page.locator('text=Tahap 1/2')).toBeVisible()

    await context.close()
  })

  test('5. Step 2: Error Feedback for Gate 1 (Cooling-down 24h)', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: authFile })
    const page = await context.newPage()

    // Intercept send-otp API
    await page.route('**/api/auth/send-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, expiresIn: 300, cooldown: 60 }),
      })
    })

    // Mock withdraw API with 403 COOLING_DOWN
    await page.route('**/api/admin/finance/withdraw', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'COOLING_DOWN',
          error:
            'Penarikan saldo terkunci selama masa cooling-down 24 jam setelah perubahan rekening bank.',
          remainingHours: 23,
          remainingMinutes: 45,
        }),
      })
    })

    await page.route('**/api/admin/finance*', async (route) => {
      try {
        const response = await route.fetch()
        const json = await response.json()
        if (json.store) {
          json.store.cooldownStatus = {
            isLocked: false,
            remainingHours: 0,
            remainingMinutes: 0,
          }
        }
        if (json.stats) {
          json.stats.availableBalance = 15000000
        }
        await route.fulfill({ json })
      } catch {
        // Ignore in-flight abort
      }
    })

    await page.goto('/dashboard/admin/finance')
    await page.waitForLoadState('domcontentloaded')

    // Open modal & proceed to Step 2
    const withdrawBtn = page.locator(
      'button:has-text("Tarik Saldo ke Rekening PT")'
    )
    await expect(withdrawBtn).toBeVisible({ timeout: 20000 })
    await withdrawBtn.click()

    await page.fill('input[placeholder="misal: 50000000"]', '500000')
    await page.click('button:has-text("Lanjutkan ke Verifikasi OTP")')

    // Fill OTP and submit
    await page.fill('input[placeholder="• • • • • •"]', '123456')
    await page.click('button:has-text("Konfirmasi & Cairkan Dana")')

    // Verify Cooling-down error banner appears in modal
    await expect(
      page.locator('text=Penarikan Terkunci (Cooling-down)')
    ).toBeVisible()
    await expect(
      page.locator(
        'text=Penarikan saldo terkunci selama masa cooling-down 24 jam'
      )
    ).toBeVisible()

    await page.unrouteAll({ behavior: 'ignoreErrors' })
    await context.close()
  })

  test('6. Step 3: Successful withdrawal flow and confirmation dialog', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: authFile })
    const page = await context.newPage()

    // Intercept send-otp API
    await page.route('**/api/auth/send-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, expiresIn: 300, cooldown: 60 }),
      })
    })

    // Mock withdraw API with 200 OK
    await page.route('**/api/admin/finance/withdraw', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Pencairan saldo PT berhasil diverifikasi dan diproses!',
          data: {
            refNumber: 'WD-20260925-ROXY99',
            amount: 5000000,
            bankName: 'Bank Mandiri',
            accountNumber: '1180019283741',
            accountName: 'PT Gadget Jaya Sentosa',
            requestedBy: 'Bambang Susanto',
            date: new Date().toISOString(),
          },
        }),
      })
    })

    await page.route('**/api/admin/finance*', async (route) => {
      try {
        const response = await route.fetch()
        const json = await response.json()
        if (json.store) {
          json.store.cooldownStatus = {
            isLocked: false,
            remainingHours: 0,
            remainingMinutes: 0,
          }
        }
        if (json.stats) {
          json.stats.availableBalance = 15000000
        }
        await route.fulfill({ json })
      } catch {
        // Ignore in-flight abort
      }
    })

    await page.goto('/dashboard/admin/finance')
    await page.waitForLoadState('domcontentloaded')

    // Open modal & proceed to Step 2
    const withdrawBtn = page.locator(
      'button:has-text("Tarik Saldo ke Rekening PT")'
    )
    await expect(withdrawBtn).toBeVisible({ timeout: 20000 })
    await withdrawBtn.click()

    await page.fill('input[placeholder="misal: 50000000"]', '5000000')
    await page.click('button:has-text("Lanjutkan ke Verifikasi OTP")')

    // Fill OTP and submit
    await page.fill('input[placeholder="• • • • • •"]', '888999')
    await page.click('button:has-text("Konfirmasi & Cairkan Dana")')

    // Verify Step 3 Success UI
    await expect(page.locator('text=Pencairan Dana Berhasil!')).toBeVisible()
    await expect(page.locator('text=WD-20260925-ROXY99')).toBeVisible()
    await expect(page.locator('text=Bank Mandiri').first()).toBeVisible()
    await expect(
      page.locator('text=PT Gadget Jaya Sentosa').first()
    ).toBeVisible()

    // Close modal
    await page.click('button:has-text("Tutup & Kembali ke Keuangan")')
    await expect(
      page.locator('text=Pencairan Dana Berhasil!')
    ).not.toBeVisible()

    await page.unrouteAll({ behavior: 'ignoreErrors' })
    await context.close()
  })

  test('7. Cooling-down 24 Jam Banner and disabled button state on dashboard', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: authFile })
    const page = await context.newPage()

    await page.route('**/api/admin/finance*', async (route) => {
      try {
        const response = await route.fetch()
        const json = await response.json()
        if (json.store) {
          json.store.cooldownStatus = {
            isLocked: true,
            remainingHours: 18,
            remainingMinutes: 30,
          }
        }
        await route.fulfill({ json })
      } catch {
        // Ignore in-flight abort
      }
    })

    await page.goto('/dashboard/admin/finance')
    await page.waitForLoadState('domcontentloaded')

    // Verify warning banner on card
    await expect(
      page.locator('text=Penarikan Terkunci (Cooling-down 24 Jam)')
    ).toBeVisible({ timeout: 20000 })
    await expect(page.locator('text=18 jam 30 menit')).toBeVisible()

    // Verify button is disabled and indicates remaining time
    const lockedBtn = page.locator('button:has-text("Terkunci (18j 30m)")')
    await expect(lockedBtn).toBeVisible()
    await expect(lockedBtn).toBeDisabled()

    await page.unrouteAll({ behavior: 'ignoreErrors' })
    await context.close()
  })
})
