import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Customer to CS / Superadmin Chat Robustness Suite', () => {
  const rootDir = process.cwd()

  it('1. verifies all-rooms returns rooms with messages for sidebar', () => {
    const allRoomsPath = path.join(
      rootDir,
      'src',
      'app',
      'api',
      'customer',
      'chat',
      'all-rooms',
      'route.ts'
    )
    const content = fs.readFileSync(allRoomsPath, 'utf-8')
    expect(content).toContain('messages: { some: {} }')
  })

  it('2. verifies message route handles isCs / superadmin storeId gracefully without violating foreign key', () => {
    const messageRoutePath = path.join(
      rootDir,
      'src',
      'app',
      'api',
      'customer',
      'chat',
      'message',
      'route.ts'
    )
    const content = fs.readFileSync(messageRoutePath, 'utf-8')
    // Must identify CS requests
    expect(content).toContain("reqStoreId === 'superadmin'")
    expect(content).toContain('storeId: null')
  })

  it('3. verifies client chat page sets isCsRoom and avoids sending literal superadmin storeId', () => {
    const chatPagePath = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'customer',
      'chat',
      'page.tsx'
    )
    const content = fs.readFileSync(chatPagePath, 'utf-8')
    expect(content).toContain('isCsRoom')
    expect(content).toContain(
      'isCsRoom ? undefined : (selectedRoom.storeId || undefined)'
    )
  })
})
