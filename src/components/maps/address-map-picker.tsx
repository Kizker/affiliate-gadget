'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { MapPin, Loader2, Crosshair, Sparkles, Navigation } from 'lucide-react'

export interface GeocodeAddressData {
  fullAddress?: string
  road?: string
  village?: string
  district?: string
  city?: string
  province?: string
  postalCode?: string
  displayName?: string
}

interface AddressMapPickerProps {
  onLocationSelect: (
    lat: number,
    lng: number,
    address?: string | GeocodeAddressData
  ) => void
  initialLat?: number
  initialLng?: number
  height?: string
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const defaultCenter = {
  lat: -6.2088, // Jakarta Pusat
  lng: 106.8456,
}

export default function AddressMapPicker({
  onLocationSelect,
  initialLat,
  initialLng,
  height = '320px',
}: AddressMapPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number
    lng: number
  } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [mapCenter, setMapCenter] = useState(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng }
      : defaultCenter
  )
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  useEffect(() => {
    if (initialLat && initialLng) {
      const newPos = { lat: initialLat, lng: initialLng }
      setMapCenter(newPos)
      setSelectedPosition(newPos)
    }
  }, [initialLat, initialLng])

  const fetchAddressFromCoords = async (
    lat: number,
    lng: number
  ): Promise<GeocodeAddressData | null> => {
    try {
      const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`)
      if (res.ok) {
        const data: GeocodeAddressData = await res.json()
        return data
      }
    } catch (err) {
      console.warn('Gagal reverse geocode koordinat GPS:', err)
    }
    return null
  }

  // Get current device GPS location & auto-resolve address details
  const handleGetCurrentLocation = useCallback(() => {
    setLoading(true)

    const processLocation = async (lat: number, lng: number) => {
      const addrData = await fetchAddressFromCoords(lat, lng)
      if (addrData) {
        onLocationSelect(lat, lng, addrData)
      } else {
        onLocationSelect(lat, lng)
      }
      setLoading(false)
    }

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setMapCenter(pos)
          setSelectedPosition(pos)
          processLocation(pos.lat, pos.lng)
        },
        () => {
          const pos = defaultCenter
          setSelectedPosition(pos)
          setMapCenter(pos)
          processLocation(pos.lat, pos.lng)
        },
        { enableHighAccuracy: true, timeout: 6000 }
      )
    } else {
      const pos = defaultCenter
      setSelectedPosition(pos)
      processLocation(pos.lat, pos.lng)
    }
  }, [onLocationSelect])

  // Handle map click
  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setSelectedPosition({ lat, lng })

        if (
          typeof google !== 'undefined' &&
          google.maps &&
          google.maps.Geocoder
        ) {
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              onLocationSelect(lat, lng, results[0].formatted_address)
              return
            }
          })
        }

        const addrData = await fetchAddressFromCoords(lat, lng)
        if (addrData) {
          onLocationSelect(lat, lng, addrData)
        } else {
          onLocationSelect(lat, lng)
        }
      }
    },
    [onLocationSelect]
  )

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  // If no Google Maps API key, render an ultra-clean visual interactive map surface
  if (!apiKey) {
    const lat = selectedPosition?.lat || mapCenter.lat
    const lng = selectedPosition?.lng || mapCenter.lng

    const handleFallbackMapClick = async (
      e: React.MouseEvent<HTMLDivElement>
    ) => {
      // Don't trigger if clicked button
      if ((e.target as HTMLElement).closest('button')) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const normX = x / rect.width - 0.5
      const normY = y / rect.height - 0.5

      const currentLat = selectedPosition?.lat || mapCenter.lat
      const currentLng = selectedPosition?.lng || mapCenter.lng

      // Calculate new coordinates from click position (~0.008 lat span and ~0.012 lng span)
      const newLat = currentLat - normY * 0.008
      const newLng = currentLng + normX * 0.012

      const newPos = { lat: newLat, lng: newLng }
      setSelectedPosition(newPos)
      setMapCenter(newPos)

      setLoading(true)
      const addrData = await fetchAddressFromCoords(newLat, newLng)
      if (addrData) {
        onLocationSelect(newLat, newLng, addrData)
      } else {
        onLocationSelect(newLat, newLng)
      }
      setLoading(false)
    }

    return (
      <div
        onClick={handleFallbackMapClick}
        className="relative flex w-full cursor-crosshair select-none flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100"
        style={{ height }}
        title="Klik di mana saja pada peta untuk mengubah titik lokasi toko"
      >
        {/* Real OpenStreetMap Visual Map Layer */}
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.007}%2C${lat - 0.004}%2C${lng + 0.007}%2C${lat + 0.004}&layer=mapnik&marker=${lat}%2C${lng}`}
          className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-80"
          title="Peta Interaktif Lokasi Toko"
        />

        {/* Central Pulsing GPS Pin Target */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative flex flex-col items-center">
            {/* Ripple animation */}
            <div className="absolute -inset-4 animate-ping rounded-full bg-orange-500/20" />
            <div className="absolute -inset-2 rounded-full bg-orange-500/30" />

            {/* Pin Icon Bubble */}
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl ring-4 ring-white">
              <MapPin className="h-5 w-5 fill-orange-500 text-orange-500" />
            </div>

            {/* Pin point anchor stem */}
            <div className="-mt-0.5 h-3 w-1.5 rounded-b-full bg-slate-950 shadow-sm" />
            <div className="mt-0.5 h-1.5 w-4 rounded-full bg-slate-950/30 blur-[1px]" />
          </div>
        </div>

        {/* Top Control Overlay */}
        <div className="relative z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-slate-900/60 via-slate-900/10 to-transparent p-2.5 sm:p-3">
          <div className="shadow-2xs flex shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-900 backdrop-blur-md">
            <Navigation className="h-3 w-3 shrink-0 text-orange-600" />
            <span className="whitespace-nowrap">Klik Peta</span>
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="shadow-xs flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-slate-950/90 px-3 py-1 text-[10.5px] font-bold text-white backdrop-blur-md transition hover:bg-slate-950 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
            ) : (
              <Crosshair className="h-3 w-3 shrink-0 text-orange-400" />
            )}
            <span className="whitespace-nowrap">
              {loading ? 'Mencari...' : 'Deteksi GPS'}
            </span>
          </button>
        </div>

        {/* Bottom Coordinates Overlay */}
        <div className="shadow-xs relative z-10 m-2.5 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/95 p-2.5 backdrop-blur-md">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Sparkles className="h-3 w-3" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-900">
              Titik GPS Terpasang
            </p>
            <p className="font-mono text-[9px] text-slate-500">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Google Maps Full Experience
  return (
    <div
      className="shadow-2xs relative w-full overflow-hidden rounded-2xl border border-slate-200/80"
      style={{ height }}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={15}
        onClick={handleMapClick}
        onLoad={onLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {selectedPosition && (
          <Marker
            position={selectedPosition}
            animation={google.maps.Animation.DROP}
          />
        )}
      </GoogleMap>

      {/* Floating GPS Button */}
      <div className="absolute right-2.5 top-2.5 z-10">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="shadow-xs flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-950/90 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md transition hover:bg-slate-950 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Crosshair className="h-3 w-3 text-orange-400" />
          )}
          <span>GPS Saya</span>
        </button>
      </div>
    </div>
  )
}
