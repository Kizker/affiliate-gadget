import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standardized error codes returned by NextAuth authorize() via thrown Error.
 * Frontend reads these from the `error` query param after failed sign-in.
 */
export const LOGIN_ERROR_CODES = {
  /** Email or password is incorrect (generic — do not differentiate) */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  /** Account is temporarily locked due to repeated failed attempts */
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  /** Too many login attempts from this IP address */
  RATE_LIMIT_IP: 'RATE_LIMIT_IP',
  /** Too many login attempts for this email account */
  RATE_LIMIT_EMAIL: 'RATE_LIMIT_EMAIL',
  /** Account exists but email has not been verified yet */
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  /** Account has been disabled by an administrator */
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
} as const

export type LoginErrorCode =
  (typeof LOGIN_ERROR_CODES)[keyof typeof LOGIN_ERROR_CODES]

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const sanitizedEmail = z
  .string()
  .transform((val) => val.trim().toLowerCase())
  .pipe(z.string().email('Format email tidak valid'))

// ─────────────────────────────────────────────────────────────────────────────
// Login schema
// ─────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .transform((val) => val.trim().toLowerCase())
    .pipe(z.string().email('Email tidak valid')),
  /**
   * At login we only enforce non-empty + max length.
   * Max 128 chars prevents CPU DoS via bcrypt on very long strings.
   * We intentionally do NOT enforce complexity rules here —
   * that would leak password policy info to attackers.
   */
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .max(128, 'Password terlalu panjang'),
})

// ─────────────────────────────────────────────────────────────────────────────
// Register schema
// ─────────────────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nama minimal 2 karakter')
      .max(100, 'Nama maksimal 100 karakter'),
    email: sanitizedEmail,
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .max(128, 'Password maksimal 128 karakter')
      .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
      .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
      .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka')
      .regex(
        /[^A-Za-z0-9]/,
        'Password harus mengandung minimal 1 karakter simbol (@, #, $, dll)'
      ),
    confirmPassword: z.string(),
    phone: z
      .string()
      .trim()
      .regex(
        /^(\+62|62|0)8[1-9][0-9]{6,11}$/,
        'Format nomor HP tidak valid (contoh: 08123456789 atau +628123456789)'
      )
      .optional()
      .or(z.literal('')),
    role: z.enum(['CUSTOMER', 'MITRA']).default('CUSTOMER'),
    honeypotField: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  })

// ─────────────────────────────────────────────────────────────────────────────
// Resend verification schema
// ─────────────────────────────────────────────────────────────────────────────

export const resendVerificationSchema = z.object({
  email: sanitizedEmail,
})

// ─────────────────────────────────────────────────────────────────────────────
// Store Data Application schema
// ─────────────────────────────────────────────────────────────────────────────

export const storeDataSchema = z.object({
  userId: z.string().nullable().optional(),
  storeName: z
    .string()
    .trim()
    .min(3, 'Nama toko minimal 3 karakter')
    .max(100, 'Nama toko maksimal 100 karakter'),
  companyName: z
    .string()
    .trim()
    .min(3, 'Nama PT/badan usaha minimal 3 karakter')
    .max(150, 'Nama PT/badan usaha maksimal 150 karakter'),
  taxId: z.string().trim().nullable().optional().or(z.literal('')),
  address: z
    .string()
    .trim()
    .min(10, 'Alamat fisik toko minimal 10 karakter')
    .max(500, 'Alamat fisik toko maksimal 500 karakter'),
  city: z
    .string()
    .trim()
    .min(2, 'Nama kota minimal 2 karakter')
    .max(100, 'Nama kota maksimal 100 karakter'),
  province: z
    .string()
    .trim()
    .min(2, 'Nama provinsi minimal 2 karakter')
    .max(100, 'Nama provinsi maksimal 100 karakter'),
  postalCode: z.string().trim().nullable().optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .min(8, 'Nomor telepon minimal 8 karakter')
    .max(20, 'Nomor telepon maksimal 20 karakter'),
  bankName: z.string().trim().nullable().optional().or(z.literal('')),
  accountNumber: z.string().trim().nullable().optional().or(z.literal('')),
  accountName: z.string().trim().nullable().optional().or(z.literal('')),
})

// ─────────────────────────────────────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
export type StoreDataInput = z.infer<typeof storeDataSchema>
