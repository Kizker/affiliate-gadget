/**
 * Utility untuk menghitung tanggal dan waktu kontekstual dinamis
 * pada setiap tahapan pesanan (Belum Bayar, Diproses, Dikirim, Selesai, Dibatalkan, Retur).
 */

export interface OrderTimestampInfo {
  label: string // 'Dipesan' | 'Dibayar' | 'Dikirim' | 'Diterima' | 'Dibatalkan' | 'Diajukan Retur'
  fullLabel: string // 'Waktu Dipesan' | 'Waktu Pembayaran' | 'Waktu Pengiriman' | 'Waktu Diterima' | 'Waktu Dibatalkan' | 'Waktu Pengajuan Retur'
  rawDate: string
  date: Date
  shortDate: string // e.g. "07 Okt 2026"
  dateTime: string // e.g. "07 Okt 2026, 14:30 WIB"
  fullDateTime: string // e.g. "07 Oktober 2026, 14:30 WIB"
  badgeColorClass: string
}

export interface OrderTimelineAuditStep {
  key:
    | 'created'
    | 'paid'
    | 'shipped'
    | 'completed'
    | 'cancelled'
    | 'returned'
    | 'warranty'
  title: string
  dateFormatted: string | null
  isPassed: boolean
  isCurrent: boolean
  description?: string
}

export function formatOrderShortDate(dateInput?: string | Date | null): string {
  if (!dateInput) return ''
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatOrderDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return ''
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''
  const datePart = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timePart = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${datePart}, ${timePart} WIB`
}

export function formatOrderFullDateTime(
  dateInput?: string | Date | null
): string {
  if (!dateInput) return ''
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''
  const datePart = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timePart = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${datePart}, ${timePart} WIB`
}

/**
 * Menghasilkan timestamp kontekstual sesuai status pemesanan
 */
