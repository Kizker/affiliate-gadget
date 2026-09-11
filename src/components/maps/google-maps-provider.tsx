'use client'

import { useLoadScript, Libraries } from '@react-google-maps/api'
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Loader2 } from 'lucide-react'

const libraries: Libraries = ['places', 'geometry']

interface GoogleMapsContextType {
  isLoaded: boolean
  loadError: Error | undefined
  isConfigured: boolean
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
  isConfigured: false,
})

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext)
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider')
  }
  return context
}

interface GoogleMapsProviderProps {
  children: ReactNode
}

// Track if Google Maps is already loaded globally
let isGoogleMapsLoaded = false

function GoogleMapsScriptLoader({
  apiKey,
  children,
}: {
  apiKey: string
  children: ReactNode
}) {
  const [manuallyLoaded, setManuallyLoaded] = useState(false)

  // Check if Google Maps is already available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      isGoogleMapsLoaded = true
      setManuallyLoaded(true)
    }
  }, [])

  const { isLoaded: hookLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
    ...(isGoogleMapsLoaded || manuallyLoaded
      ? { preventGoogleFontsLoading: true }
      : {}),
  })

  const isLoaded = hookLoaded || manuallyLoaded || isGoogleMapsLoaded

  useEffect(() => {
    if (hookLoaded) {
      isGoogleMapsLoaded = true
    }
  }, [hookLoaded])

  if (loadError && !isLoaded) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">
          Error loading Google Maps. Please check your API key.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading Google Maps...</span>
      </div>
    )
  }

  return (
    <GoogleMapsContext.Provider
      value={{
        isLoaded,
        loadError,
        isConfigured: true,
      }}
    >
      {children}
    </GoogleMapsContext.Provider>
  )
}

export default function GoogleMapsProvider({
  children,
}: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || ''

  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider
        value={{
          isLoaded: false,
          loadError: undefined,
          isConfigured: false,
        }}
      >
        {children}
      </GoogleMapsContext.Provider>
    )
  }

  return (
    <GoogleMapsScriptLoader apiKey={apiKey}>{children}</GoogleMapsScriptLoader>
  )
}
