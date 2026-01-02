'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { SearchBar } from '@/components/catalog/search-bar'
import { FilterSidebar } from '@/components/catalog/filter-sidebar'
import FloatingChatButton from '@/components/chat/floating-chat-button'
import {
  MessageCircle,
  Wrench,
  Settings,
  Star,
  MapPin,
  Filter,
  X,
  ChevronRight,
  Clock,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Technician interface
interface Technician {
  id: string
  name: string
  photo: string
  specialization: string
  rating: number
  reviewCount: number
  completedJobs: number
  location: string
  available: boolean
  responseTime: string
}

// API Response Technician interface
interface ApiTechnician {
  id: string
  user?: {
    id: string
    name: string | null
    image: string | null
  }
  specialties?: string[]
  rating?: number
  totalReview?: number
  experience?: number
  isAvailable?: boolean
  location?: string
}

const filterGroups = [
  {
    title: 'Spesialisasi',
    type: 'checkbox' as const,
    options: [
      { value: 'iphone', label: 'iPhone', count: 45 },
      { value: 'samsung', label: 'Samsung', count: 38 },
      { value: 'laptop', label: 'Laptop', count: 28 },
      { value: 'tablet', label: 'Tablet', count: 15 },
      { value: 'xiaomi', label: 'Xiaomi', count: 32 },
    ],
  },
  {
    title: 'Rating',
    type: 'checkbox' as const,
    options: [
      { value: '4.5+', label: '4.5+ ⭐', count: 89 },
      { value: '4.0+', label: '4.0+ ⭐', count: 120 },
    ],
  },
  {
    title: 'Ketersediaan',
    type: 'checkbox' as const,
    options: [
      { value: 'available', label: 'Online Sekarang', count: 65 },
      { value: 'today', label: 'Tersedia Hari Ini', count: 85 },
    ],
  },
]

interface ServicePageProps {
  serviceType: 'konsultasi' | 'cek-bongkar' | 'jasa-servis'
}

export default function ServiceTechnicianList({
  serviceType,
}: ServicePageProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch technicians from API
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/technicians')
        const data = await response.json()

        if (data.technicians) {
          // Transform API data to match our interface
          const transformedData: Technician[] = data.technicians.map(
            (tech: ApiTechnician) => ({
              id: tech.user?.id || tech.id,
              name: tech.user?.name || 'Teknisi',
              photo:
                tech.user?.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.user?.name || 'T')}&background=3b82f6&color=fff`,
              specialization:
                tech.specialties?.join(', ') || 'Spesialis Servis HP',
              rating: tech.rating || 4.8,
              reviewCount: tech.totalReview || 0,
              completedJobs: tech.experience || 0,
              location: tech.location || 'Jakarta',
              available: tech.isAvailable !== false,
              responseTime: '< 10 menit',
            })
          )
          setTechnicians(transformedData)
        }
      } catch (error) {
        console.error('Error fetching technicians:', error)
        setTechnicians([])
      } finally {
        setLoading(false)
      }
    }

    fetchTechnicians()
  }, [])

  const serviceInfo = {
    konsultasi: {
      title: 'Konsultasi Servis',
      subtitle: 'Gratis',
      description:
        'Chat langsung dengan teknisi untuk konsultasi masalah gadget',
      icon: MessageCircle,
      color: 'green',
      badge: 'Gratis',
    },
    'cek-bongkar': {
      title: 'Jasa Cek/Bongkar',
      subtitle: 'Mulai Rp 50.000',
      description: 'Diagnosa lengkap kondisi gadget oleh teknisi profesional',
      icon: Wrench,
      color: 'orange',
      badge: 'Populer',
    },
    'jasa-servis': {
      title: 'Jasa Servis',
      subtitle: 'Bergaransi',
      description: 'Perbaikan gadget berkualitas dengan garansi',
      icon: Settings,
      color: 'blue',
      badge: 'Bergaransi',
    },
  }

  const currentService = serviceInfo[serviceType]

  // Filter technicians based on search
  const filteredTechnicians = technicians.filter(
    (tech) =>
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="pb-16 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
              {currentService.title}
            </h1>
            <p className="text-lg text-gray-600">
              {currentService.description}
            </p>
          </div>

          {/* Service Flow Tabs */}
          <div className="mb-8 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2">
            <Link
              href="/konsultasi"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                serviceType === 'konsultasi'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">1.</span> Konsultasi
            </Link>
            <ChevronRight className="h-5 w-5 self-center text-gray-300" />
            <Link
              href="/cek-bongkar"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                serviceType === 'cek-bongkar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">2.</span> Cek/Bongkar
            </Link>
            <ChevronRight className="h-5 w-5 self-center text-gray-300" />
            <Link
              href="/jasa-servis"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                serviceType === 'jasa-servis'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">3.</span> Jasa Servis
            </Link>
          </div>

          {/* Search & Filter */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SearchBar
              placeholder="Cari teknisi berdasarkan nama, spesialisasi, atau lokasi..."
              onSearch={setSearchQuery}
            />
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 md:hidden"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <div className="hidden w-64 flex-shrink-0 md:block">
              <FilterSidebar filters={filterGroups} />
            </div>

            {/* Mobile Filter Drawer */}
            {mobileFilterOpen && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setMobileFilterOpen(false)}
                />
                <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Filter</h3>
                    <button onClick={() => setMobileFilterOpen(false)}>
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <FilterSidebar filters={filterGroups} />
                </div>
              </div>
            )}

            {/* Technician Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <p className="mt-4 text-gray-600">Memuat data teknisi...</p>
                </div>
              ) : filteredTechnicians.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-20">
                  <p className="text-lg font-medium text-gray-900">
                    Tidak ada teknisi ditemukan
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {searchQuery
                      ? 'Coba ubah kata kunci pencarian Anda'
                      : 'Belum ada teknisi terdaftar'}
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-sm text-gray-600">
                    Menampilkan {filteredTechnicians.length} teknisi untuk{' '}
                    {currentService.title}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTechnicians.map((tech) => (
                      <Link
                        key={tech.id}
                        href={`/teknisi/${tech.id}?service=${serviceType}`}
                        className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-lg"
                      >
                        <div className="mb-3 flex items-start gap-3">
                          <div className="relative h-14 w-14 flex-shrink-0">
                            <Image
                              src={tech.photo}
                              alt={tech.name}
                              fill
                              className="rounded-full object-cover"
                              sizes="56px"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                              {tech.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {tech.specialization}
                            </p>
                            <div className="mt-1 flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {tech.rating}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({tech.reviewCount})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tech.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {tech.responseTime}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              tech.available
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tech.available ? '🟢 Online' : '⚫ Offline'}
                          </span>
                          <span className="text-sm font-medium text-blue-600">
                            {serviceType === 'konsultasi'
                              ? 'Mulai Chat'
                              : 'Pilih Teknisi'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <FloatingChatButton />
      <Footer variant="light" />
    </div>
  )
}