export function getOrderContextualTimestamp(order: {
  status: string
  createdAt: string
  updatedAt?: string | null
  completedAt?: string | null
  customerConfirmedAt?: string | null
  trackingNumber?: string | null
  payment?: { status?: string; verifiedAt?: string | null } | null
  returnRequests?: Array<{
    createdAt?: string | null
    resolvedAt?: string | null
    status?: string
  }>
}): OrderTimestampInfo {
  // 1. Status Selesai / Diterima Customer
  const isCompleted =
    order.status === 'COMPLETED' ||
    Boolean(order.customerConfirmedAt) ||
    Boolean(order.completedAt)

  if (isCompleted) {
    const rawDate =
      order.customerConfirmedAt ||
      order.completedAt ||
      order.updatedAt ||
      order.createdAt

    const d = new Date(rawDate)
    return {
      label: 'Diterima',
      fullLabel: 'Waktu Diterima',
      rawDate,
      date: d,
      shortDate: formatOrderShortDate(d),
      dateTime: formatOrderDateTime(d),
      fullDateTime: formatOrderFullDateTime(d),
      badgeColorClass:
        'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
    }
  }

  // 2. Status Retur / Pengembalian
  const latestReturn = order.returnRequests?.[0]
  if (order.status === 'RETURNED' || Boolean(latestReturn)) {
    const isReturnResolved =
      latestReturn?.status === 'COMPLETED' ||
      latestReturn?.status === 'APPROVED'

    const rawDate =
      (isReturnResolved && latestReturn?.resolvedAt) ||
      latestReturn?.createdAt ||
      order.updatedAt ||
      order.createdAt

    const d = new Date(rawDate)
    const isDone = latestReturn?.status === 'COMPLETED'
    return {
      label: isDone ? 'Retur Selesai' : 'Diajukan Retur',
      fullLabel: isDone ? 'Waktu Retur Selesai' : 'Waktu Pengajuan Retur',
      rawDate,
      date: d,
      shortDate: formatOrderShortDate(d),
      dateTime: formatOrderDateTime(d),
      fullDateTime: formatOrderFullDateTime(d),
      badgeColorClass:
        'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
    }
  }

  // 3. Status Dibatalkan
  if (order.status === 'CANCELLED') {
    const rawDate = order.updatedAt || order.createdAt
    const d = new Date(rawDate)
    return {
      label: 'Dibatalkan',
      fullLabel: 'Waktu Dibatalkan',
      rawDate,
      date: d,
      shortDate: formatOrderShortDate(d),
      dateTime: formatOrderDateTime(d),
      fullDateTime: formatOrderFullDateTime(d),
      badgeColorClass:
        'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
    }
  }

  // 4. Status Sedang Dikirim Kurir
  if (
    order.status === 'SHIPPED' ||
    order.status === 'IN_PROGRESS' ||
    Boolean(order.trackingNumber)
  ) {
    const rawDate = order.updatedAt || order.createdAt
    const d = new Date(rawDate)
    return {
      label: 'Dikirim',
      fullLabel: 'Waktu Pengiriman',
      rawDate,
      date: d,
      shortDate: formatOrderShortDate(d),
      dateTime: formatOrderDateTime(d),
      fullDateTime: formatOrderFullDateTime(d),
      badgeColorClass:
        'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',
    }
  }

  // 5. Status Diproses Toko (Sudah Dibayar)
  if (
    order.status === 'PROCESSING' ||
    order.status === 'PAID' ||
    order.payment?.status === 'PAID' ||
    order.payment?.status === 'SUCCESS'
  ) {
    const rawDate =
      order.payment?.verifiedAt || order.updatedAt || order.createdAt
    const d = new Date(rawDate)
    return {
      label: 'Dibayar',
      fullLabel: 'Waktu Pembayaran',
      rawDate,
      date: d,
      shortDate: formatOrderShortDate(d),
      dateTime: formatOrderDateTime(d),
      fullDateTime: formatOrderFullDateTime(d),
      badgeColorClass:
        'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40',
    }
  }

  // 6. Default: Belum Bayar (Menunggu Pembayaran)
  const rawDate = order.createdAt
  const d = new Date(rawDate)
  return {
    label: 'Dipesan',
    fullLabel: 'Waktu Dipesan',
    rawDate,
    date: d,
    shortDate: formatOrderShortDate(d),
    dateTime: formatOrderDateTime(d),
    fullDateTime: formatOrderFullDateTime(d),
    badgeColorClass:
      'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800',
  }
}

/**
 * Menghasilkan timeline audit riwayat transaksi untuk rincian pesanan
 */
