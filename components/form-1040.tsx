
"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Form1040Props {
  taxReturn: any
  className?: string
}

export function Form1040({ taxReturn, className }: Form1040Props) {
  // Calculate derived values
  const totalDeduction = Math.max(
    Number(taxReturn.standardDeduction) || 0, 
    Number(taxReturn.itemizedDeduction) || 0
  )
  
  const isRefund = Number(taxReturn.refundAmount) > 0
  const finalAmount = isRefund ? Number(taxReturn.refundAmount) : Number(taxReturn.amountOwed)

  // Get W-2 information
  const w2Income = taxReturn.incomeEntries?.find((entry: any) => entry.incomeType === 'W2_WAGES')
  const totalWithholding = taxReturn.incomeEntries?.reduce((sum: number, entry: any) => {
    // If this is W-2 income, add federal withholding from extracted data
    if (entry.incomeType === 'W2_WAGES' && entry.extractedEntries?.length > 0) {
      const extractedData = entry.extractedEntries[0]?.extractedData as any
      return sum + (Number(extractedData?.federalIncomeTaxWithheld) || 0)
    }
    return sum
  }, 0) || 0

  return (
    <div className={`max-w-4xl mx-auto bg-white ${className}`}>
      {/* Form Header */}
      <div className="border-2 border-black p-4 mb-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Form 1040</h1>
          <p className="text-lg mb-2">U.S. Individual Income Tax Return</p>
          <p className="text-base">Tax Year {taxReturn.taxYear}</p>
        </div>
      </div>

      {/* Filing Status */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Filing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border border-black flex items-center justify-center">
                  {taxReturn.filingStatus === 'SINGLE' && <span>✓</span>}
                </div>
                <span>Single</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border border-black flex items-center justify-center">
                  {taxReturn.filingStatus === 'MARRIED_FILING_JOINTLY' && <span>✓</span>}
                </div>
                <span>Married filing jointly</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border border-black flex items-center justify-center">
                  {taxReturn.filingStatus === 'MARRIED_FILING_SEPARATELY' && <span>✓</span>}
                </div>
                <span>Married filing separately</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border border-black flex items-center justify-center">
                  {taxReturn.filingStatus === 'HEAD_OF_HOUSEHOLD' && <span>✓</span>}
                </div>
                <span>Head of household</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border border-black flex items-center justify-center">
                  {taxReturn.filingStatus === 'QUALIFYING_SURVIVING_SPOUSE' && <span>✓</span>}
                </div>
                <span>Qualifying surviving spouse</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="mb-2">
                <label className="text-sm font-medium">First name and middle initial</label>
                <div className="border-b border-black pb-1 min-h-[24px]">
                  {taxReturn.firstName || ''}
                </div>
              </div>
              <div className="mb-2">
                <label className="text-sm font-medium">Last name</label>
                <div className="border-b border-black pb-1 min-h-[24px]">
                  {taxReturn.lastName || ''}
                </div>
              </div>
            </div>
            {taxReturn.filingStatus === 'MARRIED_FILING_JOINTLY' && (
              <div>
                <div className="mb-2">
                  <label className="text-sm font-medium">Spouse's first name and middle initial</label>
                  <div className="border-b border-black pb-1 min-h-[24px]">
                    {taxReturn.spouseFirstName || ''}
                  </div>
                </div>
                <div className="mb-2">
                  <label className="text-sm font-medium">Spouse's last name</label>
                  <div className="border-b border-black pb-1 min-h-[24px]">
                    {taxReturn.spouseLastName || ''}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="text-sm font-medium">Home address</label>
            <div className="border-b border-black pb-1 min-h-[24px]">
              {taxReturn.address || ''}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">City</label>
              <div className="border-b border-black pb-1 min-h-[24px]">
                {taxReturn.city || ''}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">State</label>
              <div className="border-b border-black pb-1 min-h-[24px]">
                {taxReturn.state || ''}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">ZIP code</label>
              <div className="border-b border-black pb-1 min-h-[24px]">
                {taxReturn.zipCode || ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">1a. Wages, salaries, tips, etc. (Attach Form W-2)</span>
              <span className="font-mono text-right min-w-[100px] border-b border-black pb-1">
                {Number(taxReturn.totalIncome).toLocaleString()}
              </span>
            </div>
            
            {taxReturn.incomeEntries?.filter((entry: any) => entry.incomeType !== 'W2_WAGES').map((entry: any, index: number) => (
              <div key={entry.id} className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">
                  {index + 2}. {entry.incomeType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
                <span className="font-mono text-right min-w-[100px] border-b border-black pb-1">
                  {Number(entry.amount).toLocaleString()}
                </span>
              </div>
            ))}
            
            <div className="flex justify-between items-center font-bold text-lg border-t-2 border-black pt-2">
              <span>7b. Total income</span>
              <span className="font-mono text-right min-w-[100px] border-b-2 border-black pb-1">
                {Number(taxReturn.totalIncome).toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center font-bold text-lg">
              <span>11. Adjusted gross income</span>
              <span className="font-mono text-right min-w-[100px] border-b-2 border-black pb-1">
                {Number(taxReturn.adjustedGrossIncome).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standard Deduction and Taxable Income */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Standard Deduction and Taxable Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">
                12a. Standard deduction or itemized deductions
              </span>
              <span className="font-mono text-right min-w-[100px] border-b border-black pb-1">
                {totalDeduction.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center font-bold text-lg border-t border-black pt-2">
              <span>15. Taxable income</span>
              <span className="font-mono text-right min-w-[100px] border-b-2 border-black pb-1">
                {Number(taxReturn.taxableIncome).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax and Credits */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Tax and Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">16. Tax (from Tax Table or Tax Computation Worksheet)</span>
              <span className="font-mono text-right min-w-[100px] border-b border-black pb-1">
                {Number(taxReturn.taxLiability).toLocaleString()}
              </span>
            </div>
            
            {Number(taxReturn.totalCredits) > 0 && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">19. Child tax credit and credit for other dependents</span>
                <span className="font-mono text-right min-w-[100px] border-b border-black pb-1">
                  {Number(taxReturn.totalCredits).toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center font-bold text-lg border-t border-black pt-2">
              <span>22. Total tax</span>
              <span className="font-mono text-right min-w-[100px] border-b-2 border-black pb-1">
                {Math.max(0, Number(taxReturn.taxLiability) - Number(taxReturn.totalCredits)).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">25a. Federal income tax withheld from Forms W-2 and 1099</span>
              <span className="font-mono text-right min-w-[100px] border-b border-black pb-1">
                {totalWithholding.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center font-bold text-lg border-t border-black pt-2">
              <span>33. Total payments</span>
              <span className="font-mono text-right min-w-[100px] border-b-2 border-black pb-1">
                {totalWithholding.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refund or Amount Owed */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Refund or Amount You Owe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isRefund ? (
              <div className="flex justify-between items-center font-bold text-xl text-green-600 bg-green-50 p-3 rounded">
                <span>34. Refund</span>
                <span className="font-mono text-right min-w-[100px]">
                  ${finalAmount.toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center font-bold text-xl text-red-600 bg-red-50 p-3 rounded">
                <span>37. Amount you owe</span>
                <span className="font-mono text-right min-w-[100px]">
                  ${finalAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dependents */}
      {taxReturn.dependents && taxReturn.dependents.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Dependents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border border-black">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-black p-2 text-left">First name Last name</th>
                    <th className="border border-black p-2 text-left">Social security number</th>
                    <th className="border border-black p-2 text-left">Relationship</th>
                    <th className="border border-black p-2 text-center">Child tax credit</th>
                  </tr>
                </thead>
                <tbody>
                  {taxReturn.dependents.map((dependent: any) => (
                    <tr key={dependent.id}>
                      <td className="border border-black p-2">
                        {dependent.firstName} {dependent.lastName}
                      </td>
                      <td className="border border-black p-2">
                        {dependent.ssn || '***-**-****'}
                      </td>
                      <td className="border border-black p-2">
                        {dependent.relationship}
                      </td>
                      <td className="border border-black p-2 text-center">
                        {dependent.qualifiesForCTC && <span>✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature Section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Sign Here</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            Under penalties of perjury, I declare that I have examined this return and accompanying schedules and statements, 
            and to the best of my knowledge and belief, they are true, correct, and complete.
          </p>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <label className="text-sm font-medium">Your signature</label>
                <div className="border-b border-black pb-1 min-h-[40px] mt-2"></div>
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <div className="border-b border-black pb-1 min-h-[24px] mt-2"></div>
              </div>
            </div>
            
            {taxReturn.filingStatus === 'MARRIED_FILING_JOINTLY' && (
              <div>
                <div className="mb-4">
                  <label className="text-sm font-medium">Spouse's signature</label>
                  <div className="border-b border-black pb-1 min-h-[40px] mt-2"></div>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <div className="border-b border-black pb-1 min-h-[24px] mt-2"></div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
