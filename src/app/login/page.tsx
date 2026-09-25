'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  ArrowLeft,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectParam =
    searchParams.get('redirect') || searchParams.get('callbackUrl')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // 2FA Verification States (Email-First Flow with WA/SMS fallback)
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [otp, setOtp] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [activeChannel, setActiveChannel] = useState<
    'EMAIL' | 'WHATSAPP' | 'SMS'
  >('EMAIL')
  const [activeIdentifier, setActiveIdentifier] = useState('')
  const [showAltOptions, setShowAltOptions] = useState(false)
  const [otpData, setOtpData] = useState<{
    email?: string
    maskedEmail?: string
    hasPhone?: boolean
    phone?: string
    maskedPhone?: string
    whatsappUrl?: string
    otpPreview?: string
  } | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Expiry countdown timer for OTP
  useEffect(() => {
    if (otpCountdown <= 0) return
    const timer = setInterval(() => {
      setOtpCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [otpCountdown])

  const executeSignIn = async () => {
    setIsLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email atau kata sandi tidak cocok. Silakan periksa kembali.')
      setIsLoading(false)
      setIsVerifyingOtp(false)
      return
    }

    // Wait for session to be established
    await new Promise((resolve) => setTimeout(resolve, 600))

    let redirectUrl =
      redirectParam && redirectParam.startsWith('/') ? redirectParam : '/'
    let retries = 3

    while (retries > 0) {
      try {
        const userRes = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'include',
        })

        if (userRes.ok) {
          const userData = await userRes.json()
          const adminStaffRoles = [
            'SUPER_ADMIN',
            'ADMIN',
            'STORE_ADMIN',
            'STORE_SALES',
            'FINANCE_ADMIN',
            'CONTENT_EDITOR',
          ]

          if (adminStaffRoles.includes(userData.role)) {
            redirectUrl = '/dashboard/admin'
          } else if (userData.role === 'TECHNICIAN' || userData.isTechnician) {
            redirectUrl = '/dashboard/teknisi'
          } else if (userData.role === 'MITRA') {
            redirectUrl =
              userData.mitraStatus === 'PENDING'
                ? '/dashboard/mitra/pending'
                : '/dashboard/mitra'
          } else if (redirectParam && redirectParam.startsWith('/')) {
            redirectUrl = redirectParam
          } else {
            redirectUrl = '/'
          }
          break
        } else if (userRes.status === 401) {
          await new Promise((resolve) => setTimeout(resolve, 300))
          retries--
        } else {
          break
        }
      } catch {
        retries--
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }

    window.location.replace(redirectUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 1. Check credentials & 2FA requirement via /api/auth/login-2fa
      const checkRes = await fetch('/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          email: formData.email,
          password: formData.password,
        }),
      })

      const checkData = await checkRes.json()

      if (!checkRes.ok) {
        setError(
          checkData.error ||
            'Email atau kata sandi tidak cocok. Silakan periksa kembali.'
        )
        setIsLoading(false)
        return
      }

      // If user has 2FA enabled:
      if (checkData.requires2FA) {
        setIsLoading(false)
        setOtpData({
          email: checkData.email,
          maskedEmail: checkData.maskedEmail,
          hasPhone: checkData.hasPhone,
          phone: checkData.phone,
          maskedPhone: checkData.maskedPhone,
          whatsappUrl: checkData.whatsappUrl,
          otpPreview: checkData.otpPreview,
        })
        setActiveChannel('EMAIL')
        setActiveIdentifier(formData.email.trim().toLowerCase())
        setShowAltOptions(false)
        setOtpCountdown(checkData.expiresInSeconds || 300)
        setOtp('')
        setStep('2fa')
        return
      }

      // If 2FA not required: proceed with regular signIn
      await executeSignIn()
    } catch (err) {
      console.error('Login error:', err)
      setError('Terjadi kendala koneksi. Silakan coba lagi.')
      setIsLoading(false)
    }
  }

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.trim().length < 6) {
      setError('Masukkan 6 digit kode OTP verifikasi')
      return
    }

    setIsVerifyingOtp(true)
    setError('')

    try {
      const verifyRes = await fetch('/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: formData.email,
          otp: otp.trim(),
          identifierUsed: activeIdentifier || formData.email,
        }),
      })

      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        setError(
          verifyData.error ||
            'Kode OTP tidak cocok. Periksa kembali pesan masuk Anda.'
        )
        setIsVerifyingOtp(false)
        return
      }

      // OTP is valid! Proceed with sign in
      await executeSignIn()
    } catch (err) {
      console.error('OTP verify error:', err)
      setError('Gagal memverifikasi kode OTP. Silakan coba lagi.')
      setIsVerifyingOtp(false)
    }
  }

  const handleResendEmailOtp = async () => {
    if (otpCountdown > 240) return
    setIsResendingOtp(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend-email',
          email: formData.email,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActiveChannel('EMAIL')
        setActiveIdentifier(formData.email.trim().toLowerCase())
        setOtpCountdown(data.expiresInSeconds || 300)
      } else {
        setError(data.error || 'Gagal mengirim ulang kode OTP ke email.')
      }
    } catch {
      setError('Gagal mengirim ulang kode OTP')
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleAltChannel = async (channel: 'WHATSAPP' | 'SMS') => {
    if (!otpData?.hasPhone || !otpData?.phone) {
      setError('Nomor telepon tidak tersedia pada akun ini.')
      return
    }
    setIsResendingOtp(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: channel === 'WHATSAPP' ? 'resend-wa' : 'resend-sms',
          email: formData.email,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActiveChannel(channel)
        setActiveIdentifier(otpData.phone)
        setShowAltOptions(false)
        setOtpData((prev) => ({
          ...prev,
          maskedPhone: data.maskedPhone || prev?.maskedPhone,
          whatsappUrl: data.whatsappUrl,
          otpPreview: data.otpPreview,
        }))
        setOtpCountdown(data.expiresInSeconds || 300)
      } else {
        setError(data.error || `Gagal mengirim kode OTP via ${channel}`)
      }
    } catch {
      setError(`Gagal mengirim kode OTP via ${channel}`)
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    await signIn('google', {
      callbackUrl: redirectParam || '/api/auth/redirect',
    })
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* Subtle Ambient Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[350px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-orange-100/30 via-slate-100/20 to-transparent blur-3xl dark:from-slate-800/20" />
      </div>

      {/* Top Simple Header Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus:outline-none"
          aria-label="Affiliate Gadget Beranda"
        >
          <img
            src="/logo.png"
            alt="Affiliate Gadget Logo"
            className="shadow-2xs h-8 w-8 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-base font-black leading-none tracking-tight text-slate-950 dark:text-white">
            Affiliate<span className="text-orange-500">Gadget</span>
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
        >
          ← Kembali ke Beranda
        </Link>
      </header>

      {/* Main Form Center */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-[460px]">
          {/* Card Container */}
          <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
            {step === 'credentials' ? (
              <>
                {/* Header with Logo & Simplified Title */}
                <div className="mb-6 flex flex-col items-center text-center">
                  <Link
                    href="/"
                    className="group mb-3 inline-block focus:outline-none"
                    aria-label="Affiliate Gadget Beranda"
                  >
                    <img
                      src="/logo.png"
                      alt="Affiliate Gadget"
                      className="shadow-2xs h-11 w-11 rounded-2xl object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                  </Link>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Masuk
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Masuk ke akun Anda untuk melanjutkan
                  </p>
                </div>

                {/* Error Notification Banner */}
                {error && (
                  <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 duration-150 animate-in fade-in dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </div>
                )}

                {/* Credentials Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        Kata Sandi
                      </label>
                      <Link
                        href="/hubungi-kami"
                        className="text-[11px] font-semibold text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                      >
                        Bantuan Sandi?
                      </Link>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-11 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none dark:hover:text-slate-200"
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

                  {/* Submit CTA Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="shadow-xs active:scale-98 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 py-3 text-xs font-bold text-white transition-all duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Memverifikasi Akun...</span>
                        </>
                      ) : (
                        <>
                          <span>Masuk ke Akun</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Divider */}
                <div className="relative my-6 flex items-center justify-center">
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
                  className="shadow-2xs flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-slate-200/80 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
                  <span>Lanjutkan dengan Google</span>
                </button>

                {/* Sign Up Redirect */}
                <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Belum memiliki akun?{' '}
                  <Link
                    href={`/register${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
                    className="font-bold text-orange-600 hover:text-orange-700 hover:underline dark:text-orange-400"
                  >
                    Daftar sekarang
                  </Link>
                </p>
              </>
            ) : (
              /* Step 2: 2FA Email (Default) / WhatsApp / SMS OTP Form */
              <div className="duration-200 animate-in fade-in">
                <div className="mb-6 flex flex-col items-center text-center">
                  <div
                    className={`shadow-xs mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border ${
                      activeChannel === 'EMAIL'
                        ? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                        : activeChannel === 'WHATSAPP'
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}
                  >
                    {activeChannel === 'EMAIL' ? (
                      <Mail className="h-6 w-6" />
                    ) : activeChannel === 'WHATSAPP' ? (
                      <MessageSquare className="h-6 w-6" />
                    ) : (
                      <Phone className="h-6 w-6" />
                    )}
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Verifikasi 2 Langkah
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {activeChannel === 'EMAIL' ? (
                      <>
                        Masukkan 6 digit kode OTP yang dikirim ke email:{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {otpData?.maskedEmail || formData.email}
                        </span>
                      </>
                    ) : activeChannel === 'WHATSAPP' ? (
                      <>
                        Masukkan 6 digit kode OTP yang dikirim ke WhatsApp:{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {otpData?.maskedPhone || otpData?.phone}
                        </span>
                      </>
                    ) : (
                      <>
                        Masukkan 6 digit kode OTP yang dikirim via SMS ke:{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {otpData?.maskedPhone || otpData?.phone}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Error Notification Banner */}
                {error && (
                  <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 duration-150 animate-in fade-in dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </div>
                )}

                {/* Direct WhatsApp Message CTA (if WhatsApp channel selected) */}
                {activeChannel === 'WHATSAPP' && otpData?.whatsappUrl && (
                  <a
                    href={otpData.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shadow-xs mb-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Buka Pesan OTP WhatsApp</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>
                )}

                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      KODE VERIFIKASI 6-DIGIT
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="123456"
                      autoFocus
                      className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-3 text-center font-mono text-2xl font-black tracking-[0.35em] text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    {otpData?.otpPreview && (
                      <p className="text-center text-[10px] text-slate-400">
                        Simulasi Kode:{' '}
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {otpData.otpPreview}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Expiry and Resend */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Berlaku:{' '}
                      <strong className="font-mono text-slate-800 dark:text-slate-200">
                        {Math.floor(otpCountdown / 60)}:
                        {(otpCountdown % 60).toString().padStart(2, '0')}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleResendEmailOtp}
                      disabled={isResendingOtp || otpCountdown > 240}
                      className="cursor-pointer font-bold text-orange-600 hover:underline disabled:opacity-40 disabled:hover:no-underline"
                    >
                      {isResendingOtp ? 'Mengirim...' : 'Kirim Ulang Email'}
                    </button>
                  </div>

                  {/* Fallback to WA / SMS ("Cara Lainnya" jika akun memiliki nomor telepon) */}
                  {otpData?.hasPhone && (
                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAltOptions(!showAltOptions)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
                      >
                        <span>Pilihan pengiriman lain</span>
                        {showAltOptions ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>

                      {showAltOptions && (
                        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-left duration-200 animate-in fade-in dark:border-slate-800 dark:bg-slate-800/40">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Kirim ke nomor{' '}
                            {otpData?.maskedPhone || otpData?.phone}:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={isResendingOtp}
                              onClick={() => handleAltChannel('WHATSAPP')}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-95 disabled:opacity-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              disabled={isResendingOtp}
                              onClick={() => handleAltChannel('SMS')}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                              <Phone className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                              <span>SMS</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Verification */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={isVerifyingOtp || isLoading || otp.length < 6}
                      className="shadow-xs active:scale-98 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-950 py-3 text-xs font-bold text-white transition-all duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      {isVerifyingOtp || isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <>
                          <span>Verifikasi & Masuk</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep('credentials')
                        setError('')
                        setOtp('')
                      }}
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Gunakan Akun / Sandi Lain</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Trust Security Footer Tag */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Koneksi Akun Aman & Terlindungi 100%</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 py-6 text-center text-[11px] text-slate-400 dark:border-slate-800/50">
        © {new Date().getFullYear()} Affiliate Gadget. All rights reserved.
        Jaringan Toko Smartphone Resmi & Terpercaya.
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-7 w-7 animate-spin text-slate-900" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
