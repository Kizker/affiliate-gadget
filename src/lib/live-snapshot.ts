/**
 * Helper to capture video frames and upload live snapshots for dynamic sharing thumbnails
 */

/**
 * Capture current frame from HTMLVideoElement as a JPEG base64 string
 */
export function captureVideoSnapshot(
  video: HTMLVideoElement | null,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.85,
  isMirrored?: boolean
): string | null {
  try {
    if (!video || !video.videoWidth || !video.videoHeight) return null

    const srcW = video.videoWidth
    const srcH = video.videoHeight

    // Calculate dimensions preserving aspect ratio
    let targetW = srcW
    let targetH = srcH

    if (targetW > maxWidth || targetH > maxHeight) {
      const ratio = Math.min(maxWidth / targetW, maxHeight / targetH)
      targetW = Math.round(targetW * ratio)
      targetH = Math.round(targetH * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Deteksi apakah video sedang di-mirror (baik dari parameter atau style transform)
    const shouldMirror =
      typeof isMirrored === 'boolean'
        ? isMirrored
        : (video.style.transform || '').includes('scaleX(-1)')

    if (shouldMirror) {
      // Mirror / balik kanvas secara horizontal sebelum menggambar frame
      ctx.translate(targetW, 0)
      ctx.scale(-1, 1)
    }

    // Draw the current video frame onto canvas
    ctx.drawImage(video, 0, 0, targetW, targetH)

    return canvas.toDataURL('image/jpeg', quality)
  } catch (err) {
    console.error('Failed to capture video snapshot:', err)
    return null
  }
}

/**
 * Upload snapshot to server to be used as OpenGraph / WhatsApp thumbnail
 */
export async function uploadLiveSnapshot(
  streamId: string,
  imageBase64: string
): Promise<string | null> {
  if (!streamId || !imageBase64) return null
  try {
    const res = await fetch(`/api/live-streams/${streamId}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    })
    const json = await res.json()
    if (json.success && json.url) {
      return json.url
    }
  } catch (err) {
    // Non-blocking error
    console.warn('Upload live snapshot non-critical error:', err)
  }
  return null
}
