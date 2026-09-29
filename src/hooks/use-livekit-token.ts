'use client'

import { useState, useEffect, useCallback } from 'react'

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
  guestName?: string
) {
  const [data, setData] = useState<LiveKitTokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
