export interface ColumnFormatConfig {
  type: 'currency' | 'percent' | 'quantity' | 'text' | 'center'
  numFmt?: string
  alignment: {
    horizontal: 'left' | 'center' | 'right'
    vertical: 'middle'
    wrapText: boolean
  }
}

export const CURRENCY_FORMAT = '"Rp "#,##0;[Red]("-Rp "#,##0);"Rp 0"'
export const PERCENT_FORMAT = '0.00"%"'
export const QUANTITY_FORMAT = '#,##0'

export function getColumnFormatAndAlignment(
  header: string
): ColumnFormatConfig {
  const h = header.toLowerCase()

  // 1. Currency Columns (Rp, Harga, Omzet, Modal, HPP, Laba, Komisi, Biaya, Diskon, Ongkir, Asuransi, Total)
  if (
    h.includes('(rp)') ||
    h.includes('omzet') ||
    h.includes('hpp') ||
    h.includes('modal') ||
    h.includes('laba') ||
    h.includes('komisi') ||
    h.includes('biaya') ||
    h.includes('diskon') ||
    h.includes('ongkir') ||
    h.includes('asuransi') ||
    h.includes('total (rp)') ||
    h.includes('total') ||
    h.includes('harga') ||
    h.includes('revenue') ||
    h.includes('spending')
  ) {
    return {
      type: 'currency',
      numFmt: CURRENCY_FORMAT,
      alignment: { horizontal: 'right', vertical: 'middle', wrapText: false },
    }
  }

  // 2. Percentage Columns (Margin Kotor/Bersih)
  if (
    h.includes('(%)') ||
    h.includes('margin') ||
    h.includes('rasio') ||
    h.includes('rate')
  ) {
    return {
      type: 'percent',
      numFmt: PERCENT_FORMAT,
      alignment: { horizontal: 'right', vertical: 'middle', wrapText: false },
    }
  }

  // 3. Quantity / Number Columns
  if (
    h.includes('qty') ||
    h.includes('stock') ||
    h.includes('sold') ||
    h.includes('jumlah')
  ) {
    return {
      type: 'quantity',
      numFmt: QUANTITY_FORMAT,
      alignment: { horizontal: 'right', vertical: 'middle', wrapText: false },
    }
  }

  // 4. Text Columns (Left-aligned for readable text)
  if (
    h.includes('nama') ||
    h.includes('name') ||
    h.includes('produk') ||
    h.includes('product') ||
    h.includes('customer') ||
    h.includes('pelanggan') ||
    h.includes('email') ||
    h.includes('toko') ||
    h.includes('cabang') ||
    h.includes('item')
  ) {
    return {
      type: 'text',
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    }
  }

  // 5. Default Identifiers / Dates / Status (Center-aligned)
  return {
    type: 'center',
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: false },
  }
}
