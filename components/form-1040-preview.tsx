
"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Form1040 } from './form-1040'
import { Form1040Actions } from './form-1040-actions'
import { mapTaxReturnToForm1040 } from '@/lib/form-1040-data-mapper'
import { Eye, FileText, X } from 'lucide-react'

interface Form1040PreviewProps {
  taxReturn: any
  trigger?: React.ReactNode
  className?: string
}

export function Form1040Preview({ taxReturn, trigger, className }: Form1040PreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Map tax return data to form structure
  const formData = mapTaxReturnToForm1040(taxReturn)
  
  const defaultTrigger = (
    <Button className="flex items-center space-x-2">
      <Eye className="h-4 w-4" />
      <span>Preview Form 1040</span>
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Form 1040 Preview - Tax Year {formData.taxYear}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row h-full">
          {/* Form Preview */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-[70vh] px-6">
              <div data-form-1040>
                <Form1040 taxReturn={taxReturn} className="scale-90 origin-top" />
              </div>
            </ScrollArea>
          </div>
          
          {/* Actions Sidebar */}
          <div className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l bg-gray-50">
            <Form1040Actions
              formData={formData}
              onPreview={() => setIsOpen(true)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Standalone Form 1040 page component
 */
export function Form1040Page({ taxReturn }: { taxReturn: any }) {
  const formData = mapTaxReturnToForm1040(taxReturn)
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Form 1040 - Tax Year {formData.taxYear}
          </h1>
          <p className="text-gray-600">
            U.S. Individual Income Tax Return for {formData.firstName} {formData.lastName}
          </p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Form */}
          <div className="xl:col-span-3">
            <div data-form-1040>
              <Form1040 taxReturn={taxReturn} />
            </div>
          </div>
          
          {/* Actions */}
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <Form1040Actions formData={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
