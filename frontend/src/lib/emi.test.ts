import { describe, expect, it } from 'vitest'
import { calculateEmi } from './emi'

describe('calculateEmi', () => {
  it('matches the standard reducing-balance formula', () => {
    const result = calculateEmi(500_000, 12, 36)
    expect(result.emi).toBe(16_607)
    expect(result.totalPayment).toBe(597_858)
    expect(result.totalInterest).toBe(result.totalPayment - 500_000)
  })

  it('handles a zero interest rate', () => {
    expect(calculateEmi(120_000, 0, 12)).toMatchObject({ emi: 10_000, totalInterest: 0 })
  })

  it('amortises to a zero balance with one row per year', () => {
    const { yearly } = calculateEmi(100_000, 14, 30)
    expect(yearly).toHaveLength(3)
    expect(yearly.at(-1)!.balance).toBe(0)
    expect(yearly.reduce((sum, row) => sum + row.principal, 0)).toBeCloseTo(100_000, -1)
  })
})
