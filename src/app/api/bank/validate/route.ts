import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyIndonesianBankAccount } from '@/lib/bank-validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bankName, accountNumber, accountName } = body

    const result = await verifyIndonesianBankAccount({
      bankName: String(bankName || 'Bank Mandiri'),
      accountNumber: String(accountNumber || ''),
      inputAccountName: accountName ? String(accountName) : undefined,
    })

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: result.message,
          result,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      valid: true,
      result,
    })
  } catch (error) {
    console.error('[POST /api/bank/validate Error]:', error)
    return NextResponse.json(
      { error: 'Gagal memvalidasi nomor rekening bank.' },
      { status: 500 }
    )
  }
}
