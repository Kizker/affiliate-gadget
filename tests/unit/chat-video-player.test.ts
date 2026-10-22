import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Chat Video Player Minimalist Inline & Complete Fullscreen Suite', () => {
  const rootDir = process.cwd()
  const chatVideoPlayerPath = path.join(
    rootDir,
    'src',
    'components',
    'chat',
    'chat-video-player.tsx'
  )
  const chatMessageBubblePath = path.join(
    rootDir,
    'src',
    'components',
    'customer',
    'chat',
    'chat-message-bubble.tsx'
  )
  const adminChatPath = path.join(
    rootDir,
    'src',
    'app',
    'dashboard',
    'admin',
    'chat',
    'page.tsx'
  )
  const customerMediaModalPath = path.join(
    rootDir,
    'src',
    'components',
    'customer',
    'chat',
    'chat-media-modal.tsx'
  )

  const chatVideoPlayerContent = fs.readFileSync(chatVideoPlayerPath, 'utf-8')
  const chatMessageBubbleContent = fs.readFileSync(
    chatMessageBubblePath,
    'utf-8'
  )
  const adminChatContent = fs.readFileSync(adminChatPath, 'utf-8')
  const customerMediaModalContent = fs.readFileSync(
    customerMediaModalPath,
    'utf-8'
  )

  describe('1. ChatVideoPlayer Component Structure', () => {
    it('does not have controls attribute on inline video to prevent native browser overlay clutter', () => {
      // Inline video in bubble MUST NOT have controls attribute
      expect(chatVideoPlayerContent).not.toMatch(
        /<video[^>]*\bcontrols\b[^>]*>/i
      )
      expect(chatVideoPlayerContent).toContain('playsInline')
      expect(chatVideoPlayerContent).toContain('ref={videoRef}')
    })

    it('renders only play/pause button and fullscreen button for minimalist bubble player', () => {
      // Center play/pause toggle button
      expect(chatVideoPlayerContent).toContain('<Play')
      expect(chatVideoPlayerContent).toContain('<Pause')
      expect(chatVideoPlayerContent).toContain('togglePlay')

      // Top-right fullscreen toggle button
      expect(chatVideoPlayerContent).toContain('<Maximize2')
      expect(chatVideoPlayerContent).toContain('handleFullscreen')
      expect(chatVideoPlayerContent).toContain('onOpenFullscreen')
    })

    it('pauses inline video when entering fullscreen to prevent audio/video overlap', () => {
      expect(chatVideoPlayerContent).toContain('videoRef.current.pause()')
      expect(chatVideoPlayerContent).toContain('setIsPlaying(false)')
    })
  })

  describe('2. Customer Chat Bubble Integration', () => {
    it('uses ChatVideoPlayer for video media messages instead of raw controls', () => {
      expect(chatMessageBubbleContent).toContain(
        "import { ChatVideoPlayer } from '@/components/chat/chat-video-player'"
      )
      expect(chatMessageBubbleContent).toContain('<ChatVideoPlayer')
      expect(chatMessageBubbleContent).toContain('src={msg.mediaUrl!}')
      expect(chatMessageBubbleContent).toContain('onOpenFullscreen=')
      // Ensure raw controls video was removed from bubble
      expect(chatMessageBubbleContent).not.toMatch(
        /<video[^>]*\bcontrols\b[^>]*>/i
      )
    })
  })

  describe('3. Admin Chat Bubble Integration', () => {
    it('uses ChatVideoPlayer for admin chat video messages', () => {
      expect(adminChatContent).toContain(
        "import { ChatVideoPlayer } from '@/components/chat/chat-video-player'"
      )
      expect(adminChatContent).toContain('<ChatVideoPlayer')
      expect(adminChatContent).toContain('src={message.mediaUrl!}')
      expect(adminChatContent).toContain('setFullscreenMedia')
    })
  })

  describe('4. Fullscreen Modal Complete Player', () => {
    it('customer chat media modal renders video with full native controls', () => {
      expect(customerMediaModalContent).toMatch(
        /<video[^>]*\bcontrols\b[^>]*>/i
      )
      expect(customerMediaModalContent).toContain('autoPlay')
      expect(customerMediaModalContent).toContain('playsInline')
    })

    it('admin chat fullscreen modal renders video with full native controls', () => {
      expect(adminChatContent).toMatch(
        /fullscreenMedia\.type === 'video'[\s\S]*?<video[^>]*\bcontrols\b[^>]*>/
      )
    })
  })
})
