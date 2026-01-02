import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Save user address
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { address, city, province, postalCode } = body

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Update user address
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        address,
        city,
        province,
        postalCode,
      },
    })

    return NextResponse.json({
      message: 'Address saved successfully',
      address: {
        address: user.address,
        city: user.city,
        province: user.province,
        postalCode: user.postalCode,
      },
    })
  } catch (error) {
    console.error('Error saving address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
