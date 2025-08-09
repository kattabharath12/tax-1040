
import { writeFile } from 'fs/promises'

/**
 * Alternative document processing using LLM API for OCR and data extraction
 * This is a fallback when Google Document AI is not available
 */

export interface ExtractedTaxData {
  documentType: string
  ocrText: string
  extractedData: any
  confidence: number
  processingMethod: 'llm_api_extraction'
}

export class AlternativeDocumentProcessor {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.ABACUSAI_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('LLM API key not found. Please set ABACUSAI_API_KEY environment variable.')
    }
  }

  async processDocument(document: any): Promise<ExtractedTaxData> {
    console.log("AlternativeDocumentProcessor: Starting LLM-based processing...")
    
    try {
      // Read the document file
      const { readFile } = await import("fs/promises")
      const { existsSync } = await import("fs")
      
      if (!existsSync(document.filePath)) {
        throw new Error(`File not found: ${document.filePath}`)
      }
      
      const fileBuffer = await readFile(document.filePath)
      console.log("AlternativeDocumentProcessor: File read successfully, size:", fileBuffer.length)

      // Convert to base64 for API
      const base64String = fileBuffer.toString('base64')
      
      // Determine MIME type
      let mimeType = 'application/pdf'
      if (document.filePath?.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png'
      } else if (document.filePath?.toLowerCase().endsWith('.jpg') || document.filePath?.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (document.filePath?.toLowerCase().endsWith('.tiff') || document.filePath?.toLowerCase().endsWith('.tif')) {
        mimeType = 'image/tiff'
      }

      // Create the LLM API request
      const messages = [{
        role: "user",
        content: [
          {
            type: "text",
            text: this.getExtractionPrompt(document.documentType)
          },
          {
            type: mimeType.startsWith('image/') ? "image_url" : "file",
            [mimeType.startsWith('image/') ? 'image_url' : 'file']: mimeType.startsWith('image/') 
              ? { url: `data:${mimeType};base64,${base64String}` }
              : { filename: document.fileName || "document.pdf", file_data: `data:${mimeType};base64,${base64String}` }
          }
        ]
      }]

      console.log("AlternativeDocumentProcessor: Sending request to LLM API...")

      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages,
          response_format: { type: "json_object" },
          max_tokens: 3000,
          temperature: 0.1 // Low temperature for consistent extraction
        })
      })

      if (!response.ok) {
        throw new Error(`LLM API request failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.choices?.[0]?.message?.content) {
        throw new Error('No content returned from LLM API')
      }

      // Parse the JSON response
      let extractedContent
      try {
        extractedContent = JSON.parse(result.choices[0].message.content)
      } catch (parseError) {
        console.error("Failed to parse LLM response:", result.choices[0].message.content)
        throw new Error('Failed to parse extraction results')
      }

      // Validate and structure the response
      const extractedTaxData: ExtractedTaxData = {
        documentType: document.documentType,
        ocrText: extractedContent.ocrText || '',
        extractedData: this.validateAndCleanExtractedData(extractedContent.extractedData, document.documentType),
        confidence: extractedContent.confidence || 0.8,
        processingMethod: 'llm_api_extraction'
      }

      console.log("AlternativeDocumentProcessor: Processing completed successfully")
      return extractedTaxData

    } catch (error) {
      console.error("AlternativeDocumentProcessor: Processing failed:", error)
      throw error
    }
  }

  private getExtractionPrompt(documentType: string): string {
    const basePrompt = `
You are an expert tax document processor. Extract information from this tax document image/PDF.

CRITICAL INSTRUCTIONS:
1. Extract ALL visible text as OCR text
2. Identify and extract key tax information fields
3. Return data in the exact JSON format specified below
4. Use empty strings for fields that are not visible or unclear
5. For monetary amounts, extract numbers only (no $ signs or commas)
6. Be very accurate with numbers - double check all amounts

`

    const formatInstructions = `
Respond with clean JSON only. Do not include code blocks, markdown, or any other formatting.

JSON format:
{
  "ocrText": "Complete text content of the document",
  "extractedData": {
    ${this.getFieldsForDocumentType(documentType)}
  },
  "confidence": 0.85
}
`

    switch (documentType) {
      case 'W2':
        return basePrompt + `
This appears to be a W-2 tax form. Focus on extracting:
- Employee and employer information
- Box 1: Wages, tips, other compensation
- Box 2: Federal income tax withheld  
- Box 3: Social security wages
- Box 4: Social security tax withheld
- Box 5: Medicare wages and tips
- Box 6: Medicare tax withheld
- State tax information

` + formatInstructions

      case 'FORM_1099_INT':
        return basePrompt + `
This appears to be a 1099-INT form. Focus on extracting:
- Payer and recipient information
- Box 1: Interest income
- Box 4: Federal income tax withheld
- Box 8: Tax-exempt interest
- State tax information

` + formatInstructions

      case 'FORM_1099_DIV':
        return basePrompt + `
This appears to be a 1099-DIV form. Focus on extracting:
- Payer and recipient information  
- Box 1a: Ordinary dividends
- Box 1b: Qualified dividends
- Box 2a: Total capital gain distributions
- Box 4: Federal income tax withheld

` + formatInstructions

      default:
        return basePrompt + `
This is a tax document. Extract all relevant tax information including:
- Names and addresses
- Tax identification numbers
- Income amounts
- Tax withheld amounts
- Any other tax-relevant information

` + formatInstructions
    }
  }

  private getFieldsForDocumentType(documentType: string): string {
    switch (documentType) {
      case 'W2':
        return `
    "employeeName": "",
    "employeeSSN": "",
    "employeeAddress": "",
    "employerName": "",
    "employerEIN": "",
    "employerAddress": "",
    "wages": "",
    "federalTaxWithheld": "",
    "socialSecurityWages": "",
    "socialSecurityTaxWithheld": "",
    "medicareWages": "",
    "medicareTaxWithheld": "",
    "socialSecurityTips": "",
    "allocatedTips": "",
    "stateWages": "",
    "stateTaxWithheld": "",
    "localWages": "",
    "localTaxWithheld": ""
`

      case 'FORM_1099_INT':
        return `
    "payerName": "",
    "payerTIN": "",
    "payerAddress": "",
    "recipientName": "",
    "recipientTIN": "",
    "recipientAddress": "",
    "interestIncome": "",
    "earlyWithdrawalPenalty": "",
    "interestOnUSavingsBonds": "",
    "federalTaxWithheld": "",
    "investmentExpenses": "",
    "foreignTaxPaid": "",
    "foreignCountry": "",
    "taxExemptInterest": "",
    "stateCode": "",
    "stateTaxWithheld": "",
    "stateIdNumber": ""
`

      case 'FORM_1099_DIV':
        return `
    "payerName": "",
    "payerTIN": "",
    "payerAddress": "",
    "recipientName": "",
    "recipientTIN": "",
    "recipientAddress": "",
    "ordinaryDividends": "",
    "qualifiedDividends": "",
    "totalCapitalGain": "",
    "nondividendDistributions": "",
    "federalTaxWithheld": "",
    "section199ADividends": "",
    "investmentExpenses": "",
    "foreignTaxPaid": "",
    "foreignCountry": "",
    "stateCode": "",
    "stateTaxWithheld": "",
    "stateIdNumber": ""
`

      default:
        return `
    "payerName": "",
    "payerTIN": "",
    "recipientName": "",
    "recipientTIN": "",
    "incomeAmount": "",
    "taxWithheld": "",
    "additionalInfo": ""
`
    }
  }

  private validateAndCleanExtractedData(data: any, documentType: string): any {
    if (!data) return {}

    // Clean monetary values - remove $ and commas, keep only numbers and decimals
    const cleanMoneyFields = (obj: any) => {
      const cleaned = { ...obj }
      for (const [key, value] of Object.entries(cleaned)) {
        if (typeof value === 'string' && value.length > 0) {
          // Check if this looks like a monetary field
          if (key.toLowerCase().includes('wage') || 
              key.toLowerCase().includes('tax') || 
              key.toLowerCase().includes('income') ||
              key.toLowerCase().includes('amount') ||
              key.toLowerCase().includes('dividend') ||
              key.toLowerCase().includes('interest') ||
              key.toLowerCase().includes('compensation')) {
            // Clean the value - remove everything except numbers and decimal points
            const cleanedValue = value.replace(/[^0-9.]/g, '')
            cleaned[key] = cleanedValue
          }
        }
      }
      return cleaned
    }

    return cleanMoneyFields(data)
  }
}

// Factory function to create the alternative processor
export function createAlternativeDocumentProcessor(): AlternativeDocumentProcessor {
  return new AlternativeDocumentProcessor()
}
