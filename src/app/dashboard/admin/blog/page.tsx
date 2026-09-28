'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePageGuard } from '@/hooks/use-page-guard'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Calendar,
  Tag,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  tags: string[]
  isPublished: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export default function BlogAdminPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/blog'
  )
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [, setTotal] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
  })

  useEffect(() => {
    fetchArticles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const res = await fetch(`/api/admin/blog?${params}`)
      if (!res.ok) throw new Error('Failed to fetch articles')

      const data = await res.json()
      setArticles(data.articles || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete article')

      toast.success('Article deleted successfully')
      fetchArticles()
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Failed to delete article')
    }
  }

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8 py-6 sm:py-8">
      {/* 1. Header Hero Section */}
      <div className="shadow-xs flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <FileText className="h-3.5 w-3.5 text-orange-500" />
            <span>Pusat Edukasi, Tips Gadget & Berita Toko</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Artikel & Panduan Gadget
          </h1>

          <p className="max-w-xl text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
            Tulis artikel review smartphone second, panduan klaim garansi 30
            hari tukar unit, dan tips perawatan gadget.
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/admin/blog/new')}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-orange-500 px-6 py-3 text-xs font-semibold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>+ Tulis Artikel Baru</span>
        </button>
      </div>

      {/* 2. 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Artikel
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Semua konten terbit & draft
          </p>
        </div>

        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Artikel Terbit
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.published}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Live di website publik
          </p>
        </div>

        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Draft Tersimpan
          </p>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.drafts}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Menunggu review editorial
          </p>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="shadow-xs flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'Semua Artikel' },
            { id: 'published', label: 'Terbit' },
            { id: 'draft', label: 'Draft' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as any)
                setPage(1)
              }}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                statusFilter === tab.id
                  ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul artikel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* 4. Articles List */}
      <div className="shadow-xs overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs font-medium">Memuat artikel...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="space-y-3 p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <FileText className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Belum ada artikel
            </p>
            <p className="text-xs text-slate-400">
              Mulai tulis artikel baru untuk memberikan panduan kepada
              pelanggan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="group flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        article.isPublished
                          ? 'border border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'border border-amber-200/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}
                    >
                      {article.isPublished ? 'Terbit' : 'Draft'}
                    </span>
                    {article.category && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {article.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 transition group-hover:text-orange-600 dark:text-white">
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {article.excerpt}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/admin/blog/${article.id}/edit`)
                    }
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="rounded-full p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Hapus Artikel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="border-t border-slate-100 p-6 dark:border-slate-800">
            <div className="flex justify-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      type="button"
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`rounded-lg px-4 py-2 ${
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
                  className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
