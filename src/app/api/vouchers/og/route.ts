import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim().toUpperCase()

    let voucher: any = null
    if (code) {
      voucher = await (prisma.voucher as any).findUnique({
        where: { code },
        include: {
          store: {
            select: {
              name: true,
              city: true,
            },
          },
        },
      })
    }

    const isFixed = voucher?.discountType === 'FIXED_AMOUNT'
    const discountText = voucher
      ? isFixed
        ? `POTONGAN RP ${(voucher.discountAmount || 0).toLocaleString('id-ID')}`
        : `DISKON ${voucher.discountPercent}% OFF`
      : 'VOUCHER DISKON SPESIAL'

    const maxDiscountText =
      !isFixed && voucher?.maxDiscountAmount
        ? `Maksimal Potongan Rp ${voucher.maxDiscountAmount.toLocaleString('id-ID')}`
        : 'Berlaku untuk Produk Gadget Pilihan'

    const voucherCode = voucher ? voucher.code : code || 'PROMO'
    const rawStoreName =
      voucher?.store?.name || 'Affiliate Gadget Official Store'
    const storeName = rawStoreName.replace(
      /^Affiliate Gadget\s*[-–—]\s*/i,
      'Affiliate Gadget - '
    )
    const cityName = voucher?.store?.city ? ` • ${voucher.store.city}` : ''

    const minPurchaseText =
      voucher?.minimumPurchase && voucher.minimumPurchase > 0
        ? `Min. Belanja Rp ${voucher.minimumPurchase.toLocaleString('id-ID')}`
        : 'Tanpa Minimum Belanja'

    const validUntilText = voucher?.validUntil
      ? `Berlaku s/d ${new Date(voucher.validUntil).toLocaleDateString(
          'id-ID',
          {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }
        )}`
      : 'Promo Terbatas'

    // Escape text for SVG
    const escapeXml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

    const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16"/>
          <stop offset="60%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <linearGradient id="ticketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f97316"/>
          <stop offset="50%" stop-color="#ea580c"/>
          <stop offset="100%" stop-color="#c2410c"/>
        </linearGradient>
        <radialGradient id="glow" cx="80%" cy="20%" r="60%">
          <stop offset="0%" stop-color="#fb923c" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect width="1200" height="630" fill="url(#glow)"/>

      <!-- Ambient Decorative Circles -->
      <circle cx="1050" cy="120" r="180" fill="#f97316" opacity="0.08"/>
      <circle cx="150" cy="520" r="140" fill="#f97316" opacity="0.05"/>

      <!-- Outer Ticket Container Card -->
      <g transform="translate(100, 75)">
        <rect width="1000" height="480" rx="32" fill="url(#ticketGrad)" stroke="#fdba74" stroke-width="2"/>

        <!-- Left Ticket Notch Cutout -->
        <circle cx="0" cy="240" r="32" fill="#090d16"/>
        <!-- Right Ticket Notch Cutout -->
        <circle cx="1000" cy="240" r="32" fill="#090d16"/>

        <!-- Dashed Divider Line -->
        <line x1="720" y1="40" x2="720" y2="440" stroke="#fed7aa" stroke-width="3" stroke-dasharray="10 10" opacity="0.6"/>

        <!-- Ticket Left Section (Main Info) -->
        <!-- Store Badge Pill -->
        <rect x="50" y="45" width="460" height="42" rx="21" fill="#ffffff" fill-opacity="0.18"/>
        <text x="75" y="73" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="18" fill="#ffffff" letter-spacing="1">
          🏢 ${escapeXml(storeName)}${escapeXml(cityName)}
        </text>

        <!-- Official Tag -->
        <rect x="525" y="45" width="150" height="42" rx="21" fill="#ffffff" fill-opacity="0.25"/>
        <text x="548" y="72" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="16" fill="#ffffff">
          ✓ RESMI PT
        </text>

        <!-- Main Discount Headline -->
        <text x="50" y="185" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="62" fill="#ffffff" letter-spacing="-1">
          ${escapeXml(discountText)}
        </text>

        <!-- Max Discount Subtext -->
        <text x="52" y="230" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="22" fill="#ffedd5">
          ${escapeXml(maxDiscountText)}
        </text>

        <!-- Promo Code Capsule -->
        <rect x="50" y="270" width="620" height="88" rx="20" fill="#ffffff" stroke="#fed7aa" stroke-width="3"/>
        <text x="80" y="305" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="#9a3412" letter-spacing="2">
          KODE VOUCHER KLAIM
        </text>
        <text x="80" y="342" font-family="monospace, Courier, sans-serif" font-weight="900" font-size="34" fill="#ea580c" letter-spacing="4">
          ${escapeXml(voucherCode)}
        </text>

        <!-- Ticket Terms & Validity -->
        <g transform="translate(50, 400)">
          <!-- Min Purchase Pill -->
          <rect x="0" y="0" width="300" height="40" rx="12" fill="#000000" fill-opacity="0.25"/>
          <text x="20" y="26" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="17" fill="#ffffff">
            🛍️ ${escapeXml(minPurchaseText)}
          </text>

          <!-- Validity Pill -->
          <rect x="320" y="0" width="300" height="40" rx="12" fill="#000000" fill-opacity="0.25"/>
          <text x="340" y="26" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="17" fill="#ffffff">
            ⏰ ${escapeXml(validUntilText)}
          </text>
        </g>

        <!-- Ticket Right Section (Perforated Stub / Action Callout) -->
        <g transform="translate(740, 60)">
          <!-- Guarantee Shield -->
          <rect x="25" y="30" width="200" height="48" rx="14" fill="#ffffff" fill-opacity="0.2"/>
          <text x="45" y="61" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="18" fill="#ffffff">
            🛡️ GARANSI
          </text>

          <text x="25" y="130" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="start">
            30 HARI
          </text>
          <text x="25" y="165" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#fed7aa">
            Ganti Unit Baru
          </text>

          <rect x="20" y="220" width="210" height="110" rx="20" fill="#ffffff"/>
          <text x="125" y="265" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#ea580c" text-anchor="middle">
            KLAIM
          </text>
          <text x="125" y="295" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#ea580c" text-anchor="middle">
            SEKARANG
          </text>

          <text x="125" y="375" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="#ffedd5" text-anchor="middle">
            100% Unit Original
          </text>
        </g>
      </g>

      <!-- Bottom Platform Tagline -->
      <text x="600" y="605" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="18" fill="#94a3b8" text-anchor="middle">
        Affiliate Gadget • Platform Marketplace Gadget Multi-PT Indonesia Terpercaya
      </text>
    </svg>
    `

    const pngBuffer = await sharp(Buffer.from(svg.trim())).png().toBuffer()

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating voucher OG image:', error)
    return new NextResponse('Error generating image', { status: 500 })
  }
}
