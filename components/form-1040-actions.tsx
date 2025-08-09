
"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  FileText, 
  Printer, 
  Eye, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'
import { PDFGenerator } from '@/lib/pdf-generator'
import { validateForm1040Data, Form1040Data } from '@/lib/form-1040-data-mapper'

interface Form1040ActionsProps {
  formData: Form1040Data
  onPreview?: () => void
  disabled?: boolean
}

export function Form1040Actions({ formData, onPreview, disabled = false }: Form1040ActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Validate form data
  const validation = validateForm1040Data(formData)
  const isValid = validation.isValid
  
  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      const formElement = document.querySelector('[data-form-1040]') as HTMLElement
      if (!formElement) {
        throw new Error('Form not found. Please refresh the page and try again.')
      }
      
      const filename = `form-1040-${formData.taxYear}-${formData.lastName?.toLowerCase()}.pdf`
      await PDFGenerator.generatePDFFromElement(formElement, filename)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleDownloadImage = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      const formElement = document.querySelector('[data-form-1040]') as HTMLElement
      if (!formElement) {
        throw new Error('Form not found. Please refresh the page and try again.')
      }
      
      const filename = `form-1040-${formData.taxYear}-${formData.lastName?.toLowerCase()}.png`
      await PDFGenerator.downloadAsImage(formElement, filename)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download image')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handlePrint = () => {
    try {
      setError(null)
      PDFGenerator.printForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print form')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Form 1040 Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Status */}
        {!isValid && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div>
                <p className="font-medium mb-2">Missing required information:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {validation.missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
                <p className="text-sm mt-2">
                  Please complete all required fields before downloading the form.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {isValid && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Form 1040 is ready for download. All required fields are completed.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {onPreview && (
            <Button
              variant="outline"
              onClick={onPreview}
              disabled={disabled}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </Button>
          )}
          
          <Button
            onClick={handlePrint}
            disabled={disabled || !isValid}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
          
          <Button
            onClick={handleDownloadPDF}
            disabled={disabled || isGenerating || !isValid}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
          </Button>
          
          <Button
            onClick={handleDownloadImage}
            disabled={disabled || isGenerating || !isValid}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isGenerating ? 'Generating...' : 'Download PNG'}</span>
          </Button>
        </div>
        
        <div className="text-xs text-gray-600 mt-4">
          <p>
            • PDF format is recommended for filing with the IRS
          </p>
          <p>
            • PNG format is useful for preview and record keeping
          </p>
          <p>
            • Always verify all information before filing
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
