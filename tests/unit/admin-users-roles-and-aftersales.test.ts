import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Users Roles & After Sales Integration', () => {
  it('includes AFTER_SALES in EditUserModal role options and auto-populates user role', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/admin/edit-user-modal.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf8')

    expect(content).toContain("value: 'AFTER_SALES'")
    expect(content).toContain('Admin After Sales (Purna Jual)')
    expect(content).toContain('role: user?.role ||')
    expect(content).toContain('setFormData({')
  })

  it('includes AFTER_SALES in CreateUserModal role options', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/admin/create-user-modal.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf8')

    expect(content).toContain("value: 'AFTER_SALES'")
    expect(content).toContain('Admin After Sales (Purna Jual)')
  })

  it('adds After Sales filter tab and badge in Users Page (/dashboard/admin/users)', () => {
    const filePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/users/page.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf8')

    expect(content).toContain("id: 'AFTER_SALES', label: 'After Sales'")
    expect(content).toContain("user.role === 'AFTER_SALES'")
    expect(content).toContain('After Sales')
  })
})
