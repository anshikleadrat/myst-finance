import { describe, expect, it } from 'vitest'
import { formatDate, formatINR, formatINRCompact } from './format'

describe('format', () => {
  it('uses Indian digit grouping', () => {
    expect(formatINR(1_000_000)).toBe('₹10,00,000')
    expect(formatINR(199)).toBe('₹199')
  })

  it('compacts lakhs and crores per locale', () => {
    expect(formatINRCompact(5_500_000, 'en')).toBe('₹55 L')
    expect(formatINRCompact(10_000_000, 'hi')).toBe('₹1 करोड़')
    expect(formatINRCompact(50_000, 'en')).toBe('₹50,000')
  })

  it('formats dates in IST regardless of server timezone', () => {
    // 20:00 UTC is already the next day in India.
    expect(formatDate('2026-10-24T20:00:00Z', 'en')).toBe('25 Oct 2026')
  })
})
