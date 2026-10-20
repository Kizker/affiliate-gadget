'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LogOut, X, Loader2 } from 'lucide-react'

export interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Keluar',
  description,
  confirmText = 'Ya, Keluar',
  cancelText = 'Batal',
  isLoading = false,
}: LogoutConfirmModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !isLoading) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, isSubmitting, isLoading])

  // Prevent body scroll when modal is open
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

  if (!isOpen || !mounted) return null

  const handleConfirmAction = async () => {
    try {
      setIsSubmitting(true)
      await onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop overlay */}
      <div
        className="backdrop-blur-xs fixed inset-0 bg-slate-950/60 transition-opacity duration-200 animate-in fade-in"
        onClick={() => {
          if (!isSubmitting && !isLoading) onClose()
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl transition-all duration-200 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting || isLoading}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="Tutup dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Badge Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-950/20">
            <LogOut className="h-6 w-6 stroke-[2.2]" />
          </div>

          {/* Title & Description */}
          <h3
            id="logout-modal-title"
            className="text-base font-bold text-slate-950 dark:text-white sm:text-lg"
          >
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
              {description}
            </p>
          )}

          {/* Action Buttons: Validasi Setuju / Batal */}
          <div className="mt-6 flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:text-sm"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={isSubmitting || isLoading}
              className="shadow-xs inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-[0.98] disabled:opacity-70 dark:bg-rose-600 dark:hover:bg-rose-700 sm:text-sm"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
