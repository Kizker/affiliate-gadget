import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can export
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'ALL'
    const mitraStatus = searchParams.get('mitraStatus') || 'ALL'

    // Build where clause
    const where: Record<string, unknown> = {}

    if (role !== 'ALL') {
      where.role = role
    }

    if (mitraStatus !== 'ALL' && role === 'MITRA') {
      where.mitraStatus = mitraStatus
    }

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        mitraStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Convert to CSV
    const headers = [
      'Name',
      'Email',
      'Role',
      'Phone',
      'Status',
      'Mitra Status',
      'Created At',
    ]
    const rows = users.map((user) => [
      user.name || '',
      user.email,
      user.role,
      user.phone || '',
      user.isActive ? 'Active' : 'Inactive',
      user.mitraStatus || 'N/A',
      new Date(user.createdAt).toLocaleDateString('id-ID'),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
