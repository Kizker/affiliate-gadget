'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  BookOpen,
  ChevronRight,
  Bookmark,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

interface Article {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string | null
  coverImage: string | null
  category: string | null
  tags: string[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

interface RelatedArticle {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImage: string | null
  category: string | null
}

interface BlogDetailClientProps {
  article: Article
  relatedArticles: RelatedArticle[]
}

export default function BlogDetailClient({
  article,
  relatedArticles,
}: BlogDetailClientProps) {
  const [mounted, setMounted] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)

  // Handle mounting animation
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll progress
  useEffect(() => {
    const updateProgress = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }

    window.addEventListener('scroll', updateProgress)
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || '',
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link berhasil disalin!')
    }
  }

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const readTime = calculateReadTime(article.content)

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Reading Progress Bar */}
      <div className="fixed left-0 top-0 z-50 h-1 w-full bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <Navbar variant="light" />

      {/* Immersive Hero Section */}
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-900">
        {/* Background Image with Parallax-like feel (static for now but full cover) */}
        <div className="absolute inset-0">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover opacity-60"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800">
              <BookOpen className="h-32 w-32 text-slate-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30"></div>
        </div>

        {/* Hero Content - Centered */}
        <div className="container relative mx-auto max-w-4xl px-4 text-center">
          <div
            className={`transform transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
            {article.category && (
              <span className="mb-6 inline-block rounded-full bg-blue-600/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm">
                {article.category}
              </span>
            )}
            <h1 className="mb-6 text-3xl font-extrabold leading-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl">
              {article.title}
            </h1>

            <div className="mb-10 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-300 md:gap-6 md:text-base">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-blue-400 to-cyan-300 font-bold text-slate-900">
                  A
                </div>
                <span className="font-medium text-white">Admin Affiliate Gadget</span>
              </div>
              <div className="hidden h-1.5 w-1.5 rounded-full bg-slate-500 md:block"></div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(
                    article.publishedAt || article.createdAt
                  ).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="hidden h-1.5 w-1.5 rounded-full bg-slate-500 md:block"></div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readTime} menit baca</span>
              </div>
            </div>

            {/* Action Buttons in Hero */}
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
              >
                <Share2 className="h-4 w-4" />
                Bagikan
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Content Body */}
        <div
          className={`transform bg-white transition-all delay-500 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
        >
          <div
            className="prose prose-lg max-w-none text-slate-700 md:prose-xl prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:rounded-r-lg prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:not-italic prose-strong:text-slate-900 prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-slate-800 prose-code:before:content-[''] prose-code:after:content-[''] prose-img:my-8 prose-img:rounded-2xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags Section */}
          {article.tags.length > 0 && (
            <div className="mt-16 border-t border-slate-100 pt-8">
              <div className="flex items-start gap-2">
                <div className="mt-1">
                  <Bookmark className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="cursor-pointer rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div
            className={`mb-20 mt-20 transform transition-all delay-700 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">
                Artikel Terkait
              </h3>
              <Link
                href="/blog"
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
              >
                Lihat Semua <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link
                  href={`/blog/${related.slug}`}
                  key={related.id}
                  className="group block h-full"
                >
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-video overflow-hidden">
                      {related.coverImage ? (
                        <Image
                          src={related.coverImage}
                          alt={related.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100">
                          <BookOpen className="h-10 w-10 text-slate-300" />
                        </div>
                      )}
                      {related.category && (
                        <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 backdrop-blur">
                          {related.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h4 className="mb-2 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                        {related.title}
                      </h4>
                      {related.excerpt && (
                        <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-500">
                          {related.excerpt}
                        </p>
                      )}
                      <div className="mt-auto flex items-center text-sm font-semibold text-blue-600">
                        Baca Artikel{' '}
                        <ArrowLeft className="ml-1 h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer variant="light" />
    </div>
  )
}
