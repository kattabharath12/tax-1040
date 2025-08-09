
/**
 * Data mapping utility for Form 1040
 * Maps tax return data from the database to proper Form 1040 structure
 */

import { Decimal } from '@prisma/client/runtime/library'

export interface Form1040Data {
  // Filing Status
  filingStatus: string
  
  // Personal Information
  firstName: string
  lastName: string
  spouseFirstName?: string
  spouseLastName?: string
  address: string
  city: string
  state: string
  zipCode: string
  
  // Income
  w2Wages: number
  interestIncome: number
  dividendIncome: number
  businessIncome: number
  capitalGains: number
  otherIncome: number
  totalIncome: number
  adjustedGrossIncome: number
  
  // Deductions
  standardDeduction: number
  itemizedDeduction: number
  totalDeduction: number
  taxableIncome: number
  
  // Tax Calculation
  taxLiability: number
  childTaxCredit: number
  earnedIncomeCredit: number
  totalCredits: number
  totalTax: number
  
  // Payments and Withholding
  federalWithholding: number
  estimatedTax: number
  totalPayments: number
  
  // Final Amounts
  refundAmount: number
  amountOwed: number
  
  // Dependents
  dependents: Array<{
    firstName: string
    lastName: string
    ssn?: string
    relationship: string
    qualifiesForCTC: boolean
    qualifiesForEITC: boolean
  }>
  
  // Supporting Details
  taxYear: number
  hasW2: boolean
  has1099: boolean
}

/**
 * Convert Decimal to number safely
 */
function decimalToNumber(value: Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  // Handle Decimal type
  return Number(value.toString()) || 0
}

/**
 * Map tax return data from database to Form 1040 structure
 */
export function mapTaxReturnToForm1040(taxReturn: any): Form1040Data {
  // Process income entries
  const incomeEntries = taxReturn.incomeEntries || []
  const w2Wages = incomeEntries
    .filter((entry: any) => entry.incomeType === 'W2_WAGES')
    .reduce((sum: number, entry: any) => sum + decimalToNumber(entry.amount), 0)
  
  const interestIncome = incomeEntries
    .filter((entry: any) => entry.incomeType === 'INTEREST')
    .reduce((sum: number, entry: any) => sum + decimalToNumber(entry.amount), 0)
  
  const dividendIncome = incomeEntries
    .filter((entry: any) => entry.incomeType === 'DIVIDENDS')
    .reduce((sum: number, entry: any) => sum + decimalToNumber(entry.amount), 0)
  
  const businessIncome = incomeEntries
    .filter((entry: any) => entry.incomeType === 'BUSINESS_INCOME')
    .reduce((sum: number, entry: any) => sum + decimalToNumber(entry.amount), 0)
  
  const capitalGains = incomeEntries
    .filter((entry: any) => entry.incomeType === 'CAPITAL_GAINS')
    .reduce((sum: number, entry: any) => sum + decimalToNumber(entry.amount), 0)
  
  const otherIncome = incomeEntries
    .filter((entry: any) => !['W2_WAGES', 'INTEREST', 'DIVIDENDS', 'BUSINESS_INCOME', 'CAPITAL_GAINS'].includes(entry.incomeType))
    .reduce((sum: number, entry: any) => sum + decimalToNumber(entry.amount), 0)

  // Calculate federal withholding from W-2 data
  const federalWithholding = incomeEntries
    .filter((entry: any) => entry.incomeType === 'W2_WAGES')
    .reduce((sum: number, entry: any) => {
      // Look for extracted W-2 data with federal withholding
      if (entry.extractedEntries?.length > 0) {
        const extractedData = entry.extractedEntries[0]?.extractedData as any
        return sum + (Number(extractedData?.federalIncomeTaxWithheld) || 0)
      }
      return sum
    }, 0)

  // Process deductions
  const standardDeduction = decimalToNumber(taxReturn.standardDeduction)
  const itemizedDeduction = decimalToNumber(taxReturn.itemizedDeduction)
  const totalDeduction = Math.max(standardDeduction, itemizedDeduction)

  // Process dependents
  const dependents = (taxReturn.dependents || []).map((dependent: any) => ({
    firstName: dependent.firstName || '',
    lastName: dependent.lastName || '',
    ssn: dependent.ssn,
    relationship: dependent.relationship || '',
    qualifiesForCTC: Boolean(dependent.qualifiesForCTC),
    qualifiesForEITC: Boolean(dependent.qualifiesForEITC),
  }))

  // Calculate final amounts
  const totalIncome = decimalToNumber(taxReturn.totalIncome)
  const adjustedGrossIncome = decimalToNumber(taxReturn.adjustedGrossIncome)
  const taxableIncome = decimalToNumber(taxReturn.taxableIncome)
  const taxLiability = decimalToNumber(taxReturn.taxLiability)
  const totalCredits = decimalToNumber(taxReturn.totalCredits)
  const totalTax = Math.max(0, taxLiability - totalCredits)
  const totalPayments = federalWithholding // Add other payments as needed
  
  const isRefund = decimalToNumber(taxReturn.refundAmount) > 0
  const refundAmount = isRefund ? decimalToNumber(taxReturn.refundAmount) : 0
  const amountOwed = !isRefund ? decimalToNumber(taxReturn.amountOwed) : 0

  return {
    // Filing Status
    filingStatus: taxReturn.filingStatus || 'SINGLE',
    
    // Personal Information
    firstName: taxReturn.firstName || '',
    lastName: taxReturn.lastName || '',
    spouseFirstName: taxReturn.spouseFirstName,
    spouseLastName: taxReturn.spouseLastName,
    address: taxReturn.address || '',
    city: taxReturn.city || '',
    state: taxReturn.state || '',
    zipCode: taxReturn.zipCode || '',
    
    // Income
    w2Wages,
    interestIncome,
    dividendIncome,
    businessIncome,
    capitalGains,
    otherIncome,
    totalIncome,
    adjustedGrossIncome,
    
    // Deductions
    standardDeduction,
    itemizedDeduction,
    totalDeduction,
    taxableIncome,
    
    // Tax Calculation
    taxLiability,
    childTaxCredit: totalCredits, // Simplified - could be more granular
    earnedIncomeCredit: 0, // Could be calculated separately
    totalCredits,
    totalTax,
    
    // Payments and Withholding
    federalWithholding,
    estimatedTax: 0, // Not implemented yet
    totalPayments,
    
    // Final Amounts
    refundAmount,
    amountOwed,
    
    // Dependents
    dependents,
    
    // Supporting Details
    taxYear: taxReturn.taxYear || new Date().getFullYear() - 1,
    hasW2: incomeEntries.some((entry: any) => entry.incomeType === 'W2_WAGES'),
    has1099: incomeEntries.some((entry: any) => entry.incomeType.includes('1099') || ['INTEREST', 'DIVIDENDS'].includes(entry.incomeType)),
  }
}

/**
 * Validate Form 1040 data completeness
 */
export function validateForm1040Data(data: Form1040Data): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = []
  
  if (!data.firstName.trim()) missingFields.push('First Name')
  if (!data.lastName.trim()) missingFields.push('Last Name')
  if (!data.address.trim()) missingFields.push('Address')
  if (!data.city.trim()) missingFields.push('City')
  if (!data.state.trim()) missingFields.push('State')
  if (!data.zipCode.trim()) missingFields.push('ZIP Code')
  
  if (data.filingStatus === 'MARRIED_FILING_JOINTLY') {
    if (!data.spouseFirstName?.trim()) missingFields.push('Spouse First Name')
    if (!data.spouseLastName?.trim()) missingFields.push('Spouse Last Name')
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}
