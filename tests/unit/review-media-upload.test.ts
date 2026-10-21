import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Review Media (Photo & Video) End-to-End Implementation Suite', () => {
  const rootDir = process.cwd()

  // ─── FASE 1: PRODUK DARI ORDER PAGE ──────────────────────────────────────────
  it('1. RatingModal supports images and videos upload, state management and submit body', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'components',
      'modals',
      'rating-modal.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('existingImages?: string[]')
    expect(content).toContain('existingVideos?: string[]')
    expect(content).toContain('const [images, setImages] = useState<string[]>')
    expect(content).toContain('const [videos, setVideos] = useState<string[]>')
    expect(content).toContain('const [uploading, setUploading] = useState')
    expect(content).toContain('handleFileUpload')
    expect(content).toContain('fileInputRef')
    expect(content).toContain(
      'body: JSON.stringify({ rating, comment, images, videos })'
    )
    expect(content).toContain('Lampirkan Foto & Video Unit')
    expect(content).toContain('+ Foto / Video')
  })

  it('2. Order review API route accepts and updates images and videos arrays', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'app',
      'api',
      'orders',
      '[orderId]',
      'review',
      'route.ts'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain(
      'const { rating, comment, images = [], videos = [] } = body'
    )
    expect(content).toContain('sanitizedImages')
    expect(content).toContain('sanitizedImages')
    expect(content).toContain('existingReview.images')
    expect(content).toContain('sanitizedVideos')
    expect(content).toContain('existingReview.videos')
  })

  it('3. Order detail client synchronizes media states and invokes MediaLightboxModal', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'customer',
      'orders',
      '[orderId]',
      'order-detail-client.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('MediaLightboxModal')
    expect(content).toContain('existingImages: currentReview?.images')
    expect(content).toContain('existingVideos: currentReview?.videos')
    expect(content).toContain(
      'existingImages={currentReview?.images ?? ratingModal.existingImages}'
    )
    expect(content).toContain(
      'existingVideos={currentReview?.videos ?? ratingModal.existingVideos}'
    )
    expect(content).toContain('reviewMediaList')
    expect(content).toContain('onOpenMedia={handleOpenMedia}')
  })

  it('4. Desktop and mobile order detail views render submitted review card with media thumbnails', () => {
    const desktopCardPath = path.join(
      rootDir,
      'src',
      'components',
      'customer',
      'order-detail',
      'order-desktop-payment-card.tsx'
    )
    const desktopContent = fs.readFileSync(desktopCardPath, 'utf-8')
    expect(desktopContent).toContain('onOpenMedia?: (index: number) => void')
    expect(desktopContent).toContain('Ulasan Anda')
    expect(desktopContent).toContain('currentReview.images?.map')
    expect(desktopContent).toContain('currentReview.videos?.map')

    const mobileViewPath = path.join(
      rootDir,
      'src',
      'components',
      'customer',
      'order-detail',
      'order-mobile-view.tsx'
    )
    const mobileContent = fs.readFileSync(mobileViewPath, 'utf-8')
    expect(mobileContent).toContain('onOpenMedia?: (index: number) => void')
    expect(mobileContent).toContain('Ulasan Anda')
    expect(mobileContent).toContain('currentReview.images?.map')
    expect(mobileContent).toContain('currentReview.videos?.map')
  })

  // ─── FASE 2: SERVIS (MITRA) REVIEW MEDIA ─────────────────────────────────────
  it('5. Mitra review API route accepts images and videos and persists them', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'app',
      'api',
      'reviews',
      'route.ts'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('images = []')
    expect(content).toContain('videos = []')
    expect(content).toContain('sanitizedImages')
    expect(content).toContain('sanitizedVideos')
    expect(content).toContain('images: sanitizedImages')
    expect(content).toContain('videos: sanitizedVideos')
  })

  it('6. ReviewModal and ReviewForm include photo & video upload UI and state handling', () => {
    const modalPath = path.join(
      rootDir,
      'src',
      'components',
      'reviews',
      'review-modal.tsx'
    )
    const modalContent = fs.readFileSync(modalPath, 'utf-8')
    expect(modalContent).toContain('handleFileUpload')
    expect(modalContent).toContain('images,')
    expect(modalContent).toContain('videos,')
    expect(modalContent).toContain('Lampirkan Foto & Video Servis')

    const formPath = path.join(
      rootDir,
      'src',
      'components',
      'reviews',
      'review-form.tsx'
    )
    const formContent = fs.readFileSync(formPath, 'utf-8')
    expect(formContent).toContain('handleFileUpload')
    expect(formContent).toContain('images,')
    expect(formContent).toContain('videos,')
    expect(formContent).toContain('Lampirkan Foto & Video Servis')
  })

  it('7. ReviewCard and ReviewDetailModal render media thumbnails and lightbox integration', () => {
    const cardPath = path.join(
      rootDir,
      'src',
      'components',
      'reviews',
      'review-card.tsx'
    )
    const cardContent = fs.readFileSync(cardPath, 'utf-8')
    expect(cardContent).toContain('images?: string[]')
    expect(cardContent).toContain('videos?: string[]')
    expect(cardContent).toContain('MediaLightboxModal')
    expect(cardContent).toContain('review.images?.map')
    expect(cardContent).toContain('review.videos?.map')

    const detailModalPath = path.join(
      rootDir,
      'src',
      'components',
      'reviews',
      'review-detail-modal.tsx'
    )
    const detailContent = fs.readFileSync(detailModalPath, 'utf-8')
    expect(detailContent).toContain('images?: string[]')
    expect(detailContent).toContain('videos?: string[]')
    expect(detailContent).toContain('MediaLightboxModal')
    expect(detailContent).toContain('activeReview.images?.map')
    expect(detailContent).toContain('activeReview.videos?.map')
  })

  // ─── FASE 3: TOKO (STORE) REVIEW MEDIA ───────────────────────────────────────
  it('8. Store reviews API route returns reviews, aggregate star counts and mediaGallery', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'app',
      'api',
      'stores',
      '[slug]',
      'reviews',
      'route.ts'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('mediaGallery')
    expect(content).toContain('averageRating')
    expect(content).toContain('starCounts')
    expect(content).toContain('hasMediaFilter')
    expect(content).toContain('storeId: store.id')
  })

  it('9. StoreReviewsSection component renders rating breakdown, media filmstrip and review cards', () => {
    const sectionPath = path.join(
      rootDir,
      'src',
      'components',
      'store',
      'store-reviews-section.tsx'
    )
    const content = fs.readFileSync(sectionPath, 'utf-8')

    expect(content).toContain('Galeri Foto & Video Pembeli')
    expect(content).toContain('Dengan Foto & Video')
    expect(content).toContain('MediaLightboxModal')
    expect(content).toContain('ReviewCard')
    expect(content).toContain('fetchStoreReviews')

    const storePagePath = path.join(
      rootDir,
      'src',
      'app',
      'toko',
      '[slug]',
      'store-detail-client.tsx'
    )
    const storePageContent = fs.readFileSync(storePagePath, 'utf-8')
    expect(storePageContent).toContain('StoreReviewsSection')
    expect(storePageContent).toContain(
      '<StoreReviewsSection storeId={store.id} storeName={store.name} />'
    )
  })
})
