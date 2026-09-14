import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import ExcelJS from 'exceljs'

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

    // Fetch all products with their variants and stores
    const products = await prisma.product.findMany({
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

    // Fetch all physical stores for combobox references
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        city: true,
      },
      orderBy: { name: 'asc' },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Affiliate Gadget Platform'
    workbook.created = new Date()

    // ─────────────────────────────────────────────────────────────
    // SHEET 3: Referensi Data (Pondasi Dropdown Combobox Excel)
    // ─────────────────────────────────────────────────────────────
    const refSheet = workbook.addWorksheet('Referensi_Data')

    const existingModels = Array.from(
      new Set(
        products
          .map((p) => {
            if (p.model?.trim()) return p.model.trim()
            return p.name
              .replace(/\s+[0-9]+GB\/[0-9]+(?:GB|TB)?.*$/i, '')
              .trim()
          })
          .concat([
            'Blackberry Z10',
            'iPhone 15 Pro Max',
            'iPhone 16 Pro Max',
            'Samsung Galaxy S24 Ultra',
            'Xiaomi 15',
            'Xiaomi 14',
            'POCO F6 Pro',
            'Vivo V30 Pro',
            'Oppo Find N3 Flip',
            'ASUS ROG Phone 8 Pro',
          ])
          .filter(Boolean)
      )
    )

    const defaultRams = ['4GB', '6GB', '8GB', '12GB', '16GB', '24GB']
    const dbRams = products
      .flatMap((p) => p.variants.map((v) => v.ram?.trim()))
      .filter(Boolean) as string[]
    const ramList = Array.from(new Set([...defaultRams, ...dbRams]))

    const defaultStorages = ['64GB', '128GB', '256GB', '512GB', '1TB']
    const dbStorages = products
      .flatMap((p) => p.variants.map((v) => v.storage?.trim()))
      .filter(Boolean) as string[]
    const storageList = Array.from(new Set([...defaultStorages, ...dbStorages]))

    const defaultColors = [
      'Black Titanium',
      'White Titanium',
      'Natural Titanium',
      'Blue Titanium',
      'White Cream',
      'Midnight',
      'Starlight',
      'Titanium Black',
      'Titanium Gray',
      'Titanium Violet',
      'Titanium Yellow',
      'Jade Green',
      'Burgundy',
      'Awesome Iceblue',
      'Awesome Navy',
      'Silver Shadow',
      'Navy',
      'Phantom Black',
      'Cream Gold',
      'Sleek Black',
      'White',
      'Black',
    ]
    const dbColors = products
      .flatMap((p) => p.variants.map((v) => v.color?.trim()))
      .filter(Boolean) as string[]
    const colorList = Array.from(new Set([...defaultColors, ...dbColors]))

    const defaultBrands = [
      'Apple',
      'Samsung',
      'Xiaomi',
      'ASUS',
      'Vivo',
      'Oppo',
      'Infinix',
      'Realme',
      'Huawei',
      'Google',
      'Sony',
      'Nothing',
      'Blackberry',
    ]
    const dbBrands = Array.from(
      new Set(products.map((p) => p.brand?.trim()).filter(Boolean) as string[])
    )
    const brandList = Array.from(new Set([...defaultBrands, ...dbBrands]))

    const conditionList = [
      'Second Like New (Mulus 99%)',
      'Second Mulus (95% - 98%)',
      'Second Grade A (Normal 100%)',
      'Baru (BNIB)',
    ]

    const storeDisplayList = stores.map((s) => `${s.name} (${s.city})`)

    refSheet.columns = [
      { header: 'Model / Nama Gadget', key: 'modelName', width: 32 },
      { header: 'RAM', key: 'ram', width: 14 },
      { header: 'Penyimpanan (Storage)', key: 'storage', width: 22 },
      { header: 'Warna', key: 'color', width: 24 },
      { header: 'Merek (Brand)', key: 'brand', width: 18 },
      { header: 'Kondisi Fisik', key: 'condition', width: 28 },
      { header: 'Toko Cabang / PT', key: 'storeName', width: 42 },
      { header: 'Status Aktif', key: 'status', width: 16 },
    ]

    const totalExistingDataRows = products.reduce((acc, p) => {
      return acc + (p.variants && p.variants.length > 0 ? p.variants.length : 1)
    }, 0)
    const firstBlankRow = 2 + totalExistingDataRows
    const extraRowsCount = 100

    const maxRefRows = Math.max(
      existingModels.length,
      ramList.length,
      storageList.length,
      colorList.length,
      brandList.length,
      conditionList.length,
      storeDisplayList.length,
      2
    )

    for (let i = 0; i < maxRefRows; i++) {
      refSheet.addRow({
        modelName: existingModels[i] || '',
        ram: ramList[i] || '',
        storage: storageList[i] || '',
        color: colorList[i] || '',
        brand: brandList[i] || '',
        condition: conditionList[i] || '',
        storeName: storeDisplayList[i] || '',
        status: i === 0 ? 'AKTIF' : i === 1 ? 'NONAKTIF' : '',
      })
    }

    // Dynamic sync formulas from 'Katalog Produk & SKU' into 'Referensi_Data'
    // Setiap kali pengguna mengetik model, RAM, storage, warna, atau merek baru di sheet Katalog,
    // sheet Referensi_Data otomatis terisi seketika via formula Excel!
    for (let i = 0; i < extraRowsCount; i++) {
      const catRowNum = firstBlankRow + i

      // Column A: Model (starts at existingModels.length + 2 + i)
      const modelRefRow = existingModels.length + 2 + i
      refSheet.getCell(`A${modelRefRow}`).value = {
        formula: `IF('Katalog Produk & SKU'!D${catRowNum}<>"",""&'Katalog Produk & SKU'!D${catRowNum},"")`,
      }

      // Column B: RAM
      const ramRefRow = ramList.length + 2 + i
      refSheet.getCell(`B${ramRefRow}`).value = {
        formula: `IF('Katalog Produk & SKU'!E${catRowNum}<>"",""&'Katalog Produk & SKU'!E${catRowNum},"")`,
      }

      // Column C: Storage
      const storageRefRow = storageList.length + 2 + i
      refSheet.getCell(`C${storageRefRow}`).value = {
        formula: `IF('Katalog Produk & SKU'!F${catRowNum}<>"",""&'Katalog Produk & SKU'!F${catRowNum},"")`,
      }

      // Column D: Warna
      const colorRefRow = colorList.length + 2 + i
      refSheet.getCell(`D${colorRefRow}`).value = {
        formula: `IF('Katalog Produk & SKU'!G${catRowNum}<>"",""&'Katalog Produk & SKU'!G${catRowNum},"")`,
      }

      // Column E: Merek (from Col J in Katalog)
      const brandRefRow = brandList.length + 2 + i
      refSheet.getCell(`E${brandRefRow}`).value = {
        formula: `IF('Katalog Produk & SKU'!J${catRowNum}<>"",""&'Katalog Produk & SKU'!J${catRowNum},"")`,
      }

      // Column F: Kondisi (from Col K in Katalog)
      const condRefRow = conditionList.length + 2 + i
      refSheet.getCell(`F${condRefRow}`).value = {
        formula: `IF('Katalog Produk & SKU'!K${catRowNum}<>"",""&'Katalog Produk & SKU'!K${catRowNum},"")`,
      }

      // Column G: Toko Cabang / PT (from Col O in Katalog)
      const storeRefRow = storeDisplayList.length + 2 + i
      refSheet.getCell(`G${storeRefRow}`).value = {
        formula: `IF('Katalog Produk & SKU'!O${catRowNum}<>"",""&'Katalog Produk & SKU'!O${catRowNum},"")`,
      }
    }

    refSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 20
        row.eachCell((cell) => {
          cell.font = { name: 'Segoe UI', size: 9.5 }
        })
      }
    })

    // Style RefSheet Header
    const refHeaderRow = refSheet.getRow(1)
    refHeaderRow.height = 24
    refHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF334155' },
      }
      cell.font = {
        name: 'Segoe UI',
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 9.5,
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // ─────────────────────────────────────────────────────────────
    // SHEET 1: Data Katalog & SKU (Main Interactive Sheet)
    // ─────────────────────────────────────────────────────────────
    const worksheet = workbook.addWorksheet('Katalog Produk & SKU', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    worksheet.columns = [
      { header: 'SKU (Kunci Unik)', key: 'sku', width: 22 }, // Col 1 (A)
      { header: 'ID Varian (Teknis)', key: 'variantId', width: 26 }, // Col 2 (B)
      { header: 'ID Produk (Teknis)', key: 'productId', width: 26 }, // Col 3 (C)
      { header: 'Model / Nama Gadget', key: 'model', width: 28 }, // Col 4 (D)
      { header: 'RAM', key: 'ram', width: 12 }, // Col 5 (E)
      { header: 'Penyimpanan (Storage)', key: 'storage', width: 20 }, // Col 6 (F)
      { header: 'Warna', key: 'color', width: 20 }, // Col 7 (G)
      { header: 'Nama Produk (Otomatis)', key: 'productName', width: 38 }, // Col 8 (H)
      { header: 'Nama Varian (Otomatis)', key: 'variantName', width: 28 }, // Col 9 (I)
      { header: 'Merek (Brand)', key: 'brand', width: 18 }, // Col 10 (J)
      { header: 'Kondisi Fisik', key: 'condition', width: 26 }, // Col 11 (K)
      { header: 'Harga Jual Baru (Rp)', key: 'price', width: 20 }, // Col 12 (L)
      { header: 'Harga Coret Baru (Rp)', key: 'originalPrice', width: 20 }, // Col 13 (M)
      { header: 'Stok Baru', key: 'stock', width: 12 }, // Col 14 (N)
      { header: 'Toko Pemilik / PT', key: 'storeName', width: 38 }, // Col 15 (O)
      { header: 'Status Aktif (AKTIF/NONAKTIF)', key: 'isActive', width: 24 }, // Col 16 (P)
      {
        header: 'Deskripsi Lengkap Unit Gadget',
        key: 'description',
        width: 45,
      }, // Col 17 (Q)
      { header: 'Chipset (Spesifikasi)', key: 'chipset', width: 28 }, // Col 18 (R)
      { header: 'Layar (Spesifikasi)', key: 'layar', width: 26 }, // Col 19 (S)
      { header: 'Kamera (Spesifikasi)', key: 'kamera', width: 32 }, // Col 20 (T)
      { header: 'Baterai (Spesifikasi)', key: 'baterai', width: 26 }, // Col 21 (U)
    ]

    // Style Header Row
    const headerRow = worksheet.getRow(1)
    headerRow.height = 28
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' }, // Trust Blue Brand Palette
      }
      cell.font = {
        name: 'Segoe UI',
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 10,
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      }
    })

    // Format Condition display
    const formatConditionDisplay = (cond: string) => {
      if (cond === 'SECOND_MULUS') return 'Second Mulus (95% - 98%)'
      if (cond === 'GRADE_A') return 'Second Grade A (Normal 100%)'
      if (cond === 'LIKE_NEW') return 'Second Like New (Mulus 99%)'
      if (cond === 'BARU') return 'Baru (BNIB)'
      return cond || 'Second Like New (Mulus 99%)'
    }

    let currentRowIndex = 2

    // Populate Existing Data Rows
    products.forEach((prod) => {
      const storeName = prod.store
        ? `${prod.store.name} (${prod.store.city})`
        : storeDisplayList[0] ||
          'Affiliate Gadget - Roxy Mas Jakarta (Jakarta Pusat)'
      const specs = (prod.specs as any) || {}
      const prodModel =
        prod.model ||
        prod.name
          .replace(/\s+[0-9]+GB\/[0-9]+(?:GB|TB)?.*$/i, '')
          .replace(/\s+[0-9]+(?:GB|TB).*$/i, '')
          .trim()

      if (prod.variants && prod.variants.length > 0) {
        prod.variants.forEach((v) => {
          let varRam = v.ram || ''
          let varStorage = v.storage || ''
          let varColor = v.color || ''

          if (!varRam && v.name) {
            const ramMatch = v.name.match(/^([0-9]+GB)\s*\//i)
            if (ramMatch) varRam = ramMatch[1].toUpperCase()
          }
          if (!varStorage && v.name) {
            const storageMatch = v.name.match(/(?:^|\/|\s)([0-9]+(?:GB|TB))/i)
            if (storageMatch) varStorage = storageMatch[1].toUpperCase()
          }
          if (!varColor && v.name) {
            if (v.name.includes('-')) {
              varColor = v.name.split('-').slice(1).join('-').trim()
            }
          }

          const rowNum = currentRowIndex
          const row = worksheet.addRow({
            sku: v.sku || `SKU-${v.id.slice(-8).toUpperCase()}`,
            variantId: v.id,
            productId: prod.id,
            model: prodModel,
            ram: varRam,
            storage: varStorage,
            color: varColor,
            productName: {
              formula: `IF(D${rowNum}<>"",TRIM(D${rowNum}&" "&IF(AND(E${rowNum}<>"",F${rowNum}<>""),E${rowNum}&"/"&F${rowNum},IF(E${rowNum}<>"",E${rowNum},IF(F${rowNum}<>"",F${rowNum},"")))&IF(G${rowNum}<>""," "&G${rowNum},"")),"")`,
              result: prod.name,
            },
            variantName: {
              formula: `IF(OR(E${rowNum}<>"",F${rowNum}<>"",G${rowNum}<>""),TRIM(IF(AND(E${rowNum}<>"",F${rowNum}<>""),E${rowNum}&"/"&F${rowNum},IF(E${rowNum}<>"",E${rowNum},IF(F${rowNum}<>"",F${rowNum},"")))&IF(G${rowNum}<>""," "&G${rowNum},"")),"")`,
              result: v.name,
            },
            brand: prod.brand || '-',
            condition: formatConditionDisplay(prod.condition),
            price: Number(v.price) || 0,
            originalPrice: Number(prod.originalPrice) || '',
            stock: Number(v.stock) || 0,
            storeName: storeName,
            isActive: prod.isActive ? 'AKTIF' : 'NONAKTIF',
            description: prod.description || '',
            chipset: specs.Chipset || '',
            layar: specs.Layar || '',
            kamera: specs.Kamera || '',
            baterai: specs.Baterai || '',
          })
          styleDataRow(row)
          applyComboboxValidation(row, currentRowIndex, {
            modelCount: existingModels.length,
            ramCount: ramList.length,
            storageCount: storageList.length,
            colorCount: colorList.length,
            brandCount: brandList.length,
            condCount: conditionList.length,
            storeCount: storeDisplayList.length,
          })
          currentRowIndex++
        })
      } else {
        const rowNum = currentRowIndex
        const row = worksheet.addRow({
          sku: `SKU-${prod.id.slice(-8).toUpperCase()}`,
          variantId: '',
          productId: prod.id,
          model: prodModel,
          ram: '',
          storage: '',
          color: '',
          productName: {
            formula: `IF(D${rowNum}<>"",TRIM(D${rowNum}&" "&IF(AND(E${rowNum}<>"",F${rowNum}<>""),E${rowNum}&"/"&F${rowNum},IF(E${rowNum}<>"",E${rowNum},IF(F${rowNum}<>"",F${rowNum},"")))&IF(G${rowNum}<>""," "&G${rowNum},"")),"")`,
            result: prod.name,
          },
          variantName: {
            formula: `IF(OR(E${rowNum}<>"",F${rowNum}<>"",G${rowNum}<>""),TRIM(IF(AND(E${rowNum}<>"",F${rowNum}<>""),E${rowNum}&"/"&F${rowNum},IF(E${rowNum}<>"",E${rowNum},IF(F${rowNum}<>"",F${rowNum},"")))&IF(G${rowNum}<>""," "&G${rowNum},"")),"")`,
            result: 'Standar',
          },
          brand: prod.brand || '-',
          condition: formatConditionDisplay(prod.condition),
          price: Number(prod.price) || 0,
          originalPrice: Number(prod.originalPrice) || '',
          stock: Number(prod.stock) || 0,
          storeName: storeName,
          isActive: prod.isActive ? 'AKTIF' : 'NONAKTIF',
          description: prod.description || '',
          chipset: specs.Chipset || '',
          layar: specs.Layar || '',
          kamera: specs.Kamera || '',
          baterai: specs.Baterai || '',
        })
        styleDataRow(row)
        applyComboboxValidation(row, currentRowIndex, {
          modelCount: existingModels.length,
          ramCount: ramList.length,
          storageCount: storageList.length,
          colorCount: colorList.length,
          brandCount: brandList.length,
          condCount: conditionList.length,
          storeCount: storeDisplayList.length,
        })
        currentRowIndex++
      }
    })

    // ─────────────────────────────────────────────────────────────
    // AUTO-FILL TEMPLATE ROWS FOR NEW ENTRIES (Up to 100 extra rows)
    // ─────────────────────────────────────────────────────────────
    // If user clicks new row and types Model/Nama Gadget, RAM, Storage, Warna:
    // SKU, ID Varian, ID Produk, Nama Produk, Nama Varian, and Status Aktif auto-fill dynamically!
    const hexSuffix = (Math.floor(Date.now() / 1000) % 1000000).toString(16)
    for (let i = 0; i < extraRowsCount; i++) {
      const rowNum = currentRowIndex
      const row = worksheet.addRow([])

      // Column A: Smart SKU formula (e.g. Z10-512-WC)
      row.getCell(1).value = {
        formula: `IF(D${rowNum}="","",UPPER(IFERROR(MID(D${rowNum},FIND(" ",D${rowNum})+1,IFERROR(FIND(" ",D${rowNum},FIND(" ",D${rowNum})+1)-FIND(" ",D${rowNum})-1,4)),LEFT(D${rowNum},4))&"-"&IF(F${rowNum}<>"",SUBSTITUTE(SUBSTITUTE(UPPER(F${rowNum}),"GB",""),"TB","TB"),TEXT(ROW(),"000"))&"-"&IF(G${rowNum}<>"",MID(G${rowNum},1,1)&IFERROR(MID(G${rowNum},FIND(" ",G${rowNum})+1,1),MID(G${rowNum},2,1)),"DF")))`,
      }
      // Column B: ID Varian auto-generated cuid-like technical ID
      row.getCell(2).value = {
        formula: `IF(D${rowNum}="","","cvar"&TEXT(ROW(),"0000")&"${hexSuffix}"&"v"&TEXT(ROW(),"00"))`,
      }
      // Column C: ID Produk auto-generated cuid-like technical ID
      row.getCell(3).value = {
        formula: `IF(D${rowNum}="","","cprd"&TEXT(ROW(),"0000")&"${hexSuffix}"&"p"&TEXT(ROW(),"00"))`,
      }

      // Column H: Nama Produk = (Nama Produk)+(Ram)+(/)+(Penyimpanan)+(Warna)
      row.getCell(8).value = {
        formula: `IF(D${rowNum}<>"",TRIM(D${rowNum}&" "&IF(AND(E${rowNum}<>"",F${rowNum}<>""),E${rowNum}&"/"&F${rowNum},IF(E${rowNum}<>"",E${rowNum},IF(F${rowNum}<>"",F${rowNum},"")))&IF(G${rowNum}<>""," "&G${rowNum},"")),"")`,
      }

      // Column I: Nama Varian = (Ram)+(/)+(Penyimpanan)+(Warna)
      row.getCell(9).value = {
        formula: `IF(OR(E${rowNum}<>"",F${rowNum}<>"",G${rowNum}<>""),TRIM(IF(AND(E${rowNum}<>"",F${rowNum}<>""),E${rowNum}&"/"&F${rowNum},IF(E${rowNum}<>"",E${rowNum},IF(F${rowNum}<>"",F${rowNum},"")))&IF(G${rowNum}<>""," "&G${rowNum},"")),"")`,
      }

      // Column P: Status Aktif defaults to AKTIF
      row.getCell(16).value = {
        formula: `IF(D${rowNum}<>"","AKTIF","")`,
      }

      styleDataRow(row)
      applyComboboxValidation(row, rowNum, {
        modelCount: existingModels.length,
        ramCount: ramList.length,
        storageCount: storageList.length,
        colorCount: colorList.length,
        brandCount: brandList.length,
        condCount: conditionList.length,
        storeCount: storeDisplayList.length,
      })
      currentRowIndex++
    }

    // ─────────────────────────────────────────────────────────────
    // SHEET 2: Petunjuk Penggunaan
    // ─────────────────────────────────────────────────────────────
    const instructionSheet = workbook.addWorksheet('Petunjuk Pengisian')
    instructionSheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Topik', key: 'topic', width: 25 },
      { header: 'Panduan & Aturan Pengisian', key: 'guide', width: 85 },
    ]

    const instrHeader = instructionSheet.getRow(1)
    instrHeader.height = 26
    instrHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
      }
      cell.font = {
        name: 'Segoe UI',
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 10,
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    const instructions = [
      {
        no: 1,
        topic: 'Input RAM, Storage & Warna Terpisah',
        guide:
          'Ketik Model/Nama Gadget (misal "Blackberry Z10"), pilih/ketik RAM ("12GB"), Storage ("512GB"), dan Warna ("White Cream"). Kolom Nama Produk dan Nama Varian otomatis tersusun: (Model)+(RAM)+(/)+(Storage)+(Warna).',
      },
      {
        no: 2,
        topic: 'Format SKU & ID Otomatis',
        guide:
          'Kolom SKU otomatis membentuk format cerdas: [Model]-[Storage]-[KodeWarna] (contoh: "Z10-512-WC"). Kolom ID Varian dan ID Produk juga terisi kode teknis unik dinamis.',
      },
      {
        no: 3,
        topic: 'Deskripsi & Spesifikasi Ringkas',
        guide:
          'Tersedia kolom "Deskripsi Lengkap Unit Gadget" dan 4 kolom spesifikasi teknis ("Chipset", "Layar", "Kamera", "Baterai") yang otomatis terhubung ke highlight etalase halaman produk.',
      },
      {
        no: 4,
        topic: 'Ubah Harga & Stok Katalog',
        guide:
          'Untuk memperbarui produk lama, cukup ganti angka pada kolom "Harga Jual Baru (Rp)", "Harga Coret Baru (Rp)", dan "Stok Baru". Nilai harus berupa angka bulat positif.',
      },
      {
        no: 5,
        topic: 'Pilihan Toko Pemilik / PT',
        guide:
          'Pilih toko cabang pemilik gadget dari dropdown (misal: "Affiliate Gadget - Roxy Mas Jakarta"). Produk baru otomatis tercatat pada inventori toko tersebut.',
      },
      {
        no: 6,
        topic: 'Status Penayangan Katalog',
        guide:
          'Pilih "AKTIF" agar produk tampil di etalase pembeli, atau "NONAKTIF" untuk mengarsipkan unit sementara tanpa menghapusnya.',
      },
      {
        no: 7,
        topic: 'Unggah Kembali ke Sistem',
        guide:
          'Setelah selesai mengedit, simpan berkas (.xlsx) lalu klik tombol "Update Massal Excel" di menu Katalog Dashboard Admin untuk menerapkan seluruh perubahan secara instan.',
      },
    ]

    instructions.forEach((ins) => {
      const r = instructionSheet.addRow(ins)
      r.height = 28
      r.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
      r.getCell(2).font = { bold: true }
      r.eachCell((c) => {
        c.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `katalog_gadget_template_${new Date().toISOString().slice(0, 10)}.xlsx`

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

function applyComboboxValidation(
  row: ExcelJS.Row,
  rowNum: number,
  counts: {
    modelCount: number
    ramCount: number
    storageCount: number
    colorCount: number
    brandCount: number
    condCount: number
    storeCount: number
  }
) {
  const maxModelRow = Math.max(counts.modelCount + 150, 300)
  const maxRamRow = Math.max(counts.ramCount + 30, 50)
  const maxStorageRow = Math.max(counts.storageCount + 30, 50)
  const maxColorRow = Math.max(counts.colorCount + 50, 100)
  const maxBrandRow = Math.max(counts.brandCount + 50, 100)
  const maxCondRow = Math.max(counts.condCount + 30, 50)
  const maxStoreRow = Math.max(counts.storeCount + 30, 50)

  // Column D (Col 4): Model / Nama Gadget Dropdown
  row.getCell(4).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`Referensi_Data!$A$2:$A$${maxModelRow}`],
    showErrorMessage: false,
  }

  // Column E (Col 5): RAM Dropdown
  row.getCell(5).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`Referensi_Data!$B$2:$B$${maxRamRow}`],
    showErrorMessage: false,
  }

  // Column F (Col 6): Storage Dropdown
  row.getCell(6).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`Referensi_Data!$C$2:$C$${maxStorageRow}`],
    showErrorMessage: false,
  }

  // Column G (Col 7): Warna Dropdown
  row.getCell(7).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`Referensi_Data!$D$2:$D$${maxColorRow}`],
    showErrorMessage: false,
  }

  // Column J (Col 10): Merek (Brand) Dropdown
  row.getCell(10).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`Referensi_Data!$E$2:$E$${maxBrandRow}`],
    showErrorMessage: false,
  }

  // Column K (Col 11): Kondisi Fisik Dropdown
  row.getCell(11).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`Referensi_Data!$F$2:$F$${maxCondRow}`],
    showErrorMessage: false,
  }

  // Column O (Col 15): Toko Pemilik / PT Dropdown
  row.getCell(15).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`Referensi_Data!$G$2:$G$${maxStoreRow}`],
    showErrorMessage: false,
  }

  // Column P (Col 16): Status Aktif (AKTIF/NONAKTIF)
  row.getCell(16).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: ['"AKTIF, NONAKTIF"'],
    showErrorMessage: false,
  }
}

