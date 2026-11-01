import type { Metadata } from 'next'
import { Suspense } from 'react'
import prisma from '@/lib/db'
import { VoucherClaimView } from '@/components/voucher/voucher-claim-view'

interface PageProps {
  searchParams: Promise<{ code?: string }>
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { code: rawCode } = await searchParams
  const code = rawCode?.trim().toUpperCase()
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'

  if (!code) {
    return {
      title: 'Klaim Voucher Diskon Gadget | Affiliate Gadget',
      description:
        'Klaim kode kupon diskon belanja gadget original bergaransi 30 hari di Affiliate Gadget Indonesia.',
      openGraph: {
        title: '🎟️ Klaim Voucher Diskon Gadget Original | Affiliate Gadget',
        description:
          'Dapatkan diskon belanja gadget impian Anda dengan garansi 30 hari tukar unit baru.',
        url: `${baseUrl}/voucher/claim`,
        siteName: 'Affiliate Gadget',
        images: [
          {
            url: `${baseUrl}/api/vouchers/og?v=2`,
            width: 800,
            height: 800,
            alt: 'Voucher Promo Affiliate Gadget',
          },
        ],
      },
    }
  }

  const voucher = await (prisma.voucher as any).findUnique({
    where: { code },
    include: {
      store: {
        select: {
          name: true,
          city: true,
        },
      },
    },
  })

  if (!voucher) {
    return {
      title: `Voucher Promo ${code} | Affiliate Gadget`,
      description: `Klaim voucher ${code} di Affiliate Gadget. 100% Produk Original & Bergaransi Resmi.`,
      openGraph: {
        title: `🎟️ Voucher Promo ${code} | Affiliate Gadget`,
        description: `Klaim voucher ${code} di Affiliate Gadget. 100% Produk Original & Bergaransi Resmi.`,
        url: `${baseUrl}/voucher/claim?code=${encodeURIComponent(code)}`,
        siteName: 'Affiliate Gadget',
        images: [
          {
            url: `${baseUrl}/api/vouchers/og?code=${encodeURIComponent(code)}&v=2`,
            width: 800,
            height: 800,
            alt: `Voucher Promo ${code}`,
          },
        ],
      },
    }
  }

  const isFixed = voucher.discountType === 'FIXED_AMOUNT'
  const discountLabel = isFixed
    ? `Potongan Langsung Rp ${(voucher.discountAmount || 0).toLocaleString('id-ID')}`
    : `Diskon ${voucher.discountPercent}% OFF${voucher.maxDiscountAmount ? ` (Maks. Rp ${voucher.maxDiscountAmount.toLocaleString('id-ID')})` : ''}`

  const storeName = voucher.store?.name || 'Seluruh Cabang Toko Resmi'
  const minPurchaseLabel =
    voucher.minimumPurchase > 0
      ? `Min. Belanja Rp ${voucher.minimumPurchase.toLocaleString('id-ID')}`
      : 'Tanpa Min. Belanja'

  const title = `🎟️ ${discountLabel} (Kode: ${voucher.code}) | Affiliate Gadget`
  const description = `Klaim kupon voucher ${voucher.code} sekarang! Dapatkan ${discountLabel}. ${minPurchaseLabel} • Khusus ${storeName}. Garansi 30 Hari Tukar Unit Baru & Proteksi Asuransi Resmi.`
  const ogImageUrl = `${baseUrl}/api/vouchers/og?code=${encodeURIComponent(voucher.code)}&v=2`

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/voucher/claim?code=${encodeURIComponent(voucher.code)}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/voucher/claim?code=${encodeURIComponent(voucher.code)}`,
      siteName: 'Affiliate Gadget',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 800,
          alt: `Voucher Promo ${voucher.code}`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default function VoucherClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      }
    >
      <VoucherClaimView />
    </Suspense>
  )
}
