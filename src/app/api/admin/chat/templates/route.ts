import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { isAdminStaffRole } from '@/lib/dashboard-utils'

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-1',
    content: 'Ready ya ka, order masuk langsung diproses ya ka..',
    sortOrder: 1,
  },
  {
    id: 'tpl-2',
    content:
      'All fungsi normal, nominus, siap pakai, garansi toko 30hari ganti unit baru ya ka..',
    sortOrder: 2,
  },
  {
    id: 'tpl-3',
    content:
      'Pakai voucher promo toko ka pas klik beli ada pilihan gunakan voucher ya..',
    sortOrder: 3,
  },
  {
    id: 'tpl-4',
    content:
      'Barang kami original resmi teruji teknisi, sinyal & IMEI aman selamanya..',
    sortOrder: 4,
  },
  {
    id: 'tpl-5',
    content:
      'Ditunggu ordernya ya ka.. Sehat selalu dan murah rezeki. aminn 😊',
    sortOrder: 5,
  },
  {
    id: 'tpl-6',
    content: 'Mau tipe apa dan varian memory storage berapa ka ya?',
    sortOrder: 6,
  },
  {
    id: 'tpl-7',
    content:
      'Pas klik beli ada pilihan tipe varian dan storage ya ka. Silakan dicoba.',
    sortOrder: 7,
  },
  {
    id: 'tpl-8',
    content: 'Pas klik beli sudah tertera rincian harga per variannya ya ka.',
    sortOrder: 8,
  },
  {
    id: 'tpl-9',
    content: 'Rencana mau checkout pembelian kapan ya ka?',
    sortOrder: 9,
  },
  {
    id: 'tpl-10',
    content:
      'Unit retur sudah kami terima di cabang dan saat ini sedang dalam proses pemeriksaan teknis (QC).',
    sortOrder: 10,
  },
  {
    id: 'tpl-11',
    content:
      'Pengajuan garansi Anda sedang ditindaklanjuti oleh tim After Sales, mohon ditunggu ya kak.',
    sortOrder: 11,
  },
]

// GET - List templates for active admin/staff/mitra/aftersales
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    let customTemplates: any[] = []

    try {
      customTemplates = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, content, "sortOrder", "userId" FROM "chat_templates" WHERE "userId" = $1 ORDER BY "sortOrder" ASC, "createdAt" ASC`,
        userId
      )
    } catch {
      customTemplates = []
    }

    const templates =
      customTemplates.length > 0 ? customTemplates : DEFAULT_TEMPLATES

    return NextResponse.json({ success: true, templates })
  } catch (error) {
    console.error('Error fetching chat templates:', error)
    return NextResponse.json({ success: true, templates: DEFAULT_TEMPLATES })
  }
}

// POST - Create custom template
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const content = (body.content || '').trim()

    if (!content) {
      return NextResponse.json(
        { error: 'Isi template tidak boleh kosong' },
        { status: 400 }
      )
    }

    const id = `tpl-${Date.now()}`
    const userId = session.user.id

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "chat_templates" ("id", "userId", "content", "sortOrder", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, 99, NOW(), NOW())`,
        id,
        userId,
        content
      )
    } catch (e) {
      console.warn('DB template insert fallback:', e)
    }

    return NextResponse.json({
      success: true,
      template: { id, content, userId, sortOrder: 99 },
    })
  } catch (error) {
    console.error('Error creating chat template:', error)
    return NextResponse.json(
      { error: 'Gagal membuat template' },
      { status: 500 }
    )
  }
}

// PUT - Update template
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, content } = body

    if (!id || !content?.trim()) {
      return NextResponse.json(
        { error: 'ID dan isi template wajib diisi' },
        { status: 400 }
      )
    }

    const trimmed = content.trim()

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "chat_templates" SET "content" = $1, "updatedAt" = NOW() WHERE "id" = $2 AND "userId" = $3`,
        trimmed,
        id,
        session.user.id
      )
    } catch (e) {
      console.warn('DB template update fallback:', e)
    }

    return NextResponse.json({
      success: true,
      template: { id, content: trimmed },
    })
  } catch (error) {
    console.error('Error updating chat template:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui template' },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID template required' },
        { status: 400 }
      )
    }

    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "chat_templates" WHERE "id" = $1 AND "userId" = $2`,
        id,
        session.user.id
      )
    } catch (e) {
      console.warn('DB template delete fallback:', e)
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error deleting chat template:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus template' },
      { status: 500 }
    )
  }
}
