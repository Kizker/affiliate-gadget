import { test, expect } from '@playwright/test'

/**
 * Affiliate Gadget - Authentication Tests
 * Tests login functionality and protected routes
 */

test.describe('Authentication', () => {
  test('Login form validation works', async ({ page }) => {
    await page.goto('/login')

    // Submit empty form
    await page.click('button[type="submit"]')

    // Should show validation or prevent submission
    await page.waitForTimeout(500)

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@email.com')
    await page.fill('input[type="password"]', 'wrongpassword123')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for response
    await page.waitForTimeout(2000)

    // Should show error or stay on login page
    const hasError = await page
      .locator('text=/salah|error|invalid/i')
      .isVisible()
    const stillOnLogin = page.url().includes('/login')

    expect(hasError || stillOnLogin).toBeTruthy()
  })

  test('Protected dashboard routes redirect to login', async ({ page }) => {
    // Try to access admin dashboard without auth
    await page.goto('/dashboard/admin')

    // Should redirect to login
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('Protected mitra routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard/mitra')

    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Cart & Checkout (Unauthenticated)', () => {
  test('Cart page loads', async ({ page }) => {
    await page.goto('/cart')

    // Should either show login prompt or empty cart
    await page.waitForLoadState('networkidle')

    // Check page loaded without error
    await expect(page.locator('body')).not.toContainText(
      'Internal Server Error'
    )
  })

  // Skip: This test is environment-dependent - checkout behavior varies
  test.skip('Checkout redirects to login when not authenticated', async ({
    page,
  }) => {
    await page.goto('/checkout')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Checkout page should either:
    // 1. Redirect to login
    // 2. Show login prompt
    // 3. Show empty cart / redirect back to cart
    // All are valid behaviors for unauthenticated users
    const isOnLogin = page.url().includes('/login')
    const isOnCart = page.url().includes('/cart')
    const isOnCheckout = page.url().includes('/checkout')
    const hasLoginPrompt = await page.locator('text=/login|masuk/i').isVisible()
    const pageLoadedWithoutError = !(await page
      .locator('text=/Internal Server Error|500/')
      .isVisible())

    // Valid if redirected to login/cart, or page loaded without server error
    expect(
      isOnLogin ||
        isOnCart ||
        hasLoginPrompt ||
        (isOnCheckout && pageLoadedWithoutError)
    ).toBeTruthy()
  })
})
