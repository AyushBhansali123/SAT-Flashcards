import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiResponse, PaginatedResponse, WordWithProgress, WordFilter } from "@/types"

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<WordWithProgress>>>> {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const search = searchParams.get("search") || ""
    const difficulty = searchParams.get("difficulty")?.split(",").map(Number).filter(Boolean) || []
    const learned = searchParams.get("learned")
    const starred = searchParams.get("starred")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const sortBy = searchParams.get("sortBy") as "word" | "difficulty" | "createdAt" | "lastReviewed" || "word"
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" || "asc"
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { word: { contains: search, mode: "insensitive" } },
        { definition: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (difficulty.length > 0) {
      where.difficulty = { in: difficulty }
    }

    // Build includes for user-specific data
    const include: any = {}
    if (session?.user?.id) {
      include.userWordProgress = {
        where: { userId: session.user.id }
      }
      include.starredWords = {
        where: { userId: session.user.id }
      }
    }

    // Get total count
    const totalCount = await prisma.word.count({ where })

    // Get words with pagination
    const words = await prisma.word.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      }
    })

    // Transform data to include progress and starred status
    const transformedWords: WordWithProgress[] = words.map(word => ({
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
    }))

    // Apply learned filter if specified (requires user progress)
    let filteredWords = transformedWords
    if (learned !== null && session?.user?.id) {
      const isLearned = learned === "true"
      filteredWords = transformedWords.filter(word => 
        isLearned ? word.userProgress?.isLearned : !word.userProgress?.isLearned
      )
    }

    // Apply starred filter if specified
    if (starred === "true" && session?.user?.id) {
      filteredWords = filteredWords.filter(word => word.isStarred)
    }

    const totalPages = Math.ceil(totalCount / limit)
    
    const response: PaginatedResponse<WordWithProgress> = {
      items: filteredWords,
      totalCount,
      pageSize: limit,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error("Words API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch words"
      },
      { status: 500 }
    )
  }
}