'use client'

import { Autocomplete } from '@react-google-maps/api'
import { useState, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { useGoogleMaps } from './google-maps-provider'

interface GoogleMapsAutocompleteProps {
  onPlaceSelected: (place: {
    address: string
    city: string
    province: string
    latitude: number
    longitude: number
  }) => void
  defaultValue?: string
  placeholder?: string
}

export default function GoogleMapsAutocomplete({
  onPlaceSelected,
  defaultValue = '',
  placeholder = 'Cari alamat...',
}: GoogleMapsAutocompleteProps) {
  const { isLoaded } = useGoogleMaps()
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace()

      if (!place.geometry || !place.geometry.location) {
        console.error('No geometry found for this place')
        return
      }

      // Extract address components
      const address = place.formatted_address || ''
      let city = ''
      let province = ''

      place.address_components?.forEach((component) => {
        const types = component.types

        if (
          types.includes('locality') ||
          types.includes('administrative_area_level_2')
        ) {
          city = component.long_name
        }

        if (types.includes('administrative_area_level_1')) {
          province = component.long_name
        }
      })

      const latitude = place.geometry.location.lat()
      const longitude = place.geometry.location.lng()

      onPlaceSelected({
        address,
        city,
        province,
        latitude,
        longitude,
      })
    }
  }

  // Graceful fallback for environments without Google Maps API Key
  if (!isLoaded) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={(e) => {
            onPlaceSelected({
              address: e.target.value,
              city: '',
              province: '',
              latitude: -6.2088,
              longitude: 106.8456,
            })
          }}
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: 'id' }, // Restrict to Indonesia
          fields: ['address_components', 'formatted_address', 'geometry'],
        }}
      >
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            defaultValue={defaultValue}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </Autocomplete>
    </div>
  )
}
