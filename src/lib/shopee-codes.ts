/**
 * Shopee Code & Smart SKU Generation Engine
 * Auto-generates official-looking Shopee item IDs (11 digits), variation IDs (12 digits),
 * and structured SKUs ([MODEL]-[STORAGE]-[COLOR]) conforming to marketplace catalog standards.
 */

// ─────────────────────────────────────────────────────────────
// 1. SHOPEE NUMERIC ID GENERATORS
// ─────────────────────────────────────────────────────────────

/**
 * Generate an authentic 11-digit Shopee Item ID (e.g. 58941029145).
 * If a seed string is provided, produces a deterministic 11-digit number.
 */
export function generateShopeeItemId(seed?: string): string {
  if (seed && /^[0-9]{10,12}$/.test(seed.trim())) {
    return seed.trim()
  }

  const prefix = '58'
  if (seed) {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
    }
    const numStr = String(hash % 1000000000).padStart(9, '0')
    return `${prefix}${numStr}`
  }

  const timePart = String(Date.now()).slice(-7)
  const randPart = String(Math.floor(10 + Math.random() * 90))
  return `${prefix}${timePart}${randPart}`
}

/**
 * Generate an authentic 12-digit Shopee Variation ID (e.g. 289410291341).
 * If a seed string is provided, produces a deterministic 12-digit number.
 */
export function generateShopeeVariationId(seed?: string): string {
  if (seed && /^[0-9]{11,13}$/.test(seed.trim())) {
    return seed.trim()
  }

  const prefix = '28'
  if (seed) {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 37 + seed.charCodeAt(i)) >>> 0
    }
    const numStr = String(hash % 10000000000).padStart(10, '0')
    return `${prefix}${numStr}`
  }

  const timePart = String(Date.now()).slice(-7)
  const randPart = String(Math.floor(100 + Math.random() * 900))
  return `${prefix}${timePart}${randPart}`
}

// ─────────────────────────────────────────────────────────────
// 2. MODEL EXTRACTION & ABBREVIATION
// ─────────────────────────────────────────────────────────────

