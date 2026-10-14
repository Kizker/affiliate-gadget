import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { VIEWER_ROOM_OPTIONS } from '@/lib/livekit-options'

describe('Live Stream Mobile Speaker & Audio Autoplay Engine', () => {
  it('enables webAudioMix in VIEWER_ROOM_OPTIONS for loudspeaker media routing', () => {
    // webAudioMix must be true so audio routes to phone loudspeaker (media stream like YouTube),
    // not phone call earpiece.
    expect(VIEWER_ROOM_OPTIONS.webAudioMix).toBe(true)
  })

  it('implements AudioAutoPlayer with automatic gesture unlock and volume 1.0 in LiveKitStreamPlayer', () => {
    const subscriberFilePath = path.resolve(
      process.cwd(),
      'src/components/live/livekit-subscriber-video.tsx'
    )
    const subscriberContent = fs.readFileSync(subscriberFilePath, 'utf-8')

    // 1. Should import useRoomContext and RoomEvent
    expect(subscriberContent).toContain('useRoomContext')
    expect(subscriberContent).toContain('RoomEvent')

    // 2. Should configure RoomAudioRenderer with full volume 1.0 and synchronized muted state
    expect(subscriberContent).toContain(
      '<RoomAudioRenderer volume={1.0} muted={isMuted} />'
    )

    // 3. Should render AudioAutoPlayer to handle mobile browser autoplay policy
    expect(subscriberContent).toContain('<AudioAutoPlayer isMuted={isMuted}')

    // 4. AudioAutoPlayer must call room.startAudio() on connection and user gestures
    expect(subscriberContent).toContain('room.startAudio()')
    expect(subscriberContent).toContain('RoomEvent.AudioPlaybackStatusChanged')
    expect(subscriberContent).toContain("window.addEventListener('touchstart'")
    expect(subscriberContent).toContain("window.addEventListener('pointerdown'")

    // 5. Video element must be muted independently so it does not trigger browser video autoplay blocks
    expect(subscriberContent).toContain('el.muted = true')
    expect(subscriberContent).toContain('el.playsInline = true')
  })
})
