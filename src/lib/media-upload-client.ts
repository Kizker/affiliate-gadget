/**
 * Media Upload Helper & Client-Side Compression Utility
 *
 * Persyaratan:
 * 1. Image (Foto Produk / Galeri Media / Review Produk, Mitra, dan Servis):
 *    - Ukuran file: Maksimal 2 MB per foto.
 *    - Format file: JPG, JPEG, atau PNG.
 *    - Auto-compress jika file > 2 MB menggunakan HTML5 Canvas.
 *    - Error handling jika file terlalu besar (> 25MB atau setelah kompresi masih > 2MB).
 *
 * 2. Video:
 *    - Ukuran file: Maksimal 30 MB.
 *    - Format file: MP4 (tidak mendukung format VP9).
 *    - Durasi: 10 sampai 60 detik.
 *    - Resolusi: Maksimal 1280 x 1280 piksel.
 */

export const MEDIA_LIMITS = {
  IMAGE: {
    MAX_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB
    HARD_MAX_BYTES: 25 * 1024 * 1024, // 25 MB
    ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png'],
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png'],
  },
  VIDEO: {
    MAX_SIZE_BYTES: 30 * 1024 * 1024, // 30 MB
    MIN_DURATION_SECONDS: 10,
    MAX_DURATION_SECONDS: 60,
    MAX_RESOLUTION: 1280, // 1280 x 1280
    ALLOWED_EXTENSIONS: ['mp4'],
    ALLOWED_MIME_TYPES: ['video/mp4'],
  },
} as const

/**
 * Validasi dan kompres foto jika ukuran melebihi 2 MB.
 */
export async function validateAndCompressImage(file: File): Promise<File> {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const isExtensionValid = (
    MEDIA_LIMITS.IMAGE.ALLOWED_EXTENSIONS as readonly string[]
  ).includes(extension)
  const isMimeValid =
    (MEDIA_LIMITS.IMAGE.ALLOWED_MIME_TYPES as readonly string[]).includes(
      file.type
    ) || file.type === 'image/*'

  if (!isExtensionValid && !isMimeValid) {
    throw new Error(
      'Format file tidak didukung. Format foto harus JPG, JPEG, atau PNG.'
    )
  }

  // Jika ukuran sudah di bawah atau sama dengan 2 MB, tidak perlu kompresi
  if (file.size <= MEDIA_LIMITS.IMAGE.MAX_SIZE_BYTES) {
    return file
  }

  // Jika file terlalu besar melampaui batas wajar
  if (file.size > MEDIA_LIMITS.IMAGE.HARD_MAX_BYTES) {
    throw new Error('Ukuran file terlalu besar. Maksimal 2 MB per foto.')
  }

  // Lingkungan non-browser (SSR/test)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file
  }

  return new Promise<File>((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl)
      try {
        let width = img.width
        let height = img.height

        // Downscale jika resolusi foto sangat raksasa (> 2048px)
        const maxDim = 2048
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Gagal menginisialisasi canvas untuk kompresi foto.')
        }

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // Coba kompresi bertahap dengan penurunan quality
        const qualities = [0.85, 0.72, 0.58, 0.45]
        let finalBlob: Blob | null = null

        for (const quality of qualities) {
          const blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, 'image/jpeg', quality)
          )
          if (blob && blob.size <= MEDIA_LIMITS.IMAGE.MAX_SIZE_BYTES) {
            finalBlob = blob
            break
          }
          finalBlob = blob
        }

        // Jika masih lebih dari 2MB, lakukan scaling dimensi tambahan
        if (finalBlob && finalBlob.size > MEDIA_LIMITS.IMAGE.MAX_SIZE_BYTES) {
          const scaledCanvas = document.createElement('canvas')
          scaledCanvas.width = Math.round(width * 0.7)
          scaledCanvas.height = Math.round(height * 0.7)
          const scaledCtx = scaledCanvas.getContext('2d')
          if (scaledCtx) {
            scaledCtx.fillStyle = '#ffffff'
            scaledCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height)
            scaledCtx.drawImage(
              canvas,
              0,
              0,
              scaledCanvas.width,
              scaledCanvas.height
            )
            finalBlob = await new Promise<Blob | null>((res) =>
              scaledCanvas.toBlob(res, 'image/jpeg', 0.6)
            )
          }
        }

        if (!finalBlob || finalBlob.size > MEDIA_LIMITS.IMAGE.MAX_SIZE_BYTES) {
          reject(
            new Error('Ukuran file terlalu besar. Maksimal 2 MB per foto.')
          )
          return
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
        const compressedFile = new File([finalBlob], cleanName, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })

        resolve(compressedFile)
      } catch (err: any) {
        reject(
          new Error(
            err.message || 'Ukuran file terlalu besar. Maksimal 2 MB per foto.'
          )
        )
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Gagal membaca data foto. Pastikan file tidak rusak.'))
    }

    img.src = objectUrl
  })
}

