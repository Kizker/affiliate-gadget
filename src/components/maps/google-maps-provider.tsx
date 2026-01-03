'use client'

import { useLoadScript } from '@react-google-maps/api'
import { ReactNode, createContext, useContext } from 'react'
import { Loader2 } from 'lucide-react'

const libraries: ('places' | 'geometry')[] = ['places', 'geometry']

interface GoogleMapsContextType {
  isLoaded: boolean
  loadError: Error | undefined
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
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

export default function GoogleMapsProvider({
  children,
}: GoogleMapsProviderProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  if (loadError) {
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
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}
