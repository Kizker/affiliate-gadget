import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mitra Reviews Data & UI Synchronization Test Suite', () => {
  const rootDir = process.cwd()

  it('1. verifies MitraDetail type interface exports MitraReviewItem and includes reviews array', () => {
    const typesPath = path.join(rootDir, 'src', 'types', 'mitra-detail.ts')
    const content = fs.readFileSync(typesPath, 'utf-8')

    expect(content).toContain('export interface MitraReviewItem')
    expect(content).toContain('reviews?: MitraReviewItem[]')
  })

  it('2. verifies getMitra in rekomendasi/[id]/page.tsx includes reviews & _count and synchronizes totalReview', () => {
    const pagePath = path.join(
      rootDir,
      'src',
      'app',
      'rekomendasi',
      '[id]',
      'page.tsx'
    )
    const content = fs.readFileSync(pagePath, 'utf-8')

    expect(content).toContain('reviews: {')
    expect(content).toContain('_count: {')
    expect(content).toContain('actualReviewCount = mitra._count?.reviews ?? 0')
    expect(content).toContain(
      'totalReview = actualReviewCount > 0 ? actualReviewCount : 0'
    )
    expect(content).toContain('reviews: mitra.reviews.map')
  })

  it('3. verifies ReviewList accepts initialReviews and initializes reviews state with it', () => {
    const reviewListPath = path.join(
      rootDir,
      'src',
      'components',
      'reviews',
      'review-list.tsx'
    )
    const content = fs.readFileSync(reviewListPath, 'utf-8')

    expect(content).toContain('initialReviews?: Review[]')
    expect(content).toContain(
      'const [reviews, setReviews] = useState<Review[]>(initialReviews || [])'
    )
    expect(content).toContain(
      'const [loading, setLoading] = useState(!initialReviews)'
    )
  })

  it('4. verifies MitraMobileView passes initialReviews to ReviewList component', () => {
    const mobileViewPath = path.join(
      rootDir,
      'src',
      'components',
      'rekomendasi',
      'mitra-mobile-view.tsx'
    )
    const content = fs.readFileSync(mobileViewPath, 'utf-8')

    expect(content).toContain('<ReviewList')
    expect(content).toContain('initialReviews={mitra.reviews}')
  })

  it('5. verifies desktop MitraReviews component supports and passes initialReviews to ReviewList', () => {
    const desktopReviewsPath = path.join(
      rootDir,
      'src',
      'components',
      'rekomendasi',
      'mitra-reviews.tsx'
    )
    const content = fs.readFileSync(desktopReviewsPath, 'utf-8')

    expect(content).toContain('initialReviews?: MitraReviewItem[]')
    expect(content).toContain('initialReviews={initialReviews}')
  })
})
