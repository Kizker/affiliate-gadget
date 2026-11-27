'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { playChatNotificationSound } from '@/lib/chat-notification-sound'

export interface AdminNavCounts {
  orders: number
  ordersNeedProcessing: number
  ordersPendingPayment: number
  chat: number
  finance: number
  complaints: number
  returns: number
  ads: number
  live: number
  mitras: number
  total: number
}

const defaultCounts: AdminNavCounts = {
  orders: 0,
  ordersNeedProcessing: 0,
  ordersPendingPayment: 0,
  chat: 0,
  finance: 0,
  complaints: 0,
  returns: 0,
  ads: 0,
  live: 0,
  mitras: 0,
  total: 0,
}

interface AdminNotificationsContextType {
  counts: AdminNavCounts
  rawCounts: AdminNavCounts
  loading: boolean
  refresh: () => Promise<void>
  markAsRead: (key: string, customCount?: number) => void
  markAllAsRead: () => void
}

const AdminNotificationsContext = createContext<
  AdminNotificationsContextType | undefined
>(undefined)

export const getSectionKeyFromPath = (path: string): string | null => {
  if (
    path === '/dashboard/admin/orders' ||
    path.startsWith('/dashboard/admin/orders/')
  )
    return 'orders'
  if (
    path === '/dashboard/admin/chat' ||
    path.startsWith('/dashboard/admin/chat/')
  )
    return 'chat'
  if (
    path === '/dashboard/admin/finance' ||
    path.startsWith('/dashboard/admin/finance/')
  )
    return 'finance'
  if (
    path === '/dashboard/admin/complaints' ||
    path.startsWith('/dashboard/admin/complaints/')
  )
    return 'complaints'
  if (
    path === '/dashboard/admin/returns' ||
    path.startsWith('/dashboard/admin/returns/')
  )
    return 'returns'
  if (
    path === '/dashboard/admin/ads' ||
    path.startsWith('/dashboard/admin/ads/')
  )
    return 'ads'
  if (
    path === '/dashboard/admin/live' ||
    path.startsWith('/dashboard/admin/live/')
  )
    return 'live'
  if (
    path === '/dashboard/admin/mitras' ||
    path.startsWith('/dashboard/admin/mitras/')
  )
    return 'mitras'
  return null
}

export function AdminNotificationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const [rawCounts, setRawCounts] = useState<AdminNavCounts>(defaultCounts)
  const [readCounts, setReadCounts] = useState<Record<string, number>>({})
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  const storageKey = useMemo(() => {
    return session?.user?.id
      ? `affiliate_admin_read_notifications_${session.user.id}`
      : 'affiliate_admin_read_notifications_global'
  }, [session?.user?.id])

  const prevChatCountRef = useRef<number | null>(null)

  // Load persisted read counts on mount
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          setReadCounts(JSON.parse(stored))
        }
      } catch {
        // Ignore
      }
    }
  }, [storageKey])

  // Mark a specific section as read
  const markAsRead = useCallback(
    (key: string, customCount?: number) => {
      setReadCounts((prev) => {
        const currentRaw =
          customCount !== undefined
            ? customCount
            : (rawCounts[key as keyof AdminNavCounts] as number) || 0
        const updated = {
          ...prev,
          [key]: currentRaw,
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated))
          } catch {
            // Ignore
          }
        }
        return updated
      })
    },
    [rawCounts, storageKey]
  )

  // Mark all active notification categories as read
  const markAllAsRead = useCallback(() => {
    setReadCounts(() => {
      const updated = {
        orders: rawCounts.orders,
        chat: rawCounts.chat,
        finance: rawCounts.finance,
        complaints: rawCounts.complaints,
        returns: rawCounts.returns,
        ads: rawCounts.ads,
        live: rawCounts.live,
        mitras: rawCounts.mitras,
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated))
        } catch {
          // Ignore
        }
      }
      return updated
    })
  }, [rawCounts, storageKey])

  const fetchCounts = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) return

    try {
      setLoading(true)
      const res = await fetch('/api/admin/nav-notifications', {
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.counts) {
          // Trigger audio chime if incoming unread chat count increased
          const incomingChat = Number(data.counts.chat) || 0
          if (
            prevChatCountRef.current !== null &&
            incomingChat > prevChatCountRef.current
          ) {
            playChatNotificationSound()
          }
          prevChatCountRef.current = incomingChat

          setRawCounts(data.counts)

          // If user is currently on an active section, automatically sync and mark as read
          if (pathname) {
            const activeSection = getSectionKeyFromPath(pathname)
            if (activeSection) {
              const activeCount =
                (data.counts[
                  activeSection as keyof AdminNavCounts
                ] as number) || 0
              setReadCounts((prev) => {
                const updated = { ...prev, [activeSection]: activeCount }
                if (typeof window !== 'undefined') {
                  try {
                    localStorage.setItem(storageKey, JSON.stringify(updated))
                  } catch {
                    // Ignore
                  }
                }
                return updated
              })
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // Ignore normal unmount / page navigation fetch cancellations
      if (!msg.includes('Failed to fetch') && !msg.includes('aborted')) {
        console.error('Failed to fetch admin nav notifications:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [pathname, session, status, storageKey])

  // Dynamic notification active items (hilang otomatis ketika aksi selesai diproses)
  useEffect(() => {
    // Tidak auto-dismiss saat navigasi halaman: badge tetap mencerminkan item yang belum diproses!
  }, [pathname])

  // Initial fetch and fast polling every 2.5 seconds (reduced from 15s to minimize chat delay)
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCounts()
      const interval = setInterval(fetchCounts, 2500)

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchCounts()
        }
      }

      const handleCustomRefresh = () => {
        fetchCounts()
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleCustomRefresh)
      window.addEventListener(
        'admin-notifications-refresh',
        handleCustomRefresh
      )

      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleCustomRefresh)
        window.removeEventListener(
          'admin-notifications-refresh',
          handleCustomRefresh
        )
      }
    }
  }, [fetchCounts, status])

  // Real-time actionable notifications (badge tetap menyala selama item belum diproses)
  const counts: AdminNavCounts = useMemo(() => {
    if (!mounted) {
      return defaultCounts
    }

    return {
      orders: rawCounts.orders,
      ordersNeedProcessing: rawCounts.ordersNeedProcessing,
      ordersPendingPayment: rawCounts.ordersPendingPayment,
      chat: rawCounts.chat,
      finance: rawCounts.finance,
      complaints: rawCounts.complaints,
      returns: rawCounts.returns,
      ads: rawCounts.ads,
      live: rawCounts.live,
      mitras: rawCounts.mitras,
      total: rawCounts.total,
    }
  }, [mounted, rawCounts])

  return (
    <AdminNotificationsContext.Provider
      value={{
        counts,
        rawCounts,
        loading,
        refresh: fetchCounts,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </AdminNotificationsContext.Provider>
  )
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext)
  if (!context) {
    return {
      counts: defaultCounts,
      rawCounts: defaultCounts,
      loading: false,
      refresh: async () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
    }
  }
  return context
}
