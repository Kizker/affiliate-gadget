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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 32px 16px; -webkit-font-smoothing: antialiased; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); }
    .header { padding: 22px 28px; border-bottom: 1px solid #f1f5f9; background: #ffffff; }
    .logo { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; text-decoration: none; }
    .logo-accent { color: #2563eb; }
    .content { padding: 28px; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b; line-height: 1.6; }
    .btn { display: inline-block; padding: 10px 22px; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; }
    .btn:hover { background: #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">Affiliate<span class="logo-accent">Gadget</span></span>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #334155;">Affiliate Gadget Indonesia</p>
      <p style="margin: 0 0 4px 0;">Marketplace Gadget Terverifikasi Multi-PT &bull; ITC Roxy Mas, Jakarta Pusat</p>
      <p style="margin: 0; color: #94a3b8; font-size: 11px;">Email ini dikirim secara otomatis untuk tanda bukti transaksi resmi.</p>
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

function formatRupiah(amount?: number): string {
  if (amount === undefined || amount === null) return 'Rp 0'
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function renderItemsTable(
  items?: Array<{
    name: string
    variant?: string
    quantity: number
    price: number
  }>
): string {
  if (!items || items.length === 0) return ''
  const rows = items
    .map((item) => {
      const variant = item.variant
        ? ` <span style="color: #64748b; font-size: 11px;">(${item.variant})</span>`
        : ''
      const total = item.price * (item.quantity || 1)
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b;">
            <strong style="color: #0f172a;">${item.name}</strong>${variant}<br/>
            <span style="font-size: 11px; color: #64748b;">${item.quantity || 1} unit × ${formatRupiah(item.price)}</span>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a;">
            ${formatRupiah(total)}
          </td>
        </tr>
      `
    })
    .join('')

  return `
    <div style="margin: 22px 0 10px 0;">
      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
        Rincian Unit Gadget
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `
}

function renderAwbCard(params: {
  awb?: string
  courier?: string
  courierService?: string
  trackingUrl?: string
  returnAwb?: string
  returnCourier?: string
}): string {
  if (!params.awb && !params.returnAwb) return ''

  return `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px;">
        Informasi Pengiriman & Resi
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="color: #64748b; padding: 5px 0;">Ekspedisi Kurir:</td>
          <td style="color: #0f172a; font-weight: 600; text-align: right; padding: 5px 0;">
            ${params.courier || 'Kurir Logistik'}${params.courierService ? ` (${params.courierService})` : ''}
          </td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 5px 0;">Nomor Resi (AWB):</td>
          <td style="text-align: right; padding: 5px 0;">
            <span style="font-family: monospace; font-size: 13px; font-weight: 700; color: #0f172a; background: #ffffff; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
              ${params.awb || 'TERVERIFIKASI'}
            </span>
          </td>
        </tr>
        ${
          params.returnAwb
            ? `<tr>
                <td style="color: #64748b; padding: 5px 0;">Resi Retur Balik:</td>
                <td style="text-align: right; padding: 5px 0;">
                  <span style="font-family: monospace; font-size: 13px; font-weight: 700; color: #0f172a; background: #ffffff; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
                    ${params.returnAwb} (${params.returnCourier || 'Kurir'})
                  </span>
                </td>
              </tr>`
            : ''
        }
        <tr>
          <td style="color: #64748b; padding: 5px 0;">Proteksi Pengiriman:</td>
          <td style="color: #16a34a; font-weight: 600; text-align: right; padding: 5px 0;">
            Asuransi Wajib 100% Aktif
          </td>
        </tr>
      </table>
      ${
        params.trackingUrl
          ? `<div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: right;">
              <a href="${params.trackingUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-size: 12px; font-weight: 600;">
                Lacak Perjalanan Paket &rarr;
              </a>
            </div>`
          : ''
      }
    </div>
  `
}

function renderTotalsCard(params: {
  subtotal?: number
  shippingCost?: number
  insuranceFee?: number
  discountAmount?: number
  total?: number
}): string {
  if (params.total === undefined) return ''

  return `
    <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 6px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        ${
          params.subtotal
            ? `<tr>
                <td style="padding: 4px 0; color: #64748b;">Subtotal Produk:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500; color: #0f172a;">${formatRupiah(params.subtotal)}</td>
              </tr>`
            : ''
        }
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Ongkos Kirim & Biaya Asuransi:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 500; color: #0f172a;">
            ${formatRupiah((params.shippingCost || 0) + (params.insuranceFee || 0))}
          </td>
        </tr>
        ${
          params.discountAmount
            ? `<tr>
                <td style="padding: 4px 0; color: #16a34a;">Potongan Diskon:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500; color: #16a34a;">-${formatRupiah(params.discountAmount)}</td>
              </tr>`
            : ''
        }
        <tr style="border-top: 1px solid #cbd5e1;">
          <td style="padding: 10px 0 0 0; font-weight: 700; font-size: 14px; color: #0f172a;">Total Transaksi:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-weight: 800; font-size: 15px; color: #0f172a;">${formatRupiah(params.total)}</td>
        </tr>
      </table>
    </div>
  `
}

export function orderCompletedEmailTemplate(params: {
  customerName: string
  orderNumber: string
  storeName?: string
  courierName?: string
  courierService?: string
  awbNumber?: string
  trackingUrl?: string
  totalAmount?: number
  subtotal?: number
  shippingCost?: number
  insuranceFee?: number
  discountAmount?: number
  items?: Array<{
    name: string
    variant?: string
    quantity: number
    price: number
  }>
  warrantyExpiryDate?: string
  viewOrderUrl: string
}): string {
  const content = `
    <div style="margin-bottom: 20px;">
      <div style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 3px 10px; border-radius: 6px; margin-bottom: 10px;">
        TRANSAKSI SELESAI & GARANSI AKTIF
      </div>
      <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.3px;">
        Pesanan Resmi Selesai
      </h1>
      <p style="font-size: 13px; color: #64748b; margin: 0;">
        Nomor Pesanan: <strong style="color: #0f172a; font-family: monospace;">#${params.orderNumber}</strong>
      </p>
    </div>

    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Halo <strong>${params.customerName}</strong>, transaksi Anda di Affiliate Gadget telah selesai dan unit telah diverifikasi diterima dengan baik.
    </p>

    ${renderAwbCard({
      awb: params.awbNumber,
      courier: params.courierName,
      courierService: params.courierService,
      trackingUrl: params.trackingUrl,
    })}

    <div style="border-left: 3px solid #16a34a; background: #fafafa; border-radius: 0 6px 6px 0; padding: 12px 16px; margin: 18px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #15803d; margin-bottom: 4px;">
        Garansi 30 Hari Ganti Unit Baru Aktif
      </div>
      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
        ${params.warrantyExpiryDate ? `Masa klaim garansi berlaku sampai dengan <strong>${params.warrantyExpiryDate}</strong>.` : 'Masa garansi berlaku selama 30 hari kalender sejak penerimaan paket.'}
        ${params.storeName ? ` Penjamin: <strong>${params.storeName}</strong>.` : ''}
      </p>
    </div>

    ${renderItemsTable(params.items)}
    ${renderTotalsCard({
      subtotal: params.subtotal,
      shippingCost: params.shippingCost,
      insuranceFee: params.insuranceFee,
      discountAmount: params.discountAmount,
      total: params.totalAmount,
    })}

    <div style="margin: 24px 0 6px 0; text-align: left;">
      <a href="${params.viewOrderUrl}" class="btn">
        Lihat Invoice & Detail Pesanan &rarr;
      </a>
    </div>
  `
  return baseEmailLayout(
    `Tanda Bukti Transaksi Selesai & Garansi Aktif — #${params.orderNumber}`,
    content
  )
}

export function orderRefundedEmailTemplate(params: {
  customerName: string
  orderNumber: string
  storeName?: string
  courierName?: string
  awbNumber?: string
  returnCourier?: string
  returnTrackingNumber?: string
  trackingUrl?: string
  refundAmount?: number
  refundReason?: string
  refundBank?: string
  refundAccount?: string
  refundAccountName?: string
  items?: Array<{
    name: string
    variant?: string
    quantity: number
    price: number
  }>
  viewOrderUrl: string
}): string {
  const content = `
    <div style="margin-bottom: 20px;">
      <div style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 10px; border-radius: 6px; margin-bottom: 10px;">
        PENGEMBALIAN DANA (REFUND) SELESAI
      </div>
      <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.3px;">
        Bukti Pengembalian Dana (Refund)
      </h1>
      <p style="font-size: 13px; color: #64748b; margin: 0;">
        Nomor Pesanan: <strong style="color: #0f172a; font-family: monospace;">#${params.orderNumber}</strong>
      </p>
    </div>

    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Halo <strong>${params.customerName}</strong>, permohonan pengembalian dana untuk pesanan Anda telah disetujui dan berhasil ditransfer.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px;">
        Rincian Pengembalian Dana
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Nominal Refund:</td>
          <td style="color: #0f172a; font-weight: 700; font-size: 15px; text-align: right; padding: 4px 0;">
            ${formatRupiah(params.refundAmount)}
          </td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Alasan:</td>
          <td style="color: #0f172a; text-align: right; font-weight: 500; padding: 4px 0;">
            ${params.refundReason || 'Klaim Retur & Garansi 30 Hari'}
          </td>
        </tr>
        ${
          params.refundBank
            ? `<tr>
                <td style="color: #64748b; padding: 4px 0;">Rekening Tujuan:</td>
                <td style="color: #0f172a; text-align: right; font-weight: 500; padding: 4px 0;">
                  ${params.refundBank} ${params.refundAccount || ''} a/n ${params.refundAccountName || params.customerName}
                </td>
              </tr>`
            : ''
        }
        ${
          params.storeName
            ? `<tr>
                <td style="color: #64748b; padding: 4px 0;">Toko Pemroses:</td>
                <td style="color: #0f172a; text-align: right; padding: 4px 0;">${params.storeName}</td>
              </tr>`
            : ''
        }
      </table>
    </div>

    ${renderAwbCard({
      awb: params.awbNumber,
      courier: params.courierName,
      returnAwb: params.returnTrackingNumber,
      returnCourier: params.returnCourier,
      trackingUrl: params.trackingUrl,
    })}

    ${renderItemsTable(params.items)}

    <div style="margin: 24px 0 6px 0; text-align: left;">
      <a href="${params.viewOrderUrl}" class="btn">
        Lihat Riwayat Pesanan &rarr;
      </a>
    </div>
  `
  return baseEmailLayout(
    `Bukti Pengembalian Dana (Refund) — #${params.orderNumber}`,
    content
  )
}

export function orderComplainedEmailTemplate(params: {
  customerName: string
  orderNumber: string
  storeName?: string
  courierName?: string
  awbNumber?: string
  trackingUrl?: string
  complaintSubject?: string
  complaintDescription?: string
  complaintStatus?: string
  items?: Array<{
    name: string
    variant?: string
    quantity: number
    price: number
  }>
  viewOrderUrl: string
}): string {
  const content = `
    <div style="margin-bottom: 20px;">
      <div style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 6px; margin-bottom: 10px;">
        TIKET KOMPLAIN & KLAIM GARANSI DIPROSES
      </div>
      <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.3px;">
        Laporan Komplain Diterima
      </h1>
      <p style="font-size: 13px; color: #64748b; margin: 0;">
        Nomor Pesanan: <strong style="color: #0f172a; font-family: monospace;">#${params.orderNumber}</strong>
      </p>
    </div>

    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Halo <strong>${params.customerName}</strong>, kami telah menerima laporan komplain Anda. Tim teknisi dan layanan pelanggan cabang toko sedang menindaklanjuti kendala unit Anda.
    </p>

    <div style="border-left: 3px solid #f59e0b; background: #fafafa; border-radius: 0 6px 6px 0; padding: 14px 16px; margin: 18px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309; margin-bottom: 4px;">
        Detail Kendala yang Dilaporkan
      </div>
      <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">
        ${params.complaintSubject || 'Kendala Produk'}
      </div>
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569; line-height: 1.5;">
        "${params.complaintDescription || 'Menunggu verifikasi teknisi'}"
      </p>
      <div style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;">
        SLA Respon: Maksimal 1x24 jam kerja &bull; Terproteksi garansi 30 hari ganti unit baru.
      </div>
    </div>

    ${renderAwbCard({
      awb: params.awbNumber,
      courier: params.courierName,
      trackingUrl: params.trackingUrl,
    })}

    ${renderItemsTable(params.items)}

    <div style="margin: 24px 0 6px 0; text-align: left;">
      <a href="${params.viewOrderUrl}" class="btn">
        Pantau Tiket Komplain di Dashboard &rarr;
      </a>
    </div>
  `
  return baseEmailLayout(
    `Tiket Komplain & Klaim Garansi Diterima — #${params.orderNumber}`,
    content
  )
}

export function orderCancelledEmailTemplate(params: {
  customerName: string
  orderNumber: string
  storeName?: string
  courierName?: string
  awbNumber?: string
  cancellationReason?: string
  totalAmount?: number
  viewOrderUrl?: string
}): string {
  const content = `
    <div style="margin-bottom: 20px;">
      <div style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; padding: 3px 10px; border-radius: 6px; margin-bottom: 10px;">
        PESANAN DIBATALKAN
      </div>
      <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.3px;">
        Pemberitahuan Pembatalan Pesanan
      </h1>
      <p style="font-size: 13px; color: #64748b; margin: 0;">
        Nomor Pesanan: <strong style="color: #0f172a; font-family: monospace;">#${params.orderNumber}</strong>
      </p>
    </div>

    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Halo <strong>${params.customerName}</strong>, pesanan Anda dengan nomor <strong>#${params.orderNumber}</strong> telah dibatalkan di sistem.
    </p>

    <div style="border-left: 3px solid #e11d48; background: #fafafa; border-radius: 0 6px 6px 0; padding: 14px 16px; margin: 18px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9f1239; margin-bottom: 4px;">
        Alasan Pembatalan
      </div>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a; font-weight: 500;">
        "${params.cancellationReason || 'Dibatalkan oleh pembeli atau batas waktu pembayaran habis'}"
      </p>
      <div style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;">
        Informasi Pembayaran: Dana Anda aman dan tidak tertahan. Jika sempat terpotong, pengembalian otomatis diproses oleh sistem.
      </div>
    </div>

    ${
      params.awbNumber
        ? renderAwbCard({
            awb: params.awbNumber,
            courier: params.courierName,
          })
        : ''
    }

    <div style="margin: 24px 0 6px 0; text-align: left;">
      <a href="${params.viewOrderUrl || '/gadget'}" class="btn">
        Jelajahi Gadget Pilihan Lainnya &rarr;
      </a>
    </div>
  `
  return baseEmailLayout(
    `Pemberitahuan Pembatalan Pesanan — #${params.orderNumber}`,
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

export function withdrawalConfirmationEmailTemplate(params: {
  storeName: string
  companyName: string
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
  refNumber: string
  date: string
}): string {
  const content = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Konfirmasi Penarikan Saldo Berhasil</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Permintaan pencairan dana toko <strong>${params.storeName} (${params.companyName})</strong> telah berhasil diverifikasi dan diproses oleh sistem.
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Nomor Referensi</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right;">${params.refNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Jumlah Pencairan</td>
          <td style="font-weight: 700; color: #16a34a; text-align: right; font-size: 16px;">Rp ${params.amount.toLocaleString('id-ID')}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Bank Tujuan</td>
          <td style="font-weight: 600; color: #0f172a; text-align: right;">${params.bankName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Nomor Rekening</td>
          <td style="font-weight: 600; color: #0f172a; text-align: right;">${params.accountNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Nama Pemilik Rekening</td>
          <td style="font-weight: 600; color: #0f172a; text-align: right;">${params.accountName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Waktu Transaksi</td>
          <td style="color: #475569; text-align: right;">${params.date}</td>
        </tr>
      </table>
    </div>
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 16px;">
      Dana akan diteruskan ke rekening resmi PT Anda sesuai jadwal kliring bank. Simpan nomor referensi ini sebagai bukti pencairan resmi.
    </p>
  `
  return baseEmailLayout(
    `Bukti Penarikan Saldo — Ref #${params.refNumber}`,
    content
  )
}

export function withdrawalSecurityAlertEmailTemplate(params: {
  storeName: string
  userName: string
  reason: string
  attempts?: number
  time: string
}): string {
  const content = `
    <h2 style="font-size: 20px; color: #dc2626; margin-top: 0;">⚠️ Peringatan Keamanan: Percobaan Penarikan Mencurigakan</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Terdeteksi aktivitas mencurigakan pada permintaan penarikan saldo toko <strong>${params.storeName}</strong>:
    </p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; color: #991b1b; font-size: 14px; font-weight: 600;">Detail Peringatan:</p>
      <p style="margin: 0 0 8px 0; color: #7f1d1d; font-size: 14px;">${params.reason}</p>
      ${params.attempts ? `<p style="margin: 0 0 8px 0; color: #7f1d1d; font-size: 14px;">Jumlah percobaan salah berturut-turut: <strong>${params.attempts} kali</strong></p>` : ''}
      <p style="margin: 0; color: #7f1d1d; font-size: 13px;">Waktu: ${params.time}</p>
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Permintaan penarikan telah diblokir secara otomatis oleh sistem keamanan internal platform. Jika Anda tidak mengenali aktivitas ini, segera periksa kredensial akses toko Anda.
    </p>
  `
  return baseEmailLayout(
    `Peringatan Keamanan Penarikan Saldo — ${params.storeName}`,
    content
  )
}
