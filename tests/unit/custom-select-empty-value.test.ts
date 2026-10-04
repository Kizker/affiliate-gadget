import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('CustomSelect & Radix UI Empty Value Safeguard', () => {
  const customSelectPath = path.resolve(
    process.cwd(),
    'src/components/ui/custom-select.tsx'
  )
  const mitrasToolbarPath = path.resolve(
    process.cwd(),
    'src/components/admin/mitras/mitra-toolbar.tsx'
  )
  const mitrasPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/mitras/page.tsx'
  )

  const customSelectContent = fs.readFileSync(customSelectPath, 'utf8')
  const mitrasToolbarContent = fs.existsSync(mitrasToolbarPath)
    ? fs.readFileSync(mitrasToolbarPath, 'utf8')
    : ''
  const mitrasPageContent =
    fs.readFileSync(mitrasPagePath, 'utf8') + '\n' + mitrasToolbarContent

  it('1. should define EMPTY_VALUE_SENTINEL to prevent Radix UI empty string value exception', () => {
    expect(customSelectContent).toContain('EMPTY_VALUE_SENTINEL')
    expect(customSelectContent).toContain('__RADIX_EMPTY_VALUE__')
  })

  it('2. should map empty string opt.value to sentinel in renderOptionItem', () => {
    expect(customSelectContent).toMatch(
      /opt\.value\s*===\s*''\s*\?\s*EMPTY_VALUE_SENTINEL\s*:\s*opt\.value/
    )
  })

  it('3. should map sentinel back to empty string in handleValueChange callback', () => {
    expect(customSelectContent).toMatch(
      /onChange\(\s*newVal\s*===\s*EMPTY_VALUE_SENTINEL\s*\?\s*''\s*:\s*newVal\s*\)/
    )
  })

  it('4. should correctly bind internalValue to sentinel when value is empty string and hasEmptyValueOption is true', () => {
    expect(customSelectContent).toContain('hasEmptyValueOption')
    expect(customSelectContent).toContain('internalValue')
  })

  it('5. should safely support "Semua Kota" option with value "" in MitrasPage without throwing', () => {
    expect(mitrasPageContent).toContain('<CustomSelect')
    expect(mitrasPageContent).toContain('value={cityFilter}')
    expect(mitrasPageContent).toContain("{ value: '', label: 'Semua Kota' }")
  })
})
