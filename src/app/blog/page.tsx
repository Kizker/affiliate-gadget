import prisma from '@/lib/db'
import BlogClientPage from './blog-client'

// Enable ISR - revalidate every 5 minutes (blog content changes less frequently)
export const revalidate = 300

export const metadata = {
  title: 'Blog - HaloTekno',
  description:
    'Tips, tutorial, dan berita terbaru seputar teknologi, gadget, dan servis HP',
}

// Fetch articles on server
async function getArticles() {
  try {
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: 12,
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
      }),
      prisma.article.count({ where: { isPublished: true } }),
    ])

    return {
      articles,
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil(total / 12),
        totalItems: total,
      },
    }
  } catch (error) {
    console.error('Error fetching articles:', error)
    return {
      articles: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
    }
  }
}

export default async function BlogPage() {
  const { articles, pagination } = await getArticles()

  return (
    <BlogClientPage initialArticles={articles} initialPagination={pagination} />
  )
}
