'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Calendar,
  Tag,
  Clock,
  ArrowLeft,
  Share2,
  Loader2,
  BookOpen,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Article {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string | null
  coverImage: string | null
  category: string | null
  tags: string[]
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export default function BlogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) {
      fetchArticle(params.slug as string)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug])

  const fetchArticle = async (slug: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/blog/${slug}`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/blog')
          toast.error('Artikel tidak ditemukan')
          return
        }
        throw new Error('Failed to fetch article')
      }

      const data = await res.json()
      setArticle(data.article)
    } catch (error) {
      console.error('Error fetching article:', error)
      toast.error('Gagal memuat artikel')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || '',
          url: window.location.href,
        })
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link berhasil disalin!')
    }
  }

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Memuat artikel...</p>
        </div>
      </div>
    )
  }

  if (!article) {
    return null
  }

  const readTime = calculateReadTime(article.content)
  const defaultCover =
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80'

  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="light" />

      {/* Hero Section with Cover Image Background - Full Screen */}
      <div className="relative h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={article.coverImage || defaultCover}
            alt={article.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col">
          {/* Back Button */}
          <div className="p-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur-md transition-all hover:bg-white/30"
            >
              <ArrowLeft className="h-5 w-5" />
              Kembali
            </Link>
          </div>

          {/* Hero Content - Centered */}
          <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
            <div className="max-w-4xl text-center text-white">
              {/* Category Badge */}
              {article.category && (
                <div className="mb-4 flex items-center justify-center sm:mb-6">
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-lg sm:px-6 sm:py-2 sm:text-sm">
                    {article.category}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="mb-4 text-2xl font-extrabold leading-tight sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
                {article.title}
              </h1>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="mx-auto mb-6 max-w-3xl text-base text-gray-200 sm:mb-8 sm:text-xl md:text-2xl">
                  {article.excerpt}
                </p>
              )}

              {/* Meta Info */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm sm:mb-8 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md sm:h-10 sm:w-10">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="font-semibold">HaloTekno</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm">
                    {new Date(
                      article.publishedAt || article.createdAt
                    ).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm">
                    {readTime} menit baca
                  </span>
                </div>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full bg-white/20 px-6 py-2.5 text-sm font-semibold backdrop-blur-md transition-all hover:scale-105 hover:bg-white/30 sm:px-8 sm:py-3 sm:text-base"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                Bagikan Artikel
              </button>
            </div>
          </div>

          {/* Scroll Indicator - Hidden on Mobile */}
          <div className="hidden pb-8 text-center md:block">
            <div className="inline-flex flex-col items-center gap-2 text-white">
              <span className="text-sm opacity-80">Scroll untuk membaca</span>
              <div className="h-8 w-5 rounded-full border-2 border-white/50 p-1">
                <div className="h-2 w-1 animate-bounce rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="relative">
        {/* Background Image with Light Gradient Overlay */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=80)',
            }}
          ></div>
          {/* Light gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-cyan-50/95"></div>
        </div>

        <article className="relative z-10 mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-200/50 sm:p-12 lg:p-16">
            {/* Rich Content with Custom Styles */}
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags Section */}
            {article.tags.length > 0 && (
              <div className="mt-16 border-t-2 border-gray-100 pt-8">
                <div className="mb-6 flex items-center gap-3">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="cursor-pointer rounded-full border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition-shadow hover:shadow-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Share & Navigation */}
        <section className="relative z-10 mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-center text-white shadow-xl">
            <h3 className="text-2xl font-bold">Suka artikel ini?</h3>
            <p className="mt-2 text-blue-100">
              Bagikan ke teman atau simpan untuk dibaca nanti
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-blue-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                <Share2 className="h-5 w-5" />
                Bagikan
              </button>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <BookOpen className="h-5 w-5" />
                Artikel Lainnya
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer variant="light" />

      {/* Custom Styles for Article Content */}
      <style jsx global>{`
        .article-content {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 1.125rem;
          line-height: 1.8;
          color: #374151;
        }

        .article-content h1 {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 2.25rem;
          font-weight: 800;
          color: #111827;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          line-height: 1.2;
          border-bottom: 3px solid #e5e7eb;
          padding-bottom: 1rem;
        }

        .article-content h2 {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e40af;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }

        .article-content h3 {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.375rem;
          font-weight: 600;
          color: #1d4ed8;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .article-content p {
          margin-bottom: 1.5rem;
          text-align: justify;
        }

        .article-content a {
          color: #2563eb;
          font-weight: 500;
          text-decoration: underline;
          text-decoration-color: #93c5fd;
          text-underline-offset: 2px;
          transition: all 0.2s;
        }

        .article-content a:hover {
          color: #1d4ed8;
          text-decoration-color: #2563eb;
        }

        .article-content strong {
          color: #111827;
          font-weight: 700;
        }

        .article-content em {
          font-style: italic;
          color: #4b5563;
        }

        .article-content ul,
        .article-content ol {
          margin: 1.5rem 0;
          padding-left: 2rem;
          list-style-position: outside;
        }

        .article-content ul {
          list-style-type: disc;
        }

        .article-content ol {
          list-style-type: decimal;
        }

        .article-content li {
          margin-bottom: 0.75rem;
          padding-left: 0.5rem;
          display: list-item;
        }

        .article-content ul li::marker {
          color: #3b82f6;
        }

        .article-content ol li::marker {
          color: #3b82f6;
          font-weight: 600;
        }

        .article-content blockquote {
          margin: 2rem 0;
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
          border-left: 5px solid #3b82f6;
          border-radius: 0 1rem 1rem 0;
          font-style: italic;
          color: #1e40af;
        }

        .article-content code {
          font-family: 'Fira Code', 'Monaco', monospace;
          font-size: 0.875rem;
          background: #f1f5f9;
          color: #0369a1;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
        }

        .article-content pre {
          margin: 2rem 0;
          padding: 1.5rem;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 1rem;
          overflow-x: auto;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.3);
        }

        .article-content pre code {
          background: none;
          color: #e2e8f0;
          padding: 0;
          border: none;
          font-size: 0.9rem;
        }

        .article-content img {
          margin: 2rem auto;
          border-radius: 1rem;
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.15);
          max-width: 100%;
          height: auto;
        }

        .article-content table {
          width: 100%;
          margin: 2rem 0;
          border-collapse: collapse;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.1);
        }

        .article-content th {
          background: linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%);
          color: white;
          font-weight: 600;
          text-align: left;
          padding: 1rem;
        }

        .article-content td {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .article-content tr:hover td {
          background: #f8fafc;
        }

        .article-content hr {
          margin: 3rem 0;
          border: none;
          height: 2px;
          background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
        }
      `}</style>
    </div>
  )
}
