import { describe, it, expect } from 'vitest'
import { validateAWB, detectCourierFromAWB } from '@/lib/shipping/awb-validator'
import {
  detectShippingException,
  formatExceptionForCustomer,
  formatExceptionForAdmin,
} from '@/lib/shipping/exception-detector'
import type { TrackingCheckpoint } from '@/lib/shipping/biteship-client'

describe('AWB Validation & Courier Auto-Detect Engine', () => {
  it('validates standard JNE waybills accurately', () => {
    expect(validateAWB('JNE260923123456', 'JNE').valid).toBe(true)
    expect(validateAWB('JNE9998887770', 'JNE').valid).toBe(true)
    expect(validateAWB('jne1234567890', 'JNE').valid).toBe(true) // case-insensitive
    expect(validateAWB('GK-12345678', 'JNE').valid).toBe(false)
    expect(validateAWB('12345', 'JNE').valid).toBe(false)
  })

  it('validates Gojek instant waybills accurately', () => {
    expect(validateAWB('GK-260923123456', 'GOJEK').valid).toBe(true)
    expect(validateAWB('GK-987654321012', 'GOJEK').valid).toBe(true)
    expect(validateAWB('gk-123456789012', 'GOJEK').valid).toBe(true) // case-insensitive
    expect(validateAWB('JNE12345678', 'GOJEK').valid).toBe(false)
    expect(validateAWB('GK-short', 'GOJEK').valid).toBe(false)
  })

  it('validates Biteship waybill format (WYB-xxxx) accurately', () => {
    expect(validateAWB('WYB-1790144159838').valid).toBe(true)
    expect(validateAWB('wyb-1790144159838').valid).toBe(true)
    expect(validateAWB('WYB1790144159838').valid).toBe(true)
    expect(detectCourierFromAWB('WYB-1790144159838')).toBe('JNE')
  })

  it('validates platform Order Number format (SPR-xxxx / ORD-xxxx) accurately', () => {
    expect(validateAWB('SPR-20260923-F9C71677').valid).toBe(true)
    expect(validateAWB('#SPR-20260923-F9C71677').valid).toBe(true)
    expect(validateAWB('ORD-20260921-9999').valid).toBe(true)
  })

  it('auto-detects courier from waybill prefix', () => {
    expect(detectCourierFromAWB('JNE260923123456')).toBe('JNE')
    expect(detectCourierFromAWB('GK-260923123456')).toBe('GOJEK')
    expect(detectCourierFromAWB('WYB-1790144159838')).toBe('JNE')
    expect(detectCourierFromAWB('UNKNOWN123')).toBeNull()
  })
})

describe('Shipping Exception Detector Engine', () => {
  it('returns NONE when no checkpoints exist', () => {
    const exception = detectShippingException([])
    expect(exception.type).toBe('NONE')
    expect(exception.actionRequired).toBe(false)
    expect(exception.showClaimButton).toBe(false)
  })

  it('detects DELAYED exception from checkpoints', () => {
    const checkpoints: TrackingCheckpoint[] = [
      {
        id: 'cp-1',
        status: 'MANIFESTED',
        description: 'Paket telah diterima di agen',
        location: 'Jakarta',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'cp-2',
        status: 'DELAYED',
        description: 'Pengiriman tertunda karena cuaca buruk',
        location: 'Semarang Hub',
        timestamp: new Date().toISOString(),
      },
    ]

    const exception = detectShippingException(checkpoints)
    expect(exception.type).toBe('DELAYED')
    expect(exception.severity).toBe('MEDIUM')
    expect(exception.label).toBe('Pengiriman Tertunda')
    expect(exception.actionRequired).toBe(false)
    expect(formatExceptionForCustomer(exception)).toContain('Tertunda')
    expect(formatExceptionForAdmin(exception)).toContain('Tertunda')
  })

  it('detects ADDRESS_NOT_FOUND exception and provides action advice', () => {
    const checkpoints: TrackingCheckpoint[] = [
      {
        id: 'cp-1',
        status: 'OUT_FOR_DELIVERY',
        description: 'Paket dibawa kurir',
        location: 'Bandung',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'cp-2',
        status: 'FAILED',
        description:
          'Gagal antar: alamat penerima tidak ditemukan / rumah kosong',
        location: 'Bandung',
        timestamp: new Date().toISOString(),
      },
    ]

    const exception = detectShippingException(checkpoints)
    expect(exception.type).toBe('ADDRESS_NOT_FOUND')
    expect(exception.severity).toBe('HIGH')
    expect(exception.customerAction).toBeDefined()
    expect(exception.actionRequired).toBe(true)
  })

  it('detects DAMAGED exception and activates insurance claim button', () => {
    const checkpoints: TrackingCheckpoint[] = [
      {
        id: 'cp-1',
        status: 'DAMAGED',
        description: 'Kemasan paket rusak saat transit di sorting hub',
        location: 'Surabaya Gateway',
        timestamp: new Date().toISOString(),
      },
    ]

    const exception = detectShippingException(checkpoints)
    expect(exception.type).toBe('DAMAGED')
    expect(exception.severity).toBe('CRITICAL')
    expect(exception.showClaimButton).toBe(true)
  })

  it('detects LOST exception and activates insurance claim button', () => {
    const checkpoints: TrackingCheckpoint[] = [
      {
        id: 'cp-1',
        status: 'LOST',
        description: 'Paket dinyatakan hilang dalam perjalanan',
        location: 'Transit Hub',
        timestamp: new Date().toISOString(),
      },
    ]

    const exception = detectShippingException(checkpoints)
    expect(exception.type).toBe('LOST')
    expect(exception.severity).toBe('CRITICAL')
    expect(exception.showClaimButton).toBe(true)
  })
})
