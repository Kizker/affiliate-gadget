/**
 * Smart Search & Typo-Tolerant Engine (Shopee / Google Style)
 *
 * Mendukung pencarian pintar dengan:
 * 1. Kamus typo fonetik & slang gadget Indonesia (e.g. "Ipone" -> "iPhone", "Somay" -> "Xiaomi")
 * 2. Fuse.js — battle-tested fuzzy search library (bitap algorithm, ML-grade tolerance)
 * 3. Token-based fuzzy matching pada nama, brand, model & deskripsi produk
 * 4. UX metadata "Apakah yang Anda maksud" (Did you mean?)
 */

import Fuse from 'fuse.js'

// Kamus Typo & Slang Khusus Gadget Populer Indonesia
export const GADGET_TYPO_MAP: Record<string, string> = {
  // Apple / iPhone typos
  ipon: 'iphone',
  ipone: 'iphone',
  iphon: 'iphone',
  aifon: 'iphone',
  aipon: 'iphone',
  ipong: 'iphone',
  ifone: 'iphone',
  ipohne: 'iphone',
  ip: 'iphone',
  iphn: 'iphone',
  aple: 'apple',
  apel: 'apple',
  mekbuk: 'macbook',
  macbok: 'macbook',
  mackbook: 'macbook',
  makbuk: 'macbook',
  mekbook: 'macbook',
  aipad: 'ipad',
  irpod: 'airpods',
  airpod: 'airpods',
  erpod: 'airpods',

  // Samsung typos
  samung: 'samsung',
  samasung: 'samsung',
  sansung: 'samsung',
  samsng: 'samsung',
  smsung: 'samsung',
  samsugn: 'samsung',
  galaxt: 'galaxy',
  glaxy: 'galaxy',
  galax: 'galaxy',
  galaxi: 'galaxy',
  zfold: 'z fold',
  zflip: 'z flip',

  // Xiaomi & Poco typos
  xiomi: 'xiaomi',
  siomi: 'xiaomi',
  somay: 'xiaomi',
  syomi: 'xiaomi',
  xioami: 'xiaomi',
  xiaomy: 'xiaomi',
  remdi: 'redmi',
  redmy: 'redmi',
  poko: 'poco',
  pokophone: 'pocophone',

  // Brands lain
  infinik: 'infinix',
  infinx: 'infinix',
  infinis: 'infinix',
  opo: 'oppo',
  oppoo: 'oppo',
  pipo: 'vivo',
  viv: 'vivo',
  vivoo: 'vivo',
  relme: 'realme',
  realmi: 'realme',
  asuss: 'asus',
  azus: 'asus',

  // Model & Attributes typos
  pormax: 'pro max',
  promaks: 'pro max',
  promak: 'pro max',
  promx: 'pro max',
  ultar: 'ultra',
  ultraa: 'ultra',
  titaniun: 'titanium',
  titanum: 'titanium',
  titamium: 'titanium',
  blak: 'black',
  wite: 'white',
  naturall: 'natural',
}

/**
 * Normalisasi dan ekstraksi token kata kunci
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

/**
 * Hitung jarak Levenshtein antara string a dan string b
 */
