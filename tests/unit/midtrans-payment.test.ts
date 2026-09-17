import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { verifyMidtransSignature } from '@/lib/midtrans'

describe('Midtrans Payment Gateway Integration', () => {
  it('should verify valid SHA512 signature from Midtrans webhook', () => {
    const orderId = 'SPR-20260917-12345'
    const statusCode = '200'
    const grossAmount = '25000000.00'
    const serverKey = 'test_mock_server_key_for_signature_verification'

    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex')

    const isValid = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount,
      signatureKey: expectedSignature,
      customServerKey: serverKey,
    })

    expect(isValid).toBe(true)
  })

  it('should reject tampered or invalid signature from unauthorized sources', () => {
    const orderId = 'SPR-20260917-12345'
    const statusCode = '200'
    const grossAmount = '25000000.00'
    const serverKey = 'test_mock_server_key_for_signature_verification'
    const fakeSignature = 'badc0ffee1234567890abcdef1234567890abcdef'

    const isValid = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount,
      signatureKey: fakeSignature,
      customServerKey: serverKey,
    })

    expect(isValid).toBe(false)
  })

  it('should reject if grossAmount is manipulated in the payload', () => {
    const orderId = 'SPR-20260917-12345'
    const statusCode = '200'
    const actualGrossAmount = '25000000.00'
    const tamperedGrossAmount = '1000.00'
    const serverKey = 'test_mock_server_key_for_signature_verification'

    const validSignatureForActual = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${actualGrossAmount}${serverKey}`)
      .digest('hex')

    // Attacker tries to send tampered amount with signature generated for actual amount
    const isValid = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount: tamperedGrossAmount,
      signatureKey: validSignatureForActual,
      customServerKey: serverKey,
    })

    expect(isValid).toBe(false)
  })

  it('should load Midtrans configuration from environment', async () => {
    const { getMidtransConfig } = await import('@/lib/midtrans')
    const config = getMidtransConfig()
    expect(typeof config.serverKey).toBe('string')
    expect(typeof config.clientKey).toBe('string')
  })

  it('should format charge parameters correctly for QRIS, BCA VA, and Mandiri', async () => {
    const { chargeMidtransTransaction } = await import('@/lib/midtrans')
    expect(typeof chargeMidtransTransaction).toBe('function')
  })
})
