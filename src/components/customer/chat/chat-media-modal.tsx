'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMediaModalProps {
  media: {
    url: string
    type: 'image' | 'video'
  } | null
  onClose: () => void
  mounted: boolean
}

export function ChatMediaModal({
  media,
  onClose,
  mounted,
}: ChatMediaModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!media) return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [media, onClose])

  if (!mounted || !media) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex cursor-pointer select-none flex-col items-center justify-between bg-white/45 p-4 backdrop-blur-xl sm:p-6"
        onClick={onClose}
      >
        {/* Top spacing spacer */}
        <div className="h-2 sm:h-4" />

        {/* Middle Main Media (Image/Video) Stage */}
        <div className="relative my-auto flex w-full flex-1 items-center justify-center px-2 sm:px-14">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[68vh] max-w-[90vw] cursor-default items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 shadow-2xl ring-1 ring-black/5 sm:max-h-[72vh] sm:max-w-[80vw] sm:rounded-3xl"
            >
              {media.type === 'video' ? (
                <video
                  src={media.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[68vh] w-auto max-w-full rounded-2xl bg-black object-contain shadow-2xl sm:max-h-[72vh] sm:rounded-3xl"
                />
              ) : (
                <img
                  src={media.url}
                  alt="Pratinjau Foto Lampiran"
                  className="max-h-[68vh] w-auto max-w-full select-none rounded-2xl object-contain sm:max-h-[72vh] sm:rounded-3xl"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Bar: Instructions / Keyboard shortcuts */}
        <div
          className="z-20 flex w-full max-w-sm cursor-default items-center justify-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 text-[11px] font-bold text-slate-700 shadow-lg backdrop-blur-xl">
            <span>
              Klik di luar area atau tekan{' '}
              <kbd className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">
                ESC
              </kbd>{' '}
              untuk menutup
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