export function extractModelCode(
  productName: string,
  skuInduk?: string
): string {
  const target = (skuInduk || productName || '').trim()
  const lower = target.toLowerCase()

  // Google Pixel (e.g. "Google Pixel 10" -> "PIX10", "Pixel 8 Pro" -> "PIX8P")
  if (lower.includes('pixel')) {
    const numMatch = target.match(/pixel\s*([0-9]+)/i)
    const num = numMatch ? numMatch[1] : ''
    let suffix = ''
    if (lower.includes('fold')) suffix += 'F'
    if (lower.includes('pro')) suffix += 'P'
    if (lower.includes('xl')) suffix += 'XL'
    if (lower.includes('7a') || lower.includes('8a') || lower.includes('6a')) {
      const aMatch = target.match(/([0-9]a)/i)
      return aMatch ? `PIX${aMatch[1].toUpperCase()}` : `PIX${num}A`
    }
    return `PIX${num}${suffix}` || 'PIXEL'
  }

  // POCO (e.g. "POCO F6 Pro" -> "F6P", "POCO X6 Pro" -> "X6P")
  if (lower.includes('poco')) {
    const m = target.match(/poco\s*([a-z][0-9]+)(?:\s*(pro))?/i)
    if (m) {
      return `${m[1].toUpperCase()}${m[2] ? 'P' : ''}`
    }
    const anyModel = target.match(/poco\s*([a-z0-9]+)/i)
    return anyModel ? anyModel[1].toUpperCase() : 'POCO'
  }

  // Redmi (e.g. "Redmi Note 13 Pro" -> "RDM-N13P")
  if (lower.includes('redmi')) {
    const noteM = target.match(/note\s*([0-9]+)(?:\s*(pro))?/i)
    if (noteM) {
      return `RDM-N${noteM[1]}${noteM[2] ? 'P' : ''}`
    }
    const numM = target.match(/redmi\s*([a-z0-9]+)/i)
    return numM ? `RDM-${numM[1].toUpperCase()}` : 'REDMI'
  }

  // Xiaomi (e.g. "Xiaomi 14" -> "MI14", "Xiaomi 13T Pro" -> "MI13TP")
  if (lower.includes('xiaomi') || lower.includes('mi ')) {
    const m = target.match(
      /(?:xiaomi|mi)\s*([0-9]+[a-z]?)(?:\s*(ultra|pro|lite|t))?/i
    )
    if (m) {
      const suf = m[2] ? m[2][0].toUpperCase() : ''
      return `MI${m[1].toUpperCase()}${suf}`
    }
  }

  // Vivo (e.g. "Vivo V30 Pro" -> "V30P", "Vivo X100 Pro" -> "X100P")
  if (lower.includes('vivo')) {
    const m = target.match(/vivo\s*([a-z][0-9]+)(?:\s*(pro))?/i)
    if (m) {
      return `${m[1].toUpperCase()}${m[2] ? 'P' : ''}`
    }
  }

  // Oppo (e.g. "Oppo Find N3 Flip" -> "N3F", "Oppo Reno 11 Pro" -> "R11P")
  if (lower.includes('find') || lower.includes('reno')) {
    if (lower.includes('find n')) {
      const m = target.match(/n([0-9]+)(?:\s*(flip))?/i)
      if (m) return `N${m[1]}${m[2] ? 'F' : ''}`
    }
    if (lower.includes('reno')) {
      const m = target.match(/reno\s*([0-9]+)(?:\s*(pro))?/i)
      if (m) return `R${m[1]}${m[2] ? 'P' : ''}`
    }
    const findX = target.match(/find\s*x([0-9]+)(?:\s*(ultra|pro))?/i)
    if (findX) return `X${findX[1]}${findX[2] ? findX[2][0].toUpperCase() : ''}`
  }

  // Apple iPhone (e.g. "iPhone 15 Pro Max" -> "IP15PM")
  if (lower.includes('iphone')) {
    const m = target.match(
      /iphone\s*([0-9]+)(?:\s*(pro\s*max|pro|plus|mini))?/i
    )
    if (m) {
      let suf = ''
      if (m[2]) {
        const s = m[2].toLowerCase()
        if (s.includes('max')) suf = 'PM'
        else if (s.includes('pro')) suf = 'P'
        else if (s.includes('plus')) suf = 'PL'
        else if (s.includes('mini')) suf = 'M'
      }
      return `IP${m[1]}${suf}`
    }
    if (lower.includes('se')) return 'IPSE'
  }

  // Samsung
  if (
    lower.includes('samsung') ||
    lower.includes('galaxy') ||
    lower.includes('sein')
  ) {
    if (lower.includes('fold')) {
      const m = target.match(/fold\s*([0-9]+)/i)
      return m ? `SM-ZF${m[1]}` : 'SM-ZF'
    }
    if (lower.includes('flip')) {
      const m = target.match(/flip\s*([0-9]+)/i)
      return m ? `SM-ZFL${m[1]}` : 'SM-ZFL'
    }
    const sMatch = target.match(/s([0-9]+)(?:\s*(ultra|plus|\+|fe))?/i)
    if (sMatch) {
      let suf = ''
      if (sMatch[2]) {
        const s = sMatch[2].toLowerCase()
        if (s.includes('ultra')) suf = 'U'
        else if (s.includes('plus') || s === '+') suf = 'P'
        else if (s.includes('fe')) suf = 'FE'
      }
      return `SM-S${sMatch[1]}${suf}`
    }
    if (lower.includes('note')) {
      const noteM = target.match(/note\s*([0-9]+)(?:\s*(ultra|plus|\+|lite))?/i)
      if (noteM) {
        let suf = ''
        if (noteM[2]) {
          const s = noteM[2].toLowerCase()
          if (s.includes('ultra')) suf = 'U'
          else if (s.includes('plus') || s === '+') suf = 'P'
          else if (s.includes('lite')) suf = 'L'
        }
        return `SM-N${noteM[1]}${suf}`
      }
    }
    const aMatch = target.match(/\ba([0-9]{2})\b/i)
    if (aMatch) return `SM-A${aMatch[1]}`
  }

  // ASUS ROG & Zenfone
  if (lower.includes('rog')) {
    const m = target.match(/rog\s*(?:phone)?\s*([0-9]+)(?:\s*(pro))?/i)
    if (m) return `ROG${m[1]}${m[2] ? 'P' : ''}`
  }
  if (lower.includes('zenfone')) {
    const m = target.match(/zenfone\s*([0-9]+)/i)
    if (m) return `ZF${m[1]}`
  }

  // Fallback: Clean words
  const cleaned = target
    .replace(/^sein\s*\|\s*/i, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0].slice(0, 4) + words[1].slice(0, 3)).toUpperCase()
  }
  return cleaned.slice(0, 6).toUpperCase() || 'GADGET'
}

// ─────────────────────────────────────────────────────────────
// 3. STORAGE CODE EXTRACTION
// ─────────────────────────────────────────────────────────────

export function extractStorageCode(
  variantName?: string,
  productName?: string
): string {
  const target = `${variantName || ''} ${productName || ''}`

  // Look for X/Y format e.g. 12GB/512GB or 12/256 or 16/1TB
  const slashMatch = target.match(
    /[0-9]{1,2}(?:GB)?\s*\/\s*([0-9]{2,4}(?:GB|TB)?|1TB|1\s*TB)/i
  )
  if (slashMatch) {
    let s = slashMatch[1].toUpperCase().replace(/\s+/g, '')
    if (s.endsWith('GB')) s = s.replace('GB', '')
    return s
  }

  // Look for standalone storage: 1TB, 512GB, 256GB, 128GB, 64GB
  const tbMatch = target.match(/\b(1\s*TB|2\s*TB)\b/i)
  if (tbMatch) return tbMatch[1].toUpperCase().replace(/\s+/g, '')

  const gbMatch = target.match(/\b(512|256|128|64)\s*(?:GB)?\b/i)
  if (gbMatch) return gbMatch[1]

  return ''
}

