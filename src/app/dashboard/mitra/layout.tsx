'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { Toaster } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function MitraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect pending mitra to pending page
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'MITRA') {
      const mitraStatus = (session.user as { mitraStatus?: string }).mitraStatus
      if (
        mitraStatus === 'PENDING' &&
        pathname !== '/dashboard/mitra/pending'
      ) {
        router.push('/dashboard/mitra/pending')
      }
    }
  }, [status, session, pathname, router])

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Don't render if pending mitra (will redirect)
  if (
    session?.user?.role === 'MITRA' &&
    pathname !== '/dashboard/mitra/pending'
  ) {
    const mitraStatus = (session.user as { mitraStatus?: string }).mitraStatus
    if (mitraStatus === 'PENDING') {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )
    }
  }

  // Don't use any layout for pending page
  if (pathname === '/dashboard/mitra/pending') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <Navbar variant="light" />
      <main className="min-h-screen pb-8 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
      <Footer variant="light" />
      <Toaster position="top-right" richColors />
    </div>
  )
}