export function calculateLevenshtein(a: string, b: string): number {
  const al = a.length
  const bl = b.length
  if (al === 0) return bl
  if (bl === 0) return al

  const matrix: number[][] = []
  for (let i = 0; i <= al; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[al][bl]
}

export interface SmartSearchCorrection {
  originalWord: string
  suggestedWord: string
  confidence: number // 0 to 1
  source: 'DICTIONARY' | 'FUZZY_CORPUS'
}

export interface SmartAnalysisResult {
  originalQuery: string
  effectiveQuery: string
  hasCorrection: boolean
  corrections: SmartSearchCorrection[]
}

/**
 * Analisis query pengguna untuk mendeteksi typo dan memberikan koreksi pintar
 */
export function analyzeSmartQuery(
  rawQuery: string,
  corpusWords: string[] = []
): SmartAnalysisResult {
  const original = (rawQuery || '').trim()
  if (!original) {
    return {
      originalQuery: '',
      effectiveQuery: '',
      hasCorrection: false,
      corrections: [],
    }
  }

  const tokens = tokenizeText(original)
  const corrections: SmartSearchCorrection[] = []
  const correctedTokens: string[] = []

  // Vocabulary default + dynamic dari korpus produk
  const defaultVocabulary = [
    'iphone',
    'samsung',
    'xiaomi',
    'apple',
    'macbook',
    'ipad',
    'airpods',
    'air',
    'galaxy',
    'ultra',
    'pro',
    'max',
    'plus',
    'mini',
    'titanium',
    'black',
    'white',
    'natural',
    'blue',
    'infinix',
    'oppo',
    'vivo',
    'realme',
    'asus',
    'poco',
    'redmi',
    'watch',
    'oled',
    'fold',
    'flip',
    'note',
    'lite',
  ]

  const vocabulary = Array.from(
    new Set([
      ...defaultVocabulary,
      ...corpusWords.map((w) => w.toLowerCase().trim()),
    ])
  ).filter((w) => w.length >= 3)

  for (const token of tokens) {
    // 1. Cek Kamus Typo Slang / Fonetik langsung (O(1))
    if (GADGET_TYPO_MAP[token]) {
      const suggestion = GADGET_TYPO_MAP[token]
      corrections.push({
        originalWord: token,
        suggestedWord: suggestion,
        confidence: 0.98,
        source: 'DICTIONARY',
      })
      correctedTokens.push(suggestion)
      continue
    }

    // 2. Jika token sudah persis ada di vocabulary, simpan tanpa perubahan
    if (vocabulary.includes(token)) {
      correctedTokens.push(token)
      continue
    }

    // 3. Fuzzy match via Fuse.js terhadap vocabulary (ML-grade tolerance)
    const fuseVocab = new Fuse(
      vocabulary.map((w) => ({ word: w })),
      {
        keys: ['word'],
        threshold: 0.5, // 0 = exact, 1 = match anything — 0.5 toleran untuk typo ringan-sedang
        distance: 100,
        includeScore: true,
        minMatchCharLength: 2,
      }
    )

    const fuseResults = fuseVocab.search(token)
    if (fuseResults.length > 0) {
      const best = fuseResults[0]
      const bestWord = best.item.word
      const bestScore = best.score ?? 1

      // Score Fuse.js: 0 = perfect match, 1 = no match — konversi ke confidence
      const confidence = 1 - bestScore

      if (confidence >= 0.55 && bestWord !== token) {
        corrections.push({
          originalWord: token,
          suggestedWord: bestWord,
          confidence: Math.round(confidence * 100) / 100,
          source: 'FUZZY_CORPUS',
        })
        correctedTokens.push(bestWord)
        continue
      }
    }

    // Jika tidak ada koreksi, gunakan token asli
    correctedTokens.push(token)
  }

  const effectiveQuery = correctedTokens.join(' ')
  const hasCorrection =
    corrections.length > 0 &&
    effectiveQuery.toLowerCase() !== original.toLowerCase()

  return {
    originalQuery: original,
    effectiveQuery,
    hasCorrection,
    corrections,
  }
}

/**
 * Filter produk pintar menggunakan Fuse.js sebagai primary engine
 */
export function matchesSmartProduct(
  product: {
    name?: string
    brand?: string | null
    description?: string | null
    model?: string | null
    store?: { name?: string; city?: string } | null
  },
  searchQuery: string,
  analysis?: SmartAnalysisResult
): boolean {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return true

  const name = (product.name || '').toLowerCase()
  const brand = (product.brand || '').toLowerCase()
  const model = (product.model || '').toLowerCase()
  const desc = (product.description || '').toLowerCase()
  const store = (product.store?.name || '').toLowerCase()
  const city = (product.store?.city || '').toLowerCase()

  const fullSearchableText = `${name} ${brand} ${model} ${desc} ${store} ${city}`

  // 1. Exact substring match (fastest path)
  if (fullSearchableText.includes(query)) {
    return true
  }

  // 2. Token-level exact match
  const originalTokens = tokenizeText(query)
  const allOriginalMatch = originalTokens.every((t) =>
    fullSearchableText.includes(t)
  )
  if (allOriginalMatch && originalTokens.length > 0) {
    return true
  }

  // 3. Smart Typo Correction match
  const smart = analysis || analyzeSmartQuery(query)
  if (smart.hasCorrection) {
    const effective = smart.effectiveQuery.toLowerCase()
    if (fullSearchableText.includes(effective)) {
      return true
    }
    const correctedTokens = tokenizeText(effective)
    const allCorrectedMatch = correctedTokens.every((t) =>
      fullSearchableText.includes(t)
    )
    if (allCorrectedMatch && correctedTokens.length > 0) {
      return true
    }
  }

  // 4. Token-level Fuzzy Match via Levenshtein (word-by-word pada judul produk)
  const productWords = tokenizeText(name + ' ' + brand + ' ' + model)
  const fuzzyMatched = originalTokens.every((token) => {
    if (token.length <= 2) return false
    // Cek dictionary dulu
    const dictCorrection = GADGET_TYPO_MAP[token]
    if (dictCorrection) {
      return productWords.some(
        (w) => w.includes(dictCorrection) || dictCorrection.includes(w)
      )
    }
    return productWords.some((word) => {
      if (word.length <= 2) return false
      if (word.includes(token) || token.includes(word)) return true
      // Hitung threshold secara proporsional terhadap panjang kata terpanjang
      const longer = Math.max(token.length, word.length)
      const maxDist = longer <= 4 ? 1 : longer <= 6 ? 2 : 3
      if (Math.abs(token.length - word.length) > maxDist) return false
      return calculateLevenshtein(token, word) <= maxDist
    })
  })

  return fuzzyMatched
}

/**
 * Filter daftar produk menggunakan Smart Search (Fuse.js + Dictionary + Levenshtein)
 */
export function filterGadgetsWithSmartSearch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gadgets: any[],
  searchQuery: string,
  selectedBrand: string = 'ALL'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { filtered: any[]; smartAnalysis: SmartAnalysisResult } {
  // Bangun kosakata dinamis dari katalog produk
  const corpusWords: string[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gadgets.forEach((g: any) => {
    if (g.name) corpusWords.push(...tokenizeText(g.name))
    if (g.brand) corpusWords.push(g.brand)
    if (g.model) corpusWords.push(g.model)
  })

  const smartAnalysis = analyzeSmartQuery(searchQuery, corpusWords)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = gadgets.filter((g: any) => {
    // Brand filter
    if (
      selectedBrand !== 'ALL' &&
      g.brand?.toUpperCase() !== selectedBrand.toUpperCase()
    ) {
      return false
    }

    if (!searchQuery.trim()) return true

    return matchesSmartProduct(g, searchQuery, smartAnalysis)
  })

  return { filtered, smartAnalysis }
}

/**
 * Buat Fuse.js instance untuk produk-produk — digunakan sebagai fallback terakhir
 * pada filterGadgetsWithFuse() jika metode lain gagal menghasilkan apapun.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createProductFuseIndex(gadgets: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Fuse<any>(gadgets, {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'brand', weight: 2 },
      { name: 'model', weight: 2 },
      { name: 'description', weight: 1 },
      { name: 'store.name', weight: 0.5 },
    ],
    threshold: 0.45,
    distance: 200,
    includeScore: true,
    minMatchCharLength: 2,
    useExtendedSearch: false,
    ignoreLocation: true,
  })
}
