import {
  AudioPresets,
  VideoPresets,
  VideoPreset,
  type RoomOptions,
} from 'livekit-client'

/**
 * Layer simulcast dengan bitrate & fps eksplisit supaya tiap layer stabil
 * (tidak "pecah-pecah") dan perpindahan antar layer terasa mulus.
 */
const SIMULCAST_LAYER_LOW = new VideoPreset(640, 360, 450_000, 24)
const SIMULCAST_LAYER_MID = new VideoPreset(960, 540, 1_000_000, 30)

/**
 * Konfigurasi Room HOST (publisher).
 * - Capture 720p@30fps (tajam tapi ringan untuk encoder & uplink).
 * - Simulcast 3 layer (360p / 540p / 720p): penonton lemah otomatis dapat
 *   layer rendah, penonton bagus tetap 720p.
 * - Dynacast: layer yang tidak ditonton siapa pun dimatikan -> hemat CPU & uplink.
 * - Bitrate 720p dibatasi 1.8 Mbps: cukup tajam untuk 720p dan jauh lebih
 *   tahan jitter dibanding 2.5 Mbps (pemicu blok/pecah saat jaringan naik-turun).
 * - degradationPreference 'maintain-resolution': saat berat, turunkan fps
 *   dulu, bukan ketajaman.
 * - Audio: Opus + DTX + RED (tahan packet loss) dengan preset speech (latensi rendah).
 */
export const HOST_ROOM_OPTIONS: RoomOptions = {
  dynacast: true,
  adaptiveStream: false,
  disconnectOnPageLeave: true,
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
      maxBitrate: 1_800_000,
      maxFramerate: 30,
    },
    videoSimulcastLayers: [SIMULCAST_LAYER_LOW, SIMULCAST_LAYER_MID],
    degradationPreference: 'maintain-resolution',
    audioPreset: AudioPresets.speech,
    dtx: true,
    red: true,
  },
}

/**
 * Konfigurasi Room VIEWER (subscriber).
 * - adaptiveStream: resolusi yang diminta mengikuti ukuran elemen video &
 *   kualitas jaringan; turun saat lag, naik lagi saat pulih.
 * - dynacast: ikut mengoptimalkan pengiriman layer dari host.
 * - webAudioMix dimatikan: audio diputar langsung lewat elemen <audio>
 *   (latensi lebih rendah, CPU lebih ringan di HP).
 */
export const VIEWER_ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: { pauseVideoInBackground: true },
  dynacast: true,
  webAudioMix: false,
  disconnectOnPageLeave: true,
}
