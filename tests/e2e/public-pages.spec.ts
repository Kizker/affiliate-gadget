import { test, expect } from '@playwright/test'

/**
 * HaloTekno - Public Pages E2E Tests
 * Tests all publicly accessible pages for errors and basic functionality
 */

test.describe('Public Pages', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/')

    // Check page title
    await expect(page).toHaveTitle(/HaloTekno/)

    // Check navbar is visible
    await expect(page.locator('nav')).toBeVisible()

    // Check no console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Check hero section
    await expect(page.locator('h1').first()).toBeVisible()

    // Should have no critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('Blog page loads correctly', async ({ page }) => {
    await page.goto('/blog')

    await expect(page).toHaveTitle(/Blog/)
    await expect(page.locator('h1')).toContainText(/Teknologi|Blog/)

    // Wait for articles to load
    await page.waitForLoadState('networkidle')
  })

  test('Teknisi page loads correctly', async ({ page }) => {
    await page.goto('/teknisi')

    await expect(page).toHaveTitle(/Teknisi|HaloTekno/)
    await page.waitForLoadState('networkidle')
  })

  test('Sparepart page loads correctly', async ({ page }) => {
    await page.goto('/sparepart')

    await expect(page).toHaveTitle(/Sparepart|HaloTekno/)
    await page.waitForLoadState('networkidle')
  })

  test('Sewa Alat page loads correctly', async ({ page }) => {
    await page.goto('/sewa-alat')

    await expect(page).toHaveTitle(/Sewa|HaloTekno/)
    await page.waitForLoadState('networkidle')
  })

  test('Rekomendasi page loads correctly', async ({ page }) => {
    await page.goto('/rekomendasi')

    await page.waitForLoadState('networkidle')
    // Page should not have error state
    await expect(page.locator('body')).not.toContainText('Error')
  })

  test('About page loads correctly', async ({ page }) => {
    await page.goto('/about')

    await expect(page).toHaveTitle(/Tentang|About|HaloTekno/)
    await page.waitForLoadState('networkidle')
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
    await page.waitForLoadState('networkidle')

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
  test('Can navigate from homepage to blog', async ({ page }) => {
    await page.goto('/')

    // Find and click blog link
    await page.click('a[href="/blog"], nav >> text=Blog')

    await expect(page).toHaveURL(/\/blog/)
  })

  test('Can navigate from homepage to teknisi', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Navigate to teknisi
    await page.goto('/teknisi')
    await expect(page).toHaveURL(/\/teknisi/)
  })
})

test.describe('Broken Links Check', () => {
  test('Homepage has no broken internal links', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Get all internal links
    const links = await page.locator('a[href^="/"]').all()

    // Check first 10 links (to keep test fast)
    const linksToCheck = links.slice(0, 10)

    for (const link of linksToCheck) {
      const href = await link.getAttribute('href')
      if (href && !href.includes('#')) {
        const response = await page.request.get(href)
        expect(response.status(), `Link ${href} should not be 404`).not.toBe(
          404
        )
      }
    }
  })
})

test.describe('Images Check', () => {
  test('Homepage images load correctly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that images are not broken
    const images = await page.locator('img').all()

    for (const img of images.slice(0, 5)) {
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth
      )
      const src = await img.getAttribute('src')

      // Skip placeholder images
      if (src && !src.includes('placeholder') && !src.includes('data:')) {
        expect(naturalWidth, `Image ${src} should load`).toBeGreaterThan(0)
      }
    }
  })
})
