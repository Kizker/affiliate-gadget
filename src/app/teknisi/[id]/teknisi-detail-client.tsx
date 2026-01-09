'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Star,
  Award,
  Settings,
  ChevronRight,
  Loader2,
  MessageCircle,
  Wrench,
  ChevronDown,
  Check,
} from 'lucide-react'
import Link from 'next/link'

interface TechnicianDetail {
  id: string
  bio: string | null
  experience: number
  specialties: string[]
  rating: number
  totalReview: number
  isAvailable: boolean
  user: {
    id: string
    name: string | null
    image: string | null
    phone: string | null
  }
  services: Array<{
    id: string
    name: string
    category: string
    price: number
    minPrice?: number | null
    maxPrice?: number | null
    description: string | null
  }>
  reviews: Array<{
    id: string
    rating: number
    comment: string | null
    createdAt: string
    user: {
      name: string | null
      image: string | null
    }
  }>
}

interface TeknisiDetailClientProps {
  technician: TechnicianDetail
  reviews: {
    reviews: Array<{
      id: string
      rating: number
      comment: string | null
      createdAt: string
      user: {
        name: string
        image: string | null
      }
    }>
    averageRating: number
    totalReviews: number
  }
}

export default function TeknisiDetailClient({
  technician,
  reviews: initialReviews,
}: TeknisiDetailClientProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [reviews] = useState(initialReviews)
  const [formData, setFormData] = useState({
    service: '',
    phoneType: '',
    date: '',
    time: '09:00',
    description: '',
    scheduleType: 'asap',
  })

  const searchParams = useSearchParams()
  const serviceParam = searchParams.get('service')
  const [activeService, setActiveService] = useState<
    'konsultasi' | 'cek-bongkar' | 'jasa-servis'
  >(
    (serviceParam as 'konsultasi' | 'cek-bongkar' | 'jasa-servis') ||
      'konsultasi'
  )

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleSelectService = (serviceId: string) => {
    setFormData((prev) => ({ ...prev, service: serviceId }))
    setIsDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.service-dropdown')) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!technician) return

    // Validation
    if (!formData.service) {
      alert('Pilih layanan terlebih dahulu')
      return
    }

    if (!formData.phoneType.trim()) {
      alert('Jenis HP/Gadget harus diisi')
      return
    }

    if (!formData.description.trim()) {
      alert('Deskripsi masalah harus diisi')
      return
    }

    if (formData.scheduleType === 'scheduled' && !formData.date) {
      alert('Pilih tanggal untuk jadwal booking')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: formData.service,
          phoneType: formData.phoneType,
          scheduleType: formData.scheduleType,
          date: formData.date,
          description: formData.description,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal membuat booking')
      }

      const data = await res.json()
      // Redirect to confirmation page
      window.location.href = `/booking-confirmation/${data.order.id}`
    } catch (error) {
      console.error('Error creating booking:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat membuat booking'
      )
    } finally {
      setLoading(false)
    }
  }

  const lowestServicePrice =
    technician.services.length > 0
      ? Math.min(...technician.services.map((s) => s.price))
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        {/* Breadcrumb - Hidden on mobile */}
        <div className="mb-6 hidden text-sm text-gray-600 sm:block">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          {' / '}
          <Link href="/teknisi" className="hover:text-blue-600">
            Teknisi
          </Link>
          {' / '}
          <span className="text-gray-900">{technician.user.name}</span>
        </div>

        {/* Service Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2">
          <button
            onClick={() => setActiveService('konsultasi')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
              activeService === 'konsultasi'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Konsultasi</span>
          </button>
          <ChevronRight className="hidden h-5 w-5 self-center text-gray-300 sm:block" />
          <button
            onClick={() => setActiveService('cek-bongkar')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
              activeService === 'cek-bongkar'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span className="sm:hidden">Cek</span>
            <span className="hidden sm:inline">Cek/Bongkar</span>
          </button>
          <ChevronRight className="hidden h-5 w-5 self-center text-gray-300 sm:block" />
          <button
            onClick={() => setActiveService('jasa-servis')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
              activeService === 'jasa-servis'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span className="sm:hidden">Servis</span>
            <span className="hidden sm:inline">Jasa Servis</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Profile Header */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex flex-col gap-6 md:flex-row">
                <img
                  src={
                    technician.user.image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(technician.user.name || 'T')}&background=3b82f6&color=fff&size=400`
                  }
                  alt={technician.user.name || 'Teknisi'}
                  className="h-48 w-full rounded-xl object-cover md:w-48"
                />
                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
                        {technician.user.name}
                      </h1>
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            technician.isAvailable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {technician.isAvailable ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-lg font-bold">
                      {reviews.averageRating > 0
                        ? reviews.averageRating.toFixed(1)
                        : '0.0'}
                    </span>
                    <span className="text-gray-600">
                      ({reviews.totalReviews} review
                      {reviews.totalReviews !== 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Award className="h-4 w-4 text-blue-600" />
                      <span>{technician.experience} tahun pengalaman</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <span>{technician.services.length} layanan</span>
                    </div>
                  </div>

                  {lowestServicePrice > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Mulai dari</p>
                      <p className="text-2xl font-bold text-blue-600">
                        Rp {lowestServicePrice.toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* About */}
            {technician.bio && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Tentang
                </h2>
                <p className="leading-relaxed text-gray-700">
                  {technician.bio}
                </p>
              </div>
            )}

            {/* Specializations */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Spesialisasi
              </h2>
              <div className="flex flex-wrap gap-2">
                {technician.specialties.map((spec, index) => (
                  <span
                    key={index}
                    className="rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-700"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Services */}
            {technician.services.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Layanan
                </h2>
                <div className="space-y-3">
                  {technician.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-gray-600">
                            {service.description}
                          </p>
                        )}
                        <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {service.category}
                        </span>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-bold text-blue-600">
                          {service.minPrice && service.maxPrice
                            ? `Rp ${service.minPrice.toLocaleString('id-ID')} - Rp ${service.maxPrice.toLocaleString('id-ID')}`
                            : service.minPrice
                              ? `Mulai Rp ${service.minPrice.toLocaleString('id-ID')}`
                              : service.maxPrice
                                ? `Hingga Rp ${service.maxPrice.toLocaleString('id-ID')}`
                                : `Rp ${service.price.toLocaleString('id-ID')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.reviews.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Review ({reviews.totalReviews})
                </h2>
                <div className="space-y-4">
                  {reviews.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {review.user.image ? (
                            <img
                              src={review.user.image}
                              alt={review.user.name || 'User'}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                              <span className="text-xs font-semibold text-gray-600">
                                {review.user.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                          <span className="font-semibold text-gray-900">
                            {review.user.name || 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString(
                            'id-ID',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                      <div className="mb-2 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6">
              {activeService === 'konsultasi' && (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Konsultasi Gratis
                    </h3>
                  </div>
                  <p className="mb-4 text-sm text-gray-600">
                    Chat langsung dengan {technician.user.name} untuk konsultasi
                    masalah gadget Anda
                  </p>
                  {/* Only show button for customers */}
                  {session?.user?.role === 'CUSTOMER' &&
                  !session.user.isTechnician ? (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/chat/rooms', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              technicianId: technician.id,
                            }),
                          })
                          if (res.ok) {
                            const data = await res.json()
                            window.location.href = `/chat/${data.room.id}`
                          } else if (res.status === 401) {
                            window.location.href = '/login'
                          }
                        } catch (error) {
                          console.error('Error creating chat:', error)
                        }
                      }}
                      className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700"
                    >
                      Mulai Konsultasi
                    </button>
                  ) : (
                    <div className="space-y-4 rounded-lg border border-gray-300 bg-gray-50 p-6 text-center">
                      {!session ? (
                        <>
                          <p className="text-sm text-gray-600">
                            Login sebagai customer untuk memulai konsultasi
                          </p>
                          <Link
                            href="/api/auth/signin"
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                              />
                            </svg>
                            Login Sekarang
                          </Link>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Hanya customer yang dapat melakukan booking
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {(activeService === 'cek-bongkar' ||
                activeService === 'jasa-servis') && (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    {activeService === 'cek-bongkar' ? (
                      <Wrench className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Settings className="h-5 w-5 text-blue-600" />
                    )}
                    <h3 className="text-lg font-bold text-gray-900">
                      {activeService === 'cek-bongkar'
                        ? 'Booking Cek/Bongkar'
                        : 'Booking Servis'}
                    </h3>
                  </div>
                  {/* Only show form for customers */}
                  {session?.user?.role === 'CUSTOMER' &&
                  !session.user.isTechnician ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Pilih Layanan
                        </label>
                        <div className="service-dropdown relative">
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                          >
                            <span
                              className={`${!formData.service ? 'text-gray-500' : 'font-medium text-gray-900'}`}
                            >
                              {formData.service
                                ? (() => {
                                    const s = technician.services.find(
                                      (s) => s.id === formData.service
                                    )
                                    if (!s) return 'Layanan tidak ditemukan'
                                    const price =
                                      s.minPrice && s.maxPrice
                                        ? `Rp ${s.minPrice.toLocaleString('id-ID')} - Rp ${s.maxPrice.toLocaleString('id-ID')}`
                                        : s.minPrice
                                          ? `Mulai Rp ${s.minPrice.toLocaleString('id-ID')}`
                                          : s.maxPrice
                                            ? `Hingga Rp ${s.maxPrice.toLocaleString('id-ID')}`
                                            : `Rp ${s.price.toLocaleString('id-ID')}`
                                    return `${s.name} (${price})`
                                  })()
                                : '-- Pilih Layanan --'}
                            </span>
                            <ChevronDown
                              className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {isDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-xl ring-1 ring-black/5">
                              {technician.services
                                .filter((service) => {
                                  switch (activeService) {
                                    case 'cek-bongkar':
                                      return service.category === 'CEK_BONGKAR'
                                    case 'jasa-servis':
                                      return (
                                        service.category === 'SERVIS_LENGKAP'
                                      )
                                    default:
                                      return true
                                  }
                                })
                                .map((service) => {
                                  const isSelected =
                                    formData.service === service.id
                                  const price =
                                    service.minPrice && service.maxPrice
                                      ? `Rp ${service.minPrice.toLocaleString('id-ID')} - Rp ${service.maxPrice.toLocaleString('id-ID')}`
                                      : service.minPrice
                                        ? `Mulai Rp ${service.minPrice.toLocaleString('id-ID')}`
                                        : service.maxPrice
                                          ? `Hingga Rp ${service.maxPrice.toLocaleString('id-ID')}`
                                          : `Rp ${service.price.toLocaleString('id-ID')}`

                                  return (
                                    <button
                                      key={service.id}
                                      type="button"
                                      onClick={() =>
                                        handleSelectService(service.id)
                                      }
                                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                        isSelected
                                          ? 'bg-blue-50 text-blue-700'
                                          : 'text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex flex-col items-start gap-0.5">
                                        <span
                                          className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
                                        >
                                          {service.name}
                                        </span>
                                        <span
                                          className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                                        >
                                          {price}
                                        </span>
                                      </div>
                                      {isSelected && (
                                        <Check className="h-4 w-4 text-blue-600" />
                                      )}
                                    </button>
                                  )
                                })}
                            </div>
                          )}
                          <input
                            type="hidden"
                            name="service"
                            value={formData.service}
                            required
                            onInvalid={(e) => {
                              e.preventDefault()
                              alert('Silakan pilih layanan terlebih dahulu')
                              setIsDropdownOpen(true)
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Jenis HP/Gadget
                        </label>
                        <input
                          type="text"
                          value={formData.phoneType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phoneType: e.target.value,
                            })
                          }
                          placeholder="Contoh: iPhone 13 Pro, Samsung Galaxy S21"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Jadwal
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="scheduleType"
                              value="asap"
                              checked={formData.scheduleType === 'asap'}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  scheduleType: e.target.value,
                                })
                              }
                              className="text-blue-600"
                            />
                            <span className="text-sm">Segera</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="scheduleType"
                              value="scheduled"
                              checked={formData.scheduleType === 'scheduled'}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  scheduleType: e.target.value,
                                })
                              }
                              className="text-blue-600"
                            />
                            <span className="text-sm">Pilih Tanggal</span>
                          </label>
                        </div>
                      </div>
                      {formData.scheduleType === 'scheduled' && (
                        <div>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Deskripsi Masalah
                        </label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          placeholder="Jelaskan masalah gadget Anda..."
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 py-3 font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        ) : (
                          'Booking Sekarang'
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4 rounded-lg border border-gray-300 bg-gray-50 p-6 text-center">
                      {!session ? (
                        <>
                          <p className="text-sm text-gray-600">
                            Login sebagai customer untuk melakukan booking
                          </p>
                          <Link
                            href="/api/auth/signin"
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                              />
                            </svg>
                            Login Sekarang
                          </Link>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Hanya customer yang dapat melakukan booking
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
