import { NextResponse } from 'next/server'
import { getGadgetDetail } from '@/lib/gadget-data'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await getGadgetDetail(id)

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Produk gadget tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching gadget detail:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat detail gadget' },
      { status: 500 }
    )
  }
}
