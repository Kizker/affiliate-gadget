'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BlogSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/blog?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="group relative">
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
    </form>
  )
}
