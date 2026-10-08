'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect mobile viewport (< 768px) using window.matchMedia
 * Event-driven media query hook to eliminate forced reflow / layout thrashing.
 */
export function useIsMobile(breakpoint = 768, initialValue?: boolean): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof initialValue === 'boolean') return initialValue
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mql.matches)

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
