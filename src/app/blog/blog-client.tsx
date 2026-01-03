'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Search,
  Calendar,
  Tag,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImage: string | null
  category: string | null
  tags: string[]
  publishedAt: Date | null
  createdAt: Date
}

interface BlogClientProps {
  initialArticles: Article[]
  initialPagination: {
    currentPage: number
    totalPages: number
    totalItems: number
  }
}

export default function BlogClientPage({
  initialArticles,
  initialPagination,
}: BlogClientProps) {
  const [articles] = useState<Article[]>(initialArticles)
  const [pagination] = useState(initialPagination)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter articles by search term (client-side for instant feedback)
  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-gray-900">
            Blog HaloTekno
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Tips, tutorial, dan berita terbaru seputar teknologi, gadget, dan
            servis HP
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto mb-10 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari artikel..."
              className="w-full rounded-xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Tidak ada artikel ditemukan
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Coba kata kunci lain'
                : 'Belum ada artikel yang dipublikasikan'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-xl"
                >
                  {/* Cover Image */}
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100">
                    {article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-12 w-12 text-blue-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category */}
                    {article.category && (
                      <div className="mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">
                          {article.category}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="mb-2 line-clamp-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                      {article.title}
                    </h2>

                    {/* Excerpt */}
                    {article.excerpt && (
                      <p className="mb-4 line-clamp-3 text-gray-600">
                        {article.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(
                            article.publishedAt || article.createdAt
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  disabled={pagination.currentPage <= 1}
                  className="flex items-center gap-1 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </button>
                <div className="flex gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`h-10 w-10 rounded-lg transition-colors ${
                        pagination.currentPage === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="flex items-center gap-1 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer variant="light" />
    </div>
  )
}
