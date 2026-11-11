import { chromium, devices } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const OUT = path.resolve('ux-audit-out')
fs.mkdirSync(OUT, { recursive: true })

const PAGES = [
  '/',
  '/gadget',
  '/toko',
  '/garansi',
  '/hubungi-kami',
  '/servis-lcd',
  '/cart',
  '/login',
  '/register',
]

const VIEWPORTS = [
  { name: 'mobile', ...devices['iPhone 13'] },
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
]

async function auditPage(page, vpName, url) {
  const findings = []
  const t0 = Date.now()
  const consoleErrors = []
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 200)))
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message.slice(0, 200)))

  let status = 0
  try {
    const res = await page.goto(BASE + url, { waitUntil: 'load', timeout: 60000 })
    status = res?.status() ?? 0
  } catch (e) {
    findings.push({ sev: 'HIGH', msg: `Gagal load: ${e.message.slice(0, 100)}` })
    return { url, vpName, status, findings, loadMs: Date.now() - t0 }
  }
  await page.waitForTimeout(1500)
  const loadMs = Date.now() - t0
  if (status >= 400) findings.push({ sev: 'HIGH', msg: `HTTP ${status}` })
  if (loadMs > 4000) findings.push({ sev: 'MED', msg: `Load lambat: ${loadMs}ms` })

  const vp = page.viewportSize()
  const data = await page.evaluate(({ vw, vh }) => {
    const out = { overflowX: false, small: [], offscreen: [], hiddenCta: [], noLabel: [], lowContrast: [], tinyText: 0, coveredCta: [], docH: 0 }
    out.overflowX = document.documentElement.scrollWidth > vw + 2
    out.docH = document.documentElement.scrollHeight
    const lum = (c) => {
      const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number)
    const bgOf = (el) => {
      while (el) {
        const c = parse(getComputedStyle(el).backgroundColor)
        if (c.length >= 3 && (c[3] === undefined || c[3] > 0.5)) return c
        el = el.parentElement
      }
      return [255, 255, 255]
    }
    const sel = 'button, a[href], [role=button], input, select, textarea'
    const els = [...document.querySelectorAll(sel)]
    const desc = (el) => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' "' + (el.innerText || el.getAttribute('aria-label') || el.placeholder || el.getAttribute('href') || '').trim().slice(0, 40) + '"')
    for (const el of els) {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const isMob = vw < 768
      if ((r.width < 40 || r.height < 40) && isMob && el.tagName !== 'A' || (isMob && (r.height < 32 && r.width < 32)))
        out.small.push(desc(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`)
      if (r.right > vw + 2 || r.left < -2) out.offscreen.push(desc(el))
      const accName = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.placeholder || el.querySelector('img[alt]')?.alt || '').trim()
      if (!accName && el.tagName !== 'INPUT') out.noLabel.push(desc(el))
      // covered by another element at its center
      if (r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw) {
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        if (top && top !== el && !el.contains(top) && !top.contains(el)) out.coveredCta.push(desc(el) + ' ditutup oleh ' + top.tagName.toLowerCase() + '.' + String(top.className).slice(0, 40))
      }
      // contrast for text elements
      const txt = (el.innerText || '').trim()
      if (txt) {
        const fg = parse(cs.color)
        const bg = bgOf(el)
        const L1 = lum(fg), L2 = lum(bg)
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
        if (ratio < 3) out.lowContrast.push(desc(el) + ` ratio ${ratio.toFixed(1)}`)
      }
    }
    // primary CTA visibility above fold
    const ctaRe = /beli|checkout|bayar|keranjang|masuk|daftar|cari|kirim|simpan|lihat/i
    const ctas = els.filter((e) => ctaRe.test(e.innerText || '') && getComputedStyle(e).display !== 'none')
    const aboveFold = ctas.some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.top < vh })
    if (ctas.length && !aboveFold) out.hiddenCta.push('Tidak ada CTA di fold pertama (' + ctas.length + ' CTA total)')
    // tiny text
    out.tinyText = [...document.querySelectorAll('p,span,a,button,li,label')].filter((e) => {
      const fs = parseFloat(getComputedStyle(e).fontSize); return fs < 11 && (e.innerText || '').trim().length > 3 && e.getBoundingClientRect().width > 0
    }).length
    // images w/o alt, broken
    out.brokenImg = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(0, 80))
    out.noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).length
    out.h1 = document.querySelectorAll('h1').length
    return out
  }, { vw: vp.width, vh: vp.height })

  if (data.overflowX) findings.push({ sev: 'HIGH', msg: 'Horizontal scroll (konten melebihi lebar layar)' })
  data.offscreen.slice(0, 5).forEach((m) => findings.push({ sev: 'HIGH', msg: 'Elemen keluar layar: ' + m }))
  data.coveredCta.slice(0, 5).forEach((m) => findings.push({ sev: 'HIGH', msg: 'Elemen tertutup: ' + m }))
  data.hiddenCta.forEach((m) => findings.push({ sev: 'MED', msg: m }))
  data.small.slice(0, 6).forEach((m) => findings.push({ sev: 'MED', msg: 'Tap target kecil: ' + m }))
  data.noLabel.slice(0, 5).forEach((m) => findings.push({ sev: 'MED', msg: 'Tanpa label aksesibel: ' + m }))
  data.lowContrast.slice(0, 5).forEach((m) => findings.push({ sev: 'LOW', msg: 'Kontras rendah: ' + m }))
  if (data.tinyText > 0) findings.push({ sev: 'LOW', msg: `${data.tinyText} teks <11px` })
  data.brokenImg.slice(0, 5).forEach((m) => findings.push({ sev: 'HIGH', msg: 'Gambar rusak: ' + m }))
  if (data.h1 !== 1) findings.push({ sev: 'LOW', msg: `Jumlah H1 = ${data.h1}` })
  consoleErrors.slice(0, 4).forEach((m) => findings.push({ sev: 'MED', msg: 'Console error: ' + m }))

  // scroll depth: tombol sticky / pagelength
  if (data.docH > 8 * vp.height) findings.push({ sev: 'LOW', msg: `Halaman sangat panjang (${Math.round(data.docH / vp.height)}x tinggi layar)` })

  // interaction latency: click first visible button/link-like and measure
  const shot = path.join(OUT, `${vpName}${url === '/' ? '-home' : url.replace(/\//g, '-')}.png`)
  await page.screenshot({ path: shot, fullPage: false })
  return { url, vpName, status, findings, loadMs, shot }
}

async function flowCheckout(browser) {
  const res = []
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext(vp.name === 'mobile' ? { ...devices['iPhone 13'] } : { viewport: vp.viewport })
    const page = await ctx.newPage()
    const f = []
    const steps = []
    const step = async (name, fn) => {
      const t = Date.now()
      try { await fn(); steps.push({ name, ms: Date.now() - t, ok: true }) }
      catch (e) { steps.push({ name, ms: Date.now() - t, ok: false, err: e.message.split('\n')[0].slice(0, 120) }); throw e }
    }
    try {
      await step('Buka katalog', () => page.goto(BASE + '/gadget', { waitUntil: 'load', timeout: 60000 }))
      await page.waitForTimeout(1500)
      await step('Klik produk pertama', async () => {
        const link = page.locator('a[href^="/gadget/"]').first()
        await link.waitFor({ state: 'visible', timeout: 8000 })
        await link.scrollIntoViewIfNeeded()
        await link.click({ timeout: 8000 })
        await page.waitForURL(/\/gadget\/.+/, { timeout: 30000 })
      })
      await page.waitForTimeout(1500)
      await step('Tombol Keranjang/Beli terlihat', async () => {
        const btn = page.getByRole('button', { name: /keranjang|beli sekarang/i }).first()
        await btn.waitFor({ state: 'visible', timeout: 8000 })
        const box = await btn.boundingBox()
        const vh = page.viewportSize().height
        if (box && box.y > vh) f.push({ sev: 'MED', msg: `Tombol beli/keranjang di luar fold (y=${Math.round(box.y)} > ${vh}) — harus scroll` })
      })
      await step('Klik Tambah Keranjang', async () => {
        const btn = page.getByRole('button', { name: /keranjang/i }).first()
        await btn.scrollIntoViewIfNeeded()
        await btn.click({ timeout: 8000 })
        await page.waitForTimeout(1200)
      })
      await step('Buka /cart', async () => {
        await page.goto(BASE + '/cart', { waitUntil: 'load', timeout: 60000 })
        await page.waitForTimeout(1500)
      })
      await step('Tombol Checkout terjangkau', async () => {
        const btn = page.getByRole('button', { name: /checkout|bayar/i }).or(page.getByRole('link', { name: /checkout|bayar/i })).first()
        await btn.waitFor({ state: 'visible', timeout: 8000 })
        const covered = await btn.evaluate((el) => {
          const r = el.getBoundingClientRect()
          const t = document.elementFromPoint(r.left + r.width / 2, Math.min(r.top + r.height / 2, innerHeight - 2))
          return t && t !== el && !el.contains(t)
        })
        if (covered) f.push({ sev: 'HIGH', msg: 'Tombol checkout tertutup elemen lain' })
      })
    } catch (e) {
      f.push({ sev: 'HIGH', msg: 'Flow macet: ' + e.message.split('\n')[0].slice(0, 120) })
    }
    steps.filter((s) => s.ms > 3000).forEach((s) => f.push({ sev: 'MED', msg: `Langkah lambat "${s.name}": ${s.ms}ms` }))
    await page.screenshot({ path: path.join(OUT, `flow-${vp.name}-end.png`) })
    res.push({ vp: vp.name, steps, findings: f })
    await ctx.close()
  }
  return res
}

const browser = await chromium.launch()
const report = { pages: [], flows: [] }
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext(vp.name === 'mobile' ? { ...devices['iPhone 13'] } : { viewport: vp.viewport })
  for (const url of PAGES) {
    const page = await ctx.newPage()
    try { report.pages.push(await auditPage(page, vp.name, url)) } catch (e) { report.pages.push({ url, vpName: vp.name, findings: [{ sev: 'HIGH', msg: 'Audit error ' + e.message.slice(0, 100) }] }) }
    await page.close()
  }
  await ctx.close()
}
report.flows = await flowCheckout(browser)
await browser.close()

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))

let md = '# UX Audit Report\n\n'
for (const p of report.pages) {
  md += `## [${p.vpName}] ${p.url} — ${p.status} (${p.loadMs}ms)\n`
  if (!p.findings.length) md += '- OK\n'
  p.findings.forEach((f) => (md += `- **${f.sev}** ${f.msg}\n`))
  md += '\n'
}
md += '# Flow: katalog -> detail -> keranjang -> checkout\n'
for (const f of report.flows) {
  md += `## ${f.vp}\n`
  f.steps.forEach((s) => (md += `- ${s.ok ? 'OK' : 'FAIL'} ${s.name} (${s.ms}ms)${s.err ? ' — ' + s.err : ''}\n`))
  f.findings.forEach((x) => (md += `- **${x.sev}** ${x.msg}\n`))
}
fs.writeFileSync(path.join(OUT, 'report.md'), md)
console.log(md)
