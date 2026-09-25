import 'dotenv/config'
import { sendEmail } from '../src/lib/notifications/email-provider'
import {
  orderCompletedEmailTemplate,
  orderRefundedEmailTemplate,
  orderComplainedEmailTemplate,
  orderCancelledEmailTemplate,
} from '../src/lib/notifications/templates/email-templates'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const targetEmail = process.argv[2]
  const emailType = process.argv[3] || 'all'

  if (!targetEmail) {
    console.log(`
❌ Harap masukkan email tujuan untuk pengujian!
Contoh:
  npx tsx scripts/test-order-emails.ts emailanda@gmail.com
  npx tsx scripts/test-order-emails.ts emailanda@gmail.com 1  (Kirim Selesai saja)
  npx tsx scripts/test-order-emails.ts emailanda@gmail.com 2  (Kirim Refund saja)
  npx tsx scripts/test-order-emails.ts emailanda@gmail.com 3  (Kirim Komplain saja)
  npx tsx scripts/test-order-emails.ts emailanda@gmail.com 4  (Kirim Batal saja)
    `)
    process.exit(1)
  }

  console.log(`\n======================================================`)
  console.log(`🚀 MEMULAI PENGUJIAN EMAIL TAHAP AKHIR & AWB (PRO FORMAT)`)
  console.log(`📧 Target Penerima : ${targetEmail}`)
  console.log(`🔑 RESEND_API_KEY  : ${process.env.RESEND_API_KEY ? 'Terpasang (' + process.env.RESEND_API_KEY.slice(0, 7) + '...)' : 'KOSONG (Mode Mock/Konsol)'}`)
  console.log(`📨 SENDER          : ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}`)
  console.log(`======================================================\n`)

  const sampleItems = [
    {
      name: 'iPhone 15 Pro Max 256GB',
      variant: 'Natural Titanium',
      quantity: 1,
      price: 21999000,
    },
    {
      name: 'Paket Bonus 3-in-1',
      variant: 'Case + Tempered Glass + Adaptor 20W',
      quantity: 1,
      price: 0,
    },
  ]

  // 1. Email Transaksi Selesai (COMPLETED)
  if (emailType === 'all' || emailType === '1') {
    console.log('1️⃣ Mengirim: Transaksi Selesai & Garansi Aktif (dengan AWB)...')
    const completedHtml = orderCompletedEmailTemplate({
      customerName: 'Budi Santoso',
      orderNumber: 'AG-2026-9901',
      storeName: 'PT Gadget Jaya Sentosa - Roxy Mas Pusat',
      courierName: 'JNE Express',
      courierService: 'YES (Yakin Esok Sampai)',
      awbNumber: 'JNE8899001122ID',
      trackingUrl: 'https://berdu.id/cek-resi?resi=JNE8899001122ID',
      totalAmount: 22025000,
      subtotal: 21999000,
      shippingCost: 26000,
      insuranceFee: 55000,
      discountAmount: 55000,
      items: sampleItems,
      warrantyExpiryDate: '25 Oktober 2026',
      viewOrderUrl: 'http://localhost:3000/dashboard/customer/orders/test-1',
    })
    const res1 = await sendEmail(
      targetEmail,
      'Tanda Bukti Transaksi Selesai & Garansi Aktif — #AG-2026-9901',
      completedHtml
    )
    console.log(`   Hasil: ${res1.success ? '✅ SUKSES' : '❌ GAGAL'} (${res1.provider}) ${res1.errorMessage || res1.messageId || ''}`)
    if (emailType === 'all') await sleep(1500)
  }

  // 2. Email Retur & Refund (RETURNED)
  if (emailType === 'all' || emailType === '2') {
    console.log('\n2️⃣ Mengirim: Pengembalian Dana / Refund (dengan 2 AWB)...')
    const refundHtml = orderRefundedEmailTemplate({
      customerName: 'Budi Santoso',
      orderNumber: 'AG-2026-9902',
      storeName: 'PT Sinar Gadget Nusantara - WTC Surabaya',
      courierName: 'JNE Express',
      awbNumber: 'JNE7766554433ID',
      returnCourier: 'J&T Express',
      returnTrackingNumber: 'JT8811223344',
      trackingUrl: 'https://berdu.id/cek-resi?resi=JT8811223344',
      refundAmount: 21999000,
      refundReason: 'Layar ada garis dead pixel bawaan pabrik',
      refundBank: 'BCA (Bank Central Asia)',
      refundAccount: '8830123456',
      refundAccountName: 'Budi Santoso',
      items: sampleItems,
      viewOrderUrl: 'http://localhost:3000/dashboard/customer/orders/test-2',
    })
    const res2 = await sendEmail(
      targetEmail,
      'Bukti Pengembalian Dana (Refund) — #AG-2026-9902',
      refundHtml
    )
    console.log(`   Hasil: ${res2.success ? '✅ SUKSES' : '❌ GAGAL'} (${res2.provider}) ${res2.errorMessage || res2.messageId || ''}`)
    if (emailType === 'all') await sleep(1500)
  }

  // 3. Email Tiket Komplain (COMPLAINED)
  if (emailType === 'all' || emailType === '3') {
    console.log('\n3️⃣ Mengirim: Tiket Komplain & Klaim Garansi (dengan AWB & SLA)...')
    const complaintHtml = orderComplainedEmailTemplate({
      customerName: 'Budi Santoso',
      orderNumber: 'AG-2026-9903',
      storeName: 'PT Digital Niaga Prima - BEC Bandung',
      courierName: 'Gojek Instant',
      awbNumber: 'GK-99220011',
      trackingUrl: 'https://berdu.id/cek-resi?resi=GK-99220011',
      complaintSubject: 'Kamera Belakang Blur',
      complaintDescription: 'Kamera utama tidak bisa fokus saat mengambil foto objek jarak dekat.',
      complaintStatus: 'OPEN',
      items: sampleItems,
      viewOrderUrl: 'http://localhost:3000/dashboard/customer/complaints',
    })
    const res3 = await sendEmail(
      targetEmail,
      'Tiket Komplain & Klaim Garansi Diterima — #AG-2026-9903',
      complaintHtml
    )
    console.log(`   Hasil: ${res3.success ? '✅ SUKSES' : '❌ GAGAL'} (${res3.provider}) ${res3.errorMessage || res3.messageId || ''}`)
    if (emailType === 'all') await sleep(1500)
  }

  // 4. Email Pembatalan Pesanan (CANCELLED)
  if (emailType === 'all' || emailType === '4') {
    console.log('\n4️⃣ Mengirim: Pemberitahuan Pembatalan Pesanan...')
    const cancelHtml = orderCancelledEmailTemplate({
      customerName: 'Budi Santoso',
      orderNumber: 'AG-2026-9904',
      storeName: 'PT Surya Makmur Gadget - Medan',
      courierName: 'JNE Express',
      awbNumber: 'JNE-BATAL-001',
      cancellationReason: 'Pembeli berubah pikiran memilih warna Natural Titanium',
      totalAmount: 22025000,
      viewOrderUrl: 'http://localhost:3000/gadget',
    })
    const res4 = await sendEmail(
      targetEmail,
      'Pemberitahuan Pembatalan Pesanan — #AG-2026-9904',
      cancelHtml
    )
    console.log(`   Hasil: ${res4.success ? '✅ SUKSES' : '❌ GAGAL'} (${res4.provider}) ${res4.errorMessage || res4.messageId || ''}`)
  }

  console.log(`\n======================================================`)
  console.log(`✨ PENGUJIAN SELESAI! Silakan periksa inbox email Anda.`)
  console.log(`======================================================\n`)
}

main().catch(console.error)
