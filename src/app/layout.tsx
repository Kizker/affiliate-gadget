import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import dynamic from 'next/dynamic'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from '@/components/providers/session-provider'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Affiliate Gadget - Marketplace Gadget Second Berkualitas & Terpercaya',
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
    title: 'Affiliate Gadget - Marketplace Gadget Second Berkualitas & Terpercaya',
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
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://utfs.io" />
        <link rel="dns-prefetch" href="https://utfs.io" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${poppins.className} font-sans`}>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  )
}