export function buildOrderAuditTimeline(order: {
  createdAt: string
  updatedAt?: string | null
  status: string
  completedAt?: string | null
  customerConfirmedAt?: string | null
  warrantyExpiryDate?: string | null
  trackingNumber?: string | null
  courierCode?: string | null
  payment?: { status?: string; verifiedAt?: string | null } | null
}): OrderTimelineAuditStep[] {
  const isPaid =
    order.status !== 'PENDING_PAYMENT' && order.status !== 'CANCELLED'

  const isShipped =
    order.status === 'SHIPPED' ||
    order.status === 'IN_PROGRESS' ||
    order.status === 'COMPLETED' ||
    Boolean(order.trackingNumber)

  const isCompleted =
    order.status === 'COMPLETED' ||
    Boolean(order.customerConfirmedAt) ||
    Boolean(order.completedAt)

  const isCancelled = order.status === 'CANCELLED'

  const steps: OrderTimelineAuditStep[] = [
    {
      key: 'created',
      title: 'Pesanan Dibuat',
      dateFormatted: formatOrderDateTime(order.createdAt),
      isPassed: true,
      isCurrent: order.status === 'PENDING_PAYMENT',
      description: 'Checkout pesanan gadget berhasil dicatat di sistem.',
    },
  ]

  if (isCancelled) {
    steps.push({
      key: 'cancelled',
      title: 'Pesanan Dibatalkan',
      dateFormatted: formatOrderDateTime(order.updatedAt || order.createdAt),
      isPassed: true,
      isCurrent: true,
      description: 'Transaksi pesanan telah dibatalkan.',
    })
    return steps
  }

  // Step 2: Pembayaran
  steps.push({
    key: 'paid',
    title: 'Pembayaran Terverifikasi',
    dateFormatted: isPaid
      ? formatOrderDateTime(
          order.payment?.verifiedAt || order.updatedAt || order.createdAt
        )
      : null,
    isPassed: isPaid,
    isCurrent: order.status === 'PROCESSING' || order.status === 'PAID',
    description: isPaid
      ? 'Dana diterima & pesanan diteruskan ke cabang toko fisik.'
      : 'Menunggu proses verifikasi pembayaran dari pembeli.',
  })

  // Step 3: Pengiriman
  steps.push({
    key: 'shipped',
    title: 'Diserahkan ke Kurir',
    dateFormatted: isShipped
      ? formatOrderDateTime(order.updatedAt || order.createdAt)
      : null,
    isPassed: isShipped,
    isCurrent: order.status === 'SHIPPED' || order.status === 'IN_PROGRESS',
    description: isShipped
      ? `Paket diproses via ${order.courierCode || 'Kurir'}${
          order.trackingNumber ? ` (Resi: ${order.trackingNumber})` : ''
        }.`
      : 'Pesanan sedang disiapkan & dikemas rapi oleh toko.',
  })

  // Step 4: Selesai
  const completionDate =
    order.customerConfirmedAt || order.completedAt || order.updatedAt
  steps.push({
    key: 'completed',
    title: 'Pesanan Diterima & Selesai',
    dateFormatted: isCompleted ? formatOrderDateTime(completionDate) : null,
    isPassed: isCompleted,
    isCurrent: order.status === 'COMPLETED',
    description: isCompleted
      ? 'Pesanan telah diterima oleh pembeli. Transaksi dinyatakan selesai.'
      : 'Menunggu konfirmasi penerimaan paket oleh pembeli.',
  })

  // Step 5: Garansi Aktif (Jika selesai)
  if (isCompleted && order.warrantyExpiryDate) {
    steps.push({
      key: 'warranty',
      title: 'Garansi 30 Hari Aktif',
      dateFormatted: `s/d ${formatOrderShortDate(order.warrantyExpiryDate)}`,
      isPassed: true,
      isCurrent: false,
      description:
        'Garansi tukar unit baru resmi toko cabang aktif selama 30 hari.',
    })
  }

  return steps
}

/**
 * Mengurutkan array pesanan dari yang paling terbaru dari segi waktu proses kontekstualnya.
 */
export function sortOrdersByLatestProcess<
  T extends {
    status: string
    createdAt: string
    updatedAt?: string | null
    completedAt?: string | null
    customerConfirmedAt?: string | null
    trackingNumber?: string | null
    payment?: { status?: string; verifiedAt?: string | null } | null
    returnRequests?: Array<{
      createdAt?: string | null
      resolvedAt?: string | null
      status?: string
    }>
  },
>(orders: T[]): T[] {
  return [...orders].sort((a, b) => {
    const metaA = getOrderContextualTimestamp(a)
    const metaB = getOrderContextualTimestamp(b)
    const timeA = metaA.date.getTime()
    const timeB = metaB.date.getTime()

    // 1. Urutkan berdasarkan waktu proses kontekstual terbaru (descending)
    if (!isNaN(timeA) && !isNaN(timeB) && timeB !== timeA) {
      return timeB - timeA
    }

    // 2. Fallback: updatedAt terbaru
    const updatedA = new Date(a.updatedAt || a.createdAt).getTime()
    const updatedB = new Date(b.updatedAt || b.createdAt).getTime()
    if (!isNaN(updatedA) && !isNaN(updatedB) && updatedB !== updatedA) {
      return updatedB - updatedA
    }

    // 3. Fallback: createdAt terbaru
    const createdA = new Date(a.createdAt).getTime()
    const createdB = new Date(b.createdAt).getTime()
    return createdB - createdA
  })
}
