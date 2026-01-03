'use client'

import { GoogleMap, Marker } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'
import { useGoogleMaps } from './google-maps-provider'

interface GoogleMapDisplayProps {
  latitude: number
  longitude: number
  address: string
  businessName: string
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

export default function GoogleMapDisplay({
  latitude,
  longitude,
  businessName,
}: GoogleMapDisplayProps) {
  const { isLoaded, loadError } = useGoogleMaps()

  const center = {
    lat: latitude,
    lng: longitude,
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-gray-100 p-8">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Unable to load map</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-gray-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        <Marker
          position={center}
          title={businessName}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          }}
        />
      </GoogleMap>
    </div>
  )
}
