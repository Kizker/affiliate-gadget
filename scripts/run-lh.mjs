import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import fs from 'fs'

async function run() {
  const url = process.argv[2] || 'http://localhost:3000/servis'
  const isMobile = process.argv[3] === 'mobile'

  console.log(`Starting Lighthouse audit for ${url} (${isMobile ? 'Mobile' : 'Desktop'})...`)

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
  })

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    formFactor: isMobile ? 'mobile' : 'desktop',
    screenEmulation: isMobile
      ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 2.625, disabled: false }
      : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttlingMethod: 'provided' // atau simulate
  }

  const runnerResult = await lighthouse(url, options)
  const reportJson = runnerResult.lhr

  const scores = {
    url,
    mode: isMobile ? 'Mobile' : 'Desktop',
    performance: Math.round((reportJson.categories.performance?.score || 0) * 100),
    accessibility: Math.round((reportJson.categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((reportJson.categories['best-practices']?.score || 0) * 100),
    seo: Math.round((reportJson.categories.seo?.score || 0) * 100)
  }

  console.log('\n================ LIGHTHOUSE SCORES ================')
  console.log(`URL:            ${scores.url}`)
  console.log(`Device:         ${scores.mode}`)
  console.log(`Performance:    ${scores.performance}`)
  console.log(`Accessibility:  ${scores.accessibility}`)
  console.log(`Best Practices: ${scores.bestPractices}`)
  console.log(`SEO:            ${scores.seo}`)
  console.log('===================================================\n')

  await chrome.kill()
}

run().catch(err => {
  console.error('Lighthouse error:', err)
  process.exit(1)
})
