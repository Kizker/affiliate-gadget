'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Store, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registrasi akun gagal.')
      }

      // Auto login after registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Akun berhasil dibuat, silakan masuk.')
        setTimeout(() => router.push('/login'), 1500)
      } else {
        if (formData.role === 'MITRA') {
          router.push('/dashboard/mitra/pending')
        } else {
          router.push('/')
        }
        router.refresh()
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Terjadi kendala saat pendaftaran.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between relative selection:bg-orange-500 selection:text-white">
      
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-blue-100/30 via-slate-100/20 to-transparent blur-3xl dark:from-slate-800/20" />
      </div>

      {/* Top Simple Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none"
          aria-label="Affiliate Gadget Beranda"
        >
          <img
            src="/logo.png"
            alt="Affiliate Gadget Logo"
            className="h-8 w-8 rounded-xl object-contain shadow-2xs transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-base font-black tracking-tight text-slate-950 dark:text-white leading-none">
            Affiliate<span className="text-orange-500">Gadget</span>
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors dark:text-slate-400 dark:hover:text-white"
        >
          ← Kembali ke Beranda
        </Link>
      </header>

      {/* Main Form Center */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-[500px]">
          
          {/* Card Container */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            
            {/* Header with Logo & Simplified Title */}
            <div className="text-center mb-6 flex flex-col items-center">
              <Link
                href="/"
                className="mb-3 inline-block group focus:outline-none"
                aria-label="Affiliate Gadget Beranda"
              >
                <img
                  src="/logo.png"
                  alt="Affiliate Gadget"
                  className="h-11 w-11 rounded-2xl object-contain shadow-2xs transition-transform duration-200 group-hover:scale-105"
                />
              </Link>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                Daftar
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Buat akun baru untuk mulai bertransaksi
              </p>
            </div>

            {/* Role Selection Dual Cards */}
            <div className="mb-6 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
                Pilih Jenis Akun
              </label>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 ${
                    formData.role === 'CUSTOMER'
                      ? 'border-slate-950 bg-slate-950 text-white shadow-xs dark:border-white dark:bg-white dark:text-slate-950'
                      : 'border-slate-200/80 bg-slate-50/60 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${formData.role === 'CUSTOMER' ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-950' : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-2xs'}`}>
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Customer</p>
                    <p className="text-[10px] opacity-75">Beli Smartphone</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'MITRA' })}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 ${
                    formData.role === 'MITRA'
                      ? 'border-slate-950 bg-slate-950 text-white shadow-xs dark:border-white dark:bg-white dark:text-slate-950'
                      : 'border-slate-200/80 bg-slate-50/60 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${formData.role === 'MITRA' ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-950' : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-2xs'}`}>
                    <Store className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Mitra Toko</p>
                    <p className="text-[10px] opacity-75">Daftar Akun Toko</p>
                  </div>
                </button>
              </div>

              {formData.role === 'MITRA' && (
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400 animate-in fade-in duration-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Verifikasi pendaftaran toko diproses setelah registrasi</span>
                </div>
              )}
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="mb-5 rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300 animate-in fade-in duration-150">
                {error}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Name Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Nama Lengkap
                </label>
                <div className="relative flex items-center">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Contoh: Budi Santoso"
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Alamat Email
                </label>
                <div className="relative flex items-center">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="nama@email.com"
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Kata Sandi
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-11 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative flex items-center">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="Ulangi kata sandi"
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-11 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 active:scale-98 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mendaftarkan Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftar Akun Sekarang</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="my-5 relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
              <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400 dark:bg-slate-900">
                atau
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 rounded-full border border-slate-200/80 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Daftar dengan Google</span>
            </button>

            {/* Login Link */}
            <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
              Sudah memiliki akun?{' '}
              <Link
                href="/login"
                className="font-bold text-slate-950 hover:underline dark:text-white"
              >
                Masuk di sini
              </Link>
            </p>

          </div>

          {/* Trust Security Footer Tag */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Koneksi Akun Aman & Terlindungi 100%</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-[11px] text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50">
        © {new Date().getFullYear()} Affiliate Gadget. All rights reserved. Jaringan Toko Smartphone Resmi & Terpercaya.
      </footer>

    </div>
  )
}
