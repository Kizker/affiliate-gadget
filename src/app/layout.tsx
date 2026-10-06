import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { SessionProvider } from '@/components/providers/session-provider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title:
    'Affiliate Gadget - Marketplace Gadget Second Berkualitas & Terpercaya',
  description:
    'Platform marketplace gadget second / bekas berkualitas terverifikasi se-Indonesia. Jaminan unit like new, garansi toko 30 hari tukar unit, lolos uji fungsi teknisi, dan paket bonus aksesoris lengkap 3-in-1.',
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'Affiliate Gadget',
    statusBarStyle: 'default',
  },
  openGraph: {
    title:
      'Affiliate Gadget - Marketplace Gadget Second Berkualitas & Terpercaya',
    description:
      'Platform marketplace gadget second / bekas berkualitas terverifikasi se-Indonesia. Jaminan unit like new, garansi toko 30 hari tukar unit, lolos uji fungsi teknisi, dan paket bonus aksesoris lengkap 3-in-1.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={poppins.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
        <SonnerToaster position="top-right" visibleToasts={1} expand={false} />
      </body>
    </html>
  )
}
