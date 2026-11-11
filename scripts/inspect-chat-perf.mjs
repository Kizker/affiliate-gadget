import { chromium } from '@playwright/test'

const TARGET_HOST = 'https://affiliategadget.tech'

async function inspectChat() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ storageState: 'ux-audit-out/live-admin-auth.json', viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  const requests = []
  page.on('request', (req) => {
    requests.push({ url: req.url(), method: req.method(), time: Date.now() })
  })

  const responses = []
  page.on('response', (res) => {
    responses.push({ url: res.url(), status: res.status(), time: Date.now() })
  })

  console.log('Navigating to Admin Chat...')
  const t0 = Date.now()
  await page.goto(`${TARGET_HOST}/dashboard/admin/chat`, { waitUntil: 'load', timeout: 30000 })
  const loadMs = Date.now() - t0
  await page.waitForTimeout(2000)

  console.log(`Page Load Time: ${loadMs}ms`)
  console.log('\nTop network requests taking time or called during load:')
  const apiCalls = responses.filter(r => r.url.includes('/api/'))
  for (const a of apiCalls) {
    console.log(`- [${a.status}] ${a.url}`)
  }

  await browser.close()
}

inspectChat()
