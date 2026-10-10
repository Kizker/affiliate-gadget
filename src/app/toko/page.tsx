import { Metadata } from 'next'
import { headers } from 'next/headers'
import { parseUserAgent } from '@/lib/user-agent-parser'
import { getStoresDirectoryData } from '@/lib/store-data'
import TokoDirectoryClient from './toko-directory-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'

  const title =
    'Jaringan Toko Offline Resmi — Garansi 30 Hari & Servis Kilat | Affiliate Gadget'
  const description =
    'Kunjungi cabang toko offline resmi Affiliate Gadget di Jakarta, Surabaya, Bandung, Medan, Yogyakarta, Denpasar, Makassar, dan Semarang. Jaminan tukar unit baru 30 hari & servis kilat 2 jam.'

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/toko`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/toko`,
      siteName: 'Affiliate Gadget',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/logo.webp`,
          width: 512,
          height: 512,
          alt: 'Jaringan Toko Offline Resmi Affiliate Gadget',
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [`${baseUrl}/logo.webp`],
    },
  }
}

export default async function TokoDirectoryPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'
  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''
  const clientDevice = parseUserAgent(ua)
  const isMobileDevice = clientDevice.deviceType === 'mobile'

  const stores = await getStoresDirectoryData()

  // Structured Data Schema.org ItemList for ElectronicsStore
  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jaringan Cabang Toko Offline Resmi Affiliate Gadget',
    description:
      'Daftar cabang toko fisik resmi Affiliate Gadget di Indonesia dengan fasilitas garansi tukar unit baru 30 hari dan servis kilat 2 jam.',
    numberOfItems: stores.length,
    itemListElement: stores.map((s, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'ElectronicsStore',
        name: s.name,
        image: s.logo || s.banner || `${baseUrl}/logo.webp`,
        telephone: s.phone || s.whatsapp || '+6281234567890',
        url: `${baseUrl}/toko/${s.slug}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: s.address || '',
          addressLocality: s.city || '',
          addressCountry: 'ID',
        },
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <TokoDirectoryClient
        initialStores={stores}
        initialIsMobile={isMobileDevice}
      />
    </>
  )
}
