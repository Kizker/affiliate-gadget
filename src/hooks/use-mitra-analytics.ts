'use client'

import { useRef, useEffect, useCallback } from 'react'

export function useMitraAnalytics(mitraId?: string) {
  const hasTrackedView = useRef(false)

  useEffect(() => {
    if (!mitraId || hasTrackedView.current) return
    hasTrackedView.current = true

    fetch('/api/mitra/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mitraId,
        type: 'view',
      }),
    }).catch((error) => {
      console.error('Error tracking view:', error)
    })
  }, [mitraId])

  const trackInquiry = useCallback(async () => {
    if (!mitraId) return
    try {
      await fetch('/api/mitra/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mitraId,
          type: 'inquiry',
        }),
      })
    } catch (error) {
      console.error('Error tracking inquiry:', error)
    }
  }, [mitraId])

  return { trackInquiry }
}
