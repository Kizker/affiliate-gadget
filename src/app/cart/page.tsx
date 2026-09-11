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
import {
  ShoppingBag,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Check,
  ArrowLeft,
} from 'lucide-react'

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
  const someSelected =
    selectedItems.length > 0 && selectedItems.length < items.length

  const handleSelectAll = () => {
    if (allSelected) {
      deselectAllItems()
    } else {
      selectAllItems()
    }
  }

  useEffect(() => {
    if (
      status === 'authenticated' &&
      session?.user?.id &&
      userId !== session.user.id
    ) {
      setUserId(session.user.id)
    } else if (status === 'unauthenticated') {
      setUserId(null)
    }
  }, [session, status, userId, setUserId])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />

      <main className="flex min-h-screen flex-col pb-20 pt-28 sm:pb-24 sm:pt-32">
        <div className="mx-auto my-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Keranjang Belanja
              </h1>
              {status === 'authenticated' && items.length > 0 && (
                <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {items.length} barang
                </span>
              )}
            </div>

            <Link
              href="/gadget"
              className="shadow-2xs inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Lanjut Belanja</span>
            </Link>
          </div>

          {status === 'unauthenticated' ? (
            /* Unauthenticated State */
            <div className="shadow-xs mx-auto my-8 max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Silakan Masuk Terlebih Dahulu
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Untuk melihat dan melanjutkan pesanan di keranjang belanja,
                  Anda harus masuk ke akun pembeli terlebih dahulu.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-2.5 pt-2 sm:flex-row">
                <Link
                  href="/login?redirect=/cart"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600"
                >
                  Masuk Sekarang <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/gadget"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  Katalog Produk
                </Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="shadow-xs mx-auto my-8 max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Keranjang Anda Masih Kosong
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Jelajahi smartphone second berkualitas bergaransi 30 hari
                  tukar unit dengan bonus aksesoris 3-in-1 lengkap.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/gadget"
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600"
                >
                  Mulai Belanja Sekarang <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              {/* Left Column: Selection Bar & Items List (8 cols) */}
              <div className="space-y-4 lg:col-span-8">
                {/* Select All & Multi-action Bar */}
                <div className="shadow-xs flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={allSelected}
                      onClick={handleSelectAll}
                      className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all duration-150 ${
                        allSelected
                          ? 'shadow-2xs border-slate-950 bg-slate-950 text-white dark:border-blue-600 dark:bg-blue-600'
                          : someSelected
                            ? 'border-slate-400 bg-slate-200 text-slate-900 dark:border-slate-600 dark:bg-slate-700'
                            : 'border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800'
                      }`}
                      aria-label="Pilih semua item"
                    >
                      {allSelected && (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      )}
                      {someSelected && !allSelected && (
                        <div className="rounded-xs h-2 w-2 bg-slate-700 dark:bg-white" />
                      )}
                    </button>

                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Pilih Semua ({items.length})
                    </span>

                    {selectedItems.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {selectedItems.length} terpilih
                      </span>
                    )}
                  </div>

                  {selectedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={removeSelectedItems}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors hover:text-rose-600"
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
              <div className="sticky top-28 lg:col-span-4">
                <CartSummary />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
