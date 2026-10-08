'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface LiveKitTokenData {
  token: string
  wsUrl: string
  roomName: string
  isBroadcaster: boolean
  identity: string
  name: string
}

export function useLiveKitToken(
  streamId: string,
  role: 'broadcaster' | 'viewer' = 'viewer',
  guestName?: string,
  initialData?: { token: string; wsUrl: string; roomName?: string } | null
) {
  const [data, setData] = useState<LiveKitTokenData | null>(
    initialData?.token
      ? {
          token: initialData.token,
          wsUrl: initialData.wsUrl,
          roomName: initialData.roomName || '',
          isBroadcaster: role === 'broadcaster',
          identity: '',
          name: guestName || 'Penonton',
        }
      : null
  )
  const [loading, setLoading] = useState<boolean>(!initialData?.token)
  const [error, setError] = useState<string | null>(null)
  const hasUsedInitialData = useRef<boolean>(!!initialData?.token)

  const fetchToken = useCallback(async () => {
    if (!streamId) return
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ role })
      if (guestName) params.set('name', guestName)

      const res = await fetch(
        `/api/live-streams/${streamId}/livekit-token?${params.toString()}`
      )
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperoleh token LiveKit')
      }

      setData(json.data)
    } catch (err: any) {
      console.error('useLiveKitToken error:', err)
      setError(err.message || 'Koneksi ke server gagal')
    } finally {
      setLoading(false)
    }
  }, [streamId, role, guestName])

  useEffect(() => {
    if (hasUsedInitialData.current) {
      hasUsedInitialData.current = false
      return
    }
    fetchToken()
  }, [fetchToken])

  return {
    token: data?.token ?? '',
    wsUrl: data?.wsUrl ?? '',
    roomName: data?.roomName ?? '',
    isBroadcaster: data?.isBroadcaster ?? false,
    identity: data?.identity ?? '',
    name: data?.name ?? '',
    loading,
    error,
    refetch: fetchToken,
  }
}
