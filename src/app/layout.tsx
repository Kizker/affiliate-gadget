import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from '@/components/providers/session-provider'
import FloatingChatButton from '@/components/chat/floating-chat-button'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HaloTekno - Solusi Teknologi Terpercaya',
  description:
    'Platform servis HP profesional, sparepart original, dan ekosistem teknologi lengkap',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
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
