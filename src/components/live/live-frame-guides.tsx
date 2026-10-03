'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Smartphone, Monitor } from 'lucide-react'

/** Rasio layar penonton */
const MOBILE_ASPECT = 9 / 16 // layar HP potret (Instagram Live style)
const DESKTOP_ASPECT = 16 / 9 // player desktop (YouTube Live style)

/** Zona yang tertutup UI di layar HP penonton (dalam % dari tinggi/lebar area HP) */
const MOBILE_TOP_UI = 0.1 // header toko, LIVE, jumlah penonton
const MOBILE_BOTTOM_UI = 0.32 // komentar, produk disematkan, kolom input
const MOBILE_SIDE_UI = 0.05

interface Size {
  w: number
  h: number
}

/**
 * Hitung area dari frame sumber (kamera) yang benar-benar terlihat jika
 * ditampilkan dengan object-fit: cover pada layar berasio `aspect`.
 * Hasil dalam fraksi 0..1 terhadap frame sumber.
 */
function coverRegion(sourceAspect: number, aspect: number) {
  if (sourceAspect > aspect) {
    return { w: aspect / sourceAspect, h: 1 }
  }
  return { w: 1, h: sourceAspect / aspect }
}

/**
 * Panduan frame untuk HOST: menampilkan batas area yang terlihat oleh
 * penonton HP (9:16) dan penonton desktop (16:9) di atas preview kamera.
 * Host dapat menaruh barang / dirinya di dalam "zona aman" agar tidak
 * terpotong di perangkat penonton.
 */
export function LiveFrameGuides({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<Size>({ w: 0, h: 0 })
  const [source, setSource] = useState<Size>({ w: 1280, h: 720 })

  // Ukuran container preview
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Ukuran asli frame kamera (berubah saat flip kamera / ganti orientasi)
  useEffect(() => {
    const read = () => {
      const v = videoRef.current
      if (v && v.videoWidth > 0 && v.videoHeight > 0) {
        setSource((prev) =>
          prev.w === v.videoWidth && prev.h === v.videoHeight
            ? prev
            : { w: v.videoWidth, h: v.videoHeight }
        )
      }
    }
    read()
    const id = window.setInterval(read, 1000)
    const v = videoRef.current
    v?.addEventListener('loadedmetadata', read)
    v?.addEventListener('resize', read)
    return () => {
      window.clearInterval(id)
      v?.removeEventListener('loadedmetadata', read)
      v?.removeEventListener('resize', read)
    }
  }, [videoRef])

  const sourceAspect = source.w / source.h

  // Frame kamera yang tampil (object-contain) di dalam container
  let frameW = 0
  let frameH = 0
  if (box.w > 0 && box.h > 0) {
    if (box.w / box.h > sourceAspect) {
      frameH = box.h
      frameW = box.h * sourceAspect
    } else {
      frameW = box.w
      frameH = box.w / sourceAspect
    }
  }

  const mobile = coverRegion(sourceAspect, MOBILE_ASPECT)
  const desktop = coverRegion(sourceAspect, DESKTOP_ASPECT)

  const pct = (n: number) => `${n * 100}%`
  const centered = (r: { w: number; h: number }): React.CSSProperties => ({
    left: pct((1 - r.w) / 2),
    top: pct((1 - r.h) / 2),
    width: pct(r.w),
    height: pct(r.h),
  })

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      aria-hidden="true"
    >
      {frameW > 0 && (
        <div
          className="relative overflow-hidden"
          style={{ width: frameW, height: frameH }}
        >
          {/* Area desktop (16:9) */}
          <div
            className="absolute rounded-sm border-2 border-dashed border-sky-400/90"
            style={centered(desktop)}
          >
            <span className="absolute left-1 top-1 flex items-center gap-1 rounded bg-sky-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
              <Monitor className="h-2.5 w-2.5" />
              Desktop 16:9
            </span>
          </div>

          {/* Area HP (9:16): di luar area ini TIDAK terlihat oleh penonton HP */}
          <div
            className="absolute rounded-sm border-2 border-orange-400"
            style={{
              ...centered(mobile),
              boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.55)',
            }}
          >
            <span className="absolute left-1/2 top-1 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
              <Smartphone className="h-2.5 w-2.5" />
              Layar HP 9:16
            </span>

            {/* Zona tertutup header di HP */}
            <div
              className="absolute inset-x-0 top-0 bg-rose-500/15"
              style={{ height: pct(MOBILE_TOP_UI) }}
            />
            {/* Zona tertutup komentar / produk / input di HP */}
            <div
              className="absolute inset-x-0 bottom-0 flex items-end justify-center bg-rose-500/15 pb-1"
              style={{ height: pct(MOBILE_BOTTOM_UI) }}
            >
              <span className="rounded bg-rose-600/90 px-1.5 py-0.5 text-[8px] font-semibold text-white">
                Tertutup chat &amp; produk (HP)
              </span>
            </div>

            {/* Zona aman */}
            <div
              className="absolute rounded-sm border border-dashed border-emerald-300"
              style={{
                left: pct(MOBILE_SIDE_UI),
                right: pct(MOBILE_SIDE_UI),
                top: pct(MOBILE_TOP_UI),
                bottom: pct(MOBILE_BOTTOM_UI),
              }}
            >
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                Zona aman barang
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
