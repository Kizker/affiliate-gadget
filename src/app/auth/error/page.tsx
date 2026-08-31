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
    Verification: 'Tautan atau token verifikasi tidak valid atau telah kadaluarsa.',
    Default: 'Terjadi kendala saat proses otentikasi login.',
  }

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between relative selection:bg-orange-500 selection:text-white">
      
      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none"
          aria-label="Affiliate Gadget Beranda"
        >
          <img
            src="/logo.png"
            alt="Affiliate Gadget Logo"
            className="h-8 w-8 rounded-xl object-contain shadow-2xs"
          />
          <span className="text-base font-black tracking-tight text-slate-950 dark:text-white leading-none">
            Affiliate<span className="text-orange-500">Gadget</span>
          </span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h1 className="mb-2 text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
              Kendala Otentikasi
            </h1>
            <p className="mb-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {errorMessage}
            </p>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 py-3 px-6 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition-all duration-200 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-[11px] text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50">
        © {new Date().getFullYear()} Affiliate Gadget. All rights reserved.
      </footer>
    </div>
  )
}
