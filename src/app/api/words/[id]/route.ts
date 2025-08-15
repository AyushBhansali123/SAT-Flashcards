import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiResponse, WordWithProgress } from "@/types"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<WordWithProgress>>> {
  try {
    const session = await getServerSession(authOptions)
    const { id } = params

    const include: any = {}
    if (session?.user?.id) {
      include.userWordProgress = {
        where: { userId: session.user.id }
      }
      include.starredWords = {
        where: { userId: session.user.id }
      }
    }

    const word = await prisma.word.findUnique({
      where: { id },
      include
    })

    if (!word) {
      return NextResponse.json(
        { success: false, error: "Word not found" },
        { status: 404 }
      )
    }

    const transformedWord: WordWithProgress = {
      id: word.id,
      word: word.word,
      definition: word.definition,
      example: word.example,
      partOfSpeech: word.partOfSpeech,
      difficulty: word.difficulty,
      sourceSlug: word.sourceSlug,
      tags: word.tags,
      createdAt: word.createdAt,
      updatedAt: word.updatedAt,
      userProgress: (word as any).userWordProgress?.[0],
      isStarred: (word as any).starredWords && (word as any).starredWords.length > 0
    }

    return NextResponse.json({
      success: true,
      data: transformedWord
    })

  } catch (error) {
    console.error("Word API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch word"
      },
      { status: 500 }
    )
  }
}