function styleDataRow(row: ExcelJS.Row) {
  row.height = 22
  row.eachCell((cell, colNumber) => {
    cell.font = { name: 'Segoe UI', size: 9.5 }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }
    // Alignment & Formatting per Column (Total 21 columns)
    if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
      // Col 1 (SKU), Col 2 (ID Varian), Col 3 (ID Produk)
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
      cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF475569' } }
    } else if (colNumber === 5 || colNumber === 6) {
      // Col 5 (RAM), Col 6 (Storage)
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    } else if (colNumber === 8 || colNumber === 9) {
      // Col 8 (Nama Produk), Col 9 (Nama Varian)
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
      cell.font = { name: 'Segoe UI', size: 9.5, bold: colNumber === 8 }
    } else if (colNumber === 12 || colNumber === 13) {
      // Price columns (Col 12: Harga Jual, Col 13: Harga Coret)
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
      cell.numFmt = '#,##0'
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0FDF4' },
      }
    } else if (colNumber === 14) {
      // Stock column (Col 14)
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.numFmt = '#,##0'
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0FDF4' },
      }
    } else if (colNumber === 16) {
      // Status (Col 16)
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    } else if (colNumber === 17) {
      // Deskripsi (Col 17)
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      }
    } else {
      // Other text columns (Model, Warna, Merek, Kondisi, Toko, Specs)
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    }
  })
}
