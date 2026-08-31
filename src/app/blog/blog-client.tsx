'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { Search, Calendar, ArrowUpRight, Sparkles } from 'lucide-react'
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

export default function BlogClientPage({ initialArticles }: BlogClientProps) {
  const [articles] = useState<Article[]>(initialArticles)
  const [searchTerm, setSearchTerm] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar variant="light" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] opacity-40 [background-size:16px_16px]"></div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div
            className={`mb-6 inline-flex transform items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            <Sparkles className="h-3 w-3" />
            Affiliate Gadget Blog
          </div>
          <h1
            className={`mb-6 transform text-5xl font-extrabold tracking-tight text-slate-900 transition-all delay-100 duration-700 sm:text-6xl ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            Wawasan seputar{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Teknologi
            </span>
          </h1>
          <p
            className={`mx-auto max-w-2xl transform text-lg text-slate-600 transition-all delay-200 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            Temukan berbagai tips, tutorial, dan berita terkini untuk
            memaksimalkan gadget dan perangkat elektronik Anda.
          </p>

          {/* Premium Search Bar */}
          <div
            className={`mx-auto mt-10 max-w-xl transform transition-all delay-300 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-200 to-cyan-200 opacity-25 blur transition duration-1000 group-hover:opacity-50 group-hover:duration-200"></div>
              <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <Search className="ml-4 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari artikel menarik..."
                  className="w-full bg-transparent py-4 pl-3 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Masonry Layout */}
        {filteredArticles.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-100 bg-white py-20 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
              <Search className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Artikel tidak ditemukan
            </h3>
            <p className="mt-2 text-slate-500">
              Coba gunakan kata kunci lain untuk pencarian Anda.
            </p>
          </div>
        ) : (
          /* Masonry Grid with CSS Columns */
          <div className="mt-12 columns-2 gap-4 space-y-4 md:columns-2 md:gap-8 md:space-y-8 lg:columns-3">
            {filteredArticles.map((article, index) => (
              <div
                key={article.id}
                className={`transform break-inside-avoid transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
                style={{ transitionDelay: `${100 + index * 50}ms` }}
              >
                <Link
                  href={`/blog/${article.slug}`}
                  className="group block h-full"
                >
                  <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                    {/* Image Container - Varied Height for Masonry */}
                    {(() => {
                      const aspects = [
                        'aspect-square',
                        'aspect-[4/5]',
                        'aspect-[3/4]',
                        'aspect-video',
                        'aspect-[5/4]',
                      ]
                      const aspectClass = aspects[index % aspects.length]
                      return (
                        <div
                          className={`relative overflow-hidden ${aspectClass}`}
                        >
                          <div className="absolute inset-0 animate-pulse bg-slate-200"></div>
                          {article.coverImage && (
                            <img
                              src={article.coverImage}
                              alt={article.title}
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                          {/* Floating Category Badge */}
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
                      )
                    })()}

                    {/* Content */}
                    <div className="hidden p-6 md:block md:p-8">
                      <div className="mb-4 flex items-center gap-3 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(
                            article.publishedAt || article.createdAt
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
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
            ))}
          </div>
        )}
      </main>

      <Footer variant="light" />
    </div>
  )
}
