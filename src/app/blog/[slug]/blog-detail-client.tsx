'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Calendar,
  Tag,
  Clock,
  ArrowLeft,
  Share2,
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
      // Fallback: copy to clipboard
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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="mx-auto max-w-4xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-5 w-5" />
          Kembali ke Blog
        </Link>

        {/* Article Header */}
        <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {/* Cover Image */}
          {article.coverImage ? (
            <div className="aspect-video overflow-hidden">
              <img
                src={article.coverImage}
                alt={article.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100">
              <BookOpen className="h-24 w-24 text-blue-300" />
            </div>
          )}

          <div className="p-8">
            {/* Meta Info */}
            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {article.category && (
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-600">
                    {article.category}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(
                    article.publishedAt || article.createdAt
                  ).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{readTime} menit baca</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Admin HaloTekno</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                {article.excerpt}
              </p>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="mb-8 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
            >
              <Share2 className="h-4 w-4" />
              Bagikan Artikel
            </button>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-gray-800 prose-pre:bg-gray-900"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="mb-4 font-semibold text-gray-900">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Artikel Terkait
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100">
                    {related.coverImage ? (
                      <img
                        src={related.coverImage}
                        alt={related.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-8 w-8 text-blue-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                      {related.title}
                    </h3>
                    {related.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer variant="light" />
    </div>
  )
}
