import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-orange-100 text-4xl font-black text-orange-600 shadow-sm dark:bg-orange-950/50 dark:text-orange-400">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Halaman yang Anda tuju mungkin sudah dipindahkan, dihapus, atau
            alamat URL yang Anda masukkan salah.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <Link
            href="/"
            className="shadow-xs inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/gadget"
            className="shadow-2xs inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Katalog Gadget
          </Link>
        </div>
      </div>
    </div>
  )
}
