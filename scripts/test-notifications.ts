import 'dotenv/config'
import {
  dispatchOtp,
  dispatchTransactional,
  dispatchSecurityAlert,
} from '../src/lib/notifications'
import { db } from '../src/lib/db'

async function main() {
  const targetEmail =
    process.argv[2] ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    'customer@test.com'
  const targetPhone = '085788245395'

  console.log(`\n======================================================`)
  console.log(`🚀 MULAI PENGUJIAN SISTEM NOTIFIKASI DI LOKAL`)
  console.log(`🎯 Target Email : ${targetEmail} (Real via Resend)`)
  console.log(`🎯 Target Phone : ${targetPhone} (Mock via WA/SMS)`)
  console.log(`======================================================\n`)

  // 1. Test OTP Email
  console.log(`[1/4] Menguji Kirim OTP ke Email...`)
  const emailOtpRes = await dispatchOtp({
    identifier: targetEmail,
    purpose: 'REGISTER',
    channel: 'EMAIL',
  })
  console.log(
    emailOtpRes.success
      ? `  ✅ Sukses kirim OTP Email (ID: ${emailOtpRes.otpId})`
      : `  ❌ Gagal kirim OTP Email: ${emailOtpRes.errorMessage}`
  )

  // 2. Test OTP WhatsApp (Mock)
  console.log(`\n[2/4] Menguji Kirim OTP ke WhatsApp (Mock Mode)...`)
  const waOtpRes = await dispatchOtp({
    identifier: targetPhone,
    purpose: 'LOGIN',
    channel: 'WHATSAPP',
  })
  console.log(
    waOtpRes.success
      ? `  ✅ Sukses dispatch OTP WA Mock (ID: ${waOtpRes.otpId})`
      : `  ❌ Gagal dispatch OTP WA: ${waOtpRes.errorMessage}`
  )

  // 3. Test Notifikasi Transaksional (Order Shipped)
  console.log(`\n[3/4] Menguji Notifikasi Transaksional (Pesanan Dikirim)...`)
  await dispatchTransactional({
    event: 'ORDER_SHIPPED',
    orderId: 'test-order-123',
    orderNumber: 'ORD-2026-TEST99',
    customerName: 'Tester Lokal',
    customerEmail: targetEmail,
    customerPhone: targetPhone,
    courierName: 'JNE Express (REG)',
    awbNumber: 'JNE8899221100',
    totalAmount: 14500000,
  })
  console.log(`  ✅ Notifikasi Pesanan Dikirim selesai diproses!`)

  // 4. Test Security Alert (New Device)
  console.log(
    `\n[4/4] Menguji Notifikasi Peringatan Keamanan Perangkat Baru...`
  )
  const existingUser = await db.user.findFirst({ select: { id: true } })
  if (existingUser) {
    await dispatchSecurityAlert({
      userId: existingUser.id,
      name: 'Tester Lokal',
      email: targetEmail,
      phone: targetPhone,
      deviceLabel: 'Windows PC (Chrome 128.0)',
      ipAddress: '127.0.0.1',
      location: 'Jakarta, Indonesia',
      revokeUrl: 'http://localhost:3000/dashboard/customer/security',
    })
    console.log(`  ✅ Notifikasi Peringatan Keamanan selesai diproses!`)
  }

  // 5. Cek Database Log
  console.log(`\n------------------------------------------------------`)
  console.log(`📊 Memeriksa 4 Log Notifikasi Terakhir di Database...`)
  const logs = await db.notificationLog.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' },
    select: {
      channel: true,
      provider: true,
      recipient: true,
      subject: true,
      status: true,
      createdAt: true,
    },
  })

  logs.forEach((log, index) => {
    console.log(
      `  [${index + 1}] [${log.channel}] [${log.provider}] Status: ${log.status} | Ke: ${log.recipient} | Subjek: ${log.subject}`
    )
  })
  console.log(`======================================================\n`)
}

main()
  .catch((err) => {
    console.error('Test Error:', err)
  })
  .finally(() => {
    process.exit(0)
  })
