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
const SIMULCAST_LAYER_LOW = new VideoPreset(480, 270, 300_000, 20)
const SIMULCAST_LAYER_MID = new VideoPreset(640, 360, 600_000, 24)

/**
 * Konfigurasi Room HOST (publisher).
 * - Capture 720p@30fps (tajam tapi ringan untuk encoder & uplink).
 * - Simulcast 3 layer (270p / 360p / 720p): penonton lemah otomatis dapat
 *   layer rendah, penonton bagus tetap 720p.
 * - Dynacast: layer yang tidak ditonton siapa pun dimatikan -> hemat CPU & uplink.
 * - Bitrate 720p 1.2 Mbps: jauh lebih stabil pada jaringan mobile/broadband Indonesia.
 * - degradationPreference 'maintain-framerate': menjaga gerakan video tetap mulus & tidak membeku/freeze saat fluktuasi jaringan.
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
      maxBitrate: 1_200_000,
      maxFramerate: 30,
    },
    videoSimulcastLayers: [SIMULCAST_LAYER_LOW, SIMULCAST_LAYER_MID],
    degradationPreference: 'maintain-framerate',
    audioPreset: AudioPresets.speech,
    dtx: true,
    red: true,
  },
}

/**
 * Konfigurasi Room VIEWER (subscriber).
 * - adaptiveStream: { pauseVideoInBackground: false } agar video tidak membeku saat scroll atau drawer terbuka.
 * - dynacast: ikut mengoptimalkan pengiriman layer dari host.
 * - webAudioMix: diaktifkan (true) agar seluruh audio diarahkan lewat AudioContext / Web Audio API
 *   yang otomatis memetakan keluaran ke Loudspeaker (Speaker Media HP) seperti YouTube, bukan earpiece panggilan telepon.
 */
export const VIEWER_ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: { pauseVideoInBackground: false },
  dynacast: true,
  webAudioMix: true,
  disconnectOnPageLeave: true,
}
