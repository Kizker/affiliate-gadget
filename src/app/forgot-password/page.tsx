'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS'

function ForgotPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>('EMAIL')
  const [email, setEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpPreview, setOtpPreview] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resend cooldown & expiry timers
  const [cooldown, setCooldown] = useState(0)
  const [countdown, setCountdown] = useState(300)

  // Prefill email from query parameter if present
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  // Cooldown timer ticker
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Expiry countdown timer ticker
  useEffect(() => {
    if (step !== 'OTP' && step !== 'NEW_PASSWORD') return
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown, step])

  // Format countdown into mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SUBMIT STEP 1: REQUEST OTP
  // ─────────────────────────────────────────────────────────────────────────────
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (!email || !email.includes('@')) {
      setError('Masukkan alamat email yang valid.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-otp',
          email,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim kode OTP.')
        return
      }

      setMaskedEmail(data.maskedEmail || email)
      setCooldown(data.cooldownSeconds || 60)
      setCountdown(data.expiresInSeconds || 300)
      if (data.otpPreview) {
        setOtpPreview(data.otpPreview)
      }

      toast.success('Kode OTP berhasil dikirim ke email Anda via Resend!')
      setStep('OTP')
    } catch {
      setError('Terjadi kendala koneksi ke server. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RESEND OTP
  // ─────────────────────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-otp',
          email,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim ulang kode OTP.')
        return
      }

      setCooldown(data.cooldownSeconds || 60)
      setCountdown(data.expiresInSeconds || 300)
      if (data.otpPreview) {
        setOtpPreview(data.otpPreview)
      }

      toast.success('Kode OTP baru telah dikirimkan via Resend!')
    } catch {
      setError('Gagal mengirim ulang kode OTP. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SUBMIT STEP 2: VERIFY OTP
  // ─────────────────────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (otp.trim().length !== 6) {
      setError('Kode OTP harus terdiri dari 6 digit angka.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          email,
          otp: otp.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Kode OTP tidak valid.')
        return
      }

      toast.success('Kode OTP terverifikasi! Silakan buat kata sandi baru.')
      setStep('NEW_PASSWORD')
    } catch {
      setError('Gagal memverifikasi kode OTP. Silakan periksa koneksi Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SUBMIT STEP 3: RESET PASSWORD
  // ─────────────────────────────────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email,
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal memperbarui kata sandi.')
        return
      }

      toast.success('Kata sandi berhasil diperbarui!')
      setStep('SUCCESS')
    } catch {
      setError(
        'Terjadi kesalahan saat menyimpan kata sandi. Silakan coba lagi.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Validation checks for step 3
  const isLengthValid = newPassword.length >= 8
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* Subtle Ambient Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[350px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-orange-100/30 via-slate-100/20 to-transparent blur-3xl dark:from-slate-800/20" />
      </div>

      {/* Top Header */}
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
          href="/login"
          className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
        >
          ← Kembali ke Masuk
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-[460px]">
          <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
            {/* Error Notification Banner */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 duration-150 animate-in fade-in dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <p className="flex-1 leading-relaxed">{error}</p>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* STEP 1: MASUKKAN EMAIL                                         */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {step === 'EMAIL' && (
              <>
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Lupa Kata Sandi?
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Masukkan email terdaftar. Kami akan mengirimkan kode OTP
                    6-digit melalui Resend untuk memverifikasi akun Anda.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Alamat Email Terdaftar
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-xs font-medium text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-0 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:hover:border-slate-700 dark:focus:border-white dark:focus:bg-slate-900"
                      />
                      <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-xs font-bold text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Mengirim OTP via Resend...
                      </span>
                    ) : (
                      <>
                        <span>Kirim Kode OTP (Email)</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Ingat kata sandi Anda?{' '}
                  <Link
                    href="/login"
                    className="font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400"
                  >
                    Masuk ke Akun
                  </Link>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* STEP 2: VERIFIKASI KODE OTP (RESEND)                           */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {step === 'OTP' && (
              <>
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Verifikasi OTP Email
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Masukkan 6 digit kode OTP resmi yang dikirimkan ke:
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {maskedEmail}
                  </p>
                </div>

                {/* Dev Simulation OTP Box (untuk kemudahan testing praktis) */}
                {otpPreview && process.env.NODE_ENV !== 'production' && (
                  <div className="mb-5 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        ⚡ Kode OTP (Simulasi Dev):
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtp(otpPreview)}
                        className="rounded-lg bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-700"
                      >
                        Pasang Kode
                      </button>
                    </div>
                    <p className="mt-1 font-mono text-base font-black tracking-widest text-blue-950 dark:text-white">
                      {otpPreview}
                    </p>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor="otp"
                        className="font-bold text-slate-700 dark:text-slate-300"
                      >
                        6 DIGIT KODE OTP
                      </label>
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                        {formatTimer(countdown)}
                      </span>
                    </div>

                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 text-center font-mono text-2xl font-black tracking-[0.5em] text-slate-900 transition-all placeholder:text-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-white dark:focus:bg-slate-900"
                    />
                  </div>

                  {/* Resend Helper & Switch Email */}
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('EMAIL')
                        setOtp('')
                        setError(null)
                      }}
                      className="flex items-center gap-1 font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Ganti Email
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={cooldown > 0 || isLoading}
                      className="flex items-center gap-1.5 font-bold text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-blue-400 dark:hover:text-blue-300 dark:disabled:text-slate-600"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
                      />
                      {cooldown > 0
                        ? `Kirim Ulang (${cooldown}s)`
                        : 'Kirim Ulang Email'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.trim().length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-xs font-bold text-white transition-all hover:bg-slate-800 focus:outline-none active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Memverifikasi...
                      </span>
                    ) : (
                      <>
                        <span>Verifikasi Kode OTP</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* STEP 3: BUAT KATA SANDI BARU                                   */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {step === 'NEW_PASSWORD' && (
              <>
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Buat Kata Sandi Baru
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Atur kata sandi baru untuk akun{' '}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {email}
                    </strong>
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="newPassword"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Kata Sandi Baru
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimal 8 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-xs font-medium text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:hover:border-slate-700 dark:focus:border-white dark:focus:bg-slate-900"
                      />
                      <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Ulangi kata sandi baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-xs font-medium text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:hover:border-slate-700 dark:focus:border-white dark:focus:bg-slate-900"
                      />
                      <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Requirements checklist */}
                  <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-[11px] dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] ${
                          isLengthValid
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        ✓
                      </div>
                      <span
                        className={
                          isLengthValid
                            ? 'font-medium text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        Minimal 8 karakter
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] ${
                          isMatchValid
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        ✓
                      </div>
                      <span
                        className={
                          isMatchValid
                            ? 'font-medium text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        Konfirmasi kata sandi cocok
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isLengthValid || !isMatchValid}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-xs font-bold text-white transition-all hover:bg-slate-800 focus:outline-none active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Menyimpan Kata Sandi...
                      </span>
                    ) : (
                      <>
                        <span>Simpan Kata Sandi Baru</span>
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* STEP 4: SUKSES                                                 */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {step === 'SUCCESS' && (
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10 duration-300 animate-in zoom-in-75" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Kata Sandi Berhasil Diperbarui!
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Kata sandi baru Anda telah aktif. Anda sekarang dapat masuk
                  kembali ke akun Anda dengan kata sandi yang baru.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/login?email=${encodeURIComponent(email)}`)
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.99] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <span>Masuk ke Akun Sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Simple */}
      <footer className="relative z-10 py-6 text-center text-[11px] text-slate-400 dark:text-slate-600">
        © 2026 Affiliate Gadget. All rights reserved. Jaringan Toko Smartphone
        Resmi & Terpercaya.
      </footer>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  )
}
