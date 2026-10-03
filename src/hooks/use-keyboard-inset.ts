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
    const update = () => {
      const inset = Math.max(
        0,
        Math.round(window.innerHeight - vv.height - vv.offsetTop)
      )
      setState({
        // Abaikan perubahan kecil (toolbar browser) agar tidak goyang
        keyboardInset: inset > 80 ? inset : 0,
        offsetTop: Math.max(0, Math.round(vv.offsetTop)),
      })
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [enabled])

  return state
}
