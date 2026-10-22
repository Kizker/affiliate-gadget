import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  MEDIA_LIMITS,
  validateAndCompressImage,
  validateVideo,
  processMediaUploadFile,
} from '@/lib/media-upload-client'

describe('Comprehensive Media Upload & System-Wide Verification Suite', () => {
  const rootDir = process.cwd()

  describe('1. Media Upload Client & Limits Specification', () => {
    it('strictly satisfies all system media requirements', () => {
      // Foto: Maksimal 2 MB, JPG, JPEG, atau PNG
      expect(MEDIA_LIMITS.IMAGE.MAX_SIZE_BYTES).toBe(2 * 1024 * 1024)
      expect(MEDIA_LIMITS.IMAGE.HARD_MAX_BYTES).toBe(25 * 1024 * 1024)
      expect(MEDIA_LIMITS.IMAGE.ALLOWED_EXTENSIONS).toEqual([
        'jpg',
        'jpeg',
        'png',
      ])
      expect(MEDIA_LIMITS.IMAGE.ALLOWED_MIME_TYPES).toEqual([
        'image/jpeg',
        'image/png',
      ])

      // Video: Maksimal 30 MB, MP4 non-VP9, durasi 10-60 detik, resolusi maks 1280x1280
      expect(MEDIA_LIMITS.VIDEO.MAX_SIZE_BYTES).toBe(30 * 1024 * 1024)
      expect(MEDIA_LIMITS.VIDEO.MIN_DURATION_SECONDS).toBe(10)
      expect(MEDIA_LIMITS.VIDEO.MAX_DURATION_SECONDS).toBe(60)
      expect(MEDIA_LIMITS.VIDEO.MAX_RESOLUTION).toBe(1280)
      expect(MEDIA_LIMITS.VIDEO.ALLOWED_EXTENSIONS).toEqual(['mp4'])
      expect(MEDIA_LIMITS.VIDEO.ALLOWED_MIME_TYPES).toEqual(['video/mp4'])
    })

    it('rejects image files with invalid extension or MIME type', async () => {
      const invalidFiles = [
        new File(['dummy'], 'photo.gif', { type: 'image/gif' }),
        new File(['dummy'], 'photo.webp', { type: 'image/webp' }),
        new File(['dummy'], 'document.pdf', { type: 'application/pdf' }),
        new File(['dummy'], 'script.exe', { type: 'application/x-msdownload' }),
      ]

      for (const file of invalidFiles) {
        await expect(validateAndCompressImage(file)).rejects.toThrow(
          'Format file tidak didukung. Format foto harus JPG, JPEG, atau PNG.'
        )
      }
    })

    it('rejects oversized images exceeding hard limit (> 25MB)', async () => {
      const oversizedImage = {
        name: 'giant.jpg',
        type: 'image/jpeg',
        size: 26 * 1024 * 1024,
      } as unknown as File

      await expect(validateAndCompressImage(oversizedImage)).rejects.toThrow(
        'Ukuran file terlalu besar. Maksimal 2 MB per foto.'
      )
    })

    it('passes valid images <= 2 MB without modification in non-browser env', async () => {
      const validJpg = new File(['small image content'], 'camera.jpg', {
        type: 'image/jpeg',
      })
      const result = await validateAndCompressImage(validJpg)
      expect(result).toBe(validJpg)
      expect(result.size).toBeLessThanOrEqual(2 * 1024 * 1024)
    })

    it('rejects videos with invalid extensions, non-mp4 format, or VP9 codec', async () => {
      const invalidVideos = [
        new File(['dummy'], 'clip.webm', { type: 'video/webm' }),
        new File(['dummy'], 'clip.mov', { type: 'video/quicktime' }),
        new File(['dummy'], 'clip.mkv', { type: 'video/x-matroska' }),
        new File(['dummy'], 'clip.avi', { type: 'video/x-msvideo' }),
        new File(['dummy'], 'vp9.mp4', { type: 'video/mp4; codecs=vp9' }),
      ]

      for (const file of invalidVideos) {
        await expect(validateVideo(file)).rejects.toThrow(
          'Format file harus MP4 (tidak mendukung format VP9).'
        )
      }
    })

    it('rejects oversized videos exceeding 30 MB', async () => {
      const oversizedVideo = {
        name: 'video_35mb.mp4',
        type: 'video/mp4',
        size: 35 * 1024 * 1024,
      } as unknown as File

      await expect(validateVideo(oversizedVideo)).rejects.toThrow(
        'Ukuran file terlalu besar. Maksimal 30 MB.'
      )
    })

    it('unified processMediaUploadFile accurately routes images and videos', async () => {
      const validPhoto = new File(['valid'], 'sample.png', {
        type: 'image/png',
      })
      const processedPhoto = await processMediaUploadFile(validPhoto)
      expect(processedPhoto).toBe(validPhoto)

      const validVideo = new File(['valid mp4'], 'sample.mp4', {
        type: 'video/mp4',
      })
      const processedVideo = await processMediaUploadFile(validVideo)
      expect(processedVideo).toBe(validVideo)
    })
  })

  describe('2. Server Route Logic & Sharp Verification (/api/upload & /api/products/upload-images)', () => {
    it('verifies /api/upload has Sharp compression, PNG white flatten, and proper error handling', () => {
      const uploadRoutePath = path.join(
        rootDir,
        'src',
        'app',
        'api',
        'upload',
        'route.ts'
      )
      const content = fs.readFileSync(uploadRoutePath, 'utf-8')

      // Cek library & validasi dasar
      expect(content).toContain("import sharp from 'sharp'")
      expect(content).toContain('IMAGE_MAX_SIZE = 2 * 1024 * 1024')
      expect(content).toContain('VIDEO_MAX_SIZE = 30 * 1024 * 1024')
      expect(content).toContain('!file || file.size === 0')

      // Cek transparansi PNG di-flatten ke latar belakang putih sebelum konversi JPEG
      expect(content).toContain(".flatten({ background: '#ffffff' })")
      expect(content).toContain('.jpeg({ quality: 80, progressive: true })')

      // Cek pesan error server sesuai spesifikasi
      expect(content).toContain(
        'Format file tidak didukung. Format foto harus JPG, JPEG, atau PNG.'
      )
      expect(content).toContain(
        'Ukuran file terlalu besar. Maksimal 2 MB per foto.'
      )
      expect(content).toContain(
        'Format file harus MP4 (tidak mendukung format VP9).'
      )
      expect(content).toContain('Ukuran file terlalu besar. Maksimal 30 MB.')
    })

    it('verifies /api/products/upload-images has Sharp batch processing and white flatten', () => {
      const productUploadPath = path.join(
        rootDir,
        'src',
        'app',
        'api',
        'products',
        'upload-images',
        'route.ts'
      )
      const content = fs.readFileSync(productUploadPath, 'utf-8')

      expect(content).toContain("import sharp from 'sharp'")
      expect(content).toContain('IMAGE_MAX_SIZE = 2 * 1024 * 1024')
      expect(content).toContain('VIDEO_MAX_SIZE = 30 * 1024 * 1024')
      expect(content).toContain(".flatten({ background: '#ffffff' })")
      expect(content).toContain('Maksimal 2 MB per foto.')
      expect(content).toContain('harus MP4 (tidak mendukung format VP9).')
      expect(content).toContain('Maksimal 30 MB.')
    })
  })

  describe('3. Customer & Admin Chat Upload Integration', () => {
    it('verifies customer chat uses processMediaUploadFile and clean accept', () => {
      const customerChatPath = path.join(
        rootDir,
        'src',
        'app',
        'dashboard',
        'customer',
        'chat',
        'page.tsx'
      )
      const content = fs.readFileSync(customerChatPath, 'utf-8')

      expect(content).toContain(
        "import { processMediaUploadFile } from '@/lib/media-upload-client'"
      )
      expect(content).toContain('await processMediaUploadFile(file)')
      expect(content).toContain('accept="image/jpeg,image/png,video/mp4"')
      expect(content).not.toContain(
        'Hanya file foto (JPG, PNG, WebP) dan video (MP4, WebM, MOV)'
      )
    })

    it('verifies admin chat uses processMediaUploadFile and clean accept', () => {
      const adminChatPath = path.join(
        rootDir,
        'src',
        'app',
        'dashboard',
        'admin',
        'chat',
        'page.tsx'
      )
      const content = fs.readFileSync(adminChatPath, 'utf-8')

      expect(content).toContain(
        "import { processMediaUploadFile } from '@/lib/media-upload-client'"
      )
      expect(content).toContain('await processMediaUploadFile(file)')
      expect(content).toContain('accept="image/jpeg,image/png,video/mp4"')
      expect(content).not.toContain(
        'Hanya file foto (JPG, PNG, WebP) dan video (MP4, WebM, MOV)'
      )
    })

    it('verifies floating chat button has mounted input element and auto-compression', () => {
      const floatingChatPath = path.join(
        rootDir,
        'src',
        'components',
        'chat',
        'floating-chat-button.tsx'
      )
      const content = fs.readFileSync(floatingChatPath, 'utf-8')

      expect(content).toContain(
        "import { validateAndCompressImage } from '@/lib/media-upload-client'"
      )
      expect(content).toContain('await validateAndCompressImage(file)')
      expect(content).toContain('ref={fileInputRef}')
      expect(content).toContain('accept="image/jpeg,image/png"')
    })

    it('verifies customer order chat admin page uses validateAndCompressImage', () => {
      const orderChatPath = path.join(
        rootDir,
        'src',
        'app',
        'dashboard',
        'customer',
        'chat',
        'admin',
        '[orderId]',
        'page.tsx'
      )
      const content = fs.readFileSync(orderChatPath, 'utf-8')

      expect(content).toContain(
        "import { validateAndCompressImage } from '@/lib/media-upload-client'"
      )
      expect(content).toContain('await validateAndCompressImage(file)')
      expect(content).toContain('accept="image/jpeg,image/png"')
    })
  })

  describe('4. Ads Management Modals Upload & Base64 Fallback Elimination', () => {
    it('verifies create-ad-modal eliminates dangerous base64 fallback and uses processMediaUploadFile', () => {
      const createAdModalPath = path.join(
        rootDir,
        'src',
        'components',
        'admin',
        'ads',
        'modals',
        'create-ad-modal.tsx'
      )
      const content = fs.readFileSync(createAdModalPath, 'utf-8')

      expect(content).toContain(
        "import { processMediaUploadFile } from '@/lib/media-upload-client'"
      )
      expect(content).toContain('await processMediaUploadFile(file)')
      expect(content).toContain('accept="image/jpeg,image/png,video/mp4"')
      // Dangerous fallback readAsDataURL should not exist in upload block
      expect(content).not.toContain('reader.readAsDataURL(file)')
    })

    it('verifies change-media-modal eliminates dangerous base64 fallback and uses processMediaUploadFile', () => {
      const changeMediaModalPath = path.join(
        rootDir,
        'src',
        'components',
        'admin',
        'ads',
        'modals',
        'change-media-modal.tsx'
      )
      const content = fs.readFileSync(changeMediaModalPath, 'utf-8')

      expect(content).toContain(
        "import { processMediaUploadFile } from '@/lib/media-upload-client'"
      )
      expect(content).toContain('await processMediaUploadFile(file)')
      expect(content).toContain('accept="image/jpeg,image/png,video/mp4"')
      expect(content).not.toContain('reader.readAsDataURL(file)')
    })
  })

  describe('5. Product Creation & Edit Media Validation', () => {
    it('verifies products/new integrates validateAndCompressImage and validateVideo', () => {
      const productNewPath = path.join(
        rootDir,
        'src',
        'app',
        'dashboard',
        'admin',
        'products',
        'new',
        'page.tsx'
      )
      const content = fs.readFileSync(productNewPath, 'utf-8')

      expect(content).toContain('import {')
      expect(content).toContain('validateAndCompressImage,')
      expect(content).toContain('validateVideo,')
      expect(content).toContain("from '@/lib/media-upload-client'")
      expect(content).toContain('await validateVideo(f)')
      expect(content).toContain('await validateAndCompressImage(f)')
      expect(content).toContain('await validateAndCompressImage(file)')
      expect(content).toContain('accept="image/jpeg,image/png,video/mp4"')
    })

    it('verifies products/[id]/edit integrates validateAndCompressImage and validateVideo', () => {
      const productEditPath = path.join(
        rootDir,
        'src',
        'app',
        'dashboard',
        'admin',
        'products',
        '[id]',
        'edit',
        'page.tsx'
      )
      const content = fs.readFileSync(productEditPath, 'utf-8')

      expect(content).toContain('import {')
      expect(content).toContain('validateAndCompressImage,')
      expect(content).toContain('validateVideo,')
      expect(content).toContain("from '@/lib/media-upload-client'")
      expect(content).toContain('await validateVideo(f)')
      expect(content).toContain('await validateAndCompressImage(f)')
      expect(content).toContain('await validateAndCompressImage(file)')
      expect(content).toContain('accept="image/jpeg,image/png,video/mp4"')
    })
  })

  describe('6. Admin Settings & Reviews System Media Consistency', () => {
    it('verifies admin settings page integrates validateAndCompressImage across all banner & logo slots', () => {
      const settingsPath = path.join(
        rootDir,
        'src',
        'app',
        'dashboard',
        'admin',
        'settings',
        'page.tsx'
      )
      const content = fs.readFileSync(settingsPath, 'utf-8')

      expect(content).toContain(
        "import { validateAndCompressImage } from '@/lib/media-upload-client'"
      )
      expect(content).toContain('await validateAndCompressImage(file)')
      expect(content).toContain('accept="image/jpeg,image/png"')
    })

    it('verifies review modals, forms, and complaint modals use processMediaUploadFile', () => {
      const checkFiles = [
        path.join(rootDir, 'src', 'components', 'reviews', 'review-modal.tsx'),
        path.join(rootDir, 'src', 'components', 'reviews', 'review-form.tsx'),
        path.join(rootDir, 'src', 'components', 'modals', 'rating-modal.tsx'),
        path.join(
          rootDir,
          'src',
          'components',
          'customer',
          'complaint-modal.tsx'
        ),
        path.join(
          rootDir,
          'src',
          'components',
          'gadget',
          'product-review-modal.tsx'
        ),
        path.join(rootDir, 'src', 'components', 'upload', 'image-upload.tsx'),
        path.join(
          rootDir,
          'src',
          'components',
          'upload',
          'multi-image-upload.tsx'
        ),
      ]

      for (const filePath of checkFiles) {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const hasProcessor =
          fileContent.includes('processMediaUploadFile') ||
          fileContent.includes('validateAndCompressImage')
        expect(hasProcessor).toBe(true)
      }
    })
  })
})