// ─────────────────────────────────────────────────────────────
// 4. COLOR CODE EXTRACTION
// ─────────────────────────────────────────────────────────────

export function extractColorCode(
  variantName?: string,
  productName?: string
): string {
  const target = (variantName || productName || '').trim()

  const COLOR_MAP: Array<{ pattern: RegExp; code: string }> = [
    { pattern: /volcanic\s*black/i, code: 'VB' },
    { pattern: /equatorial\s*green/i, code: 'EG' },
    { pattern: /asteroid\s*black/i, code: 'BK' },
    { pattern: /sunset\s*orange/i, code: 'OR' },
    { pattern: /jade\s*green/i, code: 'JG' },
    { pattern: /icy\s*blue/i, code: 'IB' },
    { pattern: /natural\s*titanium|titanium\s*natural/i, code: 'NT' },
    { pattern: /black\s*titanium|titanium\s*black/i, code: 'TB' },
    { pattern: /white\s*titanium|titanium\s*white/i, code: 'TW' },
    { pattern: /blue\s*titanium|titanium\s*blue/i, code: 'TB' },
    { pattern: /titanium\s*gray|titanium\s*grey/i, code: 'TG' },
    { pattern: /titanium\s*yellow/i, code: 'TY' },
    { pattern: /titanium\s*violet/i, code: 'TV' },
    { pattern: /white\s*silver|silver\s*white/i, code: 'SW' },
    { pattern: /silver\s*blue|blue\s*shadow/i, code: 'SB' },
    { pattern: /jet\s*black/i, code: 'JB' },
    { pattern: /phantom\s*black/i, code: 'PB' },
    { pattern: /phantom\s*silver/i, code: 'PS' },
    { pattern: /phantom\s*violet/i, code: 'PV' },
    { pattern: /white|putih/i, code: 'WH' },
    { pattern: /black|hitam/i, code: 'BK' },
    { pattern: /blue|biru/i, code: 'BL' },
    { pattern: /navy/i, code: 'NV' },
    { pattern: /green|hijau/i, code: 'GN' },
    { pattern: /mint/i, code: 'MT' },
    { pattern: /cream/i, code: 'CR' },
    { pattern: /yellow|lemon|kuning/i, code: 'YL' },
    { pattern: /pink\s*gold/i, code: 'PG' },
    { pattern: /pink/i, code: 'PK' },
    { pattern: /red|merah/i, code: 'RD' },
    { pattern: /gray|grey|abu/i, code: 'GR' },
    { pattern: /silver/i, code: 'SL' },
    { pattern: /gold|emas/i, code: 'GL' },
    { pattern: /lavender|lilac/i, code: 'LV' },
    { pattern: /burgundy/i, code: 'BG' },
    { pattern: /fullset/i, code: 'FS' },
    { pattern: /unit\s*only/i, code: 'UO' },
    { pattern: /unit\s*\+\s*charger/i, code: 'UC' },
  ]

  for (const { pattern, code } of COLOR_MAP) {
    if (pattern.test(target)) {
      return code
    }
  }

  // Comma split fallback
  if (target.includes(',')) {
    const afterComma = target.split(',')[1].trim()
    const words = afterComma.split(/\s+/).filter(Boolean)
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    } else if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase()
    }
  }

  return 'DF'
}

// ─────────────────────────────────────────────────────────────
// 5. SMART STRUCTURED SKU GENERATOR
// ─────────────────────────────────────────────────────────────

/**
 * Generates clean, structured SKU: [MODEL]-[STORAGE]-[COLOR]
 * Example:
 * "Google Pixel 10 12GB/512GB White" -> "PIX10-512-WH"
 * "Xiaomi 14 12GB/512GB Jade Green" -> "MI14-512-JG"
 * "Vivo V30 Pro 12GB/512GB Volcanic Black" -> "V30P-512-VB"
 */
export function generateSmartSku(
  productName: string,
  variantName?: string,
  skuInduk?: string
): string {
  const modelCode = extractModelCode(productName, skuInduk)
  const storageCode = extractStorageCode(variantName, productName)
  const colorCode = extractColorCode(variantName, productName)

  const parts = [modelCode]
  if (storageCode) parts.push(storageCode)
  if (colorCode && colorCode !== 'DF') parts.push(colorCode)

  if (parts.length === 1) {
    parts.push('01')
  }

  return parts.join('-')
}
