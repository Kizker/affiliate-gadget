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

export async function GET() {
  try {
    const session = await auth()

    // Strict Authorization: Only SUPER_ADMIN
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          error:
            'Akses ditolak: Fitur ekspor template & update massal hanya dapat diakses oleh Superadmin.',
        },
        { status: 403 }
      )
    }

    // Fetch all active products with their variants and store
    const products = await prisma.product.findMany({
      where: { isActive: true },
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
    // SHEET 1: Sheet1 (Shopee Official Mass Update Template)
    // ─────────────────────────────────────────────────────────────
    const worksheet = workbook.addWorksheet('Sheet1', {
      views: [{ state: 'frozen', ySplit: 2 }],
    })

    // Exact 14 Shopee Columns
    worksheet.columns = [
      { header: 'Kode Produk', key: 'kodeProduk', width: 20 }, // Col A (1)
      { header: 'Nama Produk', key: 'namaProduk', width: 44 }, // Col B (2)
      { header: 'Kode Variasi', key: 'kodeVariasi', width: 20 }, // Col C (3)
      { header: 'Nama Variasi', key: 'namaVariasi', width: 32 }, // Col D (4)
      { header: 'SKU Induk', key: 'skuInduk', width: 24 }, // Col E (5)
      { header: 'SKU', key: 'sku', width: 20 }, // Col F (6)
      { header: 'Harga', key: 'harga', width: 18 }, // Col G (7)
      { header: 'GTIN', key: 'gtin', width: 16 }, // Col H (8)
      { header: 'Stok', key: 'stok', width: 12 }, // Col I (9)
      { header: 'Min. Jumlah Pembelian', key: 'minBeli', width: 24 }, // Col J (10)
      { header: 'Maks. Jumlah Pembelian', key: 'maksBeli', width: 24 }, // Col K (11)
      {
        header: 'Maks. Jumlah Pembelian - Tanggal Mulai',
        key: 'tglMulai',
        width: 26,
      }, // Col L (12)
      {
        header: 'Maks. Jumlah Pembelian - Jumlah Hari',
        key: 'jmlHari',
        width: 26,
      }, // Col M (13)
      {
        header: 'Maks. Jumlah Pembelian - Tanggal Berakhir',
        key: 'tglAkhir',
        width: 28,
      }, // Col N (14)
    ]

    // ─────────────────────────────────────────────────────────────
    // ROW 1: Header Row (Shopee Brand Orange #EE4D2D)
    // ─────────────────────────────────────────────────────────────
    const headerRow = worksheet.getRow(1)
    headerRow.height = 36
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEE4D2D' }, // Shopee Orange
      }
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
    // ROW 2: Shopee Validation & Hint Instruction Row
    // ─────────────────────────────────────────────────────────────
    const hintRow = worksheet.addRow({
      kodeProduk: '',
      namaProduk: '',
      kodeVariasi: '',
      namaVariasi: '',
      skuInduk: '',
      sku: '',
      harga:
        'Mohon masukkan 99 sampai 1000000000 untuk harga produk. Batas harga produk termahal dibagi harga harga produk termurah: 7',
      gtin: '',
      stok: '',
      minBeli:
        'Min. jumlah pembelian merupakan isi dari tingkatan produk. Pembeli dapat memesan variasi yang berbeda untuk mencapai min. jumlah pembelian. Jika dikosongkan, min. jumlah pembelian akan otomatis bernilai 1. Pastikan stok lebih besar dari min. jumlah pembelian agar Pembeli dapat membuat pesanan.',
      maksBeli:
        '[Per Pesanan + Per Periode] Pengaturan ini akan membatasi Maks. jumlah pembelian yang dapat dibeli per pesanan atau per periode. Mohon masukkan input dari 1 hingga 999,999.',
      tglMulai:
        '[Hanya untuk Pengaturan Per Periode] Mohon tentukan tanggal mulai. Tanggal mulai tercepat adalah besok. Mohon masukkan format tanggal dalam YYYY-MM-DD.',
      jmlHari:
        '[Hanya untuk Pengaturan Per Periode] Batas Maks. jumlah pembelian akan berakhir (untuk tipe periode "Tidak Berulang") atau mulai kembali (untuk tipe periode "Berulang") setelah jumlah hari yang ditentukan. Mohon masukkan 1 sampai 365.',
      tglAkhir:
        '[Hanya untuk Pengaturan Per Periode] Mohon masukkan tanggal dalam format YYY-MM-DD.\n\nUntuk tipe periode "Tidak Berulang", tanggal berakhir = tanggal mulai + jumlah hari - 1.\n\nUntuk tipe periode "Berulang", tanggal berakhir harus kelipatan dari jumlah hari.',
    })

    hintRow.height = 70
    hintRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      }
      cell.font = {
        name: 'Segoe UI',
        size: 8,
        color: { argb: 'FF64748B' },
      }
      cell.alignment = {
        vertical: 'top',
        horizontal: 'left',
        wrapText: true,
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
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
    const filename = `mass_update_sales_info_${nowStr}.xlsx`

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
