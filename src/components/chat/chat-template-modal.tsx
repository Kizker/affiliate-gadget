'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Edit2,
  Trash2,
  X,
  Loader2,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

export interface ChatTemplateItem {
  id: string
  content: string
  sortOrder?: number
}

interface ChatTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (text: string) => void
}

export function ChatTemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: ChatTemplateModalProps) {
  const [templates, setTemplates] = useState<ChatTemplateItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // State Form Tambah / Edit
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formContent, setFormContent] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/chat/templates')
      const json = await res.json()
      if (res.ok && json.templates) {
        setTemplates(json.templates)
      }
    } catch {
      toast.error('Gagal memuat template chat')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
      setIsEditing(false)
      setEditingId(null)
      setFormContent('')
    }
  }, [isOpen, fetchTemplates])

  const handleSaveTemplate = async () => {
    const trimmed = formContent.trim()
    if (!trimmed) {
      toast.error('Isi template tidak boleh kosong')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        // Edit
        const res = await fetch('/api/admin/chat/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, content: trimmed }),
        })
        if (res.ok) {
          toast.success('Template berhasil diperbarui')
          setTemplates((prev) =>
            prev.map((t) =>
              t.id === editingId ? { ...t, content: trimmed } : t
            )
          )
          setIsEditing(false)
          setEditingId(null)
          setFormContent('')
        }
      } else {
        // Tambah Baru
        const res = await fetch('/api/admin/chat/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmed }),
        })
        const json = await res.json()
        if (res.ok && json.template) {
          toast.success('Template baru berhasil ditambahkan')
          setTemplates((prev) => [...prev, json.template])
          setIsEditing(false)
          setFormContent('')
        }
      }
    } catch {
      toast.error('Gagal menyimpan template')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(
        `/api/admin/chat/templates?id=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        }
      )
      if (res.ok) {
        toast.success('Template berhasil dihapus')
        setTemplates((prev) => prev.filter((t) => t.id !== id))
      }
    } catch {
      toast.error('Gagal menghapus template')
    }
  }

  if (!isOpen) return null

  const filtered = templates.filter((t) =>
    t.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      onClick={onClose}
      className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Template Balasan Cepat
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Add Button Bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 p-3 dark:border-slate-800 sm:px-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari template chat..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditing(true)
              setEditingId(null)
              setFormContent('')
            }}
            className="shadow-2xs inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Form Tambah / Edit Template */}
        {isEditing && (
          <div className="border-b border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50 sm:px-6">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {editingId ? 'Edit Template Chat' : 'Tambah Template Baru'}
            </label>
            <textarea
              rows={2}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Ketik kalimat template balasan..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditingId(null)
                  setFormContent('')
                }}
                className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveTemplate}
                className="flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Simpan</span>
              </button>
            </div>
          </div>
        )}

        {/* List Template Chat */}
        <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800 sm:p-3">
          {loading ? (
            <div className="flex h-36 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-slate-400">
              <p>Belum ada template yang cocok</p>
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-3 rounded-xl p-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="font-mono text-[11px] font-bold text-slate-400">
                    {idx + 1}
                  </span>
                  <p className="line-clamp-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                    {item.content}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true)
                      setEditingId(item.id)
                      setFormContent(item.content)
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    title="Edit Template"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(item.id)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    title="Hapus Template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTemplate(item.content)
                      onClose()
                    }}
                    className="shadow-2xs inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 transition hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <span>Kirim</span>
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
