'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Store,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
  Phone,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import StoreDataForm from '@/components/mitra/store-data-form'

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 'otp' | 2>(1)
  const [registeredUserId, setRegisteredUserId] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  // OTP Verification States (Email-First with WA/SMS fallback)
  const [otp, setOtp] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(300)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [activeOtpChannel, setActiveOtpChannel] = useState<
    'EMAIL' | 'WHATSAPP' | 'SMS'
  >('EMAIL')
  const [activeIdentifier, setActiveIdentifier] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [hasPhone, setHasPhone] = useState(false)
  const [showAltOptions, setShowAltOptions] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpSuccess, setOtpSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'MITRA',
    honeypotField: '',
  })

  // Timer countdown for OTP expiry and resend cooldown
  useEffect(() => {
    if (currentStep !== 'otp') return
    const interval = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [currentStep])

  const formatMaskedPhone = (phoneStr: string) => {
    if (!phoneStr) return ''
    const clean = phoneStr.trim()
    if (clean.length <= 6) return clean
    return clean.slice(0, 4) + '****' + clean.slice(-4)
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Password Strength Criteria Evaluation
  const passwordCriteria = {
    length: formData.password.length >= 8 && formData.password.length <= 128,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSymbol: /[^A-Za-z0-9]/.test(formData.password),
  }

  const passedCriteriaCount =
    Object.values(passwordCriteria).filter(Boolean).length
  const isPasswordValid = passedCriteriaCount === 5

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)
    setError('')

    // Client-side quick validations
    if (formData.name.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter.')
      setIsLoading(false)
      return
    }

    if (!isPasswordValid) {
      setError(
        'Kata sandi belum memenuhi seluruh kriteria keamanan yang ditentukan.'
      )
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role,
          honeypotField: formData.honeypotField,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registrasi akun gagal.')
      }

      const createdUserId = data.userId || ''
      setRegisteredUserId(createdUserId)
      setMaskedEmail(data.maskedEmail || formData.email.trim().toLowerCase())
      setHasPhone(!!data.hasPhone)
      setActiveIdentifier(formData.email.trim().toLowerCase())
      setActiveOtpChannel('EMAIL')
      setShowAltOptions(false)

      // Selalu lanjut ke langkah OTP verifikasi email
      setCurrentStep('otp')
      setOtpCountdown(300)
      setResendCooldown(60)
      setOtp('')
      setOtpError('')
      setOtpSuccess(
        `Kode OTP 6-digit telah dikirimkan ke email Anda (${data.maskedEmail || formData.email}). Silakan periksa kotak masuk atau spam.`
      )
      return
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Terjadi kendala saat pendaftaran.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (otp.trim().length < 6) {
      setOtpError('Masukkan 6 digit kode OTP verifikasi.')
      return
    }
    setIsVerifyingOtp(true)
    setOtpError('')
    setOtpSuccess('')

    const targetIdentifier =
      activeIdentifier || formData.email.trim().toLowerCase()

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetIdentifier,
          code: otp.trim(),
          purpose: 'REGISTER',
        }),
      })
      const verifyData = await res.json()
      if (!res.ok) {
        setOtpError(
          verifyData.error || 'Kode OTP tidak cocok atau sudah kadaluarsa.'
        )
        setIsVerifyingOtp(false)
        return
      }

      setOtpSuccess('Verifikasi berhasil! Mengalihkan ke akun Anda...')

      // Auto login after OTP is confirmed
      const result = await signIn('credentials', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false,
      })

      if (formData.role === 'MITRA') {
        setCurrentStep(2)
      } else {
        if (result?.error) {
          router.push('/login?registered=true')
        } else {
          router.push('/')
          router.refresh()
        }
      }
    } catch (err: unknown) {
      setOtpError(
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat verifikasi OTP.'
      )
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendEmailOtp = async () => {
    if (resendCooldown > 0) return
    setIsResendingOtp(true)
    setOtpError('')
    setOtpSuccess('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.email.trim().toLowerCase(),
          channel: 'EMAIL',
          purpose: 'REGISTER',
          userId: registeredUserId,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActiveOtpChannel('EMAIL')
        setActiveIdentifier(formData.email.trim().toLowerCase())
        setOtpSuccess('Kode OTP baru berhasil dikirim ke email Anda!')
        setOtpCountdown(data.expiresIn || 300)
        setResendCooldown(data.cooldown || 60)
      } else {
        setOtpError(data.error || 'Gagal mengirim ulang kode OTP ke email.')
      }
    } catch {
      setOtpError('Terjadi kendala saat mengirim ulang kode OTP.')
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleAltChannelOtp = async (channel: 'WHATSAPP' | 'SMS') => {
    if (!formData.phone || formData.phone.trim().length === 0) {
      setOtpError('Nomor telepon tidak tersedia untuk opsi alternatif ini.')
      return
    }
    setIsResendingOtp(true)
    setOtpError('')
    setOtpSuccess('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.phone.trim(),
          channel,
          purpose: 'REGISTER',
          userId: registeredUserId,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActiveOtpChannel(channel)
        setActiveIdentifier(formData.phone.trim())
        setShowAltOptions(false)
        setOtpSuccess(
          channel === 'SMS'
            ? `Kode OTP dialihkan ke SMS (${formatMaskedPhone(formData.phone)})!`
            : `Kode OTP dialihkan ke WhatsApp (${formatMaskedPhone(formData.phone)})!`
        )
        setOtpCountdown(data.expiresIn || 300)
        setResendCooldown(data.cooldown || 60)
      } else {
        setOtpError(data.error || `Gagal mengirim kode via ${channel}.`)
      }
    } catch {
      setOtpError(`Terjadi kendala saat mengirim kode via ${channel}.`)
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleStoreDataSuccess = () => {
    router.push('/dashboard/mitra/pending')
    router.refresh()
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* Ambient Background Gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[350px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-blue-100/30 via-slate-100/20 to-transparent blur-3xl dark:from-slate-800/20" />
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
        <div
          className={`w-full transition-all duration-300 ${currentStep === 2 ? 'max-w-[620px]' : 'max-w-[500px]'}`}
        >
          {/* Card Container */}
          <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
            {/* Header with Logo */}
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
                {currentStep === 1
                  ? 'Daftar Akun Baru'
                  : currentStep === 'otp'
                    ? 'Verifikasi Kode OTP'
                    : 'Lengkapi Informasi Toko'}
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {currentStep === 1
                  ? 'Buat akun baru untuk mulai bertransaksi dengan garansi resmi'
                  : currentStep === 'otp'
                    ? 'Masukkan 6 digit kode OTP yang kami kirimkan untuk memverifikasi akun Anda'
                    : 'Langkah 2 dari 2: Isi rincian cabang toko fisik & badan usaha Anda untuk review'}
              </p>
            </div>

            {/* Stepper Indicator */}
            {(formData.role === 'MITRA' ||
              currentStep === 'otp' ||
              currentStep === 2) && (
              <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div
                    className={`flex items-center gap-2 ${
                      currentStep === 1
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        currentStep === 1
                          ? 'bg-orange-500 text-white'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {currentStep !== 1 ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        '1'
                      )}
                    </div>
                    <span>Data Akun</span>
                  </div>

                  <div className="mx-2.5 h-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />

                  <div
                    className={`flex items-center gap-2 ${
                      currentStep === 'otp'
                        ? 'text-orange-600 dark:text-orange-400'
                        : currentStep === 2
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        currentStep === 'otp'
                          ? 'bg-orange-500 text-white'
                          : currentStep === 2
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {currentStep === 2 ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        '2'
                      )}
                    </div>
                    <span>Verifikasi OTP</span>
                  </div>

                  {formData.role === 'MITRA' && (
                    <>
                      <div className="mx-2.5 h-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />

                      <div
                        className={`flex items-center gap-2 ${
                          currentStep === 2
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-slate-400'
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            currentStep === 2
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          3
                        </div>
                        <span>Data Toko</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 1: Akun Dasar */}
            {currentStep === 1 && (
              <>
                {/* Role Selection Dual Cards */}
                <div className="mb-6 space-y-2">
                  <label className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pilih Jenis Akun
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, role: 'CUSTOMER' })
                      }
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                        formData.role === 'CUSTOMER'
                          ? 'shadow-xs border-orange-500 bg-orange-50/25 text-slate-950 ring-1 ring-orange-500/30 dark:border-orange-500 dark:bg-orange-950/20 dark:text-white'
                          : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          formData.role === 'CUSTOMER'
                            ? 'bg-orange-500 text-white'
                            : 'shadow-2xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">
                          Customer
                        </p>
                        <p className="text-[10px] opacity-75">
                          Beli Gadget Second
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, role: 'MITRA' })
                      }
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                        formData.role === 'MITRA'
                          ? 'shadow-xs border-orange-500 bg-orange-50/25 text-slate-950 ring-1 ring-orange-500/30 dark:border-orange-500 dark:bg-orange-950/20 dark:text-white'
                          : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          formData.role === 'MITRA'
                            ? 'bg-orange-500 text-white'
                            : 'shadow-2xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Store className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">
                          Mitra Toko
                        </p>
                        <p className="text-[10px] opacity-75">
                          Daftar Cabang Toko
                        </p>
                      </div>
                    </button>
                  </div>

                  {formData.role === 'MITRA' && (
                    <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-500 duration-200 animate-in fade-in dark:text-slate-400">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>
                        Pendaftaran toko memerlukan kelengkapan profil toko di
                        langkah berikutnya
                      </span>
                    </div>
                  )}
                </div>

                {/* Error Notification Banner */}
                {error && (
                  <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 duration-150 animate-in fade-in dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmitStep1} className="space-y-3.5">
                  {/* Anti-Bot Honeypot Field */}
                  <input
                    type="text"
                    name="honeypotField"
                    value={formData.honeypotField}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        honeypotField: e.target.value,
                      })
                    }
                    className="pointer-events-none hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

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
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <User className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
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
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Phone Input (Optional) */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="phone"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Nomor WhatsApp / HP{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        (Opsional)
                      </span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="Contoh: 081234567890"
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <Phone className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
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
                        onFocus={() => setIsPasswordFocused(true)}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Min. 8 karakter (huruf besar, kecil, angka, simbol)"
                        className={`w-full rounded-2xl border bg-slate-50/70 py-2.5 pl-10 pr-11 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white dark:bg-slate-800 dark:text-white ${
                          formData.password.length > 0
                            ? isPasswordValid
                              ? 'border-emerald-500 focus:border-emerald-600'
                              : 'border-orange-400 focus:border-orange-500'
                            : 'border-slate-200/80 focus:border-slate-400 dark:border-slate-700'
                        }`}
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

                    {/* Password Strength Requirement Checklist */}
                    {(isPasswordFocused || formData.password.length > 0) && (
                      <div className="mt-2.5 space-y-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 duration-200 animate-in fade-in dark:border-slate-700/60 dark:bg-slate-800/60">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            Kekuatan Kata Sandi
                          </span>
                          <span
                            className={`font-bold ${
                              isPasswordValid
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : passedCriteriaCount >= 3
                                  ? 'text-amber-500'
                                  : 'text-slate-400'
                            }`}
                          >
                            {isPasswordValid
                              ? 'Kuat & Aman'
                              : passedCriteriaCount >= 3
                                ? 'Sedang'
                                : 'Belum Memenuhi'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isPasswordValid
                                ? 'w-full bg-emerald-500'
                                : passedCriteriaCount === 4
                                  ? 'w-4/5 bg-amber-500'
                                  : passedCriteriaCount === 3
                                    ? 'w-3/5 bg-amber-400'
                                    : passedCriteriaCount === 2
                                      ? 'w-2/5 bg-orange-400'
                                      : passedCriteriaCount === 1
                                        ? 'w-1/5 bg-rose-400'
                                        : 'w-0 bg-transparent'
                            }`}
                          />
                        </div>

                        {/* 5 Specific Criteria Badges */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                          <div
                            className={`flex items-center gap-1.5 transition-colors ${
                              passwordCriteria.length
                                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <div
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] ${
                                passwordCriteria.length
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span>Min. 8 karakter</span>
                          </div>

                          <div
                            className={`flex items-center gap-1.5 transition-colors ${
                              passwordCriteria.hasUpper
                                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <div
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] ${
                                passwordCriteria.hasUpper
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span>Huruf besar (A-Z)</span>
                          </div>

                          <div
                            className={`flex items-center gap-1.5 transition-colors ${
                              passwordCriteria.hasLower
                                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <div
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] ${
                                passwordCriteria.hasLower
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span>Huruf kecil (a-z)</span>
                          </div>

                          <div
                            className={`flex items-center gap-1.5 transition-colors ${
                              passwordCriteria.hasNumber
                                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <div
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] ${
                                passwordCriteria.hasNumber
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span>Angka (0-9)</span>
                          </div>

                          <div
                            className={`col-span-2 flex items-center gap-1.5 transition-colors ${
                              passwordCriteria.hasSymbol
                                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <div
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] ${
                                passwordCriteria.hasSymbol
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span>Karakter simbol (@, #, $, !, %, dsb)</span>
                          </div>
                        </div>
                      </div>
                    )}
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
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Ulangi kata sandi di atas"
                        className={`w-full rounded-2xl border bg-slate-50/70 py-2.5 pl-10 pr-11 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white dark:bg-slate-800 dark:text-white ${
                          formData.confirmPassword.length > 0
                            ? formData.password === formData.confirmPassword
                              ? 'border-emerald-500 focus:border-emerald-600'
                              : 'border-rose-400 focus:border-rose-500'
                            : 'border-slate-200/80 focus:border-slate-400 dark:border-slate-700'
                        }`}
                      />
                      <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none dark:hover:text-slate-200"
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
                      disabled={isLoading || !isPasswordValid}
                      className="active:scale-98 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Mendaftarkan Akun...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {formData.role === 'MITRA'
                              ? 'Lanjut ke Informasi Toko'
                              : 'Daftar Akun Sekarang'}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Divider */}
                <div className="relative my-5 flex items-center justify-center">
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
                  className="shadow-2xs flex w-full items-center justify-center gap-2.5 rounded-full border border-slate-200/80 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
              </>
            )}

            {/* STEP OTP: Verifikasi Email (Default) / WhatsApp / SMS */}
            {currentStep === 'otp' && (
              <div className="space-y-5">
                {/* Header Badge */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div
                    className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      activeOtpChannel === 'EMAIL'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        : activeOtpChannel === 'WHATSAPP'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}
                  >
                    {activeOtpChannel === 'EMAIL' ? (
                      <Mail className="h-7 w-7" />
                    ) : activeOtpChannel === 'WHATSAPP' ? (
                      <MessageSquare className="h-7 w-7" />
                    ) : (
                      <Phone className="h-7 w-7" />
                    )}
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeOtpChannel === 'EMAIL'
                      ? 'Cek Kotak Masuk Email'
                      : activeOtpChannel === 'WHATSAPP'
                        ? 'Verifikasi via WhatsApp'
                        : 'Verifikasi via SMS'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {activeOtpChannel === 'EMAIL'
                      ? 'Masukkan 6 digit kode OTP yang kami kirimkan ke email:'
                      : 'Masukkan 6 digit kode OTP yang kami kirimkan ke nomor:'}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                    {activeOtpChannel === 'EMAIL'
                      ? maskedEmail || formData.email
                      : formatMaskedPhone(formData.phone)}
                  </p>
                </div>

                {/* Error Banner */}
                {otpError && (
                  <div className="flex items-center gap-2 rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {otpSuccess && (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{otpSuccess}</span>
                  </div>
                )}

                {/* OTP Input Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="register-otp"
                      className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Kode OTP (6 Digit)
                    </label>
                    <div className="relative">
                      <input
                        id="register-otp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          setOtp(val)
                        }}
                        placeholder="••••••"
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-3 text-center font-mono text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Masa berlaku kode:</span>
                    <span
                      className={`font-mono font-bold ${
                        otpCountdown <= 60
                          ? 'text-red-500'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {formatTimer(otpCountdown)}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otp.length < 6}
                    className="active:scale-98 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <span>Verifikasi & Lanjutkan</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Resend & Alternative Channel Options */}
                <div className="space-y-3 pt-2 text-center text-xs">
                  <div>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isResendingOtp}
                      onClick={handleResendEmailOtp}
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-600 transition-colors hover:text-orange-600 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-400 dark:hover:text-orange-400"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isResendingOtp ? 'animate-spin' : ''}`}
                      />
                      <span>
                        {resendCooldown > 0
                          ? `Kirim ulang email (${resendCooldown}s)`
                          : 'Kirim ulang kode ke email'}
                      </span>
                    </button>
                  </div>

                  {/* Cara Lainnya: WhatsApp / SMS (jika user mengisi nomor HP) */}
                  {hasPhone && (
                    <div className="pt-1">
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
                        <div className="mt-2.5 flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-left duration-200 animate-in fade-in dark:border-slate-800 dark:bg-slate-800/40">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Kirim ke nomor {formatMaskedPhone(formData.phone)}:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={isResendingOtp}
                              onClick={() => handleAltChannelOtp('WHATSAPP')}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-95 disabled:opacity-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              disabled={isResendingOtp}
                              onClick={() => handleAltChannelOtp('SMS')}
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

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1)
                        setOtpError('')
                        setOtpSuccess('')
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ← Ubah email atau data akun
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Informasi Toko untuk Calon Mitra */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <StoreDataForm
                  userId={registeredUserId}
                  onSubmitSuccess={handleStoreDataSuccess}
                  apiEndpoint="/api/auth/register/store-data"
                  httpMethod="POST"
                  submitButtonText="Kirim Data Toko untuk Ditinjau Admin"
                />
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
      <footer
        suppressHydrationWarning
        className="relative z-10 border-t border-slate-200/50 py-6 text-center text-[11px] text-slate-400 dark:border-slate-800/50"
      >
        © {new Date().getFullYear()} Affiliate Gadget. All rights reserved.
        Jaringan Toko Smartphone Resmi & Terpercaya.
      </footer>
    </div>
  )
}
