import { NextRequest, NextResponse } from 'next/server'
import { verifyDealToken } from '@/lib/live-deals'

/**
 * GET /api/live-deals/verify?token=deal_xxx
 * Universal endpoint to verify if a live deal token is still valid, active, and unused.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { success: false, valid: false, reason: 'NOT_FOUND' },
      { status: 400 }
    )
  }

  const result = verifyDealToken(token)

  return NextResponse.json({
    success: true,
    valid: result.valid,
    reason: result.reason,
    deal: result.deal || null,
  })
}
