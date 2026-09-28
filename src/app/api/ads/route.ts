import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const placement = searchParams.get('placement')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const now = new Date()
    const whereClause: any = {
      isActive: true,
      status: 'APPROVED',
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    }

    if (placement) {
      whereClause.placement = placement
    }

    // Level 1: Eksklusif, hanya 1 iklan yang boleh tayang pada satu waktu
    const effectiveLimit = placement === 'HOMEPAGE_HERO' ? 1 : limit

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
      orderBy: [
        { priority: 'desc' },
        { startDate: 'desc' },
        { createdAt: 'desc' },
      ],
      take: effectiveLimit,
    })

    // Pre-fetch related product details for product-targeted ads
    const productIds = Array.from(
      new Set(
        ads
          .map((a) => {
            if (a.productId) return a.productId
            if (
              a.targetUrl?.startsWith('/gadget/') &&
              a.targetUrl !== '/gadget'
            ) {
              return a.targetUrl.replace('/gadget/', '').split('?')[0]
            }
            return null
          })
          .filter((id): id is string => Boolean(id))
      )
    )

    const productsMap = new Map<string, any>()
    if (productIds.length > 0) {
      const [prods, salesGroup] = await Promise.all([
        prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            brand: true,
            images: true,
            stock: true,
            rating: true,
            totalReview: true,
          },
        }),
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            productId: { in: productIds },
            order: { status: { not: 'CANCELLED' } },
          },
          _sum: { quantity: true },
        }),
      ])

      const salesMap = new Map<string, number>()
      salesGroup.forEach((s) => {
        if (s.productId) {
          salesMap.set(s.productId, s._sum.quantity || 0)
        }
      })

      prods.forEach((p) =>
        productsMap.set(p.id, {
          ...p,
          soldCount: salesMap.get(p.id) || 0,
        })
      )
    }

    const formattedAds = ads.map((a) => {
      const resolvedProductId =
        a.productId ||
        (a.targetUrl?.startsWith('/gadget/') && a.targetUrl !== '/gadget'
          ? a.targetUrl.replace('/gadget/', '').split('?')[0]
          : null)

      const relatedProduct = resolvedProductId
        ? productsMap.get(resolvedProductId) || null
        : null

      // Aturan: Jika admin store menginput custom image, pakai apa yang diinput admin store.
      // Jika tidak ada / kosong, ambil dari poster toko (store.banner), foto produk, atau platform poster.
      const fallbackPoster =
        relatedProduct?.images?.[0] ||
        (a.placement === 'HOMEPAGE_HERO'
          ? a.store?.banner || '/images/banners/samsung-campaign-banner.jpg'
          : a.store?.banner || '/images/banners/samsung-mobile-hero.jpg')

      const isVideo =
        Boolean(a.bannerUrl) &&
        (a.bannerUrl.toLowerCase().endsWith('.mp4') ||
          a.bannerUrl.toLowerCase().endsWith('.webm') ||
          a.bannerUrl.toLowerCase().endsWith('.ogg') ||
          a.bannerUrl.toLowerCase().includes('.mp4?') ||
          a.bannerUrl.toLowerCase().includes('/video/') ||
          a.bannerUrl.toLowerCase().includes('video/upload'))

      const finalImageUrl = isVideo
        ? fallbackPoster
        : a.bannerUrl && a.bannerUrl.trim() !== ''
          ? a.bannerUrl
          : fallbackPoster

      return {
        ...a,
        imageUrl: finalImageUrl,
        videoUrl: isVideo ? a.bannerUrl : null,
        product: relatedProduct,
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
