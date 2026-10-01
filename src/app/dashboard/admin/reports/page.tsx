'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ReportsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/admin/finance')
  }, [router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Mengalihkan ke Pusat Keuangan & Laporan Finansial...
      </p>
    </div>
  )
}
