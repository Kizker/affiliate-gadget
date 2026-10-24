/**
 * Utility for playing a subtle, pleasant notification chime for incoming chat messages.
 * Uses the Web Audio API with zero external audio assets, zero network latency,
 * and built-in debouncing to prevent audio stacking.
 */

let lastPlayedAt = 0
const CHIME_COOLDOWN_MS = 1500

export function playChatNotificationSound(): void {
  if (typeof window === 'undefined') return

  const now = Date.now()
  if (now - lastPlayedAt < CHIME_COOLDOWN_MS) {
    return
  }
  lastPlayedAt = now

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const t = ctx.currentTime

    // First tone: 1046.5 Hz (C6), subtle bell ping
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(1046.5, t)
    gain1.gain.setValueAtTime(0.12, t)
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(t)
    osc1.stop(t + 0.2)

    // Second tone: 1567.98 Hz (G6), cheerful upbeat resolution
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1567.98, t + 0.09)
    gain2.gain.setValueAtTime(0.15, t + 0.09)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(t + 0.09)
    osc2.stop(t + 0.38)

    // Automatically close AudioContext to release hardware audio handle
    setTimeout(() => {
      ctx.close().catch(() => {})
    }, 450)
  } catch {
    // Autoplay restrictions or audio disabled - fail silently
  }
}
