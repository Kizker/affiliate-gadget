'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { normalizeToLocalPhone } from '@/lib/utils'

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<RegisterInput>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'CUSTOMER',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    setIsLoading(true)

    try {
      const validatedData = registerSchema.parse(formData)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registrasi gagal')
        return
      }

      // Redirect to login after successful registration
      router.push('/login?registered=true')
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'errors' in err &&
        Array.isArray((err as { errors?: Array<{ message?: string }> }).errors)
      ) {
        const errorObj = err as { errors: Array<{ message?: string }> }
        setError(errorObj.errors[0]?.message || 'Data tidak valid')
      } else {
        setError('Terjadi kesalahan')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Nama Lengkap
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-3 pl-12 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="John Doe"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-3 pl-12 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="nama@email.com"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium">
          Nomor Telepon (Opsional)
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({
                ...formData,
                phone: normalizeToLocalPhone(e.target.value),
              })
            }
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-3 pl-12 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="08123456789"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-3 pl-12 pr-12 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-300"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Min. 8 karakter, huruf besar, kecil, dan angka
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium"
        >
          Konfirmasi Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-3 pl-12 pr-12 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-300"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Daftar Sebagai</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
            className={`rounded-xl px-6 py-3 font-semibold transition-all ${
              formData.role === 'CUSTOMER'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                : 'border border-gray-700 bg-gray-800/50 hover:border-cyan-500'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: 'MITRA' })}
            className={`rounded-xl px-6 py-3 font-semibold transition-all ${
              formData.role === 'MITRA'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                : 'border border-gray-700 bg-gray-800/50 hover:border-cyan-500'
            }`}
          >
            Mitra
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="group flex w-full transform items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : 'Daftar Sekarang'}
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  )
}
