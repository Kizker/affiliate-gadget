import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { parseUserAgent } from '@/lib/user-agent-parser'
import { getStoreDetailData } from '@/lib/store-data'
import StoreDetailClient from './store-detail-client'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'

  const store = await getStoreDetailData(slug)
  if (!store) {
    return {
      title: 'Toko Tidak Ditemukan | Affiliate Gadget',
      description: 'Cabang toko resmi tidak ditemukan di Affiliate Gadget.',
      alternates: {
        canonical: `${baseUrl}/toko/${slug}`,
      },
    }
  }

  const cleanStoreName = store.name.replace(/^Affiliate Gadget\s*[-–—]\s*/i, '')
  const title = `${cleanStoreName} — Gerai Resmi & Garansi 30 Hari | Affiliate Gadget`
  const description = `Kunjungi gerai resmi ${store.name} di ${store.address || store.city || 'Indonesia'}. Dapatkan gadget bergaransi tukar unit 30 hari, promo cicilan 0%, dan servis kilat 2 jam.`
  const coverImage =
    store.banner || store.heroImage || store.logo || `${baseUrl}/logo.webp`

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/toko/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/toko/${slug}`,
      siteName: 'Affiliate Gadget',
      type: 'website',
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: store.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage],
    },
  }
}

export default async function StoreDetailPage({ params }: PageProps) {
  const { slug } = await params
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'

  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''
  const clientDevice = parseUserAgent(ua)
  const isMobileDevice = clientDevice.deviceType === 'mobile'

  const store = await getStoreDetailData(slug)

  if (!store) {
    notFound()
  }

  // Schema.org ElectronicsStore rich snippet
  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: store.name,
    image:
      store.banner || store.heroImage || store.logo || `${baseUrl}/logo.webp`,
    telephone: store.phone || store.whatsapp || '+6281234567890',
    address: {
      '@type': 'PostalAddress',
      streetAddress: store.address || '',
      addressLocality: store.city || '',
      addressCountry: 'ID',
    },
    url: `${baseUrl}/toko/${slug}`,
    ...(store.latitude && store.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: Number(store.latitude),
            longitude: Number(store.longitude),
          },
        }
      : {}),
    ...(store.schedules && store.schedules.length > 0
      ? {
          openingHoursSpecification: store.schedules.map((sched: any) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: sched.day,
            opens: sched.openTime || '10:00',
            closes: sched.closeTime || '21:00',
          })),
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <StoreDetailClient
        initialStore={store}
        initialIsMobile={isMobileDevice}
      />
    </>
  )
}
