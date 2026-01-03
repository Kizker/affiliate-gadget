'use client'

import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import ChatRoomList from '@/components/chat/chat-room-list'
import { MessageCircle } from 'lucide-react'

import { useSession } from 'next-auth/react'

export default function ChatPage() {
  const { data: session } = useSession()

  // Determine user type based on role
  // If role is TECHNICIAN, userType is 'technician', otherwise 'customer'
  const userType =
    (session?.user?.role as string) === 'TECHNICIAN' ? 'technician' : 'customer'

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="mx-auto max-w-4xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
          </div>
          <p className="mt-2 text-gray-600">
            {userType === 'technician'
              ? 'Percakapan dengan pelanggan'
              : 'Percakapan dengan teknisi'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {session ? (
            <ChatRoomList userType={userType} />
          ) : (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          )}
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
