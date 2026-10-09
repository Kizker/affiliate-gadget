import { Metadata } from 'next'
import { headers } from 'next/headers'
import { parseUserAgent } from '@/lib/user-agent-parser'
import { getGadgetDetail } from '@/lib/gadget-data'
import GadgetDetailClient from './gadget-detail-client'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'

  try {
    const product = await getGadgetDetail(id)

    if (!product) {
      return {
        title: 'Gadget Tidak Ditemukan | Affiliate Gadget',
        description:
          'Produk gadget tidak ditemukan atau sudah tidak tersedia di Affiliate Gadget.',
        alternates: {
          canonical: `${baseUrl}/gadget/${id}`,
        },
      }
    }

    // Hitung harga minimum (varian termurah atau harga produk dasar)
    const minVariantPrice = product.variants?.length
      ? Math.min(...product.variants.map((v: any) => Number(v.price)))
      : Number(product.price)
    const effectivePrice =
      minVariantPrice > 0 ? minVariantPrice : Number(product.price)
    const formattedPrice = `Rp ${effectivePrice.toLocaleString('id-ID')}`

    const storeName =
      product.store?.name?.replace(/^Affiliate Gadget\s*[-–—]\s*/i, '') ||
      product.store?.name ||
      'Toko Resmi'
    const cityName = product.store?.city ? ` • ${product.store.city}` : ''

    const conditionMap: Record<string, string> = {
      LIKE_NEW: 'Like New 99%',
      SECOND_MULUS: 'Mulus 95%',
      GRADE_A: 'Grade A',
    }
    const conditionLabel =
      conditionMap[product.condition] || 'Unit Original Terverifikasi'

    const title = `${product.name} — ${formattedPrice} | Affiliate Gadget`
    const description = `${conditionLabel} • ${formattedPrice} • Garansi 30 Hari Tukar Unit Baru • Paket Bonus 3-in-1 Lengkap. Tersedia di ${storeName}${cityName}. Dapatkan unit original bergaransi resmi sekarang!`
    const primaryImage = product.images?.[0] || `${baseUrl}/icon.png`

    return {
      title,
      description,
      alternates: {
        canonical: `${baseUrl}/gadget/${id}`,
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/gadget/${id}`,
        siteName: 'Affiliate Gadget',
        images: [
          {
            url: primaryImage,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [primaryImage],
      },
    }
  } catch (error) {
    console.error('[Gadget Metadata Error]:', error)
    return {
      title: 'Detail Gadget | Affiliate Gadget',
      description:
        'Marketplace Gadget Terpercaya Bergaransi 30 Hari Tukar Unit & Asuransi Pengiriman.',
      alternates: {
        canonical: `${baseUrl}/gadget/${id}`,
      },
    }
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'

  // Detect mobile device on server to eliminate mobile hydration flash & double-mount
  const headerList = await headers()
  const ua = headerList.get('user-agent') || ''
  const isMobileDevice = parseUserAgent(ua).deviceType === 'mobile'

  // Preload gadget data on the server for instant SSR hydration
  const product = await getGadgetDetail(id)

  let jsonLd: any = null
  if (product) {
    const minVariantPrice = product.variants?.length
      ? Math.min(...product.variants.map((v: any) => Number(v.price)))
      : Number(product.price)
    const effectivePrice =
      minVariantPrice > 0 ? minVariantPrice : Number(product.price)

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image:
        product.images && product.images.length > 0
          ? product.images
          : [`${baseUrl}/icon.png`],
      description:
        product.description ||
        `${product.name} original bergaransi 30 hari tukar unit di Affiliate Gadget.`,
      brand: {
        '@type': 'Brand',
        name: product.brand || 'Affiliate Gadget',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'IDR',
        price: effectivePrice,
        availability:
          (product.stock || 0) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        url: `${baseUrl}/gadget/${id}`,
        seller: {
          '@type': 'Organization',
          name: product.store?.name || 'Affiliate Gadget Official',
        },
      },
      ...(product.totalReview > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: product.rating || 5.0,
              reviewCount: product.totalReview,
            },
          }
        : {}),
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <GadgetDetailClient
        initialProduct={product}
        initialIsMobile={isMobileDevice}
      />
    </>
  )
}
