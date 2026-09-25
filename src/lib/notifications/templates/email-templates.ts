/**
 * HTML Email templates for Affiliate Gadget transactional events
 */

const APP_NAME = 'Affiliate Gadget'
const PRIMARY_COLOR = '#2563EB'
const ACCENT_COLOR = '#F97316'

function baseEmailLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px 12px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1E3A8A, #2563EB); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; padding: 12px 28px; background: ${ACCENT_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${APP_NAME}</h1>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Seluruh hak cipta dilindungi.</p>
      <p style="font-size: 11px; color: #94a3b8; margin: 4px 0;">PT Gadget Jaya Sentosa &bull; Gedung ITC Roxy Mas Lt. 2 No. 15, Jakarta Pusat, Indonesia</p>
      <p style="font-size: 11px; color: #94a3b8; margin: 4px 0;">Email ini dikirim secara otomatis untuk keperluan keamanan akun. Jangan balas email ini.</p>
    </div>
  </div>
</body>
</html>`
}

export function otpEmailTemplate(
  code: string,
  purposeText: string,
  expireMinutes = 5
): string {
  const content = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Kode Verifikasi Akun</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Gunakan kode verifikasi (OTP) berikut untuk menyelesaikan <strong>${purposeText}</strong> di Affiliate Gadget:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: ${PRIMARY_COLOR}; background: #eff6ff; padding: 14px 28px; border-radius: 12px; border: 1px dashed #93c5fd;">
        ${code}
      </span>
    </div>
    <p style="color: #64748b; font-size: 13px; text-align: center; margin-bottom: 0;">
      Kode verifikasi ini berlaku selama <strong>${expireMinutes} menit</strong>.
    </p>
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 6px;">
      Jika Anda tidak melakukan permintaan ini, abaikan email ini. Akun Anda tetap aman.
    </p>
  `
  return baseEmailLayout('Kode Verifikasi OTP', content)
}

export function otpPlainText(
  code: string,
  purposeText: string,
  expireMinutes = 5
): string {
  return `AFFILIATE GADGET MARKETPLACE\n\nKode Verifikasi OTP Anda untuk ${purposeText} adalah:\n\n${code}\n\nKode ini berlaku selama ${expireMinutes} menit. Demi keamanan, jangan berikan kode ini kepada siapa pun.\n\nPT Gadget Jaya Sentosa - Jakarta Pusat, Indonesia`
}

export function orderCreatedEmailTemplate(params: {
  customerName: string
  orderNumber: string
  totalFormatted: string
  paymentDeadline?: string
  viewOrderUrl: string
}): string {
  const content = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Pesanan Berhasil Dibuat</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Halo <strong>${params.customerName}</strong>, pesanan Anda dengan nomor <strong>#${params.orderNumber}</strong> telah berhasil dibuat di sistem.
    </p>
    <div class="info-card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748b; font-size: 14px;">Total Tagihan:</span>
        <strong style="color: #0f172a; font-size: 16px;">${params.totalFormatted}</strong>
      </div>
      ${
        params.paymentDeadline
          ? `<div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-size: 14px;">Batas Pembayaran:</span>
              <span style="color: #dc2626; font-size: 14px; font-weight: 600;">${params.paymentDeadline}</span>
            </div>`
          : ''
      }
    </div>
    <p style="color: #475569; font-size: 14px;">
      Silakan selesaikan pembayaran untuk memproses pengiriman unit gadget terproteksi asuransi Anda.
    </p>
    <div style="text-align: center;">
      <a href="${params.viewOrderUrl}" class="btn">Lihat & Bayar Pesanan</a>
    </div>
  `
  return baseEmailLayout(`Pesanan #${params.orderNumber} Dibuat`, content)
}

export function paymentVerifiedEmailTemplate(params: {
  customerName: string
  orderNumber: string
  totalFormatted: string
  storeName: string
  viewOrderUrl: string
}): string {
  const content = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Pembayaran Diterima & Terverifikasi</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Halo <strong>${params.customerName}</strong>, pembayaran untuk pesanan <strong>#${params.orderNumber}</strong> telah berhasil diverifikasi oleh sistem.
    </p>
    <div class="info-card">
      <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px;">Toko Penjual:</p>
      <p style="margin: 0 0 12px 0; color: #0f172a; font-weight: 600; font-size: 15px;">${params.storeName}</p>
      <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px;">Jumlah Terbayar:</p>
      <p style="margin: 0; color: #16a34a; font-weight: 700; font-size: 18px;">${params.totalFormatted}</p>
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Cabang toko saat ini sedang menyiapkan unit gadget, pengecekan fungsi QC, dan paket bonus 3-in-1 Anda sebelum diserahkan ke kurir logistik terproteksi.
    </p>
    <div style="text-align: center;">
      <a href="${params.viewOrderUrl}" class="btn">Pantau Status Pesanan</a>
    </div>
  `
  return baseEmailLayout(
    `Pembayaran Pesanan #${params.orderNumber} Berhasil`,
    content
  )
}

