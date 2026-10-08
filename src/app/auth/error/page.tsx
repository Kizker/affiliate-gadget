import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  const errorMessages: Record<string, string> = {
    Configuration: 'Terjadi kendala konfigurasi pada server otentikasi.',
    AccessDenied: 'Akses ditolak atau izin akun Anda tidak mencukupi.',
    Verification:
      'Tautan atau token verifikasi tidak valid atau telah kadaluarsa.',
    Default: 'Terjadi kendala saat proses otentikasi login.',
  }

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* Top Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus:outline-none"
          aria-label="Affiliate Gadget Beranda"
        >
          <img
            src="/logo.webp"
            alt="Affiliate Gadget Logo"
            className="shadow-2xs h-8 w-8 rounded-xl object-contain"
          />
          <span className="text-base font-black leading-none tracking-tight text-slate-950 dark:text-white">
            Affiliate<span className="text-orange-500">Gadget</span>
          </span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h1 className="mb-2 text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
              Kendala Otentikasi
            </h1>
            <p className="mb-8 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
              {errorMessage}
            </p>

            <Link
              href="/login"
              className="shadow-xs active:scale-98 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-xs font-bold text-white transition-all duration-200 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 py-6 text-center text-[11px] text-slate-400 dark:border-slate-800/50">
        © {new Date().getFullYear()} Affiliate Gadget. All rights reserved.
      </footer>
    </div>
  )
}
