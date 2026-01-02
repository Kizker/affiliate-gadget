import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can perform bulk actions
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userIds } = body

    if (
      !action ||
      !userIds ||
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Check if any SUPER_ADMIN in the list
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true },
    })

    const hasSuperAdmin = users.some((u) => u.role === 'SUPER_ADMIN')
    if (hasSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot perform bulk action on SUPER_ADMIN' },
        { status: 403 }
      )
    }

    let result

    switch (action) {
      case 'approve':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds }, role: 'MITRA' },
          data: { mitraStatus: 'APPROVED', isActive: true },
        })
        break

      case 'reject':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds }, role: 'MITRA' },
          data: { mitraStatus: 'REJECTED' },
        })
        break

      case 'activate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true },
        })
        break

      case 'deactivate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false },
        })
        break

      case 'delete':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false },
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      message: `Successfully performed ${action} on ${result.count} users`,
      count: result.count,
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
