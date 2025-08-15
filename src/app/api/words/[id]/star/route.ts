import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiResponse } from "@/types"

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ starred: boolean }>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { id: wordId } = params

    // Check if word exists
    const word = await prisma.word.findUnique({
      where: { id: wordId }
    })

    if (!word) {
      return NextResponse.json(
        { success: false, error: "Word not found" },
        { status: 404 }
      )
    }

    // Check if already starred
    const existingStar = await prisma.starredWord.findUnique({
      where: {
        userId_wordId: {
          userId: session.user.id,
          wordId
        }
      }
    })

    if (existingStar) {
      return NextResponse.json({
        success: true,
        data: { starred: true },
        message: "Word is already starred"
      })
    }

    // Create star
    await prisma.starredWord.create({
      data: {
        userId: session.user.id,
        wordId
      }
    })

    return NextResponse.json({
      success: true,
      data: { starred: true },
      message: "Word starred successfully"
    })

  } catch (error) {
    console.error("Star word API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to star word"
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ starred: boolean }>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { id: wordId } = params

    // Remove star if it exists
    await prisma.starredWord.deleteMany({
      where: {
        userId: session.user.id,
        wordId
      }
    })

    return NextResponse.json({
      success: true,
      data: { starred: false },
      message: "Word unstarred successfully"
    })

  } catch (error) {
    console.error("Unstar word API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to unstar word"
      },
      { status: 500 }
    )
  }
}