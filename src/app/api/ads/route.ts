import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const placement = searchParams.get('placement')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const whereClause: any = {
      isActive: true,
      status: 'APPROVED',
    }

    if (placement) {
      whereClause.placement = placement
    }

    const ads = await prisma.internalAd.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            city: true,
            companyName: true,
            banner: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })

    const formattedAds = ads.map((a) => {
      // Aturan: Jika admin store menginput custom image, pakai apa yang diinput admin store.
      // Jika tidak ada / kosong, ambil dari poster toko (store.banner) atau platform poster.
      const fallbackPoster =
        a.placement === 'HOMEPAGE_HERO'
          ? a.store?.banner || '/images/banners/samsung-campaign-banner.jpg'
          : a.store?.banner || '/images/banners/samsung-mobile-hero.jpg'

      const finalImageUrl =
        a.bannerUrl && a.bannerUrl.trim() !== '' ? a.bannerUrl : fallbackPoster

      return {
        ...a,
        imageUrl: finalImageUrl,
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedAds,
    })
  } catch (error: any) {
    console.error('Error fetching internal ads:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memuat iklan', error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { adId, action } = body

    if (!adId) {
      return NextResponse.json(
        { success: false, message: 'adId diperlukan' },
        { status: 400 }
      )
    }

    if (action === 'click') {
      await prisma.internalAd.update({
        where: { id: adId },
        data: { clicks: { increment: 1 } },
      })
    } else if (action === 'impression') {
      await prisma.internalAd.update({
        where: { id: adId },
        data: { impressions: { increment: 1 } },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error logging ad action:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mencatat interaksi iklan' },
      { status: 500 }
    )
  }
}
