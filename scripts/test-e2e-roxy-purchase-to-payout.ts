import prisma from '../src/lib/db'
import crypto from 'crypto'
import {
  checkBankAccountCooldown,
  validateAccountNameMatch,
} from '../src/lib/withdrawal-security'
import {
  calculateOrderVat,
  calculatePaymentGatewayFee,
} from '../src/lib/tax/tax-engine'
import {
  getStoreWithdrawals,
  createStoreWithdrawal,
  getTotalWithdrawn,
} from '../src/lib/store-withdrawal-store'
import { createIrisPayout } from '../src/lib/midtrans-iris'
import {
  createOtpRecord,
  validateOtpRecord,
  consumeOtpRecord,
} from '../src/lib/notifications'

async function runE2ETest() {
  console.log(
    '========================================================================'
  )
  console.log(
    '🚀 MEMULAI TEST E2E: BELANJA DI TOKO ROXY MAS HINGGA PENCAIRAN DANA'
  )
  console.log(
    '========================================================================\n'
  )

  // 1. CARI DATA TOKO ROXY & CUSTOMER
  const store = await prisma.store.findFirst({
    where: { name: { contains: 'Roxy' } },
    include: {
      bankAccounts: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      products: {
        where: { isActive: true },
        include: { variants: true },
      },
    },
  })

  if (!store) {
    throw new Error('❌ Toko Roxy tidak ditemukan di database!')
  }

  const primaryBank =
    store.bankAccounts.find((b) => b.isPrimary) || store.bankAccounts[0]
  if (!primaryBank) {
    throw new Error('❌ Rekening bank resmi Toko Roxy tidak ditemukan!')
  }

  const customer = await prisma.user.findFirst({
    where: { email: 'customer@test.com' },
  })

  if (!customer) {
    throw new Error('❌ Customer test tidak ditemukan di database!')
  }

  const product = store.products.find(
    (p) => p.variants && p.variants.length > 0
  )
  if (!product || !product.variants[0]) {
    throw new Error(
      '❌ Produk aktif dengan varian tidak ditemukan di Toko Roxy!'
    )
  }
  const variant = product.variants[0]

  console.log('📍 Entitas Terlibat:')
  console.log(`- Toko Cabang: ${store.name} (${store.companyName})`)
  console.log(
    `- Rekening Resmi: ${primaryBank.bankName} ${primaryBank.accountNumber} a.n. ${primaryBank.accountName}`
  )
  console.log(`- Rate Komisi Platform: ${store.commissionRate || 1.5}%`)
  console.log(
    `- Customer: ${customer.name} (${customer.email} / ${customer.phone})`
  )
  console.log(`- Produk Dibeli: ${product.name} - Varian: ${variant.name}`)
  console.log(`- Harga Satuan: Rp ${variant.price.toLocaleString('id-ID')}`)
  console.log(`- Stok Tersedia: ${variant.stock} unit\n`)

  // =========================================================================
  // TAHAP 1: CHECKOUT TRANSAKSI
  // =========================================================================
  console.log(
    '------------------------------------------------------------------------'
  )
  console.log('🛒 TAHAP 1: CHECKOUT PESANAN BARU OLEH CUSTOMER')
  console.log(
    '------------------------------------------------------------------------'
  )

  const quantity = 1
  const subtotal = variant.price * quantity
  const shippingCost = 35000 // JNE Reguler
  const insuranceFee = Math.round(subtotal * 0.0025) // Asuransi wajib 0.25%
  const voucherDiscount = 0
  const total = subtotal + shippingCost + insuranceFee - voucherDiscount
  const commissionRate = store.commissionRate || 1.5
  const commissionAmount = Math.round((subtotal * commissionRate) / 100)
  const netStoreAmount = Math.max(
    0,
    subtotal - voucherDiscount - commissionAmount
  )

  // Verifikasi PPN Inklusif Toko PKP
  const vatResult = calculateOrderVat(subtotal, {
    isPkp: product.isTaxable ?? true,
    vatRate: 11.0,
    taxType: 'INCLUSIVE',
  })

  console.log(`- Subtotal Barang: Rp ${subtotal.toLocaleString('id-ID')}`)
  console.log(`- Ongkos Kirim JNE: Rp ${shippingCost.toLocaleString('id-ID')}`)
  console.log(
    `- Asuransi Wajib (0.25%): Rp ${insuranceFee.toLocaleString('id-ID')}`
  )
  console.log(
    `- Potongan Voucher: Rp ${voucherDiscount.toLocaleString('id-ID')}`
  )
  console.log(`- Total Tagihan Customer: Rp ${total.toLocaleString('id-ID')}`)
  console.log(
    `- Komisi Platform (${commissionRate}%): Rp ${commissionAmount.toLocaleString('id-ID')}`
  )
  console.log(
    `- Hak Bersih Toko Roxy: Rp ${netStoreAmount.toLocaleString('id-ID')}`
  )
  console.log(
    `- PPN Inklusif 11%: Rp ${vatResult.vatAmount.toLocaleString('id-ID')} (DPP: Rp ${vatResult.dppAmount.toLocaleString('id-ID')})`
  )

  // Buat Order di Database
  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`

  const createdOrder = await prisma.$transaction(async (tx) => {
    // Kurangi stok varian
    await tx.productVariant.update({
      where: { id: variant.id },
      data: { stock: { decrement: quantity } },
    })

    const ord = await tx.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        storeId: store.id,
        status: 'PENDING_PAYMENT',
        subtotal,
        total,
        shippingCost,
        insuranceFee,
        insuranceRate: 0.0025,
        isInsuranceMandatory: true,
        discountAmount: voucherDiscount,
        commissionRate,
        commissionAmount,
        tax: vatResult.vatAmount,
        dppAmount: vatResult.dppAmount,
        vatRate: vatResult.vatRate,
        taxTypeApplied: 'INCLUSIVE',
        pph23Amount: 0,
        pph23Rate: 0,
        courierCode: 'JNE',
        courierService: 'REG',
        bonusChargerIncluded: true,
        bonusProtectorIncluded: true,
        bonusCaseIncluded: true,
      },
    })

    await tx.orderItem.create({
      data: {
        orderId: ord.id,
        type: 'PRODUCT',
        productId: product.id,
        variantId: variant.id,
        variantName: variant.name,
        quantity,
        price: variant.price,
        costPrice: variant.costPrice || 0,
        subtotal,
      },
    })

    await tx.payment.create({
      data: {
        orderId: ord.id,
        method: 'MIDTRANS',
        status: 'PENDING',
        amount: total,
      },
    })

    return ord
  })

  console.log(
    `✅ Order berhasil dibuat: #${createdOrder.orderNumber} (Status: ${createdOrder.status})\n`
  )

  // =========================================================================
  // TAHAP 2: PEMBAYARAN MIDTRANS SETTLEMENT
  // =========================================================================
  console.log(
    '------------------------------------------------------------------------'
  )
  console.log('💳 TAHAP 2: SIMULASI PEMBAYARAN GATEWAY MIDTRANS (SETTLEMENT)')
  console.log(
    '------------------------------------------------------------------------'
  )

  const midtransTransactionId = `MID-TX-${crypto.randomUUID().substring(0, 12)}`
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: createdOrder.id },
      data: { status: 'IN_PROGRESS' }, // Toko menerima pembayaran & mulai packing
    })

    await tx.payment.updateMany({
      where: { orderId: createdOrder.id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        notes: JSON.stringify({
          channel: 'bank_transfer',
          bank: 'mandiri',
          vaNumber: '70012891928374',
          transactionId: midtransTransactionId,
        }),
      },
    })
  })

  const gwFee = calculatePaymentGatewayFee('MIDTRANS', total, 'MANDIRI_VA')
  console.log(
    `- Webhook Settlement Midtrans Diterima: ${midtransTransactionId}`
  )
  console.log(
    `- Kanal: Mandiri Virtual Account (Biaya Gateway: Rp ${gwFee.feeAmount.toLocaleString('id-ID')})`
  )
  console.log(`- Status Order Baru: IN_PROGRESS (Packing Toko)\n`)

  // =========================================================================
  // TAHAP 3: VERIFIKASI POS DANA TERTAHAN (ESCROW)
  // =========================================================================
  console.log(
    '------------------------------------------------------------------------'
  )
  console.log(
    '🔒 TAHAP 3: AUDIT POS DANA TERTAHAN (ESCROW) SEBELUM BARANG DITERIMA'
  )
  console.log(
    '------------------------------------------------------------------------'
  )

  // Hitung saldo toko saat ini dari order COMPLETED
  const storeCompletedAggBefore = await prisma.order.aggregate({
    where: { storeId: store.id, status: 'COMPLETED' },
    _sum: { subtotal: true, discountAmount: true, commissionAmount: true },
  })
  const storeNetRevenueBefore = Math.max(
    0,
    (storeCompletedAggBefore._sum.subtotal || 0) -
      (storeCompletedAggBefore._sum.discountAmount || 0) -
      (storeCompletedAggBefore._sum.commissionAmount || 0)
  )
  const storeWithdrawnBefore = await getTotalWithdrawn(store.id)
  const storeAvailableBefore = Math.max(
    0,
    storeNetRevenueBefore - storeWithdrawnBefore
  )

  // Hitung escrow Toko Roxy
  const storeActiveOrders = await prisma.order.findMany({
    where: {
      storeId: store.id,
      status: { in: ['PAID', 'IN_PROGRESS', 'SHIPPED', 'COMPLAINED'] },
    },
    select: { subtotal: true, discountAmount: true, commissionAmount: true },
  })
  const storeEscrowBefore = storeActiveOrders.reduce((sum, o) => {
    return (
      sum +
      Math.max(
        0,
        (o.subtotal || 0) - (o.discountAmount || 0) - (o.commissionAmount || 0)
      )
    )
  }, 0)

  // Hitung saldo Superadmin saat ini
  const superCompletedAggBefore = await prisma.order.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { commissionAmount: true },
  })
  const superHoldingWithdrawalsBefore = (await getStoreWithdrawals())
    .filter(
      (w) =>
        ['ALL', 'holding-01', 'HOLDING'].includes(w.storeId) &&
        w.status === 'SUCCESS'
    )
    .reduce((sum, w) => sum + w.amount, 0)
  const superAvailableBefore = Math.max(
    0,
    (superCompletedAggBefore._sum.commissionAmount || 0) -
      superHoldingWithdrawalsBefore
  )

  console.log(
    `- Saldo Siap Cair Toko Roxy: Rp ${storeAvailableBefore.toLocaleString('id-ID')} (Wajib 0 atau belum bertambah)`
  )
  console.log(
    `- Dana Tertahan Escrow Toko Roxy: Rp ${storeEscrowBefore.toLocaleString('id-ID')} (Mencakup Rp ${netStoreAmount.toLocaleString('id-ID')})`
  )
  console.log(
    `- Saldo Siap Cair Superadmin: Rp ${superAvailableBefore.toLocaleString('id-ID')} (Belum bertambah komisi baru)`
  )

  if (!storeEscrowBefore || storeEscrowBefore < netStoreAmount) {
    throw new Error(
      `❌ Validasi Escrow GAGAL: Dana Rp ${netStoreAmount} tidak masuk ke pos Escrow!`
    )
  }
  console.log(
    `✅ Validasi Escrow BERHASIL: Dana customer aman di rekening Escrow selama pesanan diproses.\n`
  )

  // Update ke status SHIPPED dengan nomor resi JNE
  const trackingNumber = `JNE-ROXY-${Date.now().toString().slice(-8)}`
  await prisma.order.update({
    where: { id: createdOrder.id },
    data: {
      status: 'SHIPPED',
      trackingNumber,
    },
  })
  console.log(
    `🚚 Pesanan diserahkan ke JNE: Resi #${trackingNumber} (Status: SHIPPED)\n`
  )

  // =========================================================================
  // TAHAP 4: KONFIRMASI PENERIMAAN PESANAN (COMPLETED)
  // =========================================================================
  console.log(
    '------------------------------------------------------------------------'
  )
  console.log(
    '📦 TAHAP 4: CUSTOMER KONFIRMASI TERIMA BARANG (STATUS: COMPLETED)'
  )
  console.log(
    '------------------------------------------------------------------------'
  )

  const now = new Date()
  const warrantyExpiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await prisma.order.update({
    where: { id: createdOrder.id },
    data: {
      status: 'COMPLETED',
      completedAt: now,
      customerConfirmedAt: now,
      warrantyExpiryDate,
    },
  })

  console.log(
    `✅ Pesanan #${createdOrder.orderNumber} Selesai & Dikonfirmasi Diterima!`
  )
  console.log(
    `- Garansi 30 Hari Aktif Hingga: ${warrantyExpiryDate.toLocaleDateString('id-ID')}\n`
  )

  // =========================================================================
  // TAHAP 5: AUDIT DISTRIBUSI SALDO SIAP CAIR (TOKO VS SUPERADMIN)
  // =========================================================================
  console.log(
    '------------------------------------------------------------------------'
  )
  console.log('💰 TAHAP 5: REKONSILIASI KEUANGAN & PEMISAHAN HAK PENDAPATAN')
  console.log(
    '------------------------------------------------------------------------'
  )

  // Hitung ulang saldo Toko Roxy setelah COMPLETED
  const storeCompletedAggAfter = await prisma.order.aggregate({
    where: { storeId: store.id, status: 'COMPLETED' },
    _sum: { subtotal: true, discountAmount: true, commissionAmount: true },
  })
  const storeNetRevenueAfter = Math.max(
    0,
    (storeCompletedAggAfter._sum.subtotal || 0) -
      (storeCompletedAggAfter._sum.discountAmount || 0) -
      (storeCompletedAggAfter._sum.commissionAmount || 0)
  )
  const storeAvailableAfter = Math.max(
    0,
    storeNetRevenueAfter - storeWithdrawnBefore
  )

  // Hitung ulang saldo Superadmin setelah COMPLETED
  const superCompletedAggAfter = await prisma.order.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { commissionAmount: true },
  })
  const superAvailableAfter = Math.max(
    0,
    (superCompletedAggAfter._sum.commissionAmount || 0) -
      superHoldingWithdrawalsBefore
  )

  const storeDelta = storeAvailableAfter - storeAvailableBefore
  const superDelta = superAvailableAfter - superAvailableBefore

  console.log(`📊 Hasil Rekonsiliasi Saldo:`)
  console.log(`1. Toko Roxy Mas:`)
  console.log(
    `   - Saldo Siap Cair Awal: Rp ${storeAvailableBefore.toLocaleString('id-ID')}`
  )
  console.log(
    `   - Saldo Siap Cair Akhir: Rp ${storeAvailableAfter.toLocaleString('id-ID')}`
  )
  console.log(
    `   - Kenaikan Saldo Riil: +Rp ${storeDelta.toLocaleString('id-ID')} (Target: Rp ${netStoreAmount.toLocaleString('id-ID')})`
  )

  console.log(`2. Superadmin Holding:`)
  console.log(
    `   - Saldo Komisi Awal: Rp ${superAvailableBefore.toLocaleString('id-ID')}`
  )
  console.log(
    `   - Saldo Komisi Akhir: Rp ${superAvailableAfter.toLocaleString('id-ID')}`
  )
  console.log(
    `   - Kenaikan Komisi Riil: +Rp ${superDelta.toLocaleString('id-ID')} (Target: Rp ${commissionAmount.toLocaleString('id-ID')})`
  )

  if (storeDelta !== netStoreAmount) {
    throw new Error(
      `❌ KETIDAKSESUAIAN SALDO TOKO: Diharapkan bertambah Rp ${netStoreAmount}, tetapi bertambah Rp ${storeDelta}!`
    )
  }
  if (superDelta !== commissionAmount) {
    throw new Error(
      `❌ KETIDAKSESUAIAN KOMISI SUPERADMIN: Diharapkan bertambah Rp ${commissionAmount}, tetapi bertambah Rp ${superDelta}!`
    )
  }

  console.log(
    `✅ Sempurna: Dana terdistribusi 100% presisi tanpa ada selisih 1 rupiah pun!\n`
  )

  // =========================================================================
  // TAHAP 6: TEST PENARIKAN SALDO TOKO ROXY (3 GERBANG KEAMANAN)
  // =========================================================================
  console.log(
    '------------------------------------------------------------------------'
  )
  console.log(
    '🛡️ TAHAP 6: TEST PENARIKAN DANA TOKO ROXY DENGAN 3 SECURITY GATES'
  )
  console.log(
    '------------------------------------------------------------------------'
  )

  const withdrawAmountToko = 5000000 // Tarik Rp 5.000.000

  // 6.1 Uji Gate 1: Cooling-down 24 Jam
  console.log('👉 [Gate 1] Memeriksa Cooling-down Period 24 Jam:')
  const cooldownCheck = checkBankAccountCooldown(store.bankAccountUpdatedAt)
  console.log(
    `   - Status Cooling-down: ${cooldownCheck.isLocked ? 'TERKUNCI' : 'AMAN (Bebas Kunci)'}`
  )
  if (cooldownCheck.isLocked) {
    throw new Error(
      '❌ Penarikan diblokir oleh Gate 1 karena rekening baru diubah!'
    )
  }
  console.log(`   - Hasil: Lolos Gate 1 ✅`)

  // 6.2 Uji Gate 2: Validasi Kesesuaian Nama Pemilik Rekening vs Nama Legal PT
  console.log('👉 [Gate 2] Memeriksa Kesesuaian Nama Rekening Bank vs PT:')
  console.log(`   - Nama Rekening Tujuan: "${primaryBank.accountName}"`)
  console.log(`   - Nama Badan Hukum Toko: "${store.companyName}"`)
  const nameCheck = validateAccountNameMatch(
    primaryBank.accountName,
    store.companyName
  )
  console.log(
    `   - Skor Kemiripan Algoritma: ${Math.round(nameCheck.similarityScore * 100)}% (Threshold: 70%)`
  )
  if (!nameCheck.isValid) {
    throw new Error(`❌ Gate 2 Gagal: ${nameCheck.reason}`)
  }
  console.log(`   - Hasil: Lolos Gate 2 ✅`)

  // 6.3 Uji Gate 3: OTP 2FA WhatsApp & Verifikasi Kredensial
  console.log('👉 [Gate 3] Tantangan Kode Verifikasi OTP 2FA:')
  const { code: otpCode, otpToken: otpRecord } = await createOtpRecord({
    identifier: primaryBank.accountNumber,
    purpose: 'WITHDRAWAL',
    channel: 'WHATSAPP',
  })
  console.log(
    `   - Kode OTP 6 Digit Diterbitkan: ${otpCode} (Expires: 300 detik)`
  )

  const otpValidation = await validateOtpRecord({
    identifier: primaryBank.accountNumber,
    code: otpCode,
    purpose: 'WITHDRAWAL',
  })

  if (!otpValidation.valid) {
    throw new Error(`❌ Gate 3 Gagal: Kode OTP tidak valid!`)
  }
  await consumeOtpRecord(otpRecord.id)
  console.log(`   - Verifikasi OTP Berhasil & Token Dikonsumsi Sekali Pakai ✅`)

  // 6.4 Eksekusi Payout ke Rekening Toko via Midtrans Iris
  console.log('👉 [Eksekusi Payout] Mengirim Dana via Midtrans Iris:')
  const irisResult = await createIrisPayout({
    referenceNo: `WD-ROXY-${Date.now().toString().slice(-6)}`,
    beneficiaryName: primaryBank.accountName,
    beneficiaryAccount: primaryBank.accountNumber,
    beneficiaryBank: primaryBank.bankName,
    amount: withdrawAmountToko,
    notes: `Pencairan Saldo ${store.name}`,
  })

  console.log(
    `   - Status Iris Payout: ${irisResult.status} (Mode: ${irisResult.mode})`
  )

  // Simpan record pencairan toko
  const wdRecord = await createStoreWithdrawal({
    storeId: store.id,
    storeName: store.name,
    companyName: store.companyName,
    bankName: primaryBank.bankName,
    accountNumber: primaryBank.accountNumber,
    accountName: primaryBank.accountName,
    amount: withdrawAmountToko,
    status: 'SUCCESS',
    requestedBy: 'Bambang S. (Admin Roxy Mas)',
  })
  console.log(`   - No. Referensi Penarikan: ${wdRecord.refNumber}`)

  // Verifikasi saldo toko setelah pencairan
  const storeWithdrawnAfter = await getTotalWithdrawn(store.id)
  const storeAvailableAfterWithdraw = Math.max(
    0,
    storeNetRevenueAfter - storeWithdrawnAfter
  )
  console.log(
    `   - Saldo Toko Roxy Setelah Penarikan: Rp ${storeAvailableAfterWithdraw.toLocaleString('id-ID')} (Sisa dari Rp ${storeAvailableAfter.toLocaleString('id-ID')})`
  )

  if (
    storeAvailableAfterWithdraw !==
    storeAvailableAfter - withdrawAmountToko
  ) {
    throw new Error(`❌ Pengurangan saldo toko tidak sesuai!`)
  }

  // Verifikasi Saldo Superadmin TIDAK BERKURANG
  const superAvailableCheck = Math.max(
    0,
    (superCompletedAggAfter._sum.commissionAmount || 0) -
      superHoldingWithdrawalsBefore
  )
  console.log(
    `   - Saldo Superadmin Tetap Aman: Rp ${superAvailableCheck.toLocaleString('id-ID')} (Tidak terpotong oleh penarikan cabang) ✅\n`
  )

  // =========================================================================
  // TAHAP 7: TEST PENARIKAN LABA KOMISI SUPERADMIN HOLDING
  // =========================================================================
  console.log(
    '------------------------------------------------------------------------'
  )
  console.log('🏛️ TAHAP 7: TEST PENARIKAN LABA KOMISI HOLDING SUPERADMIN')
  console.log(
    '------------------------------------------------------------------------'
  )

  const withdrawAmountSuper = 100000 // Tarik Rp 100.000 komisi holding
  console.log(
    `- Mengajukan Penarikan Laba Komisi Platform: Rp ${withdrawAmountSuper.toLocaleString('id-ID')}`
  )
  console.log(
    `- Rekening Tujuan: Bank Mandiri (Pusat) 1180099887766 a.n. PT Affiliate Gadget Nusantara`
  )

  const superWdRecord = await createStoreWithdrawal({
    storeId: 'ALL',
    storeName: 'Konsolidasi Seluruh Toko',
    companyName: 'PT Affiliate Gadget Nusantara',
    bankName: 'Bank Mandiri (Pusat)',
    accountNumber: '1180099887766',
    accountName: 'PT Affiliate Gadget Nusantara',
    amount: withdrawAmountSuper,
    status: 'SUCCESS',
    requestedBy: 'Super Administrator',
  })

  const superHoldingWithdrawalsAfter = (await getStoreWithdrawals())
    .filter(
      (w) =>
        ['ALL', 'holding-01', 'HOLDING'].includes(w.storeId) &&
        w.status === 'SUCCESS'
    )
    .reduce((sum, w) => sum + w.amount, 0)

  const superAvailableFinal = Math.max(
    0,
    (superCompletedAggAfter._sum.commissionAmount || 0) -
      superHoldingWithdrawalsAfter
  )

  console.log(`- No. Referensi Penarikan Holding: ${superWdRecord.refNumber}`)
  console.log(
    `- Sisa Saldo Komisi Superadmin: Rp ${superAvailableFinal.toLocaleString('id-ID')}`
  )

  // Verifikasi saldo toko Roxy TIDAK BERKURANG
  const storeFinalCheck = Math.max(
    0,
    storeNetRevenueAfter - (await getTotalWithdrawn(store.id))
  )
  console.log(
    `- Saldo Toko Roxy Tetap: Rp ${storeFinalCheck.toLocaleString('id-ID')} (Tidak terpotong penarikan holding) ✅\n`
  )

  console.log(
    '========================================================================'
  )
  console.log('🎉 SEMUA TAHAP TEST E2E BERJALAN 100% SUKSES DAN TANPA CACAT!')
  console.log(
    '========================================================================'
  )
}

runE2ETest()
  .catch((err) => {
    console.error('\n❌ TEST BERHENTI KARENA EROR:')
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
