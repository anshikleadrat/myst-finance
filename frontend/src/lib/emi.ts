export type EmiResult = {
  emi: number
  totalPayment: number
  totalInterest: number
  yearly: { year: number; principal: number; interest: number; balance: number }[]
}

/** Standard reducing-balance EMI with a yearly amortisation summary. */
export function calculateEmi(principal: number, annualRatePercent: number, months: number): EmiResult {
  const r = annualRatePercent / 12 / 100
  const emi = r === 0 ? principal / months : (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1)

  const yearly: EmiResult['yearly'] = []
  let balance = principal
  for (let month = 1; month <= months; month++) {
    const interest = balance * r
    const principalPart = Math.min(emi - interest, balance)
    balance = Math.max(balance - principalPart, 0)
    const year = Math.ceil(month / 12)
    const row = yearly[year - 1] ?? (yearly[year - 1] = { year, principal: 0, interest: 0, balance: 0 })
    row.principal += principalPart
    row.interest += interest
    row.balance = balance
  }

  const totalPayment = emi * months
  return {
    emi: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalPayment - principal),
    yearly: yearly.map((row) => ({
      year: row.year,
      principal: Math.round(row.principal),
      interest: Math.round(row.interest),
      balance: Math.round(row.balance),
    })),
  }
}
