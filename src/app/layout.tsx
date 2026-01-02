import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from '@/components/providers/session-provider'
import FloatingChatButton from '@/components/chat/floating-chat-button'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Improve font loading performance
})

export const metadata: Metadata = {
  title: 'HaloTekno - Solusi Teknologi Terpercaya',
  description:
    'Platform servis HP profesional, sparepart original, dan ekosistem teknologi lengkap',
  robots: 'index, follow',
  openGraph: {
    title: 'HaloTekno - Solusi Teknologi Terpercaya',
    description:
      'Platform servis HP profesional, sparepart original, dan ekosistem teknologi lengkap',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://utfs.io" />
        <link rel="dns-prefetch" href="https://utfs.io" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <FloatingChatButton />
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  )
}
