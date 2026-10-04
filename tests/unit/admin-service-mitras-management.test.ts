import { describe, it, expect } from 'vitest'

describe('Admin Service Mitras Management (Role MITRA)', () => {
  // Input Validation Logic (mirrors /api/admin/mitras/services POST)
  function validateCreateMitraInput(payload: {
    username?: unknown
    email?: unknown
    password?: unknown
  }): { valid: boolean; error?: string } {
    const { username, email, password } = payload

    if (
      !username ||
      typeof username !== 'string' ||
      username.trim().length < 2
    ) {
      return {
        valid: false,
        error: 'Username atau nama mitra wajib diisi minimal 2 karakter.',
      }
    }

    if (
      !email ||
      typeof email !== 'string' ||
      !email.includes('@') ||
      !email.includes('.')
    ) {
      return {
        valid: false,
        error: 'Format email tidak valid.',
      }
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return {
        valid: false,
        error: 'Password wajib diisi minimal 6 karakter.',
      }
    }

    return { valid: true }
  }

  // Model creation simulator (mirrors prisma transaction for role MITRA)
  function buildMitraCreationData(payload: {
    username: string
    email: string
    hashedPassword: string
  }) {
    const cleanUsername = payload.username.trim()
    const normalizedEmail = payload.email.trim().toLowerCase()

    return {
      user: {
        name: cleanUsername,
        email: normalizedEmail,
        password: payload.hashedPassword,
        role: 'MITRA',
        mitraStatus: 'APPROVED',
        isActive: true,
      },
      mitra: {
        businessName: cleanUsername,
        address: 'Alamat workshop belum diatur',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        phone: '-',
        rating: 5.0,
        totalReview: 0,
        isApproved: true,
        isActive: true,
      },
    }
  }

  // Filter simulator for service mitras
  function filterServiceMitras(
    mitras: Array<{
      username: string
      email: string
      isActive: boolean
      city?: string
    }>,
    query: string,
    statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'
  ) {
    return mitras.filter((m) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !m.isActive) return false
      if (statusFilter === 'INACTIVE' && m.isActive) return false

      // Search filter
      if (!query.trim()) return true
      const q = query.toLowerCase().trim()
      return (
        m.username.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.city && m.city.toLowerCase().includes(q))
      )
    })
  }

  it('should accept valid username, email, and password (>= 6 chars)', () => {
    const valid = validateCreateMitraInput({
      username: 'iFixit Bandung',
      email: 'ifixit.bdg@affiliategadget.com',
      password: 'password123',
    })
    expect(valid.valid).toBe(true)
    expect(valid.error).toBeUndefined()
  })

  it('should reject missing or too short username (< 2 chars)', () => {
    const invalid1 = validateCreateMitraInput({
      username: '',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(invalid1.valid).toBe(false)
    expect(invalid1.error).toContain('Username atau nama mitra wajib diisi')

    const invalid2 = validateCreateMitraInput({
      username: 'A',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(invalid2.valid).toBe(false)
    expect(invalid2.error).toContain('minimal 2 karakter')
  })

  it('should reject invalid email format', () => {
    const invalidEmail = validateCreateMitraInput({
      username: 'Mitra Servis',
      email: 'mitra-bukan-email',
      password: 'password123',
    })
    expect(invalidEmail.valid).toBe(false)
    expect(invalidEmail.error).toBe('Format email tidak valid.')
  })

  it('should reject password with less than 6 characters', () => {
    const shortPass = validateCreateMitraInput({
      username: 'Mitra Servis',
      email: 'mitra@example.com',
      password: '12345',
    })
    expect(shortPass.valid).toBe(false)
    expect(shortPass.error).toContain('minimal 6 karakter')
  })

  it('should structure user with role MITRA and default approved Mitra profile', () => {
    const created = buildMitraCreationData({
      username: '  Budi LCD Specialist  ',
      email: '  BUDI.LCD@GMAIL.COM  ',
      hashedPassword: '$2a$12$hashedPasswordExample',
    })

    expect(created.user.name).toBe('Budi LCD Specialist')
    expect(created.user.email).toBe('budi.lcd@gmail.com')
    expect(created.user.role).toBe('MITRA')
    expect(created.user.mitraStatus).toBe('APPROVED')
    expect(created.user.isActive).toBe(true)

    expect(created.mitra.businessName).toBe('Budi LCD Specialist')
    expect(created.mitra.isApproved).toBe(true)
    expect(created.mitra.isActive).toBe(true)
    expect(created.mitra.rating).toBe(5.0)
  })

  it('should correctly filter service mitras by status and search keyword', () => {
    const dummyMitras = [
      {
        username: 'Teknisi Kilat Roxy',
        email: 'roxy.servis@gmail.com',
        isActive: true,
        city: 'Jakarta Barat',
      },
      {
        username: 'Jogja Phone Repair',
        email: 'jogja.fix@gmail.com',
        isActive: true,
        city: 'Yogyakarta',
      },
      {
        username: 'Surabaya LCD Master',
        email: 'sby.master@gmail.com',
        isActive: false,
        city: 'Surabaya',
      },
    ]

    // Status filter ACTIVE
    const activeOnly = filterServiceMitras(dummyMitras, '', 'ACTIVE')
    expect(activeOnly).toHaveLength(2)

    // Status filter INACTIVE
    const inactiveOnly = filterServiceMitras(dummyMitras, '', 'INACTIVE')
    expect(inactiveOnly).toHaveLength(1)
    expect(inactiveOnly[0].username).toBe('Surabaya LCD Master')

    // Search by city
    const searchCity = filterServiceMitras(dummyMitras, 'Jakarta', 'ALL')
    expect(searchCity).toHaveLength(1)
    expect(searchCity[0].username).toBe('Teknisi Kilat Roxy')

    // Search by username
    const searchName = filterServiceMitras(dummyMitras, 'Repair', 'ALL')
    expect(searchName).toHaveLength(1)
    expect(searchName[0].email).toBe('jogja.fix@gmail.com')
  })
})
