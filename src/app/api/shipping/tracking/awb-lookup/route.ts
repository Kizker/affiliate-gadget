/**
 * Public AWB Lookup API
 * Melacak paket berdasarkan nomor resi tanpa login
 * Digunakan oleh halaman publik /resi
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  getTrackingByAWB,
  getDynamicTrackingTimeline,
} from '@/lib/shipping/biteship-client'
import { detectShippingException } from '@/lib/shipping/exception-detector'
import { validateAWB } from '@/lib/shipping/awb-validator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const awb = searchParams.get('awb')

    if (!awb) {
      return NextResponse.json(
        { success: false, error: 'Parameter awb wajib diisi' },
        { status: 400 }
      )
    }

    // Validate AWB format
    const validation = validateAWB(awb)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Format nomor resi tidak valid',
        },
        { status: 400 }
      )
    }

    // Look up in shipping store
    const record = getTrackingByAWB(awb)
    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: `Nomor resi ${awb} tidak ditemukan dalam sistem kami`,
        },
        { status: 404 }
      )
    }

    // Apply dynamic timeline
    const liveRecord = getDynamicTrackingTimeline(record)
    const exception = detectShippingException(liveRecord.checkpoints)

    return NextResponse.json({
      success: true,
      data: liveRecord,
      exception: exception.type !== 'NONE' ? exception : null,
    })
  } catch (error) {
    console.error('Error in AWB lookup:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
