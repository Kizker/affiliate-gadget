import prisma from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { Calendar, ArrowUpRight, Sparkles } from 'lucide-react'
import { Suspense } from 'react'
import BlogSearch from './blog-search'

// Force static generation with ISR
export const dynamic = 'force-static'
export const revalidate = 300 // 5 minutes

export const metadata = {
  title: 'Blog - HaloTekno',
  description:
    'Tips, tutorial, dan berita terbaru seputar teknologi, gadget, dan servis HP',
}

// Fetch articles on server
async function getArticles() {
  try {
    const articles = await prisma.article.findMany({
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
        publishedAt: true,
        createdAt: true,
      },
    })
    return articles
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

// Helper to get aspect class based on index
function getAspectClass(index: number) {
  const aspects = [
    'aspect-square',
    'aspect-[4/5]',
    'aspect-[3/4]',
    'aspect-video',
    'aspect-[5/4]',
  ]
  return aspects[index % aspects.length]
}

// Server Component - Article Card (no client JS)
function ArticleCard({
  article,
  index,
}: {
  article: Awaited<ReturnType<typeof getArticles>>[0]
  index: number
}) {
  const aspectClass = getAspectClass(index)
  const date = new Date(
    article.publishedAt || article.createdAt
  ).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="break-inside-avoid">
      <Link href={`/blog/${article.slug}`} className="group block h-full">
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
          {/* Image Container */}
          <div className={`relative overflow-hidden ${aspectClass}`}>
            <div className="absolute inset-0 bg-slate-200"></div>
            {article.coverImage && (
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                loading={index < 6 ? 'eager' : 'lazy'}
                priority={index < 3}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

            {/* Category Badge */}
            {article.category && (
              <div className="absolute left-4 top-4">
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 shadow-sm backdrop-blur-md">
                  {article.category}
                </span>
              </div>
            )}

            {/* Mobile Title Overlay */}
            <div className="absolute bottom-0 left-0 z-10 w-full p-4 md:hidden">
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
              <h2 className="line-clamp-2 text-xs font-bold leading-snug text-white drop-shadow-sm">
                {article.title}
              </h2>
            </div>
          </div>

          {/* Content - Desktop */}
          <div className="hidden p-6 md:block md:p-8">
            <div className="mb-4 flex items-center gap-3 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {date}
              </span>
            </div>

            <h2 className="mb-3 text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 md:text-2xl">
              {article.title}
            </h2>

            {article.excerpt && (
              <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-500">
                {article.excerpt}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-6">
              <span className="group/btn flex items-center gap-1 text-sm font-semibold text-blue-600">
                Baca Selengkapnya
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

// Loading skeleton for streaming
function ArticlesSkeleton() {
  return (
    <div className="mt-12 columns-2 gap-4 space-y-4 md:columns-2 md:gap-8 md:space-y-8 lg:columns-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse break-inside-avoid">
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="aspect-[4/5] rounded-2xl bg-slate-200"></div>
            <div className="mt-4 hidden space-y-3 md:block">
              <div className="h-4 w-24 rounded bg-slate-200"></div>
              <div className="h-6 w-3/4 rounded bg-slate-200"></div>
              <div className="h-4 w-full rounded bg-slate-200"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Articles grid component
async function ArticlesGrid() {
  const articles = await getArticles()

  if (articles.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-100 bg-white py-20 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
          <Sparkles className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Belum ada artikel</h3>
        <p className="mt-2 text-slate-500">
          Artikel akan segera hadir. Nantikan!
        </p>
      </div>
    )
  }

  return (
    <div className="mt-12 columns-2 gap-4 space-y-4 md:columns-2 md:gap-8 md:space-y-8 lg:columns-3">
      {articles.map((article, index) => (
        <ArticleCard key={article.id} article={article} index={index} />
      ))}
    </div>
  )
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar variant="light" />

      {/* Hero Section - Pure CSS animations, no JS */}
      <section className="relative overflow-hidden bg-white px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] opacity-40 [background-size:16px_16px]"></div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            <Sparkles className="h-3 w-3" />
            HaloTekno Blog
          </div>
          <h1 className="animate-fade-in-up mb-6 text-5xl font-extrabold tracking-tight text-slate-900 [animation-delay:100ms] sm:text-6xl">
            Wawasan seputar{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Teknologi
            </span>
          </h1>
          <p className="animate-fade-in-up mx-auto max-w-2xl text-lg text-slate-600 [animation-delay:200ms]">
            Temukan berbagai tips, tutorial, dan berita terkini untuk
            memaksimalkan gadget dan perangkat elektronik Anda.
          </p>

          {/* Search - Small interactive component */}
          <div className="animate-fade-in-up mx-auto mt-10 max-w-xl [animation-delay:300ms]">
            <BlogSearch />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Suspense fallback={<ArticlesSkeleton />}>
          <ArticlesGrid />
        </Suspense>
      </main>

      <Footer variant="light" />
    </div>
  )
}
