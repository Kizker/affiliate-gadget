import { chromium } from '@playwright/test'

const TARGET_HOST = process.env.AUDIT_TARGET || 'https://affiliategadget.tech'

const ROUTES = [
  { name: 'Home (Beranda)', path: '/' },
  { name: 'Katalog Gadget', path: '/gadget' },
  { name: 'Direktori Toko', path: '/toko' },
  { name: 'Layanan Servis', path: '/servis' },
  { name: 'Pusat Garansi', path: '/garansi' },
  { name: 'Pusat Bantuan', path: '/hubungi-kami' },
  { name: 'Keranjang (Guest)', path: '/cart' },
  { name: 'Halaman Login', path: '/login' },
  { name: 'Halaman Register', path: '/register' },
]

async function measurePage(browser, route, authState = null) {
  const ctx = await browser.newContext(
    authState ? { storageState: authState, viewport: { width: 1440, height: 900 } } : { viewport: { width: 1440, height: 900 } }
  )
  const page = await ctx.newPage()

  let ttfb = 0
  let domContentLoaded = 0
  let loadTime = 0
  let status = 0

  page.on('response', (res) => {
    if (res.url() === `${TARGET_HOST}${route.path}` || res.url() === `${TARGET_HOST}${route.path}/`) {
      status = res.status()
      const timing = res.request().timing()
      if (timing) {
        ttfb = Math.round(timing.responseStart - timing.requestStart)
      }
    }
  })

  const start = Date.now()
  try {
    const res = await page.goto(`${TARGET_HOST}${route.path}`, {
      waitUntil: 'load',
      timeout: 45000,
    })
    if (!status && res) status = res.status()
    loadTime = Date.now() - start

    const perfTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0]
      if (nav) {
        return {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          duration: Math.round(nav.duration),
        }
      }
      return null
    })

    if (perfTiming) {
      if (perfTiming.ttfb > 0) ttfb = perfTiming.ttfb
      domContentLoaded = perfTiming.domContentLoaded
      if (perfTiming.duration > 0) loadTime = perfTiming.duration
    }
  } catch (err) {
    status = 500
    loadTime = Date.now() - start
  }

  await ctx.close()
  return {
    ...route,
    status,
    ttfb,
    domContentLoaded,
    loadTime,
  }
}

async function run() {
  console.log(`\n🔍 Memulai benchmark performa live: ${TARGET_HOST}\n`)
  const browser = await chromium.launch()

  // 1. Audit Public Pages
  console.log('--- 1. Halaman Publik ---')
  const publicResults = []
  for (const r of ROUTES) {
    const res = await measurePage(browser, r)
    const flag = res.loadTime > 2500 ? '⚠️ LAMBAT' : res.loadTime > 1500 ? '🟡 SEDANG' : '🟢 CEPAT'
    console.log(`[${res.status}] ${r.name.padEnd(25)} | TTFB: ${String(res.ttfb).padStart(4)}ms | DCL: ${String(res.domContentLoaded).padStart(4)}ms | Total: ${String(res.loadTime).padStart(5)}ms | ${flag}`)
    publicResults.push(res)
  }

  // 2. Login as Store Admin & Audit Admin Pages
  console.log('\n--- 2. Halaman Admin (Store Admin) ---')
  const adminAuthFile = 'ux-audit-out/live-admin-auth.json'
  const loginCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const loginPage = await loginCtx.newPage()

  await loginPage.route('**/api/auth/login-2fa', async (route) => {
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

  await loginPage.goto(`${TARGET_HOST}/login`, { waitUntil: 'load' })
  await loginPage.fill('input[type="email"]', 'admin.roxy@affiliategadget.com')
  await loginPage.fill('input[type="password"]', 'admin123')
  await loginPage.click('button[type="submit"]')
  await loginPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 })
  await loginCtx.storageState({ path: adminAuthFile })
  await loginCtx.close()

  const ADMIN_ROUTES = [
    { name: 'Admin Dashboard', path: '/dashboard/admin' },
    { name: 'Admin Orders', path: '/dashboard/admin/orders' },
    { name: 'Admin Products', path: '/dashboard/admin/products' },
    { name: 'Admin Add Product', path: '/dashboard/admin/products/new' },
    { name: 'Admin Finance', path: '/dashboard/admin/finance' },
    { name: 'Admin Settings', path: '/dashboard/admin/settings' },
    { name: 'Admin Returns', path: '/dashboard/admin/returns' },
    { name: 'Admin Chat', path: '/dashboard/admin/chat' },
  ]

  const adminResults = []
  for (const r of ADMIN_ROUTES) {
    const res = await measurePage(browser, r, adminAuthFile)
    const flag = res.loadTime > 2500 ? '⚠️ LAMBAT' : res.loadTime > 1500 ? '🟡 SEDANG' : '🟢 CEPAT'
    console.log(`[${res.status}] ${r.name.padEnd(25)} | TTFB: ${String(res.ttfb).padStart(4)}ms | DCL: ${String(res.domContentLoaded).padStart(4)}ms | Total: ${String(res.loadTime).padStart(5)}ms | ${flag}`)
    adminResults.push(res)
  }

  await browser.close()

  console.log('\n================== KESIMPULAN AUDIT KECEPATAN ==================')
  const allSlow = [...publicResults, ...adminResults].filter((x) => x.loadTime > 2000)
  if (allSlow.length === 0) {
    console.log('✅ Semua halaman berjalan sangat cepat (< 2.0s)!')
  } else {
    console.log(`Ditemukan ${allSlow.length} halaman yang butuh perhatian/optimasi:`)
    allSlow.forEach((s) => console.log(`- ${s.name} (${s.path}): ${s.loadTime}ms (TTFB: ${s.ttfb}ms)`))
  }
}

run()
