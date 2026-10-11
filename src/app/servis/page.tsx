import { Metadata } from 'next'
import { headers } from 'next/headers'
import { parseUserAgent } from '@/lib/user-agent-parser'
import { getMitraServiceListData } from '@/lib/mitra-service-data'
import { IntegratedServiceView } from '@/components/service/integrated-service-view'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'

  const title =
    'Layanan Servis Gadget & Pergantian LCD Kilat 2 Jam | Affiliate Gadget'
  const description =
    'Pusat layanan servis gadget & pergantian LCD kilat 2 jam terpercaya di Indonesia. Teknisi level-3 specialist, meja reparasi open lab transparan, dan garansi resmi toko.'

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/servis`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/servis`,
      siteName: 'Affiliate Gadget',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/logo.webp`,
          width: 512,
          height: 512,
          alt: 'Layanan Servis Gadget Kilat & Terintegrasi',
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

export default async function ServisPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'
  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''
  const clientDevice = parseUserAgent(ua)
  const isMobileDevice = clientDevice.deviceType === 'mobile'

  const mitras = await getMitraServiceListData()

  // Schema.org structured data for Service / Repair Centers (SEO 100)
  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Daftar Pusat Layanan Servis Gadget Resmi Affiliate Gadget',
    description:
      'Daftar mitra teknisi dan lab servis LCD gadget bergaransi resmi di berbagai kota Indonesia.',
    numberOfItems: mitras.length,
    itemListElement: mitras.map((m, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'AutoRepair',
        name: m.businessName,
        image: m.banner || `${baseUrl}/logo.webp`,
        telephone: m.phone || m.whatsapp || '+6281234567890',
        url: `${baseUrl}/rekomendasi/${m.id}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: m.address || '',
          addressLocality: m.city || '',
          addressCountry: 'ID',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: m.rating > 0 ? m.rating : 5.0,
          reviewCount: m.reviewCount > 0 ? m.reviewCount : 1,
        },
      },
    })),
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <IntegratedServiceView
        initialMitras={mitras}
        initialIsMobile={isMobileDevice}
      />
    </div>
  )
}
