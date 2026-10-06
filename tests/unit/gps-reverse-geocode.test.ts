import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/geo/reverse/route'
import { NextRequest } from 'next/server'

describe('GPS Reverse Geocoding API & Address Auto-Fill Suite', () => {
  it('1. should return normalized address object for Jakarta coordinates', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/geo/reverse?lat=-6.2088&lng=106.8456'
    )
    const res = await GET(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.lat).toBeCloseTo(-6.2088)
    expect(data.lng).toBeCloseTo(106.8456)
    expect(data.fullAddress).toBeDefined()
    expect(typeof data.fullAddress).toBe('string')
    expect(data.fullAddress.length).toBeGreaterThan(0)
    expect(data.province).toBeDefined()
  })

  it('2. should handle fallback default coordinates safely when params are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/geo/reverse')
    const res = await GET(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.fullAddress).toBeDefined()
  })
})
