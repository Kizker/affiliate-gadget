import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoriesParam = searchParams.get('categories')

    // Parse categories from query string
    const categories = categoriesParam
      ? categoriesParam.split(',').filter(Boolean)
      : []

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (categories.length > 0) {
      where.category = {
        in: categories,
      }
    }

    // Fetch active bank accounts
    const bankAccounts = await prisma.bankAccount.findMany({
      where,
      orderBy: {
        category: 'asc',
      },
    })

    return NextResponse.json({ accounts: bankAccounts })
  } catch (error) {
    console.error('Error fetching bank accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
