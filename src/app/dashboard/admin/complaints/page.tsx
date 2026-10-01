'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ComplaintsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/admin/returns')
  }, [router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Mengalihkan ke halaman Pengembalian & Klaim Garansi...
      </p>
    </div>
  )
}
