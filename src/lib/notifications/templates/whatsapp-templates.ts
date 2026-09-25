/**
 * WhatsApp message templates for Affiliate Gadget platform
 */

export function otpMessage(
  code: string,
  purposeText: string,
  expireMinutes = 5
): string {
  return `*AFFILIATE GADGET*\n\nKode verifikasi (${purposeText}) Anda adalah:\n\n*${code}*\n\nKode berlaku selama ${expireMinutes} menit. JANGAN bagikan kode ini kepada siapa pun termasuk pihak Affiliate Gadget.`
}

export function orderCreatedMessage(
  customerName: string,
  orderNumber: string,
  totalFormatted: string,
  deadline: string
): string {
  return `Halo Kak ${customerName},\n\nPesanan *#${orderNumber}* berhasil dibuat.\n\nTotal Tagihan: *${totalFormatted}*\nBatas Waktu Pembayaran: *${deadline}*\n\nSilakan selesaikan pembayaran untuk memproses pesanan Anda. Terima kasih!`
}

export function paymentVerifiedMessage(
  customerName: string,
  orderNumber: string,
  storeName: string
): string {
  return `Halo Kak ${customerName},\n\nPembayaran untuk pesanan *#${orderNumber}* telah BERHASIL diverifikasi!\n\nUnit sedang disiapkan dan dicek oleh *${storeName}*. Kami akan segera mengirimkan nomor resi kurir setelah paket diserahkan.`
}

export function orderShippedMessage(
  customerName: string,
  orderNumber: string,
  courier: string,
  awb: string,
  trackUrl: string
): string {
  return `Halo Kak ${customerName},\n\nPaket pesanan *#${orderNumber}* sedang dalam perjalanan!\n\nKurir: *${courier}*\nNo. Resi (AWB): *${awb}*\n\nLacak kurir langsung:\n${trackUrl}`
}

export function orderDeliveredMessage(
  customerName: string,
  orderNumber: string
): string {
  return `Halo Kak ${customerName},\n\nKurir melaporkan bahwa pesanan *#${orderNumber}* telah TIBA di tujuan.\n\nMohon periksa fisik unit gadget Anda. Jangan lupa klik "Konfirmasi Pesanan Diterima" di aplikasi untuk mengaktifkan Garansi 30 Hari Ganti Unit Baru!`
}

export function orderCompletedMessage(
  customerName: string,
  orderNumber: string
): string {
  return `Halo Kak ${customerName},\n\nPesanan *#${orderNumber}* telah SELESAI.\n\nTerima kasih telah berbelanja di Affiliate Gadget. Garansi 30 hari ganti unit baru Anda kini aktif. Simpan nomor pesanan ini untuk klaim jika diperlukan.`
}

export function newDeviceAlertMessage(
  name: string,
  device: string,
  ip: string,
  location: string,
  revokeUrl?: string
): string {
  let msg = `⚠️ *PERINGATAN KEAMANAN AKUN*\n\nHalo ${name},\nTerdeteksi login baru pada akun Affiliate Gadget Anda:\n\nPerangkat: ${device}\nLokasi: ${location}\nIP: ${ip}\nWaktu: ${new Date().toLocaleString('id-ID')}`

  if (revokeUrl) {
    msg += `\n\nJika ini bukan Anda, segera amankan akun Anda di sini:\n${revokeUrl}`
  }

  return msg
}
