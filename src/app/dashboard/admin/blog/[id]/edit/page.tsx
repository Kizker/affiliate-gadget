'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import TemplateSelector from '@/components/blog/template-selector'
import type { BlogTemplate } from '@/lib/blog-templates'

const TinyMCEEditor = dynamic(
  () => import('@/components/blog/tinymce-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    ),
  }
)

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    category: '',
    tags: [] as string[],
    isPublished: false,
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    params.then((p) => {
      setId(p.id)
      fetchArticle(p.id)
    })
  }, [params])

  const fetchArticle = async (articleId: string) => {
    try {
      const res = await fetch(`/api/admin/blog/${articleId}`)
      if (!res.ok) throw new Error('Failed to fetch article')

      const data = await res.json()
      setFormData({
        title: data.article.title || '',
        slug: data.article.slug || '',
        content: data.article.content || '',
        excerpt: data.article.excerpt || '',
        coverImage: data.article.coverImage || '',
        category: data.article.category || '',
        tags: data.article.tags || [],
        isPublished: data.article.isPublished || false,
      })
    } catch (error) {
      console.error('Error fetching article:', error)
      toast.error('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: BlogTemplate) => {
    if (confirm('This will replace your current content. Continue?')) {
      setFormData({
        ...formData,
        content: template.content,
      })
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  const handleSubmit = async (publish: boolean) => {
    if (!formData.title || !formData.content) {
      toast.error('Please fill in title and content')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isPublished: publish,
          publishedAt:
            publish && !formData.isPublished
              ? new Date().toISOString()
              : undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to update article')

      toast.success('Article updated successfully!')
      router.push('/dashboard/admin/blog')
    } catch (error) {
      console.error('Error updating article:', error)
      toast.error('Failed to update article')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit(false)}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 font-medium text-white shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {formData.isPublished ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {/* Title & Slug */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Article Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter your article title..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="auto-generated-from-title"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Template Selector Button */}
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-4 text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-100"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Apply Template</span>
          </button>

          {/* Content Editor */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="mb-4 block text-sm font-medium text-gray-700">
              Content *
            </label>
            <TinyMCEEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Image size must be less than 5MB')
                      return
                    }
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setFormData({
                        ...formData,
                        coverImage: reader.result as string,
                      })
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
              {formData.coverImage && (
                <div className="relative mt-3">
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: '' })}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select category</option>
                <option value="Tech">Tech</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Review">Review</option>
                <option value="News">News</option>
                <option value="Tips">Tips</option>
              </select>
            </div>
          </div>

          {/* Excerpt & Tags */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                placeholder="Brief description of your article..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                  }
                  placeholder="Add a tag..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleAddTag}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  )
}
