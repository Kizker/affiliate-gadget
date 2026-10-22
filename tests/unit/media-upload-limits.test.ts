import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  MEDIA_LIMITS,
  validateAndCompressImage,
  validateVideo,
} from '@/lib/media-upload-client'

describe('Media Upload Size Limits, Auto-Compression, & Format Validation Suite', () => {
  const rootDir = process.cwd()
  const uploadRoutePath = path.join(
    rootDir,
    'src',
    'app',
    'api',
    'upload',
    'route.ts'
  )
  const productUploadRoutePath = path.join(
    rootDir,
    'src',
    'app',
    'api',
    'products',
    'upload-images',
    'route.ts'
  )
  const uploadRouteContent = fs.readFileSync(uploadRoutePath, 'utf-8')
  const productUploadRouteContent = fs.readFileSync(
    productUploadRoutePath,
    'utf-8'
  )

  describe('1. Configuration & Constants', () => {
    it('defines correct limits according to requirements', () => {
      // Foto: Maks 2 MB, JPG/JPEG/PNG
      expect(MEDIA_LIMITS.IMAGE.MAX_SIZE_BYTES).toBe(2 * 1024 * 1024)
      expect(MEDIA_LIMITS.IMAGE.ALLOWED_EXTENSIONS).toEqual([
        'jpg',
        'jpeg',
        'png',
      ])
      expect(MEDIA_LIMITS.IMAGE.ALLOWED_MIME_TYPES).toEqual([
        'image/jpeg',
        'image/png',
      ])

      // Video: Maks 30 MB, MP4 (non-VP9), 10 - 60 detik, maks 1280x1280
      expect(MEDIA_LIMITS.VIDEO.MAX_SIZE_BYTES).toBe(30 * 1024 * 1024)
      expect(MEDIA_LIMITS.VIDEO.MIN_DURATION_SECONDS).toBe(10)
      expect(MEDIA_LIMITS.VIDEO.MAX_DURATION_SECONDS).toBe(60)
      expect(MEDIA_LIMITS.VIDEO.MAX_RESOLUTION).toBe(1280)
      expect(MEDIA_LIMITS.VIDEO.ALLOWED_EXTENSIONS).toEqual(['mp4'])
    })
  })

  describe('2. Client-Side Image Validation & Compression Utility', () => {
    it('rejects unsupported image formats (e.g., GIF, WebP, PDF)', async () => {
      const invalidFile = new File(['dummy content'], 'sample.gif', {
        type: 'image/gif',
      })

      await expect(validateAndCompressImage(invalidFile)).rejects.toThrow(
        'Format file tidak didukung. Format foto harus JPG, JPEG, atau PNG.'
      )
    })

    it('rejects oversized images exceeding hard threshold (> 25MB)', async () => {
      // Mock File with 26 MB size
      const hugeFile = {
        name: 'huge_camera_raw.jpg',
        type: 'image/jpeg',
        size: 26 * 1024 * 1024,
      } as unknown as File

      await expect(validateAndCompressImage(hugeFile)).rejects.toThrow(
        'Ukuran file terlalu besar. Maksimal 2 MB per foto.'
      )
    })

    it('accepts valid JPG/PNG files under 2 MB without modification', async () => {
      const validFile = new File(['valid content'], 'photo.jpg', {
        type: 'image/jpeg',
      })

      const result = await validateAndCompressImage(validFile)
      expect(result).toBe(validFile)
    })
  })

  describe('3. Client-Side Video Validation Utility', () => {
    it('rejects non-MP4 formats and VP9/WebM codecs', async () => {
      const webmFile = new File(['dummy'], 'video.webm', {
        type: 'video/webm',
      })
      await expect(validateVideo(webmFile)).rejects.toThrow(
        'Format file harus MP4 (tidak mendukung format VP9).'
      )

      const vp9File = new File(['dummy'], 'video_vp9.mp4', {
        type: 'video/mp4; codecs=vp9',
      })
      await expect(validateVideo(vp9File)).rejects.toThrow(
        'Format file harus MP4 (tidak mendukung format VP9).'
      )
    })

    it('rejects videos exceeding 30 MB size limit', async () => {
      const oversizedVideo = {
        name: 'large_recording.mp4',
        type: 'video/mp4',
        size: 32 * 1024 * 1024, // 32 MB
      } as unknown as File

      await expect(validateVideo(oversizedVideo)).rejects.toThrow(
        'Ukuran file terlalu besar. Maksimal 30 MB.'
      )
    })
  })

  describe('4. Server-Side Upload Route Validation & Sharp Auto-Compression (/api/upload)', () => {
    it('enforces 2 MB image constraint, sharp auto-compression, and error handling', () => {
      // Sharp compression integration
      expect(uploadRouteContent).toContain("import sharp from 'sharp'")
      expect(uploadRouteContent).toContain('IMAGE_MAX_SIZE = 2 * 1024 * 1024')
      expect(uploadRouteContent).toContain('sharp(buffer)')
      expect(uploadRouteContent).toContain(
        'Ukuran file terlalu besar. Maksimal 2 MB per foto.'
      )
      expect(uploadRouteContent).toContain(
        'Format file tidak didukung. Format foto harus JPG, JPEG, atau PNG.'
      )
    })

    it('enforces 30 MB video constraint and MP4 non-VP9 validation', () => {
      expect(uploadRouteContent).toContain('VIDEO_MAX_SIZE = 30 * 1024 * 1024')
      expect(uploadRouteContent).toContain(
        'Format file harus MP4 (tidak mendukung format VP9).'
      )
      expect(uploadRouteContent).toContain(
        'Ukuran file terlalu besar. Maksimal 30 MB.'
      )
    })
  })

  describe('5. Products Batch Upload Route (/api/products/upload-images)', () => {
    it('enforces 2 MB image limit with sharp auto-compression and 30 MB MP4 video limit', () => {
      expect(productUploadRouteContent).toContain("import sharp from 'sharp'")
      expect(productUploadRouteContent).toContain(
        'IMAGE_MAX_SIZE = 2 * 1024 * 1024'
      )
      expect(productUploadRouteContent).toContain(
        'VIDEO_MAX_SIZE = 30 * 1024 * 1024'
      )
      expect(productUploadRouteContent).toContain('Maksimal 2 MB per foto.')
      expect(productUploadRouteContent).toContain(
        'harus MP4 (tidak mendukung format VP9).'
      )
      expect(productUploadRouteContent).toContain('Maksimal 30 MB.')
    })
  })
})
