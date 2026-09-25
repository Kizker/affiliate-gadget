'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'

interface Device {
  id: string
  deviceLabel: string
  deviceType: string
  browser: string
  os: string
  ipAddress: string
  location?: string
  lastLoginAt: string
  isTrusted: boolean
}

export default function SecurityPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const fetchDevices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/user/security/devices')
      const data = await res.json()
      if (res.ok && data.devices) {
        setDevices(data.devices)
      }
    } catch {
      setMessage({ type: 'error', text: 'Gagal memuat daftar perangkat aktif' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akses perangkat ini?'))
      return

    setActionLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/user/security/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Akses perangkat berhasil dicabut',
        })
        setDevices((prev) => prev.filter((d) => d.id !== deviceId))
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal menghapus perangkat',
        })
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Terjadi kendala saat menghapus perangkat',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeAllOther = async () => {
    if (
      !confirm(
        'Putuskan sesi di semua perangkat lain? Anda akan tetap masuk di perangkat ini.'
      )
    )
      return

    setActionLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/user/security/revoke-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Semua perangkat lain telah berhasil dikeluarkan',
        })
        fetchDevices()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal memutuskan sesi',
        })
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Terjadi kendala saat memutuskan sesi',
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/dashboard/customer"
              className="transition hover:text-blue-600"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200">
              Keamanan Akun
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Pusat Keamanan & Perangkat Aktif
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pantau dan amankan sesi login akun Anda di seluruh browser dan
            perangkat.
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-semibold ${
              message.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 2FA Protection Info Card */}
        <div className="bg-linear-to-r rounded-3xl border border-blue-100 from-blue-900 to-indigo-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Proteksi Login WhatsApp Multi-Channel Aktif
                </h3>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-blue-200/80">
                  Setiap percobaan login dari perangkat baru akan memicu
                  peringatan keamanan otomatis ke WhatsApp dan email Anda, serta
                  menuntut kode OTP verifikasi 6-digit.
                </p>
              </div>
            </div>
            <button
              onClick={handleRevokeAllOther}
              disabled={actionLoading || devices.length <= 1}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-900/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluarkan Perangkat Lain</span>
            </button>
          </div>
        </div>

        {/* Active Devices List */}
        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Daftar Perangkat Terhubung
              </h2>
              <p className="text-xs text-slate-500">
                Perangkat yang pernah digunakan untuk masuk ke akun ini.
              </p>
            </div>
            <button
              onClick={fetchDevices}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span>Segarkan</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-slate-300" />
                Memuat data perangkat...
              </div>
            ) : devices.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada data perangkat yang tersimpan.
              </div>
            ) : (
              devices.map((device, idx) => (
                <div
                  key={device.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {device.deviceType === 'mobile' ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Laptop className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {device.deviceLabel}
                        </span>
                        {idx === 0 && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                            Sesi Ini
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span>
                          {device.browser} • {device.os}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Globe className="h-3 w-3 text-slate-400" />
                          {device.ipAddress}{' '}
                          {device.location ? `(${device.location})` : ''}
                        </span>
                        <span>•</span>
                        <span>
                          Aktif:{' '}
                          {new Date(device.lastLoginAt).toLocaleDateString(
                            'id-ID',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {idx !== 0 && (
                    <button
                      onClick={() => handleRevokeDevice(device.id)}
                      disabled={actionLoading}
                      className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 sm:self-center"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Cabut Akses</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
