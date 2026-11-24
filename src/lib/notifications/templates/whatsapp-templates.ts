/**
 * WhatsApp message templates for Affiliate Gadget platform
 */

export function otpMessage(
  code: string,
  purposeText: string,
  expireMinutes = 5
): string {
  const isWithdrawal =
    purposeText.toLowerCase().includes('penarikan') ||
    purposeText.toLowerCase().includes('withdraw')

  if (isWithdrawal) {
    return `*AFFILIATE GADGET*
_Otorisasi Keamanan Penarikan Dana_
━━━━━━━━━━━━━━━━━━━━

Halo,
Berikut kode OTP keamanan untuk otorisasi penarikan saldo toko:

🔐 *Kode OTP:* *${code}*

⏱️ Berlaku selama *${expireMinutes} menit*.

⚠️ *Peringatan Keamanan:*
Kode ini SANGAT RAHASIA untuk pencairan dana ke rekening bank. JANGAN PERNAH memberikan kode ini kepada siapa pun termasuk staf Affiliate Gadget.`
  }

  return `*AFFILIATE GADGET*
_Verifikasi Keamanan Akun_
━━━━━━━━━━━━━━━━━━━━

Halo Kak,
Berikut adalah kode verifikasi WhatsApp untuk *${purposeText}*:

🔐 *Kode OTP:* *${code}*

⏱️ Berlaku selama *${expireMinutes} menit*.
Demi keamanan akun Anda, *JANGAN* bagikan kode ini kepada siapa pun, termasuk pihak Affiliate Gadget.

Terima kasih.`
}

export function orderCreatedMessage(
  customerName: string,
  orderNumber: string,
  totalFormatted: string,
  deadline: string
): string {
  return `*AFFILIATE GADGET*
_Notifikasi Pesanan Baru_
━━━━━━━━━━━━━━━━━━━━

Halo Kak *${customerName}*,
Pesanan Anda telah berhasil dibuat dan siap diproses:

📋 *No. Pesanan:* #${orderNumber}
💰 *Total Tagihan:* ${totalFormatted}
⏳ *Batas Waktu Pembayaran:* ${deadline}

Silakan selesaikan pembayaran agar pesanan dapat segera disiapkan oleh gerai toko fisik kami.

Terima kasih telah berbelanja di Affiliate Gadget!`
}

export function paymentVerifiedMessage(
  customerName: string,
  orderNumber: string,
  storeName: string
): string {
  return `*AFFILIATE GADGET*
_Pembayaran Terverifikasi_
━━━━━━━━━━━━━━━━━━━━

Halo Kak *${customerName}*,
Pembayaran untuk pesanan *#${orderNumber}* telah *BERHASIL* diverifikasi.

🏬 *Gerai Toko:* ${storeName}
📦 *Status:* Unit sedang dipersiapkan dan melewati proses QC fisik toko.

Nomor resi kurir akan otomatis kami kirimkan begitu paket diserahkan ke kurir ekspedisi. Terima kasih!`
}

export function orderShippedMessage(
  customerName: string,
  orderNumber: string,
  courier: string,
  awb: string,
  trackUrl: string
): string {
  return `*AFFILIATE GADGET*
_Paket Sedang Dikirim_
━━━━━━━━━━━━━━━━━━━━

Halo Kak *${customerName}*,
Paket pesanan *#${orderNumber}* sedang dalam perjalanan menuju alamat Anda:

🚚 *Kurir:* ${courier}
📄 *No. Resi (AWB):* ${awb}

📍 *Lacak Pengiriman Langsung:*
${trackUrl}

Paket Anda terlindungi 100% asuransi pengiriman resmi. Mohon pastikan penerima dapat dihubungi oleh kurir. Terima kasih!`
}

export function orderDeliveredMessage(
  customerName: string,
  orderNumber: string
): string {
  return `*AFFILIATE GADGET*
_Paket Telah Tiba_
━━━━━━━━━━━━━━━━━━━━

Halo Kak *${customerName}*,
Kurir melaporkan bahwa pesanan *#${orderNumber}* telah tiba di tujuan.

🛡️ *Langkah Selanjutnya:*
1. Periksa kelengkapan fisik unit gadget & paket bonus Anda.
2. Buka aplikasi dan klik *"Konfirmasi Pesanan Diterima"*.
3. Garansi 30 Hari Ganti Unit Baru akan otomatis aktif setelah konfirmasi penerimaan.

Terima kasih atas kepercayaan Anda berbelanja di Affiliate Gadget!`
}

export function orderCompletedMessage(
  customerName: string,
  orderNumber: string
): string {
  return `*AFFILIATE GADGET*
_Pesanan Selesai_
━━━━━━━━━━━━━━━━━━━━

Halo Kak *${customerName}*,
Transaksi untuk pesanan *#${orderNumber}* telah *SELESAI*.

🛡️ *Garansi Toko 30 Hari Aktif:*
Unit gadget Anda kini terlindungi garansi resmi toko. Simpan nomor pesanan ini sebagai bukti jika sewaktu-waktu membutuhkan konsultasi purna jual atau klaim garansi.

Terima kasih telah berbelanja di Affiliate Gadget!`
}

export function newDeviceAlertMessage(
  name: string,
  device: string,
  ip: string,
  location: string,
  revokeUrl?: string
): string {
  let msg = `*AFFILIATE GADGET*
_Peringatan Keamanan Akun_
━━━━━━━━━━━━━━━━━━━━

Halo *${name}*,
Terdeteksi aktivitas login baru pada akun Affiliate Gadget Anda:

📱 *Perangkat:* ${device}
📍 *Lokasi:* ${location}
🌐 *IP Address:* ${ip}
⏰ *Waktu:* ${new Date().toLocaleString('id-ID')} WIB`

  if (revokeUrl) {
    msg += `\n\nJika ini bukan Anda, segera amankan akun Anda di sini:\n${revokeUrl}`
  }

  return msg
}