/**
 * Validasi spesifikasi video ulasan.
 * - Format: MP4 (tidak mendukung VP9)
 * - Ukuran: Maks 30 MB
 * - Durasi: 10 - 60 detik
 * - Resolusi: Maks 1280 x 1280 px
 */
export async function validateVideo(file: File): Promise<{
  duration: number
  width: number
  height: number
}> {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const isExtensionMp4 = extension === 'mp4'
  const isMimeMp4 = file.type === 'video/mp4' || file.type === 'video/*'
  const isVp9 =
    file.type.toLowerCase().includes('vp9') ||
    file.type.toLowerCase().includes('webm')

  if (!isExtensionMp4 || !isMimeMp4 || isVp9) {
    throw new Error('Format file harus MP4 (tidak mendukung format VP9).')
  }

  // Ukuran file: Maksimal 30 MB
  if (file.size > MEDIA_LIMITS.VIDEO.MAX_SIZE_BYTES) {
    throw new Error('Ukuran file terlalu besar. Maksimal 30 MB.')
  }

  // Validasi durasi dan resolusi di browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { duration: 0, width: 0, height: 0 }
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const objectUrl = URL.createObjectURL(file)

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      video.remove()
    }

    video.onloadedmetadata = () => {
      const duration = video.duration
      const width = video.videoWidth
      const height = video.videoHeight
      cleanup()

      // Validasi durasi: 10 sampai 60 detik
      if (
        isNaN(duration) ||
        duration < MEDIA_LIMITS.VIDEO.MIN_DURATION_SECONDS
      ) {
        reject(
          new Error(
            `Durasi video terlalu singkat. Durasi harus antara 10 sampai 60 detik (saat ini ${Math.round(duration || 0)} detik).`
          )
        )
        return
      }

      if (duration > MEDIA_LIMITS.VIDEO.MAX_DURATION_SECONDS) {
        reject(
          new Error(
            `Durasi video terlalu panjang. Durasi harus antara 10 sampai 60 detik (saat ini ${Math.round(duration)} detik).`
          )
        )
        return
      }

      // Validasi resolusi: Maksimal 1280 x 1280 piksel
      if (
        width > MEDIA_LIMITS.VIDEO.MAX_RESOLUTION ||
        height > MEDIA_LIMITS.VIDEO.MAX_RESOLUTION
      ) {
        reject(
          new Error(
            `Resolusi video maksimal 1280 x 1280 piksel (saat ini ${width} x ${height} piksel).`
          )
        )
        return
      }

      resolve({ duration, width, height })
    }

    video.onerror = () => {
      cleanup()
      reject(
        new Error(
          'Format file video tidak dapat diputar atau format tidak didukung (harus MP4 non-VP9).'
        )
      )
    }

    video.src = objectUrl
  })
}

/**
 * Helper terpadu: mendeteksi apakah file adalah gambar atau video,
 * lalu memvalidasi dan memproses sesuai ketentuan.
 */
export async function processMediaUploadFile(file: File): Promise<File> {
  const isVideo =
    file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4')

  if (isVideo) {
    await validateVideo(file)
    return file
  } else {
    return await validateAndCompressImage(file)
  }
}
