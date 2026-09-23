import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { isAdminStaffRole } from '@/lib/dashboard-utils'
import {
  createStoreWithdrawal,
  getTotalWithdrawn,
} from '@/lib/store-withdrawal-store'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, storeId: requestStoreId } = body

    const numericAmount = Number(amount)
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 100000) {
      return NextResponse.json(
        { error: 'Nominal penarikan minimal Rp 100.000' },
        { status: 400 }
      )
    }

    const isStoreAdmin = session.user.role === 'STORE_ADMIN'
    let storeId = isStoreAdmin
      ? (session.user as { storeId?: string }).storeId
      : requestStoreId || undefined

    if (!storeId) {
      // Fallback untuk Superadmin jika tidak kirim storeId
      const firstStore = await prisma.store.findFirst({
        where: { isActive: true },
      })
      storeId = firstStore?.id
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'Toko cabang tidak ditemukan' },
        { status: 404 }
      )
    }

    // Ambil info toko dan rekening bank
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        bankAccounts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Data toko tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hitung saldo siap cair saat ini
    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { storeId: store.id },
          { items: { some: { product: { storeId: store.id } } } },
        ],
      },
      select: {
        subtotal: true,
        discountAmount: true,
        commissionAmount: true,
      },
    })

    const completedNetRevenue = completedOrders.reduce((sum, ord) => {
      const net = Math.max(
        0,
        (ord.subtotal || 0) -
          (ord.discountAmount || 0) -
          (ord.commissionAmount || 0)
      )
      return sum + net
    }, 0)

    const totalWithdrawn = getTotalWithdrawn(store.id)
    const availableBalance = Math.max(0, completedNetRevenue - totalWithdrawn)

    if (numericAmount > availableBalance) {
      return NextResponse.json(
        {
          error: `Saldo siap cair tidak mencukupi (Tersedia: Rp ${availableBalance.toLocaleString('id-ID')})`,
        },
        { status: 400 }
      )
    }

    const primaryBank = store.bankAccounts.find((b) => b.isPrimary) ||
      store.bankAccounts[0] || {
        bankName: 'Bank Mandiri',
        accountNumber: '1180019283741',
        accountName: store.companyName,
      }

    // Buat record withdrawal
    const withdrawal = createStoreWithdrawal({
      storeId: store.id,
      storeName: store.name,
      companyName: store.companyName,
      bankName: primaryBank.bankName,
      accountNumber: primaryBank.accountNumber,
      accountName: primaryBank.accountName,
      amount: numericAmount,
      status: 'SUCCESS',
      requestedBy: session.user.name || session.user.email || 'Admin Toko',
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'STORE_BALANCE_WITHDRAWAL',
        entityType: 'StoreWithdrawal',
        entityId: withdrawal.id,
        details: {
          storeId: store.id,
          amount: numericAmount,
          bankName: primaryBank.bankName,
          accountNumber: primaryBank.accountNumber,
          refNumber: withdrawal.refNumber,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: withdrawal,
      message: `Pencairan dana sebesar Rp ${numericAmount.toLocaleString('id-ID')} berhasil diproses ke ${primaryBank.bankName} ${primaryBank.accountNumber}.`,
    })
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json(
      { error: 'Internal server error while processing withdrawal' },
      { status: 500 }
    )
  }
}
