'use client'

import { blogTemplates, type BlogTemplate } from '@/lib/blog-templates'
import { X } from 'lucide-react'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: BlogTemplate) => void
}

export default function TemplateSelector({
  isOpen,
  onClose,
  onSelect,
}: TemplateSelectorProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Choose a Template
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Start with a pre-made template or create from scratch
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blogTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template)
                onClose()
              }}
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-blue-500 hover:shadow-lg"
            >
              <div className="mb-3 text-4xl">{template.icon}</div>
              <h3 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-blue-600">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600">{template.description}</p>
              <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
                  Use Template
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
