import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Build where clause - only published articles
    const where: Record<string, unknown> = {
      isPublished: true,
    }

    if (category && category !== 'all') {
      where.category = category
    }

    // Get total count for pagination
    const total = await prisma.article.count({ where })

    // Get published articles
    const articles = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
        tags: true,
        publishedAt: true,
        createdAt: true,
      },
    })

    // Cache response for 60 seconds, serve stale for up to 5 minutes while revalidating
    const headers = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    }

    return NextResponse.json(
      {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('Error fetching public articles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
