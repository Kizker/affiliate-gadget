import { VideoPresets, type RoomOptions } from 'livekit-client'

/**
 * Konfigurasi Room HOST (publisher).
 * - Capture 720p@30fps (resolusi tinggi, stabil untuk uplink rumahan/toko).
 * - Simulcast aktif: host mengirim beberapa layer (360p / 540p / 720p) sekaligus.
 *   Penonton dengan jaringan lemah otomatis mendapat layer lebih rendah,
 *   penonton dengan jaringan bagus tetap menerima 720p.
 * - Dynacast: layer yang tidak ditonton siapa pun dihentikan -> hemat uplink host.
 */
export const HOST_ROOM_OPTIONS: RoomOptions = {
  dynacast: true,
  adaptiveStream: false,
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
  },
  audioCaptureDefaults: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  publishDefaults: {
    simulcast: true,
    videoCodec: 'vp8',
    videoEncoding: {
      maxBitrate: 2_500_000,
      maxFramerate: 30,
    },
    videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h540],
    // Saat jaringan host turun, pertahankan ketajaman & turunkan fps lebih dulu
    degradationPreference: 'maintain-resolution',
  },
}

/**
 * Konfigurasi Room VIEWER (subscriber).
 * - adaptiveStream: resolusi yang diminta menyesuaikan ukuran elemen video
 *   dan kualitas jaringan; saat lag otomatis turun ke layer lebih rendah
 *   lalu naik lagi ke resolusi tinggi ketika jaringan pulih.
 * - dynacast: ikut mengoptimalkan pengiriman layer dari host.
 */
export const VIEWER_ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: { pauseVideoInBackground: true },
  dynacast: true,
}
