'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
import AddressMapPicker from '@/components/maps/address-map-picker'
import { SearchableCombobox, ComboboxOption } from '@/components/ui/searchable-combobox'
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
}

export function AddressModal({
  isOpen,
  onClose,
  onSuccess,
  addressToEdit,
}: AddressModalProps) {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
            INDONESIA_PROVINCES.map((p, idx) => ({ id: String(idx + 1), name: p.name }))
          )
        }
      } catch (err) {
        console.error('Error loading provinces:', err)
        setProvinceList(
          INDONESIA_PROVINCES.map((p, idx) => ({ id: String(idx + 1), name: p.name }))
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
      const res = await fetch(`/api/regions?type=regencies&provinceId=${provId}`)
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
      const found = provinceList.find((p) => p.name.toLowerCase() === name.toLowerCase())
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
      const found = cityList.find((c) => c.name.toLowerCase() === name.toLowerCase())
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
      const foundCity = prov.cities.find((c) => c.name.toLowerCase() === name.toLowerCase())
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
      const found = districtList.find((d) => d.name.toLowerCase() === name.toLowerCase())
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
      setRecipientName('')
      setPhone('')
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
  }, [addressToEdit, isOpen])

  const handleLocationSelect = (lat: number, lng: number, addr?: string) => {
    setLatitude(lat)
    setLongitude(lng)

    if (addr && !fullAddress) {
      setFullAddress(addr)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipientName.trim()) {
      toast({ title: 'Wajib Diisi', description: 'Masukkan nama penerima paket.', variant: 'destructive' })
      return
    }
    if (!phone.trim()) {
      toast({ title: 'Wajib Diisi', description: 'Masukkan nomor telepon penerima.', variant: 'destructive' })
      return
    }
    if (!fullAddress.trim()) {
      toast({ title: 'Wajib Diisi', description: 'Masukkan detail alamat pengiriman.', variant: 'destructive' })
      return
    }
    if (!province.trim()) {
      toast({ title: 'Wajib Diisi', description: 'Pilih provinsi pengiriman.', variant: 'destructive' })
      return
    }
    if (!city.trim()) {
      toast({ title: 'Wajib Diisi', description: 'Pilih kota atau kabupaten pengiriman.', variant: 'destructive' })
      return
    }
    if (!postalCode.trim()) {
      toast({ title: 'Wajib Diisi', description: 'Masukkan kode pos pengiriman.', variant: 'destructive' })
      return
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
          recipientName: recipientName.trim(),
          phone: phone.trim(),
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
          title: addressToEdit ? 'Alamat Diperbarui' : 'Alamat Ditambahkan',
          description: addressToEdit
            ? 'Perubahan alamat berhasil disimpan.'
            : 'Alamat baru berhasil ditambahkan ke daftar alamat Anda.',
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: 'Gagal Menyimpan',
          description: data.error || 'Terjadi kesalahan saat menyimpan alamat.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Error saving address:', err)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan sistem saat menyimpan alamat.',
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
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen z-[999999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
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
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* 1. Ultra-Clean Header with Integrated Type Capsule */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 border border-slate-200/60 shadow-2xs">
                <MapPin className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950 tracking-tight">
                  {addressToEdit ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Baru'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sleek Segmented Capsule for Label */}
              <div className="hidden sm:flex rounded-full border border-slate-200/70 bg-slate-100/80 p-0.5 gap-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLabel('Rumah')}
                  className={`flex items-center gap-1.5 rounded-full py-1 px-3 text-[11px] font-bold transition-all cursor-pointer ${
                    label === 'Rumah'
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  <Home className="h-3 w-3" />
                  <span>Rumah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLabel('Kantor')}
                  className={`flex items-center gap-1.5 rounded-full py-1 px-3 text-[11px] font-bold transition-all cursor-pointer ${
                    label === 'Kantor'
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  <Building2 className="h-3 w-3" />
                  <span>Kantor</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile Label Selector (Visible only on small screens) */}
          <div className="sm:hidden px-5 pt-3 pb-0 bg-slate-50/50 border-b border-slate-100">
            <div className="rounded-full border border-slate-200/70 bg-slate-100/80 p-0.5 flex gap-1 mb-3">
              <button
                type="button"
                onClick={() => setLabel('Rumah')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-bold transition-all ${
                  label === 'Rumah' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <Home className="h-3 w-3" />
                <span>Rumah</span>
              </button>
              <button
                type="button"
                onClick={() => setLabel('Kantor')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-bold transition-all ${
                  label === 'Kantor' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <Building2 className="h-3 w-3" />
                <span>Kantor</span>
              </button>
            </div>
          </div>

          {/* 2. Scrollable Body: Balanced 2-Column Grid on Desktop */}
          <form id="address-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6">
            <GoogleMapsProvider>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ---------------- LEFT COLUMN: FORM INPUTS (7 Cols) ---------------- */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Recipient Name & Phone in 2-Column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Nama Penerima <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Nama lengkap penerima"
                          required
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2 pl-9 pr-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Nomor WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Phone className="absolute left-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="081234567890"
                          required
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2 pl-9 pr-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Full Text Address Details */}
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-700">
                      Detail Alamat Lengkap & Patokan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      rows={2}
                      required
                      placeholder="Nama jalan, nomor rumah/gedung, blok/unit, RT/RW, patokan lokasi..."
                      className="w-full resize-none rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                    />
                  </div>

                  {/* 1. Provinsi & Kota / Kabupaten */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SearchableCombobox
                      label="Provinsi"
                      placeholder="Pilih Provinsi..."
                      searchPlaceholder="Cari provinsi se-Indonesia..."
                      options={provinceList}
                      value={province}
                      onChange={handleProvinceChange}
                      isLoading={loadingProvinces}
                      required
                    />

                    <SearchableCombobox
                      label="Kota / Kabupaten"
                      placeholder={province ? 'Pilih Kota/Kab...' : 'Pilih Provinsi dahulu...'}
                      searchPlaceholder="Cari kota / kabupaten..."
                      options={cityList}
                      value={city}
                      onChange={handleCityChange}
                      isLoading={loadingCities}
                      disabled={!province && cityList.length === 0}
                      required
                    />
                  </div>

                  {/* 2. Kecamatan & Desa / Kelurahan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SearchableCombobox
                      label="Kecamatan"
                      placeholder={city ? 'Pilih Kecamatan...' : 'Pilih Kota dahulu...'}
                      searchPlaceholder="Cari kecamatan..."
                      options={districtList}
                      value={district}
                      onChange={handleDistrictChange}
                      isLoading={loadingDistricts}
                      disabled={!city && districtList.length === 0}
                    />

                    <SearchableCombobox
                      label="Desa / Kelurahan"
                      placeholder={district ? 'Pilih Desa/Kelurahan...' : 'Pilih Kecamatan dahulu...'}
                      searchPlaceholder="Cari desa / kelurahan..."
                      options={villageList}
                      value={village}
                      onChange={handleVillageChange}
                      isLoading={loadingVillages}
                      disabled={!district && villageList.length === 0}
                    />
                  </div>

                  {/* 3. Kode Pos & Alamat Utama */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-6">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Kode Pos <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Contoh: 12810"
                        maxLength={5}
                        required
                        className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2 px-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-6 sm:pt-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-950 accent-slate-950 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-700 group-hover:text-slate-950 transition">
                          Atur sebagai alamat utama
                        </span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* ---------------- RIGHT COLUMN: MAP & PINPOINT GPS (5 Cols) ---------------- */}
                <div className="lg:col-span-5 space-y-2">
                  {/* Embedded Compact Interactive Map with OSM/Google Maps */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 shadow-2xs relative">
                    <AddressMapPicker
                      onLocationSelect={handleLocationSelect}
                      initialLat={latitude || undefined}
                      initialLng={longitude || undefined}
                      height="330px"
                    />
                  </div>

                  {latitude && longitude ? (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                      <span>Lat: {latitude.toFixed(5)}</span>
                      <span>Lng: {longitude.toFixed(5)}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 px-1">
                      Klik pada peta atau tombol Deteksi GPS untuk membantu kurir menemukan alamat Anda secara presisi.
                    </p>
                  )}
                </div>

              </div>
            </GoogleMapsProvider>
          </form>

          {/* 3. Sticky Footer Actions (Always visible) */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 hidden sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Data alamat terenkripsi & sesuai standar logistik nasional.</span>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full border border-slate-200/80 bg-white px-5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="address-form"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>{submitting ? 'Menyimpan...' : 'Simpan Alamat'}</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
