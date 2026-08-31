'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Clock, Mail, CheckCircle, Loader2 } from 'lucide-react'

export default function MitraPendingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (
      session?.user?.role === 'MITRA' &&
      session.user.mitraStatus === 'APPROVED'
    ) {
      router.push('/dashboard/mitra')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-10 top-10 h-48 w-48 animate-pulse rounded-full bg-blue-400/20 blur-3xl"></div>
        <div className="absolute bottom-10 left-10 h-64 w-64 animate-pulse rounded-full bg-cyan-400/20 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Main Card */}
          <div className="rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-2xl backdrop-blur-sm">
            {/* Icon */}
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-yellow-400/50"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Menunggu Persetujuan
            </h1>
            <p className="mb-5 text-center text-sm text-gray-600">
              Akun mitra Anda sedang dalam proses review oleh tim admin kami
            </p>

            {/* User Info */}
            <div className="mb-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Nama Mitra</p>
                  <p className="font-semibold text-gray-900">
                    {session?.user?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Steps - Compact */}
            <div className="mb-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Pendaftaran Berhasil
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Menunggu Review Admin
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-40">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Akun Disetujui
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-blue-600" />
                <p className="text-xs text-blue-700">
                  Notifikasi akan dikirim ke email Anda setelah proses review
                  selesai (1-2 hari kerja).
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Logout
              </button>
              <button
                onClick={() => router.refresh()}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl"
              >
                Refresh Status
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-gray-500">
            Butuh bantuan?{' '}
            <a
              href="mailto:support@affiliategadget.com"
              className="font-medium text-blue-600 hover:underline"
            >
              support@affiliategadget.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
