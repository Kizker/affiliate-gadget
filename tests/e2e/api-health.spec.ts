import { test, expect } from '@playwright/test'

/**
 * HaloTekno - API Health Check Tests
 * Tests all API endpoints for availability and basic responses
 */

test.describe('API Health Check', () => {
  test('GET /api/blog returns valid response', async ({ request }) => {
    const response = await request.get('/api/blog')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toBeDefined()
  })

  test('GET /api/products returns valid response', async ({ request }) => {
    const response = await request.get('/api/products')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toBeDefined()
  })

  test('GET /api/rental-items returns valid response', async ({ request }) => {
    const response = await request.get('/api/rental-items')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toBeDefined()
  })

  test('GET /api/technicians returns valid response', async ({ request }) => {
    const response = await request.get('/api/technicians')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toBeDefined()
  })

  test('GET /api/mitra/list returns valid response', async ({ request }) => {
    const response = await request.get('/api/mitra/list')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toBeDefined()
  })

  test('GET /api/auth/session returns valid response', async ({ request }) => {
    const response = await request.get('/api/auth/session')
    // Should return 200 (empty session for unauthenticated)
    expect(response.status()).toBe(200)
  })
})

test.describe('API Error Handling', () => {
  test('GET /api/products/invalid-id returns 404', async ({ request }) => {
    const response = await request.get('/api/products/invalid-id-12345')
    expect([404, 400]).toContain(response.status())
  })

  test('POST to protected endpoint without auth returns 401', async ({
    request,
  }) => {
    const response = await request.post('/api/admin/products', {
      data: { name: 'Test' },
    })
    expect(response.status()).toBe(401)
  })
})
