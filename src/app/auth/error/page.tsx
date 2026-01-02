import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  const errorMessages: Record<string, string> = {
    Configuration: 'Terjadi kesalahan konfigurasi server',
    AccessDenied: 'Akses ditolak',
    Verification: 'Token verifikasi tidak valid atau sudah kadaluarsa',
    Default: 'Terjadi kesalahan saat login',
  }

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-cyan-900/20"></div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-gray-700/50 bg-gray-800/50 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="mb-4 text-2xl font-bold">Oops! Terjadi Kesalahan</h1>
          <p className="mb-8 text-gray-400">{errorMessage}</p>

          <Link
            href="/login"
            className="inline-block transform rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  )
}
