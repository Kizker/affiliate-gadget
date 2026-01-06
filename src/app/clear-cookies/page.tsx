'use client'

import { useEffect, useState } from 'react'

export default function ClearCookiesPage() {
  const [status, setStatus] = useState('Clearing cookies...')
  const [cookies, setCookies] = useState<string[]>([])

  useEffect(() => {
    // Get all cookies before clearing
    const allCookies = document.cookie
      .split(';')
      .map((c) => c.trim().split('=')[0])
      .filter(Boolean)
    setCookies(allCookies)

    // Clear all cookies
    const cookieNames = document.cookie.split(';')
    let cleared = 0

    cookieNames.forEach((cookie) => {
      const name = cookie.split('=')[0].trim()
      if (name) {
        // Try different paths and domains
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.localhost`
        cleared++
      }
    })

    // Clear localStorage and sessionStorage
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      console.error('Error clearing storage:', e)
    }

    setStatus(`Cleared ${cleared} cookies. Redirecting to login...`)

    // Redirect to login after 2 seconds
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold">
          Clearing Cookies
        </h1>
        <p className="mb-4 text-center text-gray-600">{status}</p>

        {cookies.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-500">
              Found {cookies.length} cookies:
            </p>
            <div className="max-h-40 overflow-y-auto rounded bg-gray-50 p-2 text-xs">
              {cookies.map((name, i) => (
                <div key={i} className="text-gray-600">
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  )
}
