import prisma from '@/lib/db'

export const DEFAULT_PAYMENT_EXPIRATION_MINUTES = 15 // 15 menit batas tercepat (QRIS)
export const DEFAULT_PAYMENT_EXPIRATION_SECONDS =
  DEFAULT_PAYMENT_EXPIRATION_MINUTES * 60 // 900 detik
export const DEFAULT_PAYMENT_EXPIRATION_MS =
  DEFAULT_PAYMENT_EXPIRATION_SECONDS * 1000

/**
 * Menghitung sisa detik pembayaran:
 * 1. Jika pesanan sudah memilih kanal pembayaran (tersimpan di payment.notes dengan expiryTime),
 *    mengikuti expiryTime persis dari Midtrans (misal 15 menit untuk QRIS, 24 jam untuk Virtual Account).
 * 2. Jika belum membuat tagihan kanal, mengikuti batas pembayaran tercepat: 15 menit dari createdAt (QRIS).
 */
export function getOrderPaymentRemainingSeconds(order: {
  createdAt: Date | string
  payment?: { notes?: string | null } | null
}): number {
  if (order.payment?.notes) {
    try {
      if (order.payment.notes.startsWith('{')) {
        const parsed = JSON.parse(order.payment.notes)
        if (parsed.expiryTime) {
          const expTime = new Date(parsed.expiryTime).getTime()
          if (!isNaN(expTime)) {
            return Math.max(0, Math.floor((expTime - Date.now()) / 1000))
          }
        }
      }
    } catch (_) {}
  }

  const createdTime = new Date(order.createdAt).getTime()
  if (isNaN(createdTime)) return 0
  const deadline = createdTime + DEFAULT_PAYMENT_EXPIRATION_MS
  return Math.max(0, Math.floor((deadline - Date.now()) / 1000))
}

/**
 * Memeriksa apakah pesanan dengan status PENDING_PAYMENT telah melewati batas waktu pembayaran.
 */
export function isOrderPaymentExpired(order: {
  createdAt: Date | string
  status?: string
  payment?: { notes?: string | null } | null
}): boolean {
  if (order.status && order.status !== 'PENDING_PAYMENT') return false
  return getOrderPaymentRemainingSeconds(order) <= 0
}

/**
 * Format sisa detik:
 * - Jika >= 1 jam: format jam:menit:detik (HH:MM:SS) (contoh: 23:59:52)
 * - Jika < 1 jam: format menit:detik (MM:SS) (contoh: 14:52)
 */
export function formatPaymentCountdown(seconds: number): string {
  const s = Math.max(0, seconds)
  const hours = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Membatalkan pesanan kedaluwarsa secara atomik dan mengembalikan stok unit fisik.
 * Hanya membatalkan jika status saat ini adalah PENDING_PAYMENT dan sudah melewati 24 jam (atau force=true dari webhook expire).
 */
export async function cancelExpiredOrderIfDue(
  orderIdOrNumber: string,
  forceExpire: boolean = false
): Promise<{
  wasCancelled: boolean
  order: any
}> {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
    },
    include: {
      items: true,
      payment: true,
    },
  })

  if (!order) {
    return { wasCancelled: false, order: null }
  }

  // Jika pesanan sudah bukan PENDING_PAYMENT, jangan ubah status
  if (order.status !== 'PENDING_PAYMENT') {
    return { wasCancelled: false, order }
  }

  const isExpired = forceExpire || isOrderPaymentExpired(order)
  if (!isExpired) {
    return { wasCancelled: false, order }
  }

  // Eksekusi pembatalan dan pengembalian inventori secara transaksi atomik
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // 1. Ubah status pesanan menjadi CANCELLED
    const cancelled = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        notes: order.notes
          ? `${order.notes}\n[Batal Otomatis Sistem]: Batas waktu pembayaran 24 jam telah habis.`
          : '[Batal Otomatis Sistem]: Batas waktu pembayaran 24 jam telah habis.',
        updatedAt: new Date(),
      },
      include: {
        items: true,
        payment: true,
      },
    })

    // 2. Ubah status pembayaran menjadi REJECTED
    if (order.payment) {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: {
          status: 'REJECTED',
          notes: order.payment.notes
            ? `${order.payment.notes} - Pembayaran kedaluwarsa (> 24 jam)`
            : 'Pembayaran kedaluwarsa (> 24 jam)',
          updatedAt: new Date(),
        },
      })
    } else {
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: 'MIDTRANS',
          amount: order.total,
          status: 'REJECTED',
          notes: 'Pembayaran kedaluwarsa (> 24 jam)',
        },
      })
    }

    // 3. Kembalikan stok unit fisik produk dan varian
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      }
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }

    return cancelled
  })

  return { wasCancelled: true, order: updatedOrder }
}

/**
 * Batch auto-cancel untuk semua pesanan PENDING_PAYMENT yang melewati batas waktu pembayaran.
 */
export async function batchCancelExpiredOrders(): Promise<number> {
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING_PAYMENT',
    },
    include: {
      payment: true,
    },
    take: 50,
  })

  let count = 0
  for (const ord of pendingOrders) {
    if (isOrderPaymentExpired(ord)) {
      try {
        const res = await cancelExpiredOrderIfDue(ord.id)
        if (res.wasCancelled) count++
      } catch (err) {
        console.error(
          `[Order Expiration] Failed to cancel order ${ord.id}:`,
          err
        )
      }
    }
  }
  return count
}
