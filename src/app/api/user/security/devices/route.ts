import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserDevices, removeUserDevice } from '@/lib/device-fingerprint'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const devices = await getUserDevices(session.user.id)
    return NextResponse.json({ success: true, devices })
  } catch (error) {
    console.error('[API GET DEVICES ERROR]:', error)
    return NextResponse.json(
      { error: 'Gagal memuat daftar perangkat aktif' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { deviceId } = body

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId wajib diisi' },
        { status: 400 }
      )
    }

    const removed = await removeUserDevice(deviceId, session.user.id)
    if (!removed) {
      return NextResponse.json(
        { error: 'Perangkat tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Perangkat berhasil dihapus dari daftar terpercaya',
    })
  } catch (error) {
    console.error('[API DELETE DEVICE ERROR]:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus perangkat' },
      { status: 500 }
    )
  }
}
