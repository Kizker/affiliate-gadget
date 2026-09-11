'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import StoreDataForm from '@/components/mitra/store-data-form'

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [registeredUserId, setRegisteredUserId] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'MITRA',
    honeypotField: '',
  })

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

      // Auto login after registration
      const result = await signIn('credentials', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false,
      })

      if (formData.role === 'MITRA') {
        // Transition to Step 2: Store Data Onboarding
        setCurrentStep(2)
      } else {
        if (result?.error) {
          setError('Akun berhasil dibuat. Silakan masuk.')
          setTimeout(() => router.push('/login'), 1500)
        } else {
          router.push('/')
          router.refresh()
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Terjadi kendala saat pendaftaran.'
      )
    } finally {
      setIsLoading(false)
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
                  : 'Lengkapi Informasi Toko'}
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {currentStep === 1
                  ? 'Buat akun baru untuk mulai bertransaksi dengan garansi resmi'
                  : 'Langkah 2 dari 2: Isi rincian cabang toko fisik & badan usaha Anda untuk review'}
              </p>
            </div>

            {/* Stepper Indicator for Mitra */}
            {(formData.role === 'MITRA' || currentStep === 2) && (
              <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div
                    className={`flex items-center gap-2 ${currentStep === 1 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep === 1 ? 'bg-orange-500 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}
                    >
                      {currentStep > 1 ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        '1'
                      )}
                    </div>
                    <span>Data Akun</span>
                  </div>

                  <div className="mx-3 h-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />

                  <div
                    className={`flex items-center gap-2 ${currentStep === 2 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep === 2 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}
                    >
                      2
                    </div>
                    <span>Data Toko</span>
                  </div>
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
                          ? 'shadow-xs border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                          : 'border-slate-200/80 bg-slate-50/60 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          formData.role === 'CUSTOMER'
                            ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-950'
                            : 'shadow-2xs bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'
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
                          ? 'shadow-xs border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                          : 'border-slate-200/80 bg-slate-50/60 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          formData.role === 'MITRA'
                            ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-950'
                            : 'shadow-2xs bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'
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
