import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mobile Order Detail Unified & Neutral Palette Suite', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
  )
  const fileContent = fs.readFileSync(filePath, 'utf-8')

  it('contains unified single card container for mobile mode with divide-y dividers', () => {
    // Verifikasi keberadaan kontainer mobile 1 bagian saja
    expect(fileContent).toContain('block md:hidden')
    expect(fileContent).toContain('Mobile Unified Layout: 1 Bagian Saja')
    expect(fileContent).toContain(
      'overflow-hidden rounded-2xl border border-slate-200/90'
    )
    expect(fileContent).toContain(
      'divide-y divide-slate-100 dark:divide-slate-800'
    )
  })

  it('separates desktop layout cleanly via hidden md:block', () => {
    // Verifikasi layout desktop dibungkus khusus agar tidak tercampur di mobile
    expect(fileContent).toContain('Desktop Bento Layout (Hidden on Mobile)')
    expect(fileContent).toContain('<div className="hidden md:block">')
  })

  it('uses neutral slate palette for statusConfig instead of loud saturated colors', () => {
    // Pastikan statusConfig tidak menggunakan warna-warna mencolok
    expect(fileContent).not.toContain('bg-blue-50/90 text-blue-700')
    expect(fileContent).not.toContain('bg-amber-50/90 text-amber-700')
    expect(fileContent).not.toContain('bg-indigo-50/90 text-indigo-700')
    expect(fileContent).not.toContain('bg-orange-50/90 text-orange-700')
    expect(fileContent).not.toContain('bg-emerald-50/90 text-emerald-700')
    expect(fileContent).not.toContain('bg-purple-50/90 text-purple-700')

    // Harus menggunakan warna slate netral
    expect(fileContent).toContain(
      'bg-slate-100 text-slate-800 border-slate-200'
    )
  })

  it('neutralizes bonus package box from loud emerald green to calm slate styling', () => {
    // Pastikan kotak paket bonus 3-in-1 tidak bernuansa hijau menyala
    expect(fileContent).not.toContain('border-emerald-100/90 bg-emerald-50/40')
    expect(fileContent).toContain('border-slate-200/80 bg-slate-50/80')
  })

  it('neutralizes gadget brand styling from bold orange to clean neutral slate', () => {
    // Pastikan tag merek gadget tidak menggunakan teks oranye mencolok
    expect(fileContent).not.toContain('text-orange-600 dark:text-orange-400')
    expect(fileContent).toContain(
      'text-[10px] font-semibold uppercase tracking-wider text-slate-500'
    )
  })

  it('renders gadget images with object-cover so they fit container cleanly without letterbox gaps', () => {
    // Pastikan gambar gadget mobile dan desktop menggunakan object-cover agar fit
    expect(fileContent).toContain('className="h-full w-full object-cover"')
    expect(fileContent).not.toContain(
      'className="h-full w-full object-contain"'
    )
  })

  it('implements mobile courier tracking section as a collapsible dropdown accordion', () => {
    // Verifikasi fitur dropdown pelacakan kurir mobile
    expect(fileContent).toContain('isTrackingDropdownOpen')
    expect(fileContent).toContain('setIsTrackingDropdownOpen')
    expect(fileContent).toContain('ChevronDown')
    expect(fileContent).toContain('aria-expanded={isTrackingDropdownOpen}')
  })
})
