
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { AlternativeDocumentProcessor } from "@/lib/alternative-document-processor"

export const dynamic = "force-dynamic"

// Types for extracted data
interface ExtractedTaxData {
  documentType: string
  ocrText: string
  extractedData: any
  confidence: number
  processingMethod: 'llm_api_extraction'
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("=== DOCUMENT PROCESSING START ===")
  console.log("Document ID:", params.id)
  
  try {
    // Step 1: Authentication
    console.log("1. Checking authentication...")
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("✅ Session found for:", session.user.email)

    // Step 2: Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.log("❌ User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    console.log("✅ User found:", user.id)

    // Step 3: Find document
    const document = await prisma.document.findFirst({
      where: { 
        id: params.id,
        taxReturn: {
          userId: user.id
        }
      }
    })

    if (!document) {
      console.log("❌ Document not found for user")
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    console.log("✅ Document found:", {
      id: document.id,
      fileName: document.fileName,
      documentType: document.documentType,
      filePath: document.filePath
    })

    // Step 4: Check if LLM API is available
    console.log("4. Checking LLM API configuration...")
    const hasLLMAPI = !!(process.env.ABACUSAI_API_KEY)

    console.log("Environment check:", {
      hasLLMAPI,
      apiKeyLength: process.env.ABACUSAI_API_KEY ? process.env.ABACUSAI_API_KEY.length : 0
    })

    if (!hasLLMAPI) {
      console.log("❌ LLM API not configured")
      return NextResponse.json(
        { error: "Document processing service not configured. Please contact support." }, 
        { status: 500 }
      )
    }

    // Step 5: Update status to processing
    console.log("5. Updating status to PROCESSING...")
    await prisma.document.update({
      where: { id: params.id },
      data: { 
        processingStatus: 'PROCESSING',
        updatedAt: new Date()
      }
    })
    console.log("✅ Status updated")

    // Step 6: Process document with LLM API
    console.log("6. Starting LLM API processing...")
    const processor = new AlternativeDocumentProcessor()
    const extractedTaxData = await processor.processDocument(document)
    console.log("✅ LLM API processing successful")

    // Step 7: Save results
    console.log("7. Saving results to database...")
    await prisma.document.update({
      where: { id: params.id },
      data: {
        ocrText: extractedTaxData.ocrText,
        extractedData: {
          documentType: extractedTaxData.documentType,
          ocrText: extractedTaxData.ocrText,
          extractedData: extractedTaxData.extractedData,
          confidence: extractedTaxData.confidence,
          processingMethod: extractedTaxData.processingMethod
        },
        processingStatus: 'COMPLETED',
        updatedAt: new Date()
      }
    })
    console.log("✅ Results saved")

    // Step 8: Return results
    return NextResponse.json({
      success: true,
      message: "Document processed successfully using LLM API",
      processingMethod: extractedTaxData.processingMethod,
      documentType: extractedTaxData.documentType,
      confidence: extractedTaxData.confidence,
      extractedData: extractedTaxData.extractedData,
      ocrTextPreview: extractedTaxData.ocrText?.substring(0, 500) + "..."
    })

  } catch (error) {
    console.error("=== DOCUMENT PROCESSING ERROR ===")
    console.error("Error:", error?.message)
    console.error("Stack:", error?.stack?.substring(0, 1000))
    
    // Update status to failed
    try {
      await prisma.document.update({
        where: { id: params.id },
        data: { processingStatus: 'FAILED' }
      })
    } catch (updateError) {
      console.error("Failed to update status:", updateError?.message)
    }

    return NextResponse.json(
      { 
        error: "Document processing failed",
        details: error?.message || "Unknown error occurred",
        processingMethod: "llm_api_extraction"
      },
      { status: 500 }
    )
  }
}
