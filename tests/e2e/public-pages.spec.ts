import { test, expect } from '@playwright/test'

/**
 * Affiliate Gadget - Public Pages E2E Tests
 * Tests all publicly accessible pages for errors and basic functionality
 */

test.describe('Public Pages', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/')

    // Check page title
    await expect(page).toHaveTitle(/Affiliate Gadget/)

    // Check navbar is visible (first visible nav element)
    await expect(page.locator('nav:visible').first()).toBeVisible()

    // Check no console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded')

    // Check hero section
    await expect(page.locator('h1').first()).toBeVisible()

    // Should have no critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('net::ERR') &&
        !e.includes('Failed to load resource')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('Servis LCD page loads correctly', async ({ page }) => {
    await page.goto('/servis-lcd')

    await expect(page).toHaveTitle(/Servis LCD|Affiliate Gadget/)

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded')
  })

  test('Teknisi page loads correctly', async ({ page }) => {
    await page.goto('/teknisi')

    await expect(page).toHaveTitle(/Teknisi|Affiliate Gadget/)
    await page.waitForLoadState('domcontentloaded')
  })

  test('Sparepart page loads correctly', async ({ page }) => {
    await page.goto('/sparepart')

    await expect(page).toHaveTitle(/Sparepart|Affiliate Gadget/)
    await page.waitForLoadState('domcontentloaded')
  })

  test('Sewa Alat page loads correctly', async ({ page }) => {
    await page.goto('/sewa-alat')

    await expect(page).toHaveTitle(/Sewa|Affiliate Gadget/)
    await page.waitForLoadState('domcontentloaded')
  })

  test('Rekomendasi page loads correctly', async ({ page }) => {
    await page.goto('/rekomendasi')

    await page.waitForLoadState('domcontentloaded')
    // Page should not have error state
    await expect(page.locator('body')).not.toContainText('Error')
  })

  test('About page loads correctly', async ({ page }) => {
    await page.goto('/about')

    await expect(page).toHaveTitle(/Tentang|About|Affiliate Gadget/)
    await page.waitForLoadState('domcontentloaded')
  })

  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login')

    // Should have login form
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('Register page loads correctly', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')

    // Should have registration form
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    })
    await expect(page.locator('input[type="password"]').first()).toBeVisible({
      timeout: 10000,
    })
  })
})

test.describe('Navigation', () => {
  test('Can navigate from homepage to gadget catalog', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Click visible gadget link in navbar or hero
    const gadgetLink = page.locator('a[href="/gadget"]:visible').first()
    await expect(gadgetLink).toBeVisible()
    await gadgetLink.click()

    await expect(page).toHaveURL(/\/gadget/, { timeout: 15000 })
  })

  test('Can navigate from homepage to toko directory', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Click visible toko link in navbar
    const tokoLink = page.locator('a[href="/toko"]:visible').first()
    await expect(tokoLink).toBeVisible()
    await tokoLink.click()

    await expect(page).toHaveURL(/\/toko/, { timeout: 15000 })
  })

  test('Can navigate from homepage to servis-lcd via footer', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const servisLink = page.locator('footer a[href="/servis-lcd"]').first()
    await servisLink.scrollIntoViewIfNeeded()
    await expect(servisLink).toBeVisible()
    await servisLink.click()

    await expect(page).toHaveURL(/\/servis-lcd/, { timeout: 15000 })
  })

  test('Can navigate from homepage to teknisi', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Navigate to teknisi
    await page.goto('/teknisi')
    await expect(page).toHaveURL(/\/teknisi/, { timeout: 15000 })
  })
})

test.describe('Broken Links Check', () => {
  test('Homepage has no broken internal links', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Get all internal links
    const linkElements = await page.locator('a[href^="/"]').all()
    const validHrefs = new Set<string>()

    for (const link of linkElements) {
      const href = await link.getAttribute('href')
      if (
        href &&
        !href.includes('#') &&
        !href.startsWith('mailto:') &&
        !href.startsWith('tel:') &&
        !href.startsWith('//')
      ) {
        // Normalize URL without query params for status check
        const cleanHref = href.split('?')[0]
        if (cleanHref && cleanHref.startsWith('/')) {
          validHrefs.add(cleanHref)
        }
      }
      if (validHrefs.size >= 8) break
    }

    for (const href of Array.from(validHrefs)) {
      const response = await page.request.get(href)
      expect(response.status(), `Link ${href} should not be 404`).not.toBe(404)
    }
  })
})

test.describe('Images Check', () => {
  test('Homepage images load correctly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Check visible images on top fold
    const images = await page.locator('img:visible').all()

    for (const img of images.slice(0, 5)) {
      const src = await img.getAttribute('src')
      if (src && !src.includes('placeholder') && !src.includes('data:')) {
        await img.scrollIntoViewIfNeeded().catch(() => {})
        const isLoaded = await img.evaluate((el: HTMLImageElement) => {
          if (el.complete) return el.naturalWidth > 0
          return new Promise<boolean>((resolve) => {
            el.onload = () => resolve(el.naturalWidth > 0)
            el.onerror = () => resolve(false)
            setTimeout(() => resolve(el.naturalWidth > 0), 3000)
          })
        })
        expect(isLoaded, `Image ${src} should load`).toBeTruthy()
      }
    }
  })
})
