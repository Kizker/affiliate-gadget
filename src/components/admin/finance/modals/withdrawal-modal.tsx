'use client'

import React from 'react'
import {
  X,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  StoreInfo,
  WithdrawStep,
  WithdrawalSuccessData,
  WithdrawalErrorState,
  maskPhone,
} from '../types'

interface WithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
  withdrawStep: WithdrawStep
  setWithdrawStep: (step: WithdrawStep) => void
  withdrawAmount: string
  setWithdrawAmount: (amount: string) => void
  withdrawOtpCode: string
  setWithdrawOtpCode: (otp: string) => void
  isSendingOtp: boolean
  isSubmittingWithdraw: boolean
  otpExpirySeconds: number
  otpCooldownSeconds: number
  withdrawalSuccessData: WithdrawalSuccessData | null
  withdrawalError: WithdrawalErrorState | null
  availableBalance: number
  store: StoreInfo | null
  withdrawalTargetPhone: string
  onProceedToOtpStep: () => void
  onResendWithdrawOtp: () => void
  onSubmitWithdrawVerification: () => void
}

export function WithdrawalModal({
  isOpen,
  onClose,
  withdrawStep,
  setWithdrawStep,
  withdrawAmount,
  setWithdrawAmount,
  withdrawOtpCode,
  setWithdrawOtpCode,
  isSendingOtp,
  isSubmittingWithdraw,
  otpExpirySeconds,
  otpCooldownSeconds,
  withdrawalSuccessData,
  withdrawalError,
  availableBalance,
  store,
  withdrawalTargetPhone,
  onProceedToOtpStep,
  onResendWithdrawOtp,
  onSubmitWithdrawVerification,
}: WithdrawalModalProps) {
  if (!isOpen) return null

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl duration-200 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {withdrawStep === 'SUCCESS'
                  ? 'Pencairan Berhasil'
                  : withdrawStep === 'STEP_2_OTP'
                    ? 'Verifikasi Keamanan OTP (2FA)'
                    : 'Tarik Saldo ke Rekening PT'}
              </h3>
              {withdrawStep !== 'SUCCESS' && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {withdrawStep === 'STEP_1_INPUT' ? 'Tahap 1/2' : 'Tahap 2/2'}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {withdrawStep === 'SUCCESS'
                ? 'Bukti pencairan resmi telah diterbitkan'
                : withdrawStep === 'STEP_2_OTP'
                  ? 'Verifikasi WhatsApp resmi nomor terdaftar'
                  : 'Pencairan ke rekening bank resmi cabang'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {withdrawalError && (
          <div className="mt-3.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-bold">
                  {withdrawalError.code === 'COOLING_DOWN'
                    ? 'Penarikan Terkunci (Cooling-down)'
                    : withdrawalError.code === 'ACCOUNT_NAME_MISMATCH'
                      ? 'Kesesuaian Nama Rekening Ditolak'
                      : withdrawalError.code === 'OTP_BLOCKED'
                        ? 'Kode OTP Diblokir'
                        : 'Gagal Memproses Permintaan'}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  {withdrawalError.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Form Nominal & Rekening */}
        {withdrawStep === 'STEP_1_INPUT' && (
          <div className="mt-4 space-y-3.5">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                Rekening Tujuan Pencairan
              </label>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {store?.bankAccount?.bankName || 'Bank Mandiri'} ·{' '}
                  {store?.bankAccount?.accountName ||
                    store?.companyName ||
                    'PT Gadget Jaya Sentosa'}
                </p>
                <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {store?.bankAccount?.accountNumber || '1180 0192 8374 1'}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-400">
                  Nominal Penarikan
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">
                    Maks:{' '}
                    <strong className="font-semibold text-slate-700 dark:text-slate-200">
                      Rp {availableBalance.toLocaleString('id-ID')}
                    </strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (availableBalance > 0) {
                        setWithdrawAmount(availableBalance.toString())
                      } else {
                        toast.error('Saldo siap cair saat ini Rp 0')
                      }
                    }}
                    className="cursor-pointer font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700 dark:text-white dark:hover:text-slate-200"
                  >
                    Tarik Semua
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  value={
                    withdrawAmount
                      ? Number(
                          withdrawAmount.replace(/[^0-9]/g, '')
                        ).toLocaleString('id-ID')
                      : ''
                  }
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '')
                    setWithdrawAmount(clean)
                  }}
                  placeholder="500.000"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 font-mono text-sm font-bold text-slate-900 placeholder-slate-300 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Batas minimal penarikan Rp 50.000 (Bebas biaya transfer bank)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Verifikasi 2FA OTP akan dikirimkan ke nomor WhatsApp:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {maskPhone(withdrawalTargetPhone)}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onProceedToOtpStep}
                disabled={
                  isSendingOtp || !withdrawAmount || Number(withdrawAmount) <= 0
                }
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                {isSendingOtp ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                <span>Kirim OTP & Lanjutkan</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Input OTP */}
        {withdrawStep === 'STEP_2_OTP' && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
              <p className="font-semibold">
                Kode OTP 6-Digit Terkirim via WhatsApp
              </p>
              <p className="mt-0.5 text-[11px] text-blue-800/80 dark:text-blue-300/80">
                Masukkan kode keamanan yang diterima di{' '}
                <strong>{maskPhone(withdrawalTargetPhone)}</strong> untuk
                mencairkan nominal{' '}
                <strong>
                  Rp {Number(withdrawAmount).toLocaleString('id-ID')}
                </strong>
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-400">
                  Kode Verifikasi (OTP)
                </label>
                <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {Math.floor(otpExpirySeconds / 60)}:
                  {(otpExpirySeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={withdrawOtpCode}
                onChange={(e) =>
                  setWithdrawOtpCode(
                    e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                  )
                }
                placeholder="123456"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center font-mono text-xl font-black tracking-widest text-slate-900 placeholder-slate-300 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Tidak menerima kode?</span>
              <button
                type="button"
                onClick={onResendWithdrawOtp}
                disabled={isSendingOtp || otpCooldownSeconds > 0}
                className="font-bold text-slate-800 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-200"
              >
                {otpCooldownSeconds > 0
                  ? `Kirim Ulang (${otpCooldownSeconds}d)`
                  : 'Kirim Ulang OTP'}
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWithdrawStep('STEP_1_INPUT')}
                className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={onSubmitWithdrawVerification}
                disabled={isSubmittingWithdraw || withdrawOtpCode.length !== 6}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                {isSubmittingWithdraw ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                <span>Verifikasi & Cairkan Dana</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Sukses */}
        {withdrawStep === 'SUCCESS' && withdrawalSuccessData && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                Penarikan Saldo Berhasil Diproses!
              </h4>
              <p className="mt-0.5 text-xs text-slate-400">
                Dana telah diteruskan ke sistem kliring Bank Mandiri
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">No. Referensi:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {withdrawalSuccessData.refNumber}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Nominal Penarikan:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Rp {withdrawalSuccessData.amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Rekening Tujuan:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {withdrawalSuccessData.bankName}{' '}
                  {withdrawalSuccessData.accountNumber}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Pemilik Rekening:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {withdrawalSuccessData.accountName}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full cursor-pointer rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              Selesai & Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
