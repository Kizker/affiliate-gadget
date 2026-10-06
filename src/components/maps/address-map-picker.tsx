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

    return (
      <div
        className="relative flex w-full select-none flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100"
        style={{ height }}
      >
        {/* Visual Map Background with City Grid Aesthetic */}
        <div className="absolute inset-0 overflow-hidden bg-[#e5e9ec]">
          {/* Subtle vector grid and streets */}
          <svg
            className="h-full w-full opacity-60"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid-pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            {/* Major Arterial Roads Simulation */}
            <path
              d="M -50 120 Q 150 80 400 240"
              fill="none"
              stroke="#ffffff"
              strokeWidth="12"
            />
            <path
              d="M -50 120 Q 150 80 400 240"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="4"
            />
            <path
              d="M 120 -50 Q 160 200 200 450"
              fill="none"
              stroke="#ffffff"
              strokeWidth="10"
            />
            <path
              d="M 120 -50 Q 160 200 200 450"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="3"
            />
            <path
              d="M 280 -50 L 80 450"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8"
            />
            {/* Green Parks */}
            <rect
              x="30"
              y="40"
              width="80"
              height="60"
              rx="12"
              fill="#dcfce7"
              opacity="0.8"
            />
            <rect
              x="220"
              y="160"
              width="90"
              height="70"
              rx="16"
              fill="#dcfce7"
              opacity="0.8"
            />
            {/* Water Blue */}
            <path
              d="M 300 -10 C 320 100 280 200 350 400"
              fill="none"
              stroke="#bae6fd"
              strokeWidth="20"
              opacity="0.7"
            />
          </svg>

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
        </div>

        {/* Top Control Overlay */}
        <div className="relative z-10 flex items-center justify-between bg-gradient-to-b from-slate-900/60 via-slate-900/10 to-transparent p-3">
          <div className="shadow-2xs flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-900 backdrop-blur-md">
            <Navigation className="h-3 w-3 text-orange-600" />
            <span>Peta Interaktif Kurir</span>
          </div>

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
            <span>{loading ? 'Mendeteksi...' : 'Deteksi GPS Saya'}</span>
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
