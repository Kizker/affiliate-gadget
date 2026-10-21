'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import {
  X,
  Home,
  Building2,
  MapPin,
  User,
  Phone,
  Check,
  Loader2,
  Sparkles,
  Navigation,
  ShieldCheck,
} from 'lucide-react'
import GoogleMapsProvider from '@/components/maps/google-maps-provider'
import AddressMapPicker, {
  GeocodeAddressData,
} from '@/components/maps/address-map-picker'
import {
  SearchableCombobox,
  ComboboxOption,
} from '@/components/ui/searchable-combobox'
import { INDONESIA_PROVINCES } from '@/data/indonesia-regions'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

export interface UserAddressItem {
  id: string
  recipientName: string
  phone: string
  label: 'Rumah' | 'Kantor' | string
  fullAddress: string
  city: string
  province: string
  district?: string | null
  village?: string | null
  postalCode: string
  latitude?: number | null
  longitude?: number | null
  isDefault: boolean
}

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  addressToEdit?: UserAddressItem | null
  defaultRecipientName?: string
  defaultPhone?: string
}

export function AddressModal({
  isOpen,
  onClose,
  onSuccess,
  addressToEdit,
  defaultRecipientName,
  defaultPhone,
}: AddressModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const formContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Form states
  const [recipientName, setRecipientName] = useState('')
  const [phone, setPhone] = useState('')
  const [label, setLabel] = useState<'Rumah' | 'Kantor'>('Rumah')
  const [fullAddress, setFullAddress] = useState('')

  // Administrative Region names
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [village, setVillage] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [isDefault, setIsDefault] = useState(false)

  // Selected Region IDs for cascading API queries
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('')
  const [selectedCityId, setSelectedCityId] = useState<string>('')
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('')

  // Dynamic Options & Loading states from Kemendagri API
  const [provinceList, setProvinceList] = useState<ComboboxOption[]>([])
  const [cityList, setCityList] = useState<ComboboxOption[]>([])
  const [districtList, setDistrictList] = useState<ComboboxOption[]>([])
  const [villageList, setVillageList] = useState<ComboboxOption[]>([])

  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)

  // 1. Fetch all Indonesian Provinces on open
  useEffect(() => {
    if (!isOpen) return

    async function loadProvinces() {
      setLoadingProvinces(true)
      try {
        const res = await fetch('/api/regions?type=provinces')
        if (res.ok) {
          const data = await res.json()
          setProvinceList(data.map((p: any) => ({ id: p.id, name: p.name })))
        } else {
          setProvinceList(
            INDONESIA_PROVINCES.map((p, idx) => ({
              id: String(idx + 1),
              name: p.name,
            }))
          )
        }
      } catch (err) {
        console.error('Error loading provinces:', err)
        setProvinceList(
          INDONESIA_PROVINCES.map((p, idx) => ({
            id: String(idx + 1),
            name: p.name,
          }))
        )
      } finally {
        setLoadingProvinces(false)
      }
    }

    loadProvinces()
  }, [isOpen])

  // 2. Fetch Cities/Regencies when Province changes
  const fetchCities = useCallback(async (provId: string) => {
    if (!provId) {
      setCityList([])
      return
    }
    setLoadingCities(true)
    try {
      const res = await fetch(
        `/api/regions?type=regencies&provinceId=${provId}`
      )
      if (res.ok) {
        const data = await res.json()
        setCityList(data.map((c: any) => ({ id: c.id, name: c.name })))
      }
    } catch (err) {
      console.error('Error loading cities:', err)
    } finally {
      setLoadingCities(false)
    }
  }, [])

  // 3. Fetch Districts (Kecamatan) when City changes
  const fetchDistricts = useCallback(async (regId: string) => {
    if (!regId) {
      setDistrictList([])
      return
    }
    setLoadingDistricts(true)
    try {
      const res = await fetch(`/api/regions?type=districts&regencyId=${regId}`)
      if (res.ok) {
        const data = await res.json()
        setDistrictList(data.map((d: any) => ({ id: d.id, name: d.name })))
      }
    } catch (err) {
      console.error('Error loading districts:', err)
    } finally {
      setLoadingDistricts(false)
    }
  }, [])

  // 4. Fetch Villages (Desa / Kelurahan) when District changes
  const fetchVillages = useCallback(async (distId: string) => {
    if (!distId) {
      setVillageList([])
      return
    }
    setLoadingVillages(true)
    try {
      const res = await fetch(`/api/regions?type=villages&districtId=${distId}`)
      if (res.ok) {
        const data = await res.json()
        setVillageList(data.map((v: any) => ({ id: v.id, name: v.name })))
      }
    } catch (err) {
      console.error('Error loading villages:', err)
    } finally {
      setLoadingVillages(false)
    }
  }, [])

  // Handlers for region selection
  const handleProvinceChange = (name: string, opt?: ComboboxOption) => {
    setProvince(name)
    setCity('')
    setDistrict('')
    setVillage('')
    setSelectedCityId('')
    setSelectedDistrictId('')

    if (opt?.id) {
      setSelectedProvinceId(opt.id)
      fetchCities(opt.id)
    } else {
      const found = provinceList.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      )
      if (found) {
        setSelectedProvinceId(found.id)
        fetchCities(found.id)
      } else {
        setSelectedProvinceId('')
        setCityList([])
      }
    }
  }

  const handleCityChange = (name: string, opt?: ComboboxOption) => {
    setCity(name)
    setDistrict('')
    setVillage('')
    setSelectedDistrictId('')

    if (opt?.id) {
      setSelectedCityId(opt.id)
      fetchDistricts(opt.id)
    } else {
      const found = cityList.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      )
      if (found) {
        setSelectedCityId(found.id)
        fetchDistricts(found.id)
      } else {
        setSelectedCityId('')
        setDistrictList([])
      }
    }

    // Auto-fill postal code if available in static dataset
    for (const prov of INDONESIA_PROVINCES) {
      const foundCity = prov.cities.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      )
      if (foundCity && foundCity.postalCode && !postalCode) {
        setPostalCode(foundCity.postalCode)
      }
    }
  }

  const handleDistrictChange = (name: string, opt?: ComboboxOption) => {
    setDistrict(name)
    setVillage('')

    if (opt?.id) {
      setSelectedDistrictId(opt.id)
      fetchVillages(opt.id)
    } else {
      const found = districtList.find(
        (d) => d.name.toLowerCase() === name.toLowerCase()
      )
      if (found) {
        setSelectedDistrictId(found.id)
        fetchVillages(found.id)
      } else {
        setSelectedDistrictId('')
        setVillageList([])
      }
    }
  }

  const handleVillageChange = (name: string) => {
    setVillage(name)
  }

  // Populate data when editing existing address
  useEffect(() => {
    if (addressToEdit) {
      setRecipientName(addressToEdit.recipientName || '')
      setPhone(addressToEdit.phone || '')
      setLabel((addressToEdit.label as 'Rumah' | 'Kantor') || 'Rumah')
      setFullAddress(addressToEdit.fullAddress || '')
      setProvince(addressToEdit.province || '')
      setCity(addressToEdit.city || '')
      setDistrict(addressToEdit.district || '')
      setVillage(addressToEdit.village || '')
      setPostalCode(addressToEdit.postalCode || '')
      setLatitude(addressToEdit.latitude || null)
      setLongitude(addressToEdit.longitude || null)
      setIsDefault(addressToEdit.isDefault || false)
    } else {
      setRecipientName(defaultRecipientName || session?.user?.name || '')
      setPhone(defaultPhone || (session?.user as any)?.phone || '')
      setLabel('Rumah')
      setFullAddress('')
      setProvince('')
      setCity('')
      setDistrict('')
      setVillage('')
      setPostalCode('')
      setLatitude(null)
      setLongitude(null)
      setIsDefault(false)
      setSelectedProvinceId('')
      setSelectedCityId('')
      setSelectedDistrictId('')
    }
  }, [addressToEdit, isOpen, defaultRecipientName, defaultPhone, session])

  const handleLocationSelect = (
    lat: number,
    lng: number,
    addrData?: string | GeocodeAddressData
  ) => {
    setLatitude(lat)
    setLongitude(lng)

    // Pastikan Nama Penerima dan Telepon terisi jika masih kosong
    if (!recipientName.trim()) {
      const fallbackName = defaultRecipientName || session?.user?.name || ''
      if (fallbackName) setRecipientName(fallbackName)
    }
    if (!phone.trim()) {
      const fallbackPhone = defaultPhone || (session?.user as any)?.phone || ''
      if (fallbackPhone) setPhone(fallbackPhone)
    }

    if (!addrData) return

    if (typeof addrData === 'string') {
      setFullAddress(addrData)
      return
    }

    // Otomatis isi kolom alamat di atas
    if (addrData.fullAddress) {
      setFullAddress(addrData.fullAddress)
    }

    if (addrData.province) {
      const provQuery = addrData.province.toLowerCase().trim()
      const matched =
        provinceList.find((p) => p.name.toLowerCase() === provQuery) ||
        provinceList.find(
          (p) =>
            p.name.toLowerCase().includes(provQuery) ||
            provQuery.includes(p.name.toLowerCase())
        )

      if (matched) {
        setProvince(matched.name)
        if (matched.id) {
          setSelectedProvinceId(matched.id)
          fetchCities(matched.id)
        }
      } else {
        setProvince(addrData.province)
      }
    }

    if (addrData.city) {
      setCity(addrData.city)
    }

    if (addrData.district) {
      setDistrict(addrData.district)
    }

    if (addrData.village) {
      setVillage(addrData.village)
    }

    if (addrData.postalCode) {
      setPostalCode(addrData.postalCode)
    } else if (addrData.city) {
      for (const prov of INDONESIA_PROVINCES) {
        const foundCity = prov.cities.find(
          (c) =>
            c.name.toLowerCase().includes(addrData.city!.toLowerCase()) ||
            addrData.city!.toLowerCase().includes(c.name.toLowerCase())
        )
        if (foundCity?.postalCode) {
          setPostalCode(foundCity.postalCode)
          break
        }
      }
    }

    toast({
      title: 'Lokasi & Alamat Terdeteksi!',
      description:
        addrData.fullAddress || 'Kolom alamat berhasil terisi otomatis.',
    })
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }

    const resolvedRecipientName =
      recipientName.trim() ||
      defaultRecipientName?.trim() ||
      session?.user?.name?.trim() ||
      ''

    const resolvedPhone =
      phone.trim() ||
      defaultPhone?.trim() ||
      (session?.user as any)?.phone?.trim() ||
      ''

    if (!resolvedRecipientName) {
      toast({
        title: 'Nama penerima wajib diisi',
        variant: 'destructive',
      })
      formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!resolvedPhone) {
      toast({
        title: 'Nomor WhatsApp / telepon wajib diisi',
        variant: 'destructive',
      })
      formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!fullAddress.trim()) {
      toast({
        title: 'Detail alamat wajib diisi',
        variant: 'destructive',
      })
      formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!province.trim()) {
      toast({
        title: 'Provinsi wajib dipilih',
        variant: 'destructive',
      })
      formContainerRef.current?.scrollTo({ top: 120, behavior: 'smooth' })
      return
    }
    if (!city.trim()) {
      toast({
        title: 'Kota atau kabupaten wajib dipilih',
        variant: 'destructive',
      })
      formContainerRef.current?.scrollTo({ top: 120, behavior: 'smooth' })
      return
    }
    if (!postalCode.trim()) {
      toast({
        title: 'Kode pos wajib diisi',
        variant: 'destructive',
      })
      formContainerRef.current?.scrollTo({ top: 200, behavior: 'smooth' })
      return
    }

    if (!recipientName.trim() && resolvedRecipientName) {
      setRecipientName(resolvedRecipientName)
    }
    if (!phone.trim() && resolvedPhone) {
      setPhone(resolvedPhone)
    }

    setSubmitting(true)
    try {
      const url = addressToEdit
        ? `/api/user/addresses/${addressToEdit.id}`
        : '/api/user/addresses'
      const method = addressToEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: resolvedRecipientName,
          phone: resolvedPhone,
          label,
          fullAddress: fullAddress.trim(),
          province: province.trim(),
          city: city.trim(),
          district: district.trim() || null,
          village: village.trim() || null,
          postalCode: postalCode.trim(),
          latitude,
          longitude,
          isDefault,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: addressToEdit
            ? 'Alamat berhasil diperbarui'
            : 'Alamat baru berhasil ditambahkan',
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: data.error || 'Gagal menyimpan alamat',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Error saving address:', err)
      toast({
        title: 'Gagal menyimpan alamat',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 bottom-0 left-0 right-0 top-0 z-[999999] flex h-full min-h-screen w-full items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-md duration-200 animate-in fade-in sm:p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* Animated Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Ultra-Clean Header matching Screenshots 3 & 4 */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              {addressToEdit ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Baru'}
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer p-1 text-slate-400 transition hover:text-slate-700 active:scale-95"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 2. Form wrapping scrollable body and sticky footer */}
          <form
            id="address-form"
            noValidate
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Scrollable Body: Balanced 2-Column Grid on Desktop */}
            <div
              ref={formContainerRef}
              className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
            >
              {/* Type Switcher Capsule (Rumah / Kantor) matching Screenshot 3 */}
              <div className="flex gap-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-1">
                <button
                  type="button"
                  onClick={() => setLabel('Rumah')}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs transition-all ${
                    label === 'Rumah'
                      ? 'shadow-2xs border border-orange-200/80 bg-white font-bold text-orange-600'
                      : 'font-semibold text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Home
                    className={`h-4 w-4 ${label === 'Rumah' ? 'text-orange-600' : 'text-slate-400'}`}
                  />
                  <span>Rumah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLabel('Kantor')}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs transition-all ${
                    label === 'Kantor'
                      ? 'shadow-2xs border border-orange-200/80 bg-white font-bold text-orange-600'
                      : 'font-semibold text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2
                    className={`h-4 w-4 ${label === 'Kantor' ? 'text-orange-600' : 'text-slate-400'}`}
                  />
                  <span>Kantor</span>
                </button>
              </div>

              <GoogleMapsProvider>
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
                  {/* ---------------- LEFT COLUMN: FORM INPUTS (7 Cols) ---------------- */}
                  <div className="space-y-3.5 lg:col-span-7">
                    {/* Recipient Name */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        Nama Penerima <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Nama lengkap penerima"
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4 py-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        Nomor WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="081234567890"
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4 py-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                      />
                    </div>

                    {/* Full Text Address Details */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        Detail Alamat Lengkap{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={fullAddress}
                        onChange={(e) => setFullAddress(e.target.value)}
                        rows={2}
                        placeholder="Nama jalan, nomor rumah/gedung, RT/RW, blok, patokan spesifik..."
                        className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/40 p-3.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                      />
                    </div>

                    {/* 1. Provinsi */}
                    <div>
                      <SearchableCombobox
                        label="Provinsi"
                        placeholder="Cari atau pilih Provinsi..."
                        searchPlaceholder="Cari provinsi se-Indonesia..."
                        options={provinceList}
                        value={province}
                        onChange={handleProvinceChange}
                        isLoading={loadingProvinces}
                        triggerClassName="rounded-2xl border-slate-200/80 bg-slate-50/40 px-4 py-2.5 text-xs font-medium"
                        required
                      />
                    </div>

                    {/* 2. Kota / Kabupaten */}
                    <div>
                      <SearchableCombobox
                        label="Kota / Kabupaten"
                        placeholder={
                          province
                            ? 'Cari Kota atau Kabupaten...'
                            : 'Pilih Provinsi dahulu...'
                        }
                        searchPlaceholder="Cari kota atau kabupaten..."
                        options={cityList}
                        value={city}
                        onChange={handleCityChange}
                        isLoading={loadingCities}
                        disabled={!province && cityList.length === 0}
                        triggerClassName="rounded-2xl border-slate-200/80 bg-slate-50/40 px-4 py-2.5 text-xs font-medium"
                        required
                      />
                    </div>

                    {/* 3. Kecamatan */}
                    <div>
                      <SearchableCombobox
                        label="Kecamatan"
                        placeholder={
                          city ? 'Cari Kecamatan...' : 'Pilih Kota dahulu...'
                        }
                        searchPlaceholder="Cari kecamatan..."
                        options={districtList}
                        value={district}
                        onChange={handleDistrictChange}
                        isLoading={loadingDistricts}
                        disabled={!city && districtList.length === 0}
                        triggerClassName="rounded-2xl border-slate-200/80 bg-slate-50/40 px-4 py-2.5 text-xs font-medium"
                      />
                    </div>

                    {/* 4. Desa / Kelurahan */}
                    <div>
                      <SearchableCombobox
                        label="Desa / Kelurahan"
                        placeholder={
                          district
                            ? 'Cari Desa atau Kelurahan...'
                            : 'Pilih Kecamatan dahulu...'
                        }
                        searchPlaceholder="Cari desa atau kelurahan..."
                        options={villageList}
                        value={village}
                        onChange={handleVillageChange}
                        isLoading={loadingVillages}
                        disabled={!district && villageList.length === 0}
                        triggerClassName="rounded-2xl border-slate-200/80 bg-slate-50/40 px-4 py-2.5 text-xs font-medium"
                      />
                    </div>

                    {/* 5. Kode Pos */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        Kode Pos <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Contoh: 12810"
                        maxLength={5}
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4 py-3 font-mono text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                      />
                    </div>

                    {/* Checkbox: Atur sebagai alamat utama */}
                    <div className="pt-1">
                      <label className="group inline-flex cursor-pointer select-none items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-orange-500 accent-orange-500"
                        />
                        <span className="text-xs font-medium text-slate-700 transition group-hover:text-slate-950">
                          Atur sebagai alamat utama
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* ---------------- RIGHT COLUMN: MAP & PINPOINT GPS (5 Cols) ---------------- */}
                  <div className="space-y-2 pt-2 lg:col-span-5 lg:pt-0">
                    {/* Embedded Compact Interactive Map */}
                    <div className="shadow-xs relative overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100">
                      <AddressMapPicker
                        onLocationSelect={handleLocationSelect}
                        initialLat={latitude || undefined}
                        initialLng={longitude || undefined}
                        height="300px"
                      />
                    </div>

                    <p className="px-1 text-[11px] text-slate-400">
                      Gunakan GPS agar kurir dapat mengantar pesanan lebih cepat
                      & akurat.
                    </p>
                  </div>
                </div>
              </GoogleMapsProvider>
            </div>

            {/* 3. Sticky Footer Actions matching Screenshot 4 */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white p-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="cursor-pointer rounded-2xl bg-slate-100 px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
                className="shadow-xs flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Simpan Alamat</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
