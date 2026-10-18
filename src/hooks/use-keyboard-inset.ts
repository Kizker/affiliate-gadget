import { useState, useEffect } from 'react'

/**
 * Melacak keyboard virtual pada layar HP dengan VisualViewport API.
 * - keyboardInset: tinggi keyboard yang menutupi layout viewport (px)
 * - offsetTop: pergeseran visual viewport (iOS Safari scroll saat fokus input)
 * Dipakai agar bar komentar/chat "melayang" naik di atas keyboard tanpa tertutup.
 */
export function useKeyboardInset(enabled = true) {
  const [state, setState] = useState({ keyboardInset: 0, offsetTop: 0 })

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.visualViewport) {
      setState({ keyboardInset: 0, offsetTop: 0 })
      return
    }

    const vv = window.visualViewport
    let rafId: number | null = null

    const update = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const activeEl =
          typeof document !== 'undefined' ? document.activeElement : null
        const isInputFocused = Boolean(
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true')
        )

        // Penurunan tinggi visual viewport menandakan adanya virtual keyboard (hanya saat input aktif)
        const rawDelta = window.innerHeight - vv.height
        const hasKeyboard = isInputFocused && rawDelta > 75
        const inset = hasKeyboard ? Math.round(rawDelta) : 0

        setState({
          keyboardInset: inset,
          offsetTop: Math.max(0, Math.round(vv.offsetTop)),
        })
      })
    }

    // Only listen to actual viewport changes (opening/closing keyboard) to avoid forced reflow on initial mount
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)

    const handleFocusOut = () => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
      update()
    }
    window.addEventListener('focusout', handleFocusOut)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [enabled])

  return state
}