export function orderShippedEmailTemplate(params: {
  customerName: string
  orderNumber: string
  courier: string
  awb: string
  trackingUrl: string
}): string {
  const content = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Pesanan Sedang Dikirim 🚀</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Halo <strong>${params.customerName}</strong>, paket pesanan <strong>#${params.orderNumber}</strong> telah diserahkan ke pihak kurir logistik.
    </p>
    <div class="info-card">
      <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px;">Kurir Pengiriman:</p>
      <p style="margin: 0 0 12px 0; color: #0f172a; font-weight: 600; font-size: 15px;">${params.courier}</p>
      <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px;">Nomor Resi (AWB):</p>
      <p style="margin: 0; color: #0f172a; font-weight: 700; font-size: 16px; font-family: monospace;">${params.awb}</p>
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Semua pengiriman dilindungi oleh <strong>Asuransi Wajib Pengiriman</strong> untuk menjamin keamanan gadget Anda hingga sampai di tangan.
    </p>
    <div style="text-align: center;">
      <a href="${params.trackingUrl}" class="btn">Lacak Perjalanan Paket</a>
    </div>
  `
  return baseEmailLayout(
    `Pesanan #${params.orderNumber} Sedang Dikirim`,
    content
  )
}

export function orderDeliveredEmailTemplate(params: {
  customerName: string
  orderNumber: string
  confirmUrl: string
}): string {
  const content = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Paket Telah Tiba di Tujuan 🎉</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Halo <strong>${params.customerName}</strong>, kurir melaporkan bahwa pesanan <strong>#${params.orderNumber}</strong> telah sampai di alamat tujuan.
    </p>
    <div class="info-card" style="border-left: 4px solid #16a34a;">
      <p style="margin: 0; color: #15803d; font-weight: 600; font-size: 14px;">
        Penting: Segera periksa kelengkapan unit gadget dan bonus 3-in-1 Anda sebelum mengonfirmasi pesanan.
      </p>
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Setelah klik tombol konfirmasi selesai di aplikasi, <strong>Masa Garansi 30 Hari Ganti Unit Baru</strong> Anda akan resmi aktif.
    </p>
    <div style="text-align: center;">
      <a href="${params.confirmUrl}" class="btn">Konfirmasi Pesanan Diterima</a>
    </div>
  `
  return baseEmailLayout(`Paket #${params.orderNumber} Telah Tiba`, content)
}

export function orderCompletedEmailTemplate(params: {
  customerName: string
  orderNumber: string
  storeName?: string
  viewOrderUrl: string
}): string {
  const content = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Pesanan Selesai & Garansi Aktif 🎉</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Halo <strong>${params.customerName}</strong>, transaksi untuk pesanan <strong>#${params.orderNumber}</strong> telah resmi selesai dikonfirmasi.
    </p>
    <div class="info-card" style="border-left: 4px solid #2563eb;">
      <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px;">Status Garansi:</p>
      <p style="margin: 0 0 10px 0; color: #16a34a; font-weight: 700; font-size: 16px;">
        🛡️ Proteksi 30 Hari Ganti Unit Baru Resmi Aktif
      </p>
      ${
        params.storeName
          ? `<p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">Toko Penjamin:</p>
             <p style="margin: 0; color: #0f172a; font-weight: 600;">${params.storeName}</p>`
          : ''
      }
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Simpan nomor pesanan ini sebagai bukti klaim garansi di toko offline kami atau hubungi Customer Care jika membutuhkan bantuan teknisi.
    </p>
    <div style="text-align: center;">
      <a href="${params.viewOrderUrl}" class="btn">Lihat Invoice & Detail Pesanan</a>
    </div>
  `
  return baseEmailLayout(
    `Pesanan #${params.orderNumber} Selesai - Garansi Aktif`,
    content
  )
}

export function newDeviceSecurityEmailTemplate(params: {
  name: string
  deviceLabel: string
  ipAddress: string
  location?: string
  loginTime: string
  revokeUrl?: string
}): string {
  const content = `
    <h2 style="font-size: 20px; color: #dc2626; margin-top: 0;">⚠️ Peringatan: Login dari Perangkat Baru</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Halo <strong>${params.name}</strong>, akun Affiliate Gadget Anda baru saja diakses dari perangkat yang belum pernah digunakan sebelumnya:
    </p>
    <div class="info-card" style="border-left: 4px solid #dc2626;">
      <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px;">Perangkat:</p>
      <p style="margin: 0 0 10px 0; color: #0f172a; font-weight: 600;">${params.deviceLabel}</p>
      <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px;">Alamat IP & Lokasi:</p>
      <p style="margin: 0 0 10px 0; color: #0f172a; font-weight: 600;">${params.ipAddress} ${params.location ? `(${params.location})` : ''}</p>
      <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px;">Waktu Login:</p>
      <p style="margin: 0; color: #0f172a; font-weight: 600;">${params.loginTime}</p>
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Jika Anda mengenali aktivitas ini, abaikan email ini. Namun jika ini bukan Anda, segera amankan akun Anda untuk memutuskan sesi dan mengatur ulang kata sandi.
    </p>
    ${
      params.revokeUrl
        ? `<div style="text-align: center;">
            <a href="${params.revokeUrl}" class="btn" style="background: #dc2626;">Amankan Akun Saya</a>
          </div>`
        : ''
    }
  `
  return baseEmailLayout('Peringatan Login Perangkat Baru', content)
}
