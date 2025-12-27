'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="mt-2 text-gray-600">
            Create and manage your blog articles
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/admin/blog/new')}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          New Article
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Articles</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>
            <div className="rounded-xl bg-blue-500 p-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Published</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.published}
              </p>
            </div>
            <div className="rounded-xl bg-green-500 p-3">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Drafts</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.drafts}
              </p>
            </div>
            <div className="rounded-xl bg-yellow-500 p-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setStatusFilter('all')
              setPage(1)
            }}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setStatusFilter('published')
              setPage(1)
            }}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              statusFilter === 'published'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => {
              setStatusFilter('draft')
              setPage(1)
            }}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              statusFilter === 'draft'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Drafts
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {/* Articles List */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No articles found</p>
            <button
              onClick={() => router.push('/dashboard/admin/blog/new')}
              className="mt-4 text-blue-600 hover:underline"
            >
              Create your first article
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="group p-6 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          article.isPublished
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {article.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {article.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {article.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.createdAt).toLocaleDateString(
                          'id-ID'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/admin/blog/${article.id}/edit`)
                      }
                      className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
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
