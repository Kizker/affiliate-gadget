'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Search,
  Calendar,
  Tag,
  Loader2,
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

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [, setTotal] = useState(0)

  useEffect(() => {
    fetchArticles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, page])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      })

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      const res = await fetch(`/api/blog?${params}`)
      if (!res.ok) throw new Error('Failed to fetch articles')

      const data = await res.json()
      setArticles(data.articles || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = ['all', 'Tech', 'Tutorial', 'Review', 'News', 'Tips']

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="fixed inset-0 -z-10">
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

      <Navbar variant="light" />

      <main className="relative pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 py-20 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Blog & Artikel</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
                Tips & Panduan Teknologi
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-blue-100 md:text-xl">
                Baca artikel pilihan seputar servis HP, sparepart, dan teknologi
                terkini dari para ahli HaloTekno
              </p>
            </div>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="sticky top-16 z-10 border-b border-gray-200 bg-white/80 py-6 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari artikel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat)
                      setPage(1)
                    }}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? 'Semua' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <BookOpen className="h-16 w-16 text-gray-400" />
                <p className="mt-4 text-lg text-gray-500">
                  {searchQuery
                    ? 'Tidak ada artikel yang ditemukan'
                    : 'Belum ada artikel yang dipublikasikan'}
                </p>
              </div>
            ) : (
              <div className="columns-2 gap-3 sm:gap-4 md:columns-2 lg:columns-3 xl:columns-4">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="group mb-3 block break-inside-avoid overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-xl sm:mb-4"
                  >
                    {/* Cover Image */}
                    <div className="overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100">
                      {article.coverImage ? (
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center">
                          <BookOpen className="h-10 w-10 text-blue-300 sm:h-12 sm:w-12" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4">
                      {/* Category & Date */}
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {article.category && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {article.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(
                            article.publishedAt || article.createdAt
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mb-1 line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-blue-600 sm:text-base">
                        {article.title}
                      </h3>

                      {/* Excerpt - Hidden on very small screens */}
                      {article.excerpt && (
                        <p className="line-clamp-2 hidden text-xs text-gray-600 sm:block sm:text-sm">
                          {article.excerpt}
                        </p>
                      )}

                      {/* Tags */}
                      {article.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {article.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center gap-0.5 text-[10px] text-gray-500 sm:text-xs"
                            >
                              <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="mt-8 flex justify-center px-4">
                <div className="flex gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-2 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:px-4"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`rounded-lg px-3 py-2 text-sm sm:px-4 ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 transition-colors hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-2 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:px-4"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer variant="light" />
    </div>
  )
}
