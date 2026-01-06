'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BookingModalProps {
  rentalItem: {
    id: string
    name: string
    pricePerDay: number
    stock: number
    image: string
    depositAmount: number
  }
  isOpen: boolean
  onClose: () => void
}

type DurationType = 'daily' | 'weekly' | 'monthly' | 'custom'

export default function BookingModal({
  rentalItem,
  isOpen,
  onClose,
}: BookingModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [duration, setDuration] = useState(1)
  const [durationType, setDurationType] = useState<DurationType>('daily')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Calculate pricing based on duration type (no discounts)
  const pricing = useMemo(() => {
    let actualDays = duration

    if (durationType === 'daily') {
      actualDays = 1
    } else if (durationType === 'weekly') {
      actualDays = 7
    } else if (durationType === 'monthly') {
      actualDays = 30
    }

    const basePrice = rentalItem.pricePerDay * actualDays
    const subtotal = basePrice
    const deposit = rentalItem.depositAmount || 0
    const total = subtotal + deposit

    return {
      actualDays,
      basePrice,
      subtotal,
      deposit,
      total,
    }
  }, [duration, durationType, rentalItem.pricePerDay, rentalItem.depositAmount])

  const handleDurationTypeChange = (type: DurationType) => {
    setDurationType(type)
    if (type === 'daily') {
      setDuration(1)
    } else if (type === 'weekly') {
      setDuration(7)
    } else if (type === 'monthly') {
      setDuration(30)
    }
  }

  const handleCustomDurationChange = (value: string) => {
    const numValue = parseInt(value) || 1
    const clamped = Math.max(1, Math.min(365, numValue))
    setDuration(clamped)
    setDurationType('custom')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (duration < 1) {
      toast({
        title: 'Error',
        description: 'Durasi minimal 1 hari',
        variant: 'destructive',
      })
      return
    }

    if (duration > 365) {
      toast({
        title: 'Error',
        description: 'Durasi maksimal 365 hari',
        variant: 'destructive',
      })
      return
    }

    if (rentalItem.stock < 1) {
      toast({
        title: 'Error',
        description: 'Stok tidak tersedia',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    // Redirect to direct checkout with rental data
    router.push(
      `/checkout/direct?type=rental&id=${rentalItem.id}&qty=1&days=${pricing.actualDays}`
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 pt-16 sm:p-4 sm:pt-20">
      <div className="mx-auto my-4 w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl sm:my-8 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Booking Sekarang
            </h2>
            <p className="text-xs text-gray-600 sm:text-sm">
              Lengkapi detail booking Anda
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 sm:p-2"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Rental Item Info */}
        <div className="mb-4 flex gap-3 rounded-lg bg-gray-50 p-3 sm:mb-6 sm:gap-4 sm:p-4">
          {rentalItem.image && (
            <img
              src={rentalItem.image}
              alt={rentalItem.name}
              className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
              {rentalItem.name}
            </h3>
            <p className="text-base font-bold text-blue-600 sm:text-lg">
              Rp {rentalItem.pricePerDay.toLocaleString('id-ID')}/hari
            </p>
            <p className="text-xs text-gray-500 sm:text-sm">
              Stok: {rentalItem.stock}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Duration Type Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 sm:text-sm">
              Durasi Sewa
            </label>
            <div className="mt-1 grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleDurationTypeChange('daily')}
                className={`rounded-lg border-2 p-1.5 text-center transition-all sm:p-2 ${
                  durationType === 'daily'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                  1 Hari
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleDurationTypeChange('weekly')}
                className={`rounded-lg border-2 p-1.5 text-center transition-all sm:p-2 ${
                  durationType === 'weekly'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                  7 Hari
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleDurationTypeChange('monthly')}
                className={`rounded-lg border-2 p-1.5 text-center transition-all sm:p-2 ${
                  durationType === 'monthly'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                  30 Hari
                </p>
              </button>
            </div>
          </div>

          {/* Custom Duration */}
          <div>
            <label className="block text-xs font-medium text-gray-700 sm:text-sm">
              Atau Custom (1-365 hari)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => handleCustomDurationChange(e.target.value)}
              min="1"
              max="365"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-base"
              placeholder="Masukkan jumlah hari"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 sm:text-sm">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Tambahkan catatan untuk booking..."
              className="sm:rows-3 mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-base"
            />
          </div>

          {/* Total */}
          <div className="rounded-lg bg-blue-50 p-3 sm:p-4">
            <div className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Durasi</span>
                <span>{pricing.actualDays} hari</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Harga Sewa</span>
                <span>Rp {pricing.basePrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-1.5 text-gray-600 sm:pt-2">
                <span>Subtotal</span>
                <span>Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Deposit</span>
                <span
                  className={
                    pricing.deposit === 0 ? 'font-semibold text-green-600' : ''
                  }
                >
                  {pricing.deposit > 0
                    ? `Rp ${pricing.deposit.toLocaleString('id-ID')}`
                    : 'Gratis'}
                </span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-1.5 sm:pt-2">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-blue-600 sm:text-xl">
                  Rp {pricing.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            {pricing.deposit > 0 && (
              <p className="mt-2 text-[10px] text-gray-600 sm:text-xs">
                * Deposit dikembalikan setelah alat dikembalikan
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:py-3 sm:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                Memproses...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Buat Booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
