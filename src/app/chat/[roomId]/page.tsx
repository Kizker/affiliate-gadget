'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import ChatWindow from '@/components/chat/chat-window-new'
import {
  Loader2,
  Star,
  Award,
  MessageCircle,
  Mail,
  Phone,
  ShoppingBag,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

interface TechnicianChatRoom {
  id: string
  type: 'technician'
  customer: {
    id: string
    name: string | null
    image: string | null
    email: string
    phone: string | null
  }
  technician: {
    id: string
    rating: number
    totalReview: number
    experience: number
    specialties: string[]
    user: {
      name: string | null
      image: string | null
      email: string
      phone: string | null
    }
  }
}

interface AdminChatRoom {
  id: string
  type: 'admin'
  orderId: string | null
  customer: {
    id: string
    name: string | null
    image: string | null
    email: string
    phone: string | null
  }
  order?: {
    orderNumber: string
    status: string
    total: number
    createdAt: string
    items: Array<{
      product?: { name: string }
      rentalItem?: { name: string }
    }>
  }
  messages?: Array<{
    content: string
    sender: {
      id: string
      name: string | null
      image: string | null
      role: string
    }
  }>
}

type ChatRoom = TechnicianChatRoom | AdminChatRoom

export default function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRoom = useCallback(async () => {
    try {
      // Try fetching from technician rooms first
      const techRes = await fetch(`/api/chat/rooms`)
      if (techRes.ok) {
        const techData = await techRes.json()
        const foundTechRoom = techData.rooms?.find(
          (r: TechnicianChatRoom) => r.id === resolvedParams.roomId
        )
        if (foundTechRoom) {
          setRoom({ ...foundTechRoom, type: 'technician' as const })
          setLoading(false)
          return
        }
      }

      // If not found in technician rooms, try admin rooms
      const adminRes = await fetch(`/api/customer/chat/all-rooms`)
      if (adminRes.ok) {
        const adminData = await adminRes.json()
        const foundAdminRoom = adminData.rooms?.find(
          (r: AdminChatRoom) => r.id === resolvedParams.roomId
        )
        if (foundAdminRoom) {
          setRoom({ ...foundAdminRoom, type: 'admin' as const })
          setLoading(false)
          return
        }
      }

      // Room not found in either API
      router.push('/chat')
    } catch (error) {
      console.error('Error fetching room:', error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.roomId, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchRoom()
    }
  }, [status, router, fetchRoom])

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Memuat percakapan...</p>
        </div>
      </div>
    )
  }

  if (!room || !session?.user) {
    return null
  }

  // Determine if current user is the customer
  const isCustomer = room.customer?.id === session.user.id

  // Get other user info based on room type
  let otherUser
  let otherUserDetails
  let displayRole = ''

  if (room.type === 'technician') {
    if (isCustomer) {
      // Customer view - show technician info
      otherUser = room.technician?.user || null
      otherUserDetails = room.technician || null
      displayRole = 'Teknisi'
    } else {
      // Technician view - show customer info
      otherUser = room.customer || null
      otherUserDetails = room.customer || null
      displayRole = 'Customer'
    }
  } else {
    // Admin chat - get admin info from messages
    const adminMessage = room.messages?.find(
      (m) => m.sender.role === 'ADMIN' || m.sender.role === 'SUPER_ADMIN'
    )
    otherUser = {
      name: adminMessage?.sender.name || 'Admin',
      image: adminMessage?.sender.image || null,
      email: 'admin@halotekno.com',
      phone: null,
    }
    otherUserDetails = room.order || null
    displayRole = 'Admin'
  }

  if (!otherUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Error: Unable to load chat data</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-cyan-50 lg:flex">
        <Navbar variant="light" />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-6 pt-28">
          <div className="h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-80 border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white">
                <div className="flex h-full flex-col">
                  <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative">
                        <img
                          src={
                            otherUser.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name || 'U')}&background=fff&color=3b82f6&size=200`
                          }
                          alt={otherUser.name || 'User'}
                          className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
                        />
                        <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-white bg-green-500"></div>
                      </div>
                      <h2 className="mt-4 text-xl font-bold text-white">
                        {otherUser.name || 'User'}
                      </h2>
                      <p className="text-sm text-blue-100">{displayRole}</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-6 overflow-y-auto p-6">
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                        Informasi Kontak
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                          <Mail className="mt-0.5 h-4 w-4 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="truncate text-sm font-medium text-gray-900">
                              {otherUser.email}
                            </p>
                          </div>
                        </div>
                        {otherUser.phone && (
                          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                            <Phone className="mt-0.5 h-4 w-4 text-gray-400" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Telepon</p>
                              <p className="text-sm font-medium text-gray-900">
                                {otherUser.phone}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Order Info for Admin Chat */}
                    {room.type === 'admin' && room.order && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <ShoppingBag className="h-4 w-4 text-green-600" />
                          Informasi Pesanan
                        </h3>
                        <div className="space-y-3">
                          <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                            {/* Product Names */}
                            <div className="mb-3">
                              <p className="mb-2 text-xs text-gray-500">
                                Produk:
                              </p>
                              {room.order.items.map((item, idx) => (
                                <p
                                  key={idx}
                                  className="text-sm font-medium text-gray-900"
                                >
                                  •{' '}
                                  {item.product?.name || item.rentalItem?.name}
                                </p>
                              ))}
                            </div>
                            {/* Total Price */}
                            {room.order.total && (
                              <div className="mb-3 border-t border-green-200 pt-3">
                                <p className="text-xs text-gray-500">
                                  Total Harga
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                  Rp {room.order.total.toLocaleString('id-ID')}
                                </p>
                              </div>
                            )}
                            {/* Order Date */}
                            {room.order.createdAt && (
                              <div>
                                <p className="text-xs text-gray-500">
                                  Tanggal Pemesanan
                                </p>
                                <p className="text-sm font-medium text-gray-700">
                                  {new Date(
                                    room.order.createdAt
                                  ).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {room.type === 'technician' &&
                      !isCustomer &&
                      otherUserDetails &&
                      'rating' in otherUserDetails && (
                        <>
                          <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <Star className="h-4 w-4 text-yellow-500" />
                              Rating & Review
                            </h3>
                            <div className="rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
                              <div className="flex items-center justify-center gap-2">
                                <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                                <span className="text-2xl font-bold text-gray-900">
                                  {otherUserDetails.rating.toFixed(1)}
                                </span>
                              </div>
                              <p className="mt-1 text-center text-sm text-gray-600">
                                {otherUserDetails.totalReview} review
                              </p>
                            </div>
                          </div>
                          <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <Award className="h-4 w-4 text-blue-600" />
                              Pengalaman
                            </h3>
                            <div className="rounded-lg bg-blue-50 p-4">
                              <p className="text-center text-2xl font-bold text-blue-600">
                                {otherUserDetails.experience}
                              </p>
                              <p className="mt-1 text-center text-sm text-gray-600">
                                Tahun Pengalaman
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <ChatWindow
                  roomId={resolvedParams.roomId}
                  currentUserId={session.user.id!}
                  otherUserName={otherUser.name || 'User'}
                  otherUserImage={otherUser.image}
                  roomType={room.type}
                  orderId={room.type === 'admin' ? room.orderId : undefined}
                />
              </div>
            </div>
          </div>
        </main>
        <Footer variant="light" />
      </div>

      {/* Mobile View - Full Screen */}
      <div className="flex h-screen flex-col bg-white lg:hidden">
        <ChatWindow
          roomId={resolvedParams.roomId}
          currentUserId={session.user.id!}
          otherUserName={otherUser.name || 'User'}
          otherUserImage={otherUser.image}
          roomType={room.type}
          orderId={room.type === 'admin' ? room.orderId : undefined}
        />
      </div>
    </>
  )
}
