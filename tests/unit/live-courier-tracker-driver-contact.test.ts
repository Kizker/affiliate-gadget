import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Courier Tracker Driver Contact Actions', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/components/shipping/live-courier-tracker.tsx'
  )
  const fileContent = fs.readFileSync(filePath, 'utf-8')

  it('does not contain Telepon button or tel: link for driver', () => {
    expect(fileContent).not.toContain('<span>Telepon</span>')
    expect(fileContent).not.toContain('tel:${data.driver.phone}')
    expect(fileContent).not.toContain('href={`tel:')
  })

  it('preserves Chat WhatsApp button and WhatsApp link for driver', () => {
    expect(fileContent).toContain('<span>Chat WhatsApp</span>')
    expect(fileContent).toContain('https://wa.me/')
    expect(fileContent).toContain('data.driver.phone')
  })

  it('does not import Phone icon from lucide-react in live-courier-tracker', () => {
    expect(fileContent).not.toMatch(/Phone,/)
    expect(fileContent).not.toMatch(/<Phone/)
  })
})
