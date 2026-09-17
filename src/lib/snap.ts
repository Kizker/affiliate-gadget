/**
 * Dynamic Midtrans Snap.js SDK Loader
 *
 * Injects the Midtrans Snap script tag into the DOM with the client-key attribute.
 * Supports both Sandbox and Production modes with zero race conditions.
 */

export function loadMidtransSnap(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(null)
    }

    if ((window as any).snap) {
      return resolve((window as any).snap)
    }

    const isProduction =
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    const clientKey =
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
      process.env.MIDTRANS_CLIENT_KEY ||
      ''

    const scriptUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'

    const existingScript = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement | null

    if (existingScript) {
      if ((window as any).snap) {
        return resolve((window as any).snap)
      }
      let attempts = 0
      const interval = setInterval(() => {
        attempts++
        if ((window as any).snap) {
          clearInterval(interval)
          resolve((window as any).snap)
        } else if (attempts > 30) {
          clearInterval(interval)
          resolve((window as any).snap || null)
        }
      }, 100)
      return
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.setAttribute('data-client-key', clientKey)
    script.async = true
    script.onload = () => {
      resolve((window as any).snap)
    }
    script.onerror = (e) => {
      console.error('Failed to load Midtrans Snap script from:', scriptUrl, e)
      resolve(null)
    }

    document.head.appendChild(script)

    // Safety timeout after 4 seconds
    setTimeout(() => {
      resolve((window as any).snap || null)
    }, 4000)
  })
}
