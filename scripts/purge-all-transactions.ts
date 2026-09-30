import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log(
    '🚀 Memulai penghapusan seluruh data transaksi dan turunannya...\n'
  )

  // 1. Catat statistik sebelum penghapusan
  const before = {
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    payments: await prisma.payment.count(),
    invoices: await prisma.invoice.count(),
    warranties: await prisma.warranty.count(),
    tickets: await prisma.ticket.count(),
    complaints: await prisma.complaint.count(),
    returnRequests: await prisma.returnRequest.count(),
    reviews: await prisma.review.count(),
    voucherUsages: await prisma.voucherUsage.count(),
    adminChatRoomsWithOrder: await prisma.adminChatRoom.count({
      where: { orderId: { not: null } },
    }),
    chatRoomsWithOrder: await prisma.chatRoom.count({
      where: { orderId: { not: null } },
    }),
  }

  console.log('📊 DATA TRANSAKSI SAAT INI (SEBELUM DIHAPUS):')
  console.table(before)

  console.log('\n🧹 Menghapus turunan transaksi langkah demi langkah...')

  // Step 1: Hapus Semua Reviews
  const deletedReviews = await prisma.review.deleteMany({})
  console.log(`✅ Review terhapus: ${deletedReviews.count}`)

  // Step 2: Hapus Komplain (Complaint)
  const deletedComplaints = await prisma.complaint.deleteMany({})
  console.log(`✅ Komplain terhapus: ${deletedComplaints.count}`)

  // Step 3: Hapus Tiket Bantuan & Klaim Garansi (Ticket)
  const deletedTickets = await prisma.ticket.deleteMany({})
  console.log(`✅ Tiket terhapus: ${deletedTickets.count}`)

  // Step 4: Hapus Klaim Return / Refund (ReturnRequest)
  const deletedReturns = await prisma.returnRequest.deleteMany({})
  console.log(`✅ Retur & Refund terhapus: ${deletedReturns.count}`)

  // Step 5: Hapus Garansi (Warranty)
  const deletedWarranties = await prisma.warranty.deleteMany({})
  console.log(`✅ Garansi terhapus: ${deletedWarranties.count}`)

  // Step 6: Hapus Faktur / Invoice
  const deletedInvoices = await prisma.invoice.deleteMany({})
  console.log(`✅ Faktur / Invoice terhapus: ${deletedInvoices.count}`)

  // Step 7: Hapus Pembayaran (Payment)
  const deletedPayments = await prisma.payment.deleteMany({})
  console.log(`✅ Pembayaran terhapus: ${deletedPayments.count}`)

  // Step 8: Hapus Pemakaian Voucher (VoucherUsage) & reset counter voucher
  const deletedVoucherUsages = await prisma.voucherUsage.deleteMany({})
  console.log(`✅ Pemakaian Voucher terhapus: ${deletedVoucherUsages.count}`)
  const updatedVouchers = await prisma.voucher.updateMany({
    data: { usedCount: 0 },
  })
  console.log(
    `✅ Reset usedCount voucher: ${updatedVouchers.count} voucher direset`
  )

  // Step 9: Hapus OrderItem
  const deletedOrderItems = await prisma.orderItem.deleteMany({})
  console.log(
    `✅ Item Pesanan (OrderItem) terhapus: ${deletedOrderItems.count}`
  )

  // Step 10: Putus relasi / bersihkan Chat Room yang terikat ke Order
  // Admin Chat Rooms
  const orderAdminChatRooms = await prisma.adminChatRoom.findMany({
    where: { orderId: { not: null } },
    select: { id: true },
  })
  if (orderAdminChatRooms.length > 0) {
    const roomIds = orderAdminChatRooms.map((r) => r.id)
    const delMessages = await prisma.adminChatMessage.deleteMany({
      where: { roomId: { in: roomIds } },
    })
    const delRooms = await prisma.adminChatRoom.deleteMany({
      where: { id: { in: roomIds } },
    })
    console.log(
      `✅ Chat admin pesanan terhapus: ${delRooms.count} room (${delMessages.count} pesan)`
    )
  }

  // Technician Chat Rooms
  const orderTechChatRooms = await prisma.chatRoom.findMany({
    where: { orderId: { not: null } },
    select: { id: true },
  })
  if (orderTechChatRooms.length > 0) {
    const roomIds = orderTechChatRooms.map((r) => r.id)
    const delMessages = await prisma.chatMessage.deleteMany({
      where: { roomId: { in: roomIds } },
    })
    const delRooms = await prisma.chatRoom.deleteMany({
      where: { id: { in: roomIds } },
    })
    console.log(
      `✅ Chat teknisi pesanan terhapus: ${delRooms.count} room (${delMessages.count} pesan)`
    )
  }

  // Step 11: Hapus Semua Pesanan (Order)
  const deletedOrders = await prisma.order.deleteMany({})
  console.log(`✅ Pesanan (Order) terhapus: ${deletedOrders.count}`)

  // Step 12: Bersihkan Notifikasi Terkait Transaksi & Review
  const deletedNotifs = await prisma.notification.deleteMany({
    where: {
      type: {
        in: [
          'ORDER_CREATED',
          'PAYMENT_VERIFIED',
          'ORDER_STATUS_CHANGED',
          'ORDER_SHIPPED',
          'ORDER_DELIVERED',
          'NEW_REVIEW',
          'NEW_COMPLAINT',
          'COMPLAINT_RESOLVED',
        ],
      },
    },
  })
  console.log(`✅ Notifikasi pesanan/review terhapus: ${deletedNotifs.count}`)

  // Step 13: Bersihkan Audit Log Terkait Transaksi
  const deletedAuditLogs = await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entityType: 'Order' },
        { entityType: 'Payment' },
        { action: { contains: 'ORDER' } },
        { action: { contains: 'PAYMENT' } },
        { action: { contains: 'WITHDRAWAL' } },
        { action: { contains: 'COMPLAINT' } },
        { action: { contains: 'RETURN' } },
      ],
    },
  })
  console.log(`✅ Audit Log transaksi terhapus: ${deletedAuditLogs.count}`)

  // Step 14: Reset Rating & Statistik Penjualan Toko (Store)
  const updatedStores = await prisma.store.updateMany({
    data: {
      rating: 5.0,
      totalReview: 0,
      totalSales: 0,
    },
  })
  console.log(`✅ Reset rating & sales ${updatedStores.count} toko fisik`)

  // Step 15: Reset Rating Produk (Product)
  const updatedProducts = await prisma.product.updateMany({
    data: {
      rating: 5.0,
      totalReview: 0,
    },
  })
  console.log(`✅ Reset rating & review ${updatedProducts.count} produk`)

  // Step 16: Reset Rating Teknisi & Mitra
  const updatedTechs = await prisma.technician.updateMany({
    data: {
      rating: 0,
      totalReview: 0,
    },
  })
  console.log(`✅ Reset rating ${updatedTechs.count} teknisi`)

  const updatedMitras = await prisma.mitra.updateMany({
    data: {
      rating: 0,
      totalReview: 0,
    },
  })
  console.log(`✅ Reset rating ${updatedMitras.count} mitra`)

  // Step 17: Bersihkan file storage lokal (.data/shipping-store.json & .data/store-withdrawals.json)
  const dataDir = path.join(process.cwd(), '.data')
  const shippingFile = path.join(dataDir, 'shipping-store.json')
  const withdrawalFile = path.join(dataDir, 'store-withdrawals.json')

  if (fs.existsSync(shippingFile)) {
    fs.writeFileSync(shippingFile, JSON.stringify({}, null, 2), 'utf-8')
    console.log('✅ File .data/shipping-store.json berhasil direset ke {}')
  }

  if (fs.existsSync(withdrawalFile)) {
    fs.writeFileSync(withdrawalFile, JSON.stringify([], null, 2), 'utf-8')
    console.log('✅ File .data/store-withdrawals.json berhasil direset ke []')
  }

  // 18. Verifikasi kondisi akhir database
  console.log('\n📊 VERIFIKASI AKHIR DATABASE:')
  const after = {
    users: await prisma.user.count(),
    stores: await prisma.store.count(),
    products: await prisma.product.count(),
    productVariants: await prisma.productVariant.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    payments: await prisma.payment.count(),
    invoices: await prisma.invoice.count(),
    warranties: await prisma.warranty.count(),
    tickets: await prisma.ticket.count(),
    complaints: await prisma.complaint.count(),
    returnRequests: await prisma.returnRequest.count(),
    reviews: await prisma.review.count(),
    voucherUsages: await prisma.voucherUsage.count(),
    vouchers: await prisma.voucher.count(),
  }

  console.table(after)
  console.log('\n✨ PEMBERSIHAN DATA TRANSAKSI SELESAI DENGAN SEMPURNA! ✨')

  process.exit(0)
}

main()
  .catch((err) => {
    console.error('❌ Gagal membersihkan transaksi:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
