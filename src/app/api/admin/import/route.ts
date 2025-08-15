import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { importWords } from "../../../../../scripts/import-words"
import { ApiResponse, ImportResult } from "@/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ImportResult>>> {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    // Run the import
    console.log(`Admin import triggered by user: ${session.user.email}`)
    const result = await importWords()

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully imported ${result.success} words`
    })

  } catch (error) {
    console.error("Import API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Import failed"
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ status: string }>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { status: "Import endpoint ready" },
      message: "POST to this endpoint to trigger word import"
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to check import status" },
      { status: 500 }
    )
  }
}