import prisma from '@/lib/db'
import { notFound } from 'next/navigation'
import BlogDetailClient from './blog-detail-client'

// Enable ISR - revalidate every 5 minutes
export const revalidate = 300

// Pre-generate all published blog posts at build time
export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    select: { slug: true },
  })

  return articles.map((article) => ({
    slug: article.slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const article = await prisma.article.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, excerpt: true, coverImage: true },
  })

  if (!article) {
    return { title: 'Article Not Found - HaloTekno' }
  }

  return {
    title: `${article.title} - Blog HaloTekno`,
    description:
      article.excerpt || `Baca artikel ${article.title} di HaloTekno`,
    openGraph: {
      title: article.title,
      description: article.excerpt || '',
      images: article.coverImage ? [article.coverImage] : [],
    },
  }
}

// Fetch article on server
async function getArticle(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug, isPublished: true },
    })

    if (!article) return null

    // Get related articles from same category
    const relatedArticles = await prisma.article.findMany({
      where: {
        isPublished: true,
        id: { not: article.id },
        category: article.category,
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
      },
    })

    return {
      article: {
        ...article,
        publishedAt: article.publishedAt?.toISOString() || null,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      },
      relatedArticles,
    }
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getArticle(slug)

  if (!data) {
    notFound()
  }

  return (
    <BlogDetailClient
      article={data.article}
      relatedArticles={data.relatedArticles}
    />
  )
}
