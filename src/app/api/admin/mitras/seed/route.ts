import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { seedMitras } from '../../../../../../prisma/seed-mitras'

export const dynamic = 'force-dynamic'

async function handleSeed(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    // Allow execution if secret token matches OR user is authenticated as ADMIN / SUPER_ADMIN
    const isSecretValid =
      token === 'AffiliateGadget2026' || token === 'AGSeed2026'

    if (!isSecretValid) {
      const session = await getServerSession()
      if (
        !session?.user ||
        (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
      ) {
        return NextResponse.json(
          {
            error:
              'Akses ditolak. Silakan login sebagai Admin atau sertakan token keamanan yang valid.',
          },
          { status: 401 }
        )
      }
    }

    const inserted = await seedMitras()

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan/memperbarui ${inserted.length} data mitra resmi di database!`,
      data: inserted,
    })
  } catch (error) {
    console.error('Error seeding mitras via API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return handleSeed(req)
}

export async function POST(req: NextRequest) {
  return handleSeed(req)
}
