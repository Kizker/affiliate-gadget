'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log unexpected runtime errors
    console.error('Unhandled runtime error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600 shadow-sm dark:bg-red-950/50 dark:text-red-400">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Terjadi Kesalahan Sistem
          </h1>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Aplikasi mengalami kendala teknis saat memuat halaman ini. Silakan
            coba muat ulang atau kembali ke beranda.
          </p>
          {error?.digest && (
            <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
              Kode Error: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <button
            onClick={() => reset()}
            className="shadow-xs inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </button>
          <Link
            href="/"
            className="shadow-2xs inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
