import { Metadata } from 'next'
import prisma from '@/lib/db'
import GadgetDetailClient from './gadget-detail-client'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    let product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        store: true,
      },
    })

    if (!product) {
      const searchName = id.replace(/^product-/, '').replace(/-/g, ' ')
      product = await prisma.product.findFirst({
        where: {
          name: { contains: searchName, mode: 'insensitive' },
          isActive: true,
        },
        include: {
          variants: true,
          store: true,
        },
      })
    }

    if (!product) {
      return {
        title: 'Gadget Tidak Ditemukan | Affiliate Gadget',
        description:
          'Produk gadget tidak ditemukan atau sudah tidak tersedia di Affiliate Gadget.',
      }
    }

    // Hitung harga minimum (varian termurah atau harga produk dasar)
    const minVariantPrice = product.variants?.length
      ? Math.min(...product.variants.map((v) => Number(v.price)))
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

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'
    const primaryImage = product.images?.[0] || `${baseUrl}/icon.png`

    return {
      title,
      description,
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
    }
  }
}

export default async function Page() {
  return <GadgetDetailClient />
}
