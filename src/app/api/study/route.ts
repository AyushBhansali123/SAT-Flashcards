import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiResponse, StudyCard } from "@/types"

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<StudyCard[]>>> {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50)
    const mode = searchParams.get("mode") || "mixed" // "new", "review", "mixed"
    
    if (!session?.user?.id) {
      // For anonymous users, return random new words
      const words = await prisma.word.findMany({
        take: limit,
        orderBy: { createdAt: "asc" } // Start with first words
      })

      const studyCards: StudyCard[] = words.map(word => ({
        id: word.id,
        word: word.word,
        definition: word.definition,
        example: word.example || undefined,
        partOfSpeech: word.partOfSpeech || undefined,
        difficulty: word.difficulty,
        isStarred: false
      }))

      return NextResponse.json({
        success: true,
        data: studyCards
      })
    }

    const userId = session.user.id
    const now = new Date()

    let studyCards: StudyCard[] = []

    if (mode === "review" || mode === "mixed") {
      // Get words that are due for review
      const dueWords = await prisma.word.findMany({
        where: {
          userWordProgress: {
            some: {
              userId,
              nextReview: {
                lte: now
              }
            }
          }
        },
        include: {
          userWordProgress: {
            where: { userId }
          },
          starredWords: {
            where: { userId }
          }
        },
        take: mode === "review" ? limit : Math.floor(limit * 0.7),
        orderBy: {
          userWordProgress: {
            _count: "desc"
          }
        }
      })

      studyCards.push(...dueWords.map(word => ({
        id: word.id,
        word: word.word,
        definition: word.definition,
        example: word.example || undefined,
        partOfSpeech: word.partOfSpeech || undefined,
        difficulty: word.difficulty,
        userProgress: word.userWordProgress?.[0],
        isStarred: word.starredWords.length > 0
      })))
    }

    if (mode === "new" || (mode === "mixed" && studyCards.length < limit)) {
      // Get new words (words without progress)
      const remainingLimit = limit - studyCards.length
      
      const newWords = await prisma.word.findMany({
        where: {
          NOT: {
            userWordProgress: {
              some: {
                userId
              }
            }
          }
        },
        include: {
          starredWords: {
            where: { userId }
          }
        },
        take: remainingLimit,
        orderBy: [
          { difficulty: "asc" }, // Start with easier words
          { createdAt: "asc" }   // Then by creation order
        ]
      })

      studyCards.push(...newWords.map(word => ({
        id: word.id,
        word: word.word,
        definition: word.definition,
        example: word.example || undefined,
        partOfSpeech: word.partOfSpeech || undefined,
        difficulty: word.difficulty,
        isStarred: word.starredWords.length > 0
      })))
    }

    // Shuffle the cards for better study experience
    const shuffledCards = studyCards.sort(() => Math.random() - 0.5)

    return NextResponse.json({
      success: true,
      data: shuffledCards.slice(0, limit)
    })

  } catch (error) {
    console.error("Study API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch study cards"
      },
      { status: 500 }
    )
  }
}