'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  X,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  Store,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface ProductShareModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    price?: number
    images?: string[]
    brand?: string
    store?: {
      name?: string
      city?: string
    }
  }
  selectedVariant?: {
    name?: string
    price?: number
    image?: string
  } | null
  currentPrice?: number
  selectedImage?: string
}

export function ProductShareModal({
  isOpen,
  onClose,
  product,
  selectedVariant,
  currentPrice,
  selectedImage,
}: ProductShareModalProps) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      setCanNativeShare(true)
    }
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://affiliategadget.tech/gadget/${product.id}`

  const displayPrice =
    currentPrice || selectedVariant?.price || product.price || 0
  const displayImage =
    selectedImage ||
    selectedVariant?.image ||
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'
  const storeName = product.store?.name || 'Toko Resmi'

  const shareTitle = `${product.name}${
    selectedVariant?.name ? ` (${selectedVariant.name})` : ''
  }`
  const shareMessage = `Hai! Cek ${shareTitle} di Affiliate Gadget dengan harga Rp ${displayPrice.toLocaleString(
    'id-ID'
  )}. Garansi 30 Hari Tukar Unit Baru & Bonus Aksesoris 3-in-1!\n\nLihat detail produk di sini:\n${shareUrl}`

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      toast.success('Tautan produk berhasil disalin ke papan klip!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Gagal menyalin tautan.')
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Cek ${shareTitle} - Rp ${displayPrice.toLocaleString('id-ID')} di Affiliate Gadget!`,
          url: shareUrl,
        })
        onClose()
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink()
        }
      }
    } else {
      handleCopyLink()
    }
  }

  const shareChannels = [
    {
      name: 'WhatsApp',
      color:
        'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20',
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.067-1.109-.066-.889-.285-1.928-.94-2.73-1.741-.801-.801-1.456-1.841-1.741-2.73-.133-.415-.111-.797-.066-1.109.05-.333.419-1.026.824-1.17.133-.048.272-.058.405-.058.11 0 .221.002.321.011.23.023.361.168.441.353.181.417.62 1.503.674 1.614.055.111.092.241.018.388-.073.148-.11.24-.221.369-.111.13-.233.29-.333.39-.11.11-.225.23-.097.45.129.221.572.94 1.229 1.526.846.754 1.558.987 1.779 1.097.221.11.352.093.483-.058.13-.15.556-.648.704-.87.148-.221.296-.184.498-.11.203.074 1.291.609 1.513.72.221.111.369.166.424.259.056.092.056.536-.088.941z" />
        </svg>
      ),
      action: () => {
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`,
          '_blank'
        )
      },
    },
    {
      name: 'Telegram',
      color: 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20',
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
      action: () => {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            shareUrl
          )}&text=${encodeURIComponent(shareTitle)}`,
          '_blank'
        )
      },
    },
    {
      name: 'Facebook',
      color: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      ),
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`,
          '_blank'
        )
      },
    },
    {
      name: 'Twitter (X)',
      color:
        'bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 shadow-slate-900/20',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            shareUrl
          )}&text=${encodeURIComponent(
            `Cek ${shareTitle} - Rp ${displayPrice.toLocaleString('id-ID')} di Affiliate Gadget!`
          )}`,
          '_blank'
        )
      },
    },
  ]

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/60 p-0 duration-200 animate-in fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col rounded-t-[28px] border border-slate-200/80 bg-white p-5 shadow-2xl duration-200 animate-in slide-in-from-bottom-5 dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Indicator (Mobile) */}
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="share-modal-title"
                className="text-sm font-extrabold text-slate-950 dark:text-white sm:text-base"
              >
                Bagikan Gadget Ini
              </h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Kirim info unit original ini ke rekan Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mini Product Preview Card */}
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-900">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes="56px"
              unoptimized
              className="object-contain p-1"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-xs font-bold text-slate-900 dark:text-white">
              {product.name}
            </h3>
            {selectedVariant?.name && (
              <p className="line-clamp-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Varian: {selectedVariant.name}
              </p>
            )}
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-xs font-black text-orange-500">
                Rp {displayPrice.toLocaleString('id-ID')}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Store className="h-3 w-3 shrink-0" />
                <span className="max-w-[110px] truncate">{storeName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Social Channels Grid */}
        <div className="mt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Bagikan Lewat
          </span>

          <div className="mt-2 grid grid-cols-4 gap-2.5">
            {shareChannels.map((channel) => (
              <button
                key={channel.name}
                type="button"
                onClick={channel.action}
                className="hover:shadow-xs group flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-2.5 transition-all hover:border-slate-200 active:scale-95 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-105 ${channel.color}`}
                >
                  {channel.icon}
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {channel.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy Link Input Section */}
        <div className="mt-4 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Salin Tautan Langsung
          </span>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/90 p-1.5 pl-3.5 dark:border-slate-700 dark:bg-slate-800">
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {shareUrl}
            </span>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-orange-500 text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Native Web Share Button (if supported) */}
        {canNativeShare && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleNativeShare}
              className="active:scale-98 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Opsi Bagikan Lainnya (Aplikasi HP)</span>
            </button>
          </div>
        )}

        {/* Perks Footnote */}
        <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-3 text-[10.5px] font-medium text-slate-400 dark:border-slate-800">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Garansi 30 Hari Tukar Unit • Bonus Aksesoris 3-in-1</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
