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
        select: {
          code: true,
          discountType: true,
          discountPercent: true,
          discountAmount: true,
        },
      })
    }

    // Tentukan teks diskon: angka diskon + % (misal "8%")
    let mainText = 'PROMO'

    if (voucher) {
      if (voucher.discountPercent && voucher.discountPercent > 0) {
        mainText = `${voucher.discountPercent}%`
      } else if (
        voucher.discountType === 'FIXED_AMOUNT' &&
        voucher.discountAmount
      ) {
        const amount = voucher.discountAmount
        if (amount >= 1000000) {
          mainText = `${amount / 1000000}JT`
        } else if (amount >= 1000) {
          mainText = `${Math.round(amount / 1000)}RB`
        } else {
          mainText = `Rp${amount}`
        }
      } else {
        mainText = 'PROMO'
      }
    } else if (code) {
      // Fallback: jika ada angka dalam kode promo (misal DISKON50 -> 50%)
      const match = code.match(/(\d+)/)
      if (match && parseInt(match[1]) <= 100) {
        mainText = `${match[1]}%`
      }
    }

    // Ukuran font adaptif agar selalu pas di tengah kanvas 800x800
    let fontSize = 280
    if (mainText.length <= 2) {
      fontSize = 280 // e.g. "8%"
    } else if (mainText.length === 3) {
      fontSize = 250 // e.g. "10%", "99%"
    } else if (mainText.length === 4) {
      fontSize = 210 // e.g. "50RB", "100%"
    } else if (mainText.length === 5) {
      fontSize = 175 // e.g. "150RB"
    } else {
      fontSize = 140
    }

    const escapeXml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

    const svg = `
    <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff7a1a"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>
      </defs>
      <!-- Background Oranye Solid/Gradien Vibrant -->
      <rect width="800" height="800" fill="url(#orangeGrad)"/>
      <!-- Angka Diskon + % di tengah -->
      <text 
        x="400" 
        y="400" 
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
        font-weight="900" 
        font-size="${fontSize}" 
        fill="#ffffff" 
        text-anchor="middle" 
        dominant-baseline="central" 
        letter-spacing="-4"
      >${escapeXml(mainText)}</text>
    </svg>
    `

    // Render SVG menjadi PNG resolusi tinggi dengan Sharp
    const pngBuffer = await sharp(Buffer.from(svg.trim()))
      .png({ quality: 95, compressionLevel: 8 })
      .toBuffer()

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control':
          'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200',
      },
    })
  } catch (error) {
    console.error('Error generating voucher OG image:', error)
    return new NextResponse('Error generating image', { status: 500 })
  }
}
