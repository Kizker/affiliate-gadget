'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ChatRoom {
  id: string
  lastMessageAt: string
  customer?: {
    id: string
    name: string | null
    image: string | null
    email: string
  }
  technician?: {
    id: string
    user: {
      name: string | null
      image: string | null
    }
  }
  messages: Array<{
    content: string
    createdAt: string
  }>
  _count: {
    messages: number
  }
}

export default function ChatRoomList({
  userType,
}: {
  userType: 'customer' | 'technician'
}) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRooms()
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchRooms, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageCircle className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">Belum ada percakapan</p>
        {userType === 'customer' && (
          <Link
            href="/teknisi"
            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
          >
            Mulai chat dengan teknisi →
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => {
        const otherUser =
          userType === 'customer' ? room.technician?.user : room.customer
        const lastMessage = room.messages[0]
        const unreadCount = room._count.messages

        return (
          <Link
            key={room.id}
            href="/dashboard/customer/chat"
            className="block rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-600 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <img
                src={
                  otherUser?.image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'U')}&background=3b82f6&color=fff&size=100`
                }
                alt={otherUser?.name || 'User'}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="truncate font-semibold text-gray-900">
                    {otherUser?.name || 'Unknown User'}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatTime(room.lastMessageAt)}
                  </span>
                </div>
                {lastMessage && (
                  <p className="truncate text-sm text-gray-600">
                    {lastMessage.content}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {unreadCount}
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
