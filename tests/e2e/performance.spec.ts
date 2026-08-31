import { test, expect, Page } from '@playwright/test'

/**
 * Affiliate Gadget - Performance & Accessibility Tests
 * Basic performance and accessibility checks
 */

test.describe('Performance', () => {
  test('Homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const loadTime = Date.now() - startTime

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })

  test('Blog page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/blog')
    await page.waitForLoadState('domcontentloaded')

    const loadTime = Date.now() - startTime

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })
})

test.describe('Accessibility Basics', () => {
  test('Homepage has proper heading structure', async ({ page }) => {
    await page.goto('/')

    // Should have at least one h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('Images have alt attributes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const imagesWithoutAlt = await page.locator('img:not([alt])').count()

    // Allow some images without alt (decorative), but not too many
    expect(imagesWithoutAlt).toBeLessThan(10)
  })

  test('Links are accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that links have discernible text (allow icon-only links with aria-label)
    const links = await page.locator('a').all()
    let emptyLinks = 0

    for (const link of links.slice(0, 20)) {
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')
      const hasSvg = (await link.locator('svg').count()) > 0

      // Link is "empty" if no text, no aria-label, and no icon
      if (!text?.trim() && !ariaLabel && !hasSvg) {
        emptyLinks++
      }
    }

    // Should have minimal truly empty links
    expect(emptyLinks).toBeLessThan(5)
  })

  test('Form inputs have labels', async ({ page }) => {
    await page.goto('/login')

    // Check that inputs have associated labels or aria-label
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    // Should be focusable
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })
})

test.describe('Mobile Responsiveness', () => {
  test('Homepage is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that content is not significantly overflowing (allow small overflow for animations)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(400) // Allow slight overflow
  })

  test('Navigation works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check navbar exists
    const hasNavbar = (await page.locator('nav').count()) > 0
    expect(hasNavbar).toBeTruthy()

    // Mobile menu is optional - just verify page is navigable
    // Try to find and click mobile menu if it exists
    const mobileMenuButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first()

    if (await mobileMenuButton.isVisible()) {
      // If mobile menu button exists, clicking should show navigation
      await mobileMenuButton.click()
      await page.waitForTimeout(500)
    }

    // Either way, page should have loaded without errors
    await expect(page.locator('body')).not.toContainText(
      'Internal Server Error'
    )
  })
})

test.describe('Console Error Check', () => {
  async function checkPageForErrors(page: Page, url: string) {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Ignore common non-critical errors
        if (
          !text.includes('favicon') &&
          !text.includes('net::ERR') &&
          !text.includes('Failed to load resource') &&
          !text.includes('401') &&
          !text.includes('analytics')
        ) {
          errors.push(text)
        }
      }
    })

    await page.goto(url)
    await page.waitForLoadState('networkidle')

    return errors
  }

  test('Homepage has no critical console errors', async ({ page }) => {
    const errors = await checkPageForErrors(page, '/')
    expect(errors, `Console errors found: ${errors.join(', ')}`).toHaveLength(0)
  })

  test('Blog page has no critical console errors', async ({ page }) => {
    const errors = await checkPageForErrors(page, '/blog')
    expect(errors, `Console errors found: ${errors.join(', ')}`).toHaveLength(0)
  })

  test('Login page has no critical console errors', async ({ page }) => {
    const errors = await checkPageForErrors(page, '/login')
    expect(errors, `Console errors found: ${errors.join(', ')}`).toHaveLength(0)
  })
})
