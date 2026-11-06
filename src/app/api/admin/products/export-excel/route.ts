import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import ExcelJS from 'exceljs'
import {
  generateShopeeItemId,
  generateShopeeVariationId,
  generateSmartSku,
  extractModelCode,
} from '@/lib/shopee-codes'

// Helper: Extract clean model name for SKU Induk
function extractCleanModel(productName: string): string {
  if (!productName) return 'Gadget'
  return (
    productName
      .replace(/^sein\s*\|\s*/i, '')
      .replace(/^sein\s+/i, '')
      .replace(/^\[\s*tam\s*\]\s*/i, '')
      .replace(/^tam\s*\|\s*/i, '')
      .replace(/^bnob\s+/i, '')
      .replace(/^bnib\s+/i, '')
      .replace(/^resmi\s+sein\s+/i, '')
      .replace(/\s+second\s+original.*$/i, '')
      .replace(/\s+second\s+fullset.*$/i, '')
      .replace(/\s+second\s+resmi.*$/i, '')
      .replace(/\s+resmi\s+indonesia.*$/i, '')
      .replace(/\s+minus\s+.*$/i, '')
      .replace(/\s+ex\s+display.*$/i, '')
      .replace(/\s+[0-9]+(?:\/[0-9]+)?\s*(?:gb|tb)?.*$/i, '')
      .trim() || productName.slice(0, 30)
  )
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role

    // Authorization: SUPER_ADMIN or STORE_ADMIN
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'STORE_ADMIN') {
      return NextResponse.json(
        {
          error:
            'Akses ditolak: Fitur ekspor template & update massal hanya dapat diakses oleh Superadmin dan Admin Toko.',
        },
        { status: 403 }
      )
    }

    let targetStoreId: string | null = null

    if (userRole === 'STORE_ADMIN') {
      let storeId = session?.user?.storeId
      if (!storeId && session?.user?.id) {
        const u = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { storeId: true },
        })
        storeId = u?.storeId || null
      }
      if (!storeId) {
        return NextResponse.json(
          {
            error:
              'Akses gagal: Akun Admin Toko Anda belum terhubung ke toko cabang manapun.',
          },
          { status: 400 }
        )
      }
      targetStoreId = storeId
    } else {
      // SUPER_ADMIN: Wajib memilih salah satu toko
      const { searchParams } = new URL(request.url)
      const storeIdParam = searchParams.get('storeId')
      if (!storeIdParam || storeIdParam === 'ALL') {
        return NextResponse.json(
          {
            error:
              'Superadmin wajib memilih salah satu cabang toko untuk melakukan ekspor data katalog Excel.',
          },
          { status: 400 }
        )
      }
      targetStoreId = storeIdParam
    }

    // Verify store exists
    const targetStore = await prisma.store.findUnique({
      where: { id: targetStoreId },
      select: { id: true, name: true, city: true },
    })

    if (!targetStore) {
      return NextResponse.json(
        { error: 'Cabang toko yang dipilih tidak ditemukan di database.' },
        { status: 404 }
      )
    }

    // Fetch active products of this specific store with variants
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        storeId: targetStoreId,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        variants: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Shopee Mass Update / Affiliate Gadget'
    workbook.created = new Date()

    // ─────────────────────────────────────────────────────────────
    // SHEET 1: Sheet1 (Shopee Official Mass Update Template - 15 Columns with HPP)
    // ─────────────────────────────────────────────────────────────
    const worksheet = workbook.addWorksheet('Sheet1', {
      views: [{ state: 'frozen', ySplit: 6 }],
    })

    // 15 Columns including HPP
    worksheet.columns = [
      { key: 'kodeProduk', width: 20 }, // Col A (1)
      { key: 'namaProduk', width: 44 }, // Col B (2)
      { key: 'kodeVariasi', width: 20 }, // Col C (3)
      { key: 'namaVariasi', width: 32 }, // Col D (4)
      { key: 'skuInduk', width: 24 }, // Col E (5)
      { key: 'sku', width: 22 }, // Col F (6)
      { key: 'harga', width: 18 }, // Col G (7)
      { key: 'costPrice', width: 26 }, // Col H (8) - Khusus Affiliate Gadget HPP Modal
      { key: 'gtin', width: 16 }, // Col I (9)
      { key: 'stok', width: 12 }, // Col J (10)
      { key: 'minBeli', width: 24 }, // Col K (11)
      { key: 'maksBeli', width: 24 }, // Col L (12)
      { key: 'tglMulai', width: 26 }, // Col M (13)
      { key: 'jmlHari', width: 26 }, // Col N (14)
      { key: 'tglAkhir', width: 28 }, // Col O (15)
    ]

    // ─────────────────────────────────────────────────────────────
    // ROW 1: Technical Key Row (Shopee Spec)
    // ─────────────────────────────────────────────────────────────
    const row1 = worksheet.addRow([
      'item_id',
      'item_name',
      'model_id',
      'model_name',
      'parent_sku',
      'sku',
      'price',
      'cost_price',
      'gtin',
      'stock',
      'min_purchase_limit',
      'max_purchase_limit',
      'start_date',
      'days',
      'end_date',
    ])
    row1.height = 18
    row1.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      }
      cell.font = {
        name: 'Segoe UI',
        size: 8,
        color: { argb: 'FF94A3B8' },
        italic: true,
      }
    })

    // ─────────────────────────────────────────────────────────────
    // ROW 2: Data Type Metadata
    // ─────────────────────────────────────────────────────────────
    const row2 = worksheet.addRow([
      'int',
      'string',
      'int',
      'string',
      'string',
      'string',
      'float',
      'float',
      'string',
      'int',
      'int',
      'int',
      'date',
      'int',
      'date',
    ])
    row2.height = 18
    row2.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      }
      cell.font = { name: 'Segoe UI', size: 8, color: { argb: 'FF94A3B8' } }
    })

    // ─────────────────────────────────────────────────────────────
    // ROW 3: Column Labels (Shopee Orange Header)
    // ─────────────────────────────────────────────────────────────
    const row3 = worksheet.addRow([
      'Kode Produk',
      'Nama Produk',
      'Kode Variasi',
      'Nama Variasi',
      'SKU Induk',
      'SKU',
      'Harga',
      'HPP Modal (Affiliate Gadget)',
      'GTIN',
      'Stok',
      'Min. Jumlah Pembelian',
      'Maks. Jumlah Pembelian',
      'Maks. Jumlah Pembelian - Tanggal Mulai',
      'Maks. Jumlah Pembelian - Jumlah Hari',
      'Maks. Jumlah Pembelian - Tanggal Berakhir',
    ])
    row3.height = 32
    row3.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEE4D2D' },
      } // Shopee Orange
      cell.font = {
        name: 'Segoe UI',
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 9.5,
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFDC2626' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }
    })

    // ─────────────────────────────────────────────────────────────
    // ROW 4: Mandatory / Optional Indicator Row
    // ─────────────────────────────────────────────────────────────
    const row4 = worksheet.addRow([
      'Wajib',
      'Hanya Baca',
      'Wajib',
      'Hanya Baca',
      'Opsional',
      'Opsional',
      'Wajib',
      'Opsional',
      'Opsional',
      'Wajib',
      'Opsional',
      'Opsional',
      'Opsional',
      'Opsional',
      'Opsional',
    ])
    row4.height = 20
    row4.eachCell((cell) => {
      const isReq = cell.value === 'Wajib'
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isReq ? 'FFFFF1F0' : 'FFF8FAFC' },
      }
      cell.font = {
        name: 'Segoe UI',
        size: 8.5,
        bold: isReq,
        color: { argb: isReq ? 'FFE02424' : 'FF64748B' },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // ─────────────────────────────────────────────────────────────
    // ROW 5: Short Validation Rules
    // ─────────────────────────────────────────────────────────────
    const row5 = worksheet.addRow([
      'Angka unik 11 digit',
      'Maks 255 karakter',
      'Angka unik 12 digit',
      'Nama varian warna/RAM',
      'Kode model seragam',
      'Kode SKU bebas & unik',
      'Min Rp 99, rasio maks 7x',
      'Harga modal unit (HPP)',
      'Barcode EAN/UPC',
      'Angka bulat >= 0',
      'Minimal 1',
      'Maks 999.999',
      'Format YYYY-MM-DD',
      '1 - 365 hari',
      'Format YYYY-MM-DD',
    ])
    row5.height = 22
    row5.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      }
      cell.font = { name: 'Segoe UI', size: 8, color: { argb: 'FF475569' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // ─────────────────────────────────────────────────────────────
    // ROW 6: Detailed Instruction & Constraints Row
    // ─────────────────────────────────────────────────────────────
    const row6 = worksheet.addRow([
      'Jangan ubah Kode Produk untuk menjaga integritas sinkronisasi.',
      'Nama produk hanya referensi tampilan, ubah di panel jika perlu.',
      'Kosongkan bila produk tidak memiliki variasi.',
      'Nama variasi spesifik.',
      'SKU Induk mempermudah pengelompokan produk.',
      'Satu SKU dapat dipakai bersama oleh beberapa variasi.',
      'Harga jual produk. Batas harga termahal dibagi termurah maks 7x.',
      'Kolom HPP modal Affiliate Gadget. Harga jual sebaiknya tidak di bawah HPP.',
      'Nomor identifikasi produk global standar industri.',
      'Jumlah unit fisik yang tersedia di toko cabang.',
      'Batas minimum order pembelian per transaksi.',
      'Batas maksimum kuantitas yang dapat dipesan.',
      'Tanggal mulai pembatasan order.',
      'Durasi periode pembatasan.',
      'Tanggal akhir pembatasan pembelian.',
    ])
    row6.height = 42
    row6.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      }
      cell.font = { name: 'Segoe UI', size: 7.5, color: { argb: 'FF64748B' } }
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } } }
    })

    // ─────────────────────────────────────────────────────────────
    // POPULATE PRODUCT DATA ROWS (Row 3+)
    // ─────────────────────────────────────────────────────────────
    products.forEach((prod) => {
      const specs = (prod.specs as any) || {}
      // Ensure Kode Produk is an authentic Shopee ID (never a raw CUID)
      const shopeeId = specs.shopeeItemId || generateShopeeItemId(prod.id)
      const varMap = specs.shopeeVariationMap || {}
      const prodModel = prod.model || extractCleanModel(prod.name)

      if (prod.variants && prod.variants.length > 0) {
        prod.variants.forEach((v, index) => {
          // Ensure Kode Variasi is an authentic Shopee 12-digit ID
          const varCode =
            varMap[v.id] ||
            varMap[v.name] ||
            (/^[0-9]{11,13}$/.test(v.id)
              ? v.id
              : generateShopeeVariationId(v.id))

          // Ensure SKU is a clean, structured SKU conforming to template
          const variantSku =
            v.sku && !v.sku.startsWith('SKU-AUTO-') && !v.sku.startsWith('SKU-')
              ? v.sku
              : generateSmartSku(prod.name, v.name, prodModel)

          const row = worksheet.addRow({
            kodeProduk: shopeeId,
            namaProduk: prod.name,
            kodeVariasi: varCode,
            namaVariasi: v.name,
            skuInduk: prodModel,
            sku: variantSku,
            harga: Number(v.price) || 0,
            costPrice: v.costPrice ?? prod.costPrice ?? '',
            gtin: '',
            stok: Number(v.stock) || 0,
            minBeli: index === 0 ? 1 : '',
            maksBeli: '',
            tglMulai: '',
            jmlHari: '',
            tglAkhir: '',
          })
          styleShopeeDataRow(row)
        })
      } else {
        // Product without variants (Single unit)
        const singleSku = generateSmartSku(prod.name, '', prodModel)
        const row = worksheet.addRow({
          kodeProduk: shopeeId,
          namaProduk: prod.name,
          kodeVariasi: '',
          namaVariasi: '',
          skuInduk: prodModel,
          sku: singleSku,
          harga: Number(prod.price) || 0,
          costPrice: prod.costPrice ?? '',
          gtin: '',
          stok: Number(prod.stock) || 0,
          minBeli: 1,
          maksBeli: '',
          tglMulai: '',
          jmlHari: '',
          tglAkhir: '',
        })
        styleShopeeDataRow(row)
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const storeSlug = (targetStore.name || 'store')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    const filename = `mass_update_sales_info_${storeSlug}_${nowStr}.xlsx`

    // Log this download task in PostgreSQL
    if (session?.user?.id) {
      await prisma.massUpdateTask
        .create({
          data: {
            type: 'DOWNLOAD',
            templateType: 'SALES_INFO',
            storeId: targetStoreId,
            userId: session.user.id,
            status: 'COMPLETED',
            fileName: filename,
            totalCount: products.length,
            processedCount: products.length,
            successCount: products.length,
            summaryMessage: `Template berhasil diekspor (${products.length} produk).`,
            snapshotAt: new Date(),
          },
        })
        .catch((e) => console.error('Failed to log mass update task:', e))
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('Error generating Excel catalog export:', error)
    return NextResponse.json(
      {
        error:
          'Gagal membuat file template Excel: ' +
          (error?.message || 'Internal Server Error'),
      },
      { status: 500 }
    )
  }
}

function styleShopeeDataRow(row: ExcelJS.Row) {
  row.height = 22
  row.eachCell((cell, colNumber) => {
    cell.font = { name: 'Segoe UI', size: 9.5 }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }

    if (colNumber === 1 || colNumber === 3) {
      // Col 1 (Kode Produk), Col 3 (Kode Variasi)
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
      cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF475569' } }
    } else if (colNumber === 6) {
      // Col 6 (SKU)
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
      cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF0284C7' } }
    } else if (colNumber === 7) {
      // Col 7 (Harga)
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
      cell.numFmt = '#,##0'
    } else if (colNumber === 9) {
      // Col 9 (Stok)
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.numFmt = '#,##0'
    } else if (colNumber === 10) {
      // Col 10 (Min. Jumlah Pembelian)
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    }
  })
}
