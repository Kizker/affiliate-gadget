import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { isAdminStaffRole } from '@/lib/dashboard-utils'
import {
  getTaxConfigData,
  saveTaxConfigData,
  calculateActiveTaxesForOrder,
  TaxTypeId,
} from '@/lib/tax/tax-config-store'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, storeId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isStoreAdmin =
      user.role === 'STORE_ADMIN' || user.role === 'STORE_SALES'
    const url = new URL(req.url)
    const qStoreId = url.searchParams.get('storeId')

    const targetStoreId = isStoreAdmin
      ? user.storeId
      : qStoreId && qStoreId !== 'ALL'
        ? qStoreId
        : undefined

    const configData = getTaxConfigData()

    // Fetch all valid orders (PAID, IN_PROGRESS, SHIPPED, COMPLETED) to compute tax pool & ledger
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'IN_PROGRESS', 'SHIPPED', 'COMPLETED'] },
        ...(targetStoreId
          ? {
              OR: [
                { storeId: targetStoreId },
                { items: { some: { product: { storeId: targetStoreId } } } },
              ],
            }
          : {}),
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            taxId: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    })

    let totalCollectedSettled = 0 // dari pesanan COMPLETED (sudah dipotong dari saldo siap cair toko)
    let totalInEscrowTax = 0 // dari pesanan PAID / IN_PROGRESS / SHIPPED
    const breakdownByTaxId: Record<
      string,
      { settledAmount: number; escrowAmount: number; txCount: number }
    > = {}

    configData.taxes.forEach((t) => {
      breakdownByTaxId[t.id] = {
        settledAmount: 0,
        escrowAmount: 0,
        txCount: 0,
      }
    })

    const taxLedger: Array<{
      id: string
      orderId: string
      orderNumber: string
      storeName: string
      companyName: string
      npwp: string
      customerName: string
      orderStatus: string
      subtotalAfterDiscount: number
      totalTaxDeducted: number
      taxItems: Array<{
        id: string
        shortName: string
        amount: number
        ebillingKapKjs: string
      }>
      date: string
    }> = []

    for (const order of orders) {
      const subtotalAfterDiscount = Math.max(
        0,
        (order.subtotal || 0) - (order.discountAmount || 0)
      )
      const commission =
        order.commissionAmount || Math.round(subtotalAfterDiscount * 0.02)

      const calc = calculateActiveTaxesForOrder({
        subtotalAfterDiscount,
        platformCommissionAmount: commission,
        activeTaxes: configData.taxes,
      })

      if (calc.totalTaxAmount > 0) {
        const isSettled = order.status === 'COMPLETED'
        if (isSettled) {
          totalCollectedSettled += calc.totalTaxAmount
        } else {
          totalInEscrowTax += calc.totalTaxAmount
        }

        calc.items.forEach((item) => {
          if (!breakdownByTaxId[item.id]) {
            breakdownByTaxId[item.id] = {
              settledAmount: 0,
              escrowAmount: 0,
              txCount: 0,
            }
          }
          if (isSettled) {
            breakdownByTaxId[item.id].settledAmount += item.amount
          } else {
            breakdownByTaxId[item.id].escrowAmount += item.amount
          }
          breakdownByTaxId[item.id].txCount += 1
        })

        taxLedger.push({
          id: `tax-${order.id}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          storeName: order.store?.name || 'Toko Cabang',
          companyName: order.store?.companyName || 'PT Mitra Toko',
          npwp: order.store?.taxId || 'Terdaftar KPP Pratama',
          customerName: order.user?.name || 'Pembeli',
          orderStatus: order.status,
          subtotalAfterDiscount,
          totalTaxDeducted: calc.totalTaxAmount,
          taxItems: calc.items.map((i) => ({
            id: i.id,
            shortName: i.shortName,
            amount: i.amount,
            ebillingKapKjs: i.ebillingKapKjs,
          })),
          date: (order.completedAt || order.createdAt).toISOString(),
        })
      }
    }

    const totalRemittedToDjp = configData.remittances.reduce(
      (acc, r) => acc + (Number(r.amount) || 0),
      0
    )
    const remainingTaxPoolToRemit = Math.max(
      0,
      totalCollectedSettled - totalRemittedToDjp
    )

    return NextResponse.json({
      success: true,
      canManageConfig: user.role === 'SUPER_ADMIN',
      role: user.role,
      taxes: configData.taxes.map((t) => ({
        ...t,
        stats: breakdownByTaxId[t.id] || {
          settledAmount: 0,
          escrowAmount: 0,
          txCount: 0,
        },
      })),
      summary: {
        activeTaxCount: configData.taxes.filter((t) => t.isEnabled).length,
        totalCollectedSettled,
        totalInEscrowTax,
        totalRemittedToDjp,
        remainingTaxPoolToRemit,
      },
      taxLedger,
      remittances: configData.remittances,
      updatedAt: configData.updatedAt,
    })
  } catch (error) {
    console.error('[Tax API GET Error]:', error)
    return NextResponse.json(
      { error: 'Gagal memuat konfigurasi & kas pajak' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Superadmin yang dapat mengubah konfigurasi pajak UU' },
        { status: 403 }
      )
    }

    const body = await req.json()

    // 1. Toggle atau update tarif pajak
    if (Array.isArray(body.taxes)) {
      const updated = saveTaxConfigData({
        taxes: body.taxes.map((t: any) => ({
          id: t.id as TaxTypeId,
          isEnabled: Boolean(t.isEnabled),
          rate: typeof t.rate === 'number' ? t.rate : undefined,
        })),
      })
      return NextResponse.json({
        success: true,
        message: 'Konfigurasi pajak berhasil diperbarui',
        taxes: updated.taxes,
      })
    }

    // 2. Catat penyetoran pajak ke Kas Negara (e-Billing DJP / NTPN)
    if (body.action === 'RECORD_REMITTANCE') {
      const { periodLabel, ntpnNumber, billingCode, amount, taxTypes, notes } =
        body
      if (!ntpnNumber || !amount || Number(amount) <= 0) {
        return NextResponse.json(
          { error: 'Nomor NTPN dan nominal setoran pajak wajib diisi' },
          { status: 400 }
        )
      }

      const updated = saveTaxConfigData({
        newRemittance: {
          periodLabel: periodLabel || 'Masa Pajak Berjalan',
          ntpnNumber: String(ntpnNumber).trim().toUpperCase(),
          billingCode: String(billingCode || '-').trim(),
          amount: Math.round(Number(amount)),
          taxTypes: Array.isArray(taxTypes) ? taxTypes : ['PPh 22 (0.5%)'],
          remittedBy: session.user.name || 'Super Admin',
          notes: notes || 'Disetorkan ke Kas Negara via e-Billing DJP',
        },
      })

      return NextResponse.json({
        success: true,
        message:
          'Bukti setoran pajak Negara (NTPN) berhasil dicatat ke buku kas pajak',
        remittances: updated.remittances,
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('[Tax API PATCH Error]:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui konfigurasi pajak' },
      { status: 500 }
    )
  }
}
