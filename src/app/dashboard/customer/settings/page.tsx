'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import {
  AddressModal,
  UserAddressItem,
} from '@/components/customer/address-modal'
import { MobileCustomerAccountView } from '@/components/customer/mobile-customer-account-view'
import { isReturnOrder } from '@/lib/order-return-utils'
import {
  User,
  Lock,
  Camera,
  Loader2,
  Check,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  Plus,
  Home,
  Building2,
  Trash2,
  Edit3,
  Star,
  Sparkles,
  Calendar,
  AtSign,
  Smartphone,
  Laptop,
  LogOut,
  AlertCircle,
  FileText,
  ShoppingBag,
  CreditCard,
  Package,
  Truck,
  RotateCcw,
  ChevronRight,
  X,
  MessageSquare,
  ExternalLink,
  Heart,
} from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useWishlistSafe } from '@/lib/store/wishlist-store'
import { CustomerWishlistView } from '@/components/customer/customer-wishlist-view'

type Tab = 'profile' | 'address' | 'security' | 'wishlist'

export default function CustomerSettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [activeSubView, setActiveSubView] = useState<
    'overview' | 'profile' | 'address' | 'security' | 'wishlist'
  >('overview')
  const { totalCount: wishlistCount } = useWishlistSafe()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    processing: 0,
    inProgress: 0,
    completed: 0,
    returned: 0,
    total: 0,
  })

  // Profile data (Shopee buyer standard)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [initialEmail, setInitialEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan' | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Multi-address data
  const [addresses, setAddresses] = useState<UserAddressItem[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressToEdit, setAddressToEdit] = useState<UserAddressItem | null>(
    null
  )
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Security & Session data
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<{
    id: string
    deviceType: 'desktop' | 'mobile' | 'tablet'
    deviceLabel: string
    browser: string
    browserLabel: string
    os: string
    location: string
    ip: string
    lastActive: string
    isCurrent: boolean
  } | null>(null)
  const [otherSessions, setOtherSessions] = useState<
    Array<{
      id: string
      deviceLabel: string
      browser: string
      location: string
      lastActive: string
      ip: string
    }>
  >([])
  const [loggingOutOther, setLoggingOutOther] = useState(false)

  // OTP WhatsApp Verification states
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
  const [otpPurpose, setOtpPurpose] = useState<
    '2FA' | 'CHANGE_PASSWORD' | 'CHANGE_EMAIL'
  >('2FA')
  const [otpCode, setOtpCode] = useState('')
  const [otpWhatsappUrl, setOtpWhatsappUrl] = useState('')
  const [otpExpiresIn, setOtpExpiresIn] = useState(0)
  const [otpPreview, setOtpPreview] = useState('')
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // Fetch full profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setName(data.user.name || '')
        setUsername(data.user.username || '')
        setEmail(data.user.email || '')
        setInitialEmail(data.user.email || '')
        setPhone(data.user.phone || '')
        setGender(data.user.gender || '')
        if (data.user.birthDate) {
          const date = new Date(data.user.birthDate)
          setBirthDate(date.toISOString().split('T')[0])
        }
        setBio(data.user.bio || '')
        setAvatarPreview(data.user.image)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Gagal Memuat',
        description: 'Terjadi kendala saat mengambil data profil.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Fetch user multi-addresses
  const fetchAddresses = useCallback(async () => {
    setLoadingAddresses(true)
    try {
      const res = await fetch('/api/user/addresses')
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }, [])

  // Fetch customer order stats for Pesanan Saya
  const fetchOrderStats = useCallback(async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        const orders = data.orders || []
        const pending = orders.filter(
          (o: any) => o.status === 'PENDING_PAYMENT'
        ).length
        const processing = orders.filter(
          (o: any) =>
            (o.status === 'PROCESSING' || o.status === 'PAID') &&
            !isReturnOrder(o)
        ).length
        const inProgress = orders.filter(
          (o: any) =>
            (o.status === 'IN_PROGRESS' || o.status === 'SHIPPED') &&
            !isReturnOrder(o)
        ).length
        const completed = orders.filter(
          (o: any) => o.status === 'COMPLETED' && !isReturnOrder(o)
        ).length
        const returned = orders.filter((o: any) => isReturnOrder(o)).length
        setOrderStats({
          pending,
          processing,
          inProgress,
          completed,
          returned,
          total: orders.length,
        })
      }
    } catch (error) {
      console.error('Error fetching order stats:', error)
    }
  }, [])

  // Fetch Security & Active Sessions
  const fetchSecurity = useCallback(async () => {
    try {
      const res = await fetch('/api/user/security')
      if (res.ok) {
        const data = await res.json()
        setTwoFactorEnabled(data.twoFactorEnabled || false)
        if (data.currentSession) {
          setCurrentSession(data.currentSession)
        }
        setOtherSessions(data.otherSessions || [])
      }
    } catch (error) {
      console.error('Error fetching security info:', error)
    }
  }, [])

  // Countdown timer for OTP
  useEffect(() => {
    if (otpExpiresIn <= 0) return
    const interval = setInterval(() => {
      setOtpExpiresIn((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [otpExpiresIn])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/customer/settings')
    } else if (status === 'authenticated') {
      fetchProfile()
      fetchAddresses()
      fetchOrderStats()
      fetchSecurity()
    }
  }, [
    status,
    router,
    fetchProfile,
    fetchAddresses,
    fetchOrderStats,
    fetchSecurity,
  ])

  const handleSelectSubView = (
    view: 'overview' | 'profile' | 'address' | 'security' | 'wishlist'
  ) => {
    setActiveSubView(view)
    if (view !== 'overview') {
      setActiveTab(view)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format harus JPG, PNG, atau WebP',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ukuran foto maksimal 5MB',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setAvatarPreview(data.avatarUrl)
        await update()
        toast({
          title: 'Foto profil berhasil disimpan',
        })
      } else {
        const error = await res.json()
        toast({
          title: error.error || 'Gagal mengunggah foto',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Gagal mengunggah foto',
        variant: 'destructive',
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async (
    otpToVerify?: string | React.MouseEvent
  ) => {
    const otpCodeStr =
      typeof otpToVerify === 'string' ? otpToVerify : undefined

    if (!name.trim()) {
      toast({
        title: 'Nama lengkap wajib diisi',
        variant: 'destructive',
      })
      return
    }
    if (!email.trim()) {
      toast({
        title: 'Alamat email wajib diisi',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          phone: phone.trim(),
          gender: gender || null,
          birthDate: birthDate || null,
          bio: bio.trim(),
          otp:
            otpCodeStr ||
            (otpPurpose === 'CHANGE_EMAIL' && otpCode.trim()
              ? otpCode.trim()
              : undefined),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.requiresOtp) {
          setOtpPurpose('CHANGE_EMAIL')
          setOtpWhatsappUrl(data.whatsappUrl || '')
          setOtpPreview(data.otpPreview || '')
          setOtpExpiresIn(data.expiresInSeconds || 300)
          setOtpCode('')
          setIsOtpModalOpen(true)
          toast({
            title: 'Verifikasi Diperlukan',
            description:
              'Masukkan kode OTP WhatsApp untuk konfirmasi perubahan email akun.',
          })
          return
        }

        setInitialEmail(email.trim())
        setIsOtpModalOpen(false)
        setOtpCode('')
        await update()
        toast({
          title: 'Biodata berhasil disimpan',
        })
      } else {
        toast({
          title: data.error || 'Gagal menyimpan profil',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Gagal menyimpan profil',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    setSettingDefaultId(addressId)
    try {
      const res = await fetch(`/api/user/addresses/${addressId}/set-default`, {
        method: 'POST',
      })

      if (res.ok) {
        toast({
          title: 'Alamat Utama Diperbarui',
          description:
            'Alamat ini akan otomatis digunakan saat checkout pesanan.',
        })
        await fetchAddresses()
      } else {
        const err = await res.json()
        toast({
          title: 'Gagal',
          description: err.error || 'Gagal mengubah alamat utama.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error setting default address:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengatur alamat utama.',
        variant: 'destructive',
      })
    } finally {
      setSettingDefaultId(null)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus alamat pengiriman ini?'))
      return

    setDeletingId(addressId)
    try {
      const res = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Alamat Dihapus',
          description: 'Alamat telah dihapus dari daftar buku alamat Anda.',
        })
        await fetchAddresses()
      } else {
        const err = await res.json()
        toast({
          title: 'Gagal Menghapus',
          description: err.error || 'Gagal menghapus alamat.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus alamat.',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleChangePassword = async (
    otpToVerify?: string | React.MouseEvent
  ) => {
    const otpCodeStr =
      typeof otpToVerify === 'string' ? otpToVerify : undefined

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Konfirmasi password tidak cocok',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password minimal 6 karakter',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          otp:
            otpCodeStr ||
            (otpPurpose === 'CHANGE_PASSWORD' && otpCode.trim()
              ? otpCode.trim()
              : undefined),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.requiresOtp) {
          setOtpPurpose('CHANGE_PASSWORD')
          setOtpWhatsappUrl(data.whatsappUrl || '')
          setOtpPreview(data.otpPreview || '')
          setOtpExpiresIn(data.expiresInSeconds || 300)
          setOtpCode('')
          setIsOtpModalOpen(true)
          toast({
            title: 'Verifikasi Diperlukan',
            description:
              'Masukkan kode OTP WhatsApp untuk konfirmasi penggantian kata sandi.',
          })
          return
        }

        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setIsOtpModalOpen(false)
        setOtpCode('')
        toast({
          title: 'Kata sandi berhasil diubah',
        })
      } else {
        toast({
          title: data.error || 'Password lama tidak sesuai',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: 'Gagal mengubah password',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Security Handlers: 2FA WhatsApp & Sessions
  // ─────────────────────────────────────────────────────────────────────────
  const handleToggle2Fa = async () => {
    setOtpPurpose('2FA')
    if (twoFactorEnabled) {
      setSecurityLoading(true)
      try {
        const res = await fetch('/api/user/security', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'disable_2fa' }),
        })
        if (res.ok) {
          setTwoFactorEnabled(false)
          toast({ title: '2FA WhatsApp dinonaktifkan' })
        } else {
          toast({ title: 'Gagal menonaktifkan 2FA', variant: 'destructive' })
        }
      } catch (err) {
        toast({ title: 'Gagal menonaktifkan 2FA', variant: 'destructive' })
      } finally {
        setSecurityLoading(false)
      }
      return
    }

    if (!phone || phone.trim().length < 8) {
      toast({
        title: 'Nomor WhatsApp belum terdaftar di profil',
        variant: 'destructive',
      })
      return
    }

    setRequestingOtp(true)
    try {
      const res = await fetch('/api/user/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp' }),
      })
      const data = await res.json()
      if (res.ok) {
        setOtpWhatsappUrl(data.whatsappUrl || '')
        setOtpPreview(data.otpPreview || '')
        setOtpExpiresIn(data.expiresInSeconds || 300)
        setOtpCode('')
        setIsOtpModalOpen(true)
        toast({ title: 'Kode OTP WhatsApp dikirim' })
      } else {
        toast({
          title: data.error || 'Gagal meminta kode OTP',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Gagal menghubungi server',
        variant: 'destructive',
      })
    } finally {
      setRequestingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 6) {
      toast({
        title: 'Masukkan 6 digit kode OTP',
        variant: 'destructive',
      })
      return
    }

    if (otpPurpose === 'CHANGE_PASSWORD') {
      await handleChangePassword(otpCode.trim())
      return
    }

    if (otpPurpose === 'CHANGE_EMAIL') {
      await handleSaveProfile(otpCode.trim())
      return
    }

    setVerifyingOtp(true)
    try {
      const res = await fetch('/api/user/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_otp', otp: otpCode.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFactorEnabled(true)
        setIsOtpModalOpen(false)
        setOtpCode('')
        toast({ title: '2FA WhatsApp berhasil aktif' })
      } else {
        toast({
          title: data.error || 'Kode OTP tidak cocok',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Gagal memverifikasi OTP',
        variant: 'destructive',
      })
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (otpExpiresIn > 240) return
    setRequestingOtp(true)
    try {
      if (otpPurpose === 'CHANGE_PASSWORD') {
        const res = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request-otp' }),
        })
        const data = await res.json()
        if (res.ok) {
          setOtpWhatsappUrl(data.whatsappUrl || '')
          setOtpPreview(data.otpPreview || '')
          setOtpExpiresIn(data.expiresInSeconds || 300)
          toast({ title: 'Kode OTP baru dikirim ke WhatsApp' })
        } else {
          toast({
            title: data.error || 'Gagal mengirim ulang OTP',
            variant: 'destructive',
          })
        }
      } else if (otpPurpose === 'CHANGE_EMAIL') {
        const res = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'request-email-otp',
            email: email.trim(),
          }),
        })
        const data = await res.json()
        if (res.ok) {
          setOtpWhatsappUrl(data.whatsappUrl || '')
          setOtpPreview(data.otpPreview || '')
          setOtpExpiresIn(data.expiresInSeconds || 300)
          toast({ title: 'Kode OTP baru dikirim ke WhatsApp' })
        } else {
          toast({
            title: data.error || 'Gagal mengirim ulang OTP',
            variant: 'destructive',
          })
        }
      } else {
        const res = await fetch('/api/user/security', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request_otp' }),
        })
        const data = await res.json()
        if (res.ok) {
          setOtpWhatsappUrl(data.whatsappUrl || '')
          setOtpPreview(data.otpPreview || '')
          setOtpExpiresIn(data.expiresInSeconds || 300)
          toast({ title: 'Kode OTP baru dikirim ke WhatsApp' })
        } else {
          toast({
            title: data.error || 'Gagal mengirim ulang OTP',
            variant: 'destructive',
          })
        }
      }
    } catch (err) {
      toast({ title: 'Gagal mengirim ulang OTP', variant: 'destructive' })
    } finally {
      setRequestingOtp(false)
    }
  }

  const handleLogoutOtherDevices = async () => {
    setLoggingOutOther(true)
    try {
      const res = await fetch('/api/user/security', {
        method: 'DELETE',
      })
      if (res.ok) {
        setOtherSessions([])
        toast({
          title: 'Semua perangkat lain dikeluarkan',
        })
      } else {
        toast({
          title: 'Gagal mengeluarkan perangkat lain',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Gagal memproses pengeluaran sesi',
        variant: 'destructive',
      })
    } finally {
      setLoggingOutOther(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50">
        <Navbar variant="light" />
        <div className="flex flex-1 items-center justify-center pt-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-slate-900" />
            <p className="text-xs font-semibold text-slate-500">
              Memuat data akun pembeli...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tabsConfig = [
    {
      id: 'profile' as Tab,
      label: 'Profil & Biodata',
      shortLabel: 'Profil',
      icon: User,
    },
    {
      id: 'address' as Tab,
      label: `Alamat Pengiriman (${addresses.length})`,
      shortLabel: `Alamat (${addresses.length})`,
      icon: MapPin,
    },
    {
      id: 'security' as Tab,
      label: 'Kata Sandi & Keamanan',
      shortLabel: 'Keamanan',
      icon: Lock,
    },
    {
      id: 'wishlist' as Tab,
      label: `Wishlist Saya (${wishlistCount})`,
      shortLabel: `Wishlist (${wishlistCount})`,
      icon: Heart,
    },
  ]

  const renderTabContent = () => (
    <AnimatePresence mode="wait">
      {/* ========================================================================= */}
      {/* ------------------------- TAB 1: PROFIL & BIODATA ---------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* Avatar Inner Box */}
          <div className="shadow-2xs flex flex-col items-start gap-5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="relative shrink-0">
              <div className="shadow-xs relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-900 text-white">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={name || session?.user?.name || 'Avatar'}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarPreview(null)}
                  />
                ) : (
                  <span className="text-xl font-black">
                    {(name || session?.user?.name || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              {uploadingAvatar && (
                <div className="backdrop-blur-2xs absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/60">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="shadow-xs inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-950 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>
                    {uploadingAvatar ? 'Mengunggah...' : 'Ubah Foto Profil'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Format JPG, PNG atau WebP. Ukuran berkas maksimal 5MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Shopee Buyer Form Grid */}
          <div className="space-y-4">
            {/* Row 1: Nama Lengkap & Username */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap sesuai KTP"
                    required
                    className="focus:shadow-xs w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Username / Nama Panggilan
                </label>
                <div className="relative flex items-center">
                  <AtSign className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value.toLowerCase().replace(/\s+/g, '')
                      )
                    }
                    placeholder="sitiaminah99"
                    className="focus:shadow-xs w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 font-mono text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Email & Nomor Telepon WhatsApp */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Alamat Email <span className="text-red-500">*</span>
                  </label>
                  {initialEmail &&
                  email.trim().toLowerCase() !== initialEmail.toLowerCase() ? (
                    <span className="shadow-2xs inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-700">
                      <ShieldCheck className="h-3 w-3 text-orange-600" />
                      Perlu OTP WhatsApp
                    </span>
                  ) : (
                    <span className="shadow-2xs inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Terverifikasi
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="focus:shadow-xs w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                </div>
                {initialEmail &&
                  email.trim().toLowerCase() !== initialEmail.toLowerCase() && (
                    <p className="mt-1 text-[11px] font-medium text-orange-600">
                      Perubahan email memerlukan verifikasi OTP WhatsApp ke{' '}
                      {phone
                        ? phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')
                        : 'nomor WA terdaftar'}
                      .
                    </p>
                  )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Nomor Telepon / WhatsApp{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="shadow-2xs inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    WhatsApp Aktif
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Phone className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    required
                    className="focus:shadow-xs w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Nomor aktif untuk pelacakan resi kurir JNE & konfirmasi driver
                  Gojek.
                </p>
              </div>
            </div>

            {/* Row 3: Jenis Kelamin & Tanggal Lahir */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Laki-laki', 'Perempuan'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setGender(item)}
                      className={`cursor-pointer rounded-full border px-3 py-2.5 text-xs font-bold transition-all ${
                        gender === item
                          ? 'shadow-xs border-orange-500 bg-orange-50/80 font-bold text-orange-600'
                          : 'border-slate-200/70 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Tanggal Lahir
                </label>
                <div className="relative flex items-center">
                  <Calendar className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="focus:shadow-xs w-full cursor-pointer rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Dapatkan voucher diskon & hadiah spesial di hari ulang tahun
                  Anda.
                </p>
              </div>
            </div>

            {/* Row 4: Bio / Catatan Pembeli */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Bio / Catatan Khusus Pengiriman
              </label>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Jika rumah kosong, paket gadget dapat dititipkan ke security pos depan."
                  className="focus:shadow-xs w-full resize-none rounded-2xl border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Save Button (Desktop only — Mobile uses top-right header action button) */}
          <div className="hidden items-center justify-end border-t border-slate-100 pt-4 md:flex">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="shadow-xs inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{saving ? 'Menyimpan...' : 'Simpan Profil Biodata'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- TAB 2: ALAMAT PENGIRIMAN MULTI-ADDRESS ------------ */}
      {/* ========================================================================= */}
      {activeTab === 'address' && (
        <motion.div
          key="address"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* Header Bar with Add Address CTA */}
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-950">
                Daftar Alamat Pengiriman Saya
              </h2>
              <p className="text-xs text-slate-400">
                Kelola alamat Rumah, Kantor, dan titik GPS akurat untuk kurir
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddressToEdit(null)
                setIsAddressModalOpen(true)
              }}
              className="shadow-xs inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Alamat Baru</span>
            </button>
          </div>

          {/* Address Cards List */}
          {loadingAddresses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
              <div className="shadow-2xs mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-slate-900">
                Belum Ada Alamat Tersimpan
              </h3>
              <p className="mb-4 max-w-sm text-xs text-slate-400">
                Tambahkan alamat rumah atau kantor Anda untuk mempermudah proses
                checkout pembelian gadget.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAddressToEdit(null)
                  setIsAddressModalOpen(true)
                }}
                className="shadow-xs inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Alamat Pertama</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((item) => (
                <div
                  key={item.id}
                  className={`shadow-2xs rounded-2xl border p-5 transition-all ${
                    item.isDefault
                      ? 'border-slate-950/30 bg-slate-50/90 ring-1 ring-slate-950/10'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    {/* Left Details */}
                    <div className="flex-1 space-y-2">
                      {/* Badges & Recipient */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-950">
                          {item.recipientName}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          •
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {item.phone}
                        </span>

                        {/* Label Badge (Rumah vs Kantor) */}
                        <span
                          className={`shadow-2xs inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                            item.label === 'Kantor'
                              ? 'border-blue-200/80 bg-blue-50 text-blue-700'
                              : 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.label === 'Kantor' ? (
                            <Building2 className="h-3 w-3" />
                          ) : (
                            <Home className="h-3 w-3" />
                          )}
                          {item.label || 'Rumah'}
                        </span>

                        {/* Default Badge */}
                        {item.isDefault && (
                          <span className="shadow-xs inline-flex items-center gap-1 rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            Alamat Utama
                          </span>
                        )}
                      </div>

                      {/* Full Address */}
                      <p className="text-xs font-medium leading-relaxed text-slate-700">
                        {item.fullAddress}
                      </p>

                      {/* Village, District, City, Province, Postal Code */}
                      <p className="text-xs text-slate-500">
                        {[
                          item.village,
                          item.district,
                          item.city,
                          item.province,
                          item.postalCode,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>

                      {/* GPS Pin Point Indicator */}
                      {item.latitude && item.longitude && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50/80 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            <MapPin className="h-3 w-3 text-blue-600" />
                            Titik GPS Terpasang
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 md:border-t-0 md:pt-0">
                      {!item.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(item.id)}
                          disabled={settingDefaultId === item.id}
                          className="shadow-2xs inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          {settingDefaultId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Star className="h-3 w-3 text-amber-500" />
                          )}
                          <span>Atur Utama</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setAddressToEdit(item)
                          setIsAddressModalOpen(true)
                        }}
                        className="shadow-2xs inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <Edit3 className="h-3 w-3 text-slate-500" />
                        <span>Ubah</span>
                      </button>

                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(item.id)}
                          disabled={deletingId === item.id}
                          className="shadow-2xs inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-200/80 bg-rose-50/50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100/60"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Component */}
          <AddressModal
            isOpen={isAddressModalOpen}
            onClose={() => setIsAddressModalOpen(false)}
            onSuccess={fetchAddresses}
            addressToEdit={addressToEdit}
          />
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* ----------------- TAB 3: KATA SANDI & KEAMANAN AKUN --------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <motion.div
          key="security"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* 1. Ubah Kata Sandi */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="min-w-0 pr-2">
                <h2 className="text-sm font-bold text-slate-950">
                  Ubah Kata Sandi Akun
                </h2>
                <p className="text-xs text-slate-400">
                  Perbarui kata sandi secara berkala untuk menjaga keamanan akun
                </p>
              </div>
              <span className="shadow-2xs inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-slate-200/70 bg-white px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                Terproteksi
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Current Password */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Password Saat Ini
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Password lama"
                    className="focus:shadow-xs w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 cursor-pointer text-slate-400 transition hover:text-slate-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Password Baru
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="focus:shadow-xs w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 cursor-pointer text-slate-400 transition hover:text-slate-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Konfirmasi Password Baru
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="focus:shadow-xs w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 cursor-pointer text-slate-400 transition hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] text-slate-400">
                Minimal 6 karakter. Pergantian kata sandi memerlukan verifikasi kode OTP WhatsApp.
              </div>
              <button
                type="button"
                onClick={() => handleChangePassword()}
                disabled={
                  saving || !currentPassword || !newPassword || !confirmPassword
                }
                className="shadow-xs hidden shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 md:inline-flex md:w-auto"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>Perbarui Kata Sandi</span>
              </button>
            </div>
          </div>

          {/* 2. Shopee-Style Security Verification Settings */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div>
              <h2 className="text-sm font-bold text-slate-950">
                Verifikasi & Keamanan Tambahan
              </h2>
              <p className="text-xs text-slate-400">
                Proteksi transaksi checkout gadget dan akses akun Anda
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* 2FA Toggle (WhatsApp OTP) */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 transition-all">
                <div className="space-y-1.5 pr-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      Verifikasi 2 Langkah (OTP WhatsApp)
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                      DIREKOMENDASIKAN
                    </span>
                    {twoFactorEnabled && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold text-orange-700">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Minta kode OTP verifikasi WhatsApp saat login dari browser
                    baru atau transaksi sensitif.
                  </p>
                  {phone ? (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <MessageSquare className="h-3 w-3" />
                      <span>
                        Nomor WA:{' '}
                        {phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-600">
                      Nomor telepon belum diatur di biodata.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={securityLoading || requestingOtp}
                  onClick={handleToggle2Fa}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    twoFactorEnabled ? 'bg-orange-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Daftar Perangkat & Sesi Login Aktif */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  Perangkat & Sesi Login Aktif
                </h2>
                <p className="text-xs text-slate-400">
                  Daftar perangkat yang saat ini memiliki akses aktif ke akun
                  Anda
                </p>
              </div>
              {otherSessions.length > 0 && (
                <button
                  type="button"
                  onClick={handleLogoutOtherDevices}
                  disabled={loggingOutOther}
                  className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-rose-200 bg-rose-50/70 px-4 py-1.5 text-xs font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-50 sm:self-auto"
                >
                  {loggingOutOther ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  <span>Keluarkan Perangkat Lain</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Current Device (Accurately Detected from User-Agent) */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3.5 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    {currentSession?.deviceType === 'mobile' ? (
                      <Smartphone className="h-5 w-5" />
                    ) : (
                      <Laptop className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-black text-slate-950">
                      {currentSession?.deviceLabel ||
                        'PC / Desktop (Windows 11 / 10)'}
                    </span>
                    <p className="truncate text-[11px] text-slate-400">
                      {currentSession?.browserLabel || 'Google Chrome'} •{' '}
                      {currentSession?.location || 'Jakarta, Indonesia'} • (Sesi
                      Saat Ini)
                    </p>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </div>

              {/* Other Sessions if any */}
              {otherSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-3.5 sm:p-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="shadow-2xs flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-950">
                        {s.deviceLabel}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {s.browser} • {s.location} • {s.lastActive}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {otherSessions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-3.5 text-center text-xs text-slate-400">
                  Hanya perangkat ini yang sedang aktif mengakses akun Anda
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WISHLIST SAYA                                                      */}
      {/* ========================================================================= */}
      {(activeTab === 'wishlist' || activeSubView === 'wishlist') && (
        <motion.div
          key="wishlist"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          <CustomerWishlistView
            onBackToOverview={() => setActiveSubView('overview')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Hidden Global File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />

      <Toaster />

      {/* 1. Mobile View: Modular Customer Account Hub & Subviews (No Footer) */}
      <div className="block h-dvh max-h-screen w-full overflow-hidden md:hidden">
        <MobileCustomerAccountView
          user={{
            name,
            username,
            email,
            phone,
            avatarPreview,
          }}
          orderStats={orderStats}
          addressesCount={addresses.length}
          activeSubView={activeSubView}
          setActiveSubView={handleSelectSubView}
          onAvatarClick={handleAvatarClick}
          onSignOut={() => signOut({ callbackUrl: '/' })}
          onSaveProfile={handleSaveProfile}
          onSavePassword={handleChangePassword}
          onAddAddress={() => {
            setAddressToEdit(null)
            setIsAddressModalOpen(true)
          }}
          saving={saving}
        >
          {activeSubView !== 'overview' && renderTabContent()}
        </MobileCustomerAccountView>
      </div>

      {/* 2. Desktop View: Full Settings with Quick Orders Banner (No Footer) */}
      <div className="hidden min-h-screen bg-slate-50/50 text-slate-900 selection:bg-orange-500 selection:text-white md:block">
        <Navbar variant="light" />

        <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          {/* Desktop Quick Orders Banner Card */}
          <div className="shadow-2xs mb-6 rounded-3xl border border-slate-200/80 bg-white p-6">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">
                    Pesanan Saya
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pantau status pengiriman, proses pembayaran, dan histori
                    pesanan gadget Anda
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/customer/orders"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              >
                <span>Lihat Semua Pesanan</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-5">
              <Link
                href="/dashboard/customer/orders?status=PENDING_PAYMENT"
                className="hover:shadow-xs group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-orange-200 hover:bg-white"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">
                    Belum Bayar
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {orderStats.pending}
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/customer/orders?status=PROCESSING"
                className="hover:shadow-xs group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-blue-200 hover:bg-white"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">
                    Diproses Toko
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {orderStats.processing}
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/customer/orders?status=SHIPPED"
                className="hover:shadow-xs group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-amber-200 hover:bg-white"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">
                    Sedang Dikirim
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {orderStats.inProgress}
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/customer/orders?status=COMPLETED"
                className="hover:shadow-xs group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-emerald-200 hover:bg-white"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">
                    Pesanan Selesai
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {orderStats.completed}
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/customer/orders?status=RETURNED"
                className="hover:shadow-xs group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-rose-200 hover:bg-white"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-500 group-hover:text-white">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">
                    Pengembalian
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {orderStats.returned > 0 ? orderStats.returned : 'Retur'}
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Top Segmented Navigation Pills (Aligned with Header Navbar max-w-7xl) */}
          <div className="shadow-2xs mb-6 flex gap-1 rounded-full border border-slate-200/70 bg-slate-100/80 p-1">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'shadow-xs bg-white font-bold text-orange-600'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-950'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              )
            })}
          </div>

          {/* Main Content Bento Card */}
          <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* WhatsApp 2FA OTP Verification Modal */}
      {isOtpModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-4 duration-200 animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-200 animate-in zoom-in-95">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOtpModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Modal Header */}
              <div className="flex flex-col items-center text-center">
                <div className="shadow-xs mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-950">
                  {otpPurpose === 'CHANGE_PASSWORD'
                    ? 'Verifikasi Ganti Kata Sandi'
                    : otpPurpose === 'CHANGE_EMAIL'
                    ? 'Verifikasi Ganti Email Akun'
                    : 'Verifikasi OTP WhatsApp'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {otpPurpose === 'CHANGE_PASSWORD'
                    ? 'Demi keamanan akun, masukkan 6 digit kode OTP WhatsApp:'
                    : otpPurpose === 'CHANGE_EMAIL'
                    ? 'Untuk konfirmasi pergantian email, masukkan 6 digit kode OTP:'
                    : 'Masukkan 6 digit kode yang dikirimkan ke nomor WhatsApp:'}{' '}
                  <span className="font-bold text-slate-900">
                    {phone
                      ? phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')
                      : ''}
                  </span>
                </p>
              </div>

              {/* WhatsApp Link CTA */}
              {otpWhatsappUrl && (
                <a
                  href={otpWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shadow-xs mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Buka Pesan OTP WhatsApp</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
              )}

              {/* OTP Input */}
              <div className="mt-5 space-y-2">
                <label className="block text-center text-[11px] font-bold text-slate-600">
                  KODE VERIFIKASI 6-DIGIT
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="123456"
                  autoFocus
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-center font-mono text-2xl font-black tracking-[0.35em] text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
                />
                {otpPreview && (
                  <p className="text-center text-[10px] text-slate-400">
                    Simulasi Kode:{' '}
                    <span className="font-mono font-bold text-emerald-600">
                      {otpPreview}
                    </span>
                  </p>
                )}
              </div>

              {/* Expiry & Resend */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Berlaku:{' '}
                  <strong className="font-mono text-slate-800">
                    {Math.floor(otpExpiresIn / 60)}:
                    {(otpExpiresIn % 60).toString().padStart(2, '0')}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={requestingOtp || otpExpiresIn > 240}
                  className="font-bold text-orange-600 hover:underline disabled:opacity-40 disabled:hover:no-underline"
                >
                  {requestingOtp ? 'Mengirim...' : 'Kirim Ulang'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="w-1/2 rounded-full border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length < 6}
                  className="shadow-xs flex w-1/2 items-center justify-center gap-1.5 rounded-full bg-slate-950 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                >
                  {verifyingOtp ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {otpPurpose === 'CHANGE_PASSWORD'
                      ? 'Ubah Sandi'
                      : otpPurpose === 'CHANGE_EMAIL'
                      ? 'Simpan Email'
                      : 'Verifikasi'}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
