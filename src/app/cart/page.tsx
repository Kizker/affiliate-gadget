'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import CartItem from '@/components/cart/cart-item'
import CartSummary from '@/components/cart/cart-summary'
import { useCartStore } from '@/lib/store/cart-store'
import Link from 'next/link'
import { ShoppingBag, Loader2, ArrowRight, ShieldCheck, Trash2, Check, ArrowLeft } from 'lucide-react'

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const selectedItems = useCartStore((state) => state.selectedItems)
  const selectAllItems = useCartStore((state) => state.selectAllItems)
  const deselectAllItems = useCartStore((state) => state.deselectAllItems)
  const removeSelectedItems = useCartStore((state) => state.removeSelectedItems)
  const setUserId = useCartStore((state) => state.setUserId)
  const userId = useCartStore((state) => state.userId)

  const allSelected = items.length > 0 && selectedItems.length === items.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length

  const handleSelectAll = () => {
    if (allSelected) {
      deselectAllItems()
    } else {
      selectAllItems()
    }
  }

  useEffect(() => {
    if (session?.user?.id && userId !== session.user.id) {
      setUserId(session.user.id)
    }
  }, [session, userId, setUserId])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      <Navbar variant="light" />

      <main className="container mx-auto px-4 pt-28 pb-20 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Keranjang Belanja
            </h1>
            {items.length > 0 && (
              <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {items.length} barang
              </span>
            )}
          </div>

          <Link
            href="/gadget"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Lanjut Belanja</span>
          </Link>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border border-slate-200/80 bg-white p-12 sm:p-16 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4 max-w-md mx-auto my-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Keranjang Anda Masih Kosong
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Jelajahi smartphone second berkualitas bergaransi 30 hari tukar unit dengan bonus aksesoris 3-in-1 lengkap.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/gadget"
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 transition"
              >
                Mulai Belanja Sekarang <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            
            {/* Left Column: Selection Bar & Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Select All & Multi-action Bar */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={allSelected}
                    onClick={handleSelectAll}
                    className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all duration-150 ${
                      allSelected
                        ? 'bg-slate-950 border-slate-950 text-white dark:bg-blue-600 dark:border-blue-600 shadow-2xs'
                        : someSelected
                        ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-slate-700 dark:border-slate-600'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800'
                    }`}
                    aria-label="Pilih semua item"
                  >
                    {allSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    {someSelected && !allSelected && <div className="h-2 w-2 rounded-xs bg-slate-700 dark:bg-white" />}
                  </button>

                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Pilih Semua ({items.length})
                  </span>

                  {selectedItems.length > 0 && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {selectedItems.length} terpilih
                    </span>
                  )}
                </div>

                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={removeSelectedItems}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus ({selectedItems.length})</span>
                  </button>
                )}
              </div>

              {/* Items Stack */}
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>

            </div>

            {/* Right Column: Order Summary Sidebar (4 cols, Sticky) */}
            <div className="lg:col-span-4 sticky top-28">
              <CartSummary />
            </div>

          </div>
        )}
      </main>

      <Footer variant="light" />
    </div>
  )
}
