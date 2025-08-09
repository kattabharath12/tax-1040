
"use client"

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * PDF Generation Service for Form 1040
 */
export class PDFGenerator {
  /**
   * Generate PDF from HTML element
   */
  static async generatePDFFromElement(
    element: HTMLElement, 
    filename: string = 'form-1040.pdf'
  ): Promise<void> {
    try {
      // Create canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure all styles are applied in cloned document
          const clonedElement = clonedDoc.querySelector('[data-form-1040]') as HTMLElement
          if (clonedElement) {
            clonedElement.style.backgroundColor = '#ffffff'
            clonedElement.style.color = '#000000'
          }
        }
      })
      
      const imgData = canvas.toDataURL('image/png')
      
      // Calculate PDF dimensions
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = imgWidth / imgHeight
      
      // Standard US Letter size
      const pdfWidth = 8.5 * 25.4 // 8.5 inches to mm
      const pdfHeight = 11 * 25.4 // 11 inches to mm
      
      // Calculate image dimensions to fit page
      let finalWidth = pdfWidth - 20 // 10mm margin on each side
      let finalHeight = finalWidth / ratio
      
      // If height exceeds page, scale down
      if (finalHeight > pdfHeight - 20) {
        finalHeight = pdfHeight - 20 // 10mm margin top and bottom
        finalWidth = finalHeight * ratio
      }
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: finalHeight > finalWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'letter'
      })
      
      // Add image to PDF
      pdf.addImage(
        imgData, 
        'PNG', 
        (pdfWidth - finalWidth) / 2, // Center horizontally
        (pdfHeight - finalHeight) / 2, // Center vertically
        finalWidth, 
        finalHeight
      )
      
      // Add metadata
      pdf.setProperties({
        title: `Form 1040 - ${new Date().getFullYear() - 1}`,
        subject: 'U.S. Individual Income Tax Return',
        author: 'TaxGrok.AI',
        creator: 'TaxGrok.AI'
      })
      
      // Save the PDF
      pdf.save(filename)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF. Please try again.')
    }
  }

  /**
   * Generate PDF with multiple pages if needed
   */
  static async generateMultiPagePDF(
    elements: HTMLElement[], 
    filename: string = 'form-1040.pdf'
  ): Promise<void> {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      })
      
      const pdfWidth = 8.5 * 25.4 // 8.5 inches to mm
      const pdfHeight = 11 * 25.4 // 11 inches to mm
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i]
        
        // Add new page if not the first element
        if (i > 0) {
          pdf.addPage()
        }
        
        // Create canvas from element
        const canvas = await html2canvas(element, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        })
        
        const imgData = canvas.toDataURL('image/png')
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = imgWidth / imgHeight
        
        // Calculate dimensions to fit page
        let finalWidth = pdfWidth - 20
        let finalHeight = finalWidth / ratio
        
        if (finalHeight > pdfHeight - 20) {
          finalHeight = pdfHeight - 20
          finalWidth = finalHeight * ratio
        }
        
        // Add image to current page
        pdf.addImage(
          imgData,
          'PNG',
          (pdfWidth - finalWidth) / 2,
          (pdfHeight - finalHeight) / 2,
          finalWidth,
          finalHeight
        )
      }
      
      // Add metadata
      pdf.setProperties({
        title: `Form 1040 - ${new Date().getFullYear() - 1}`,
        subject: 'U.S. Individual Income Tax Return',
        author: 'TaxGrok.AI',
        creator: 'TaxGrok.AI'
      })
      
      // Save the PDF
      pdf.save(filename)
      
    } catch (error) {
      console.error('Error generating multi-page PDF:', error)
      throw new Error('Failed to generate PDF. Please try again.')
    }
  }

  /**
   * Print the form directly
   */
  static printForm(): void {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const formElement = document.querySelector('[data-form-1040]')
      if (formElement) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Form 1040</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${formElement.outerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  /**
   * Download form as image
   */
  static async downloadAsImage(
    element: HTMLElement, 
    filename: string = 'form-1040.png',
    format: 'png' | 'jpeg' = 'png'
  ): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      })
      
      // Create download link
      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL(`image/${format}`)
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error downloading image:', error)
      throw new Error('Failed to download image. Please try again.')
    }
  }
}
