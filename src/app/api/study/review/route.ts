import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateSM2, getGradeFromUserInput, isWordLearned } from "@/lib/spaced-repetition"
import { ApiResponse, ReviewGrade } from "@/types"

interface ReviewRequest {
  wordId: string
  grade?: ReviewGrade
  responseTime?: number
  wasCorrect: boolean
  confidence?: 'low' | 'medium' | 'high'
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body: ReviewRequest = await request.json()
    const { wordId, grade, responseTime = 5000, wasCorrect, confidence = 'medium' } = body

    if (!wordId) {
      return NextResponse.json(
        { success: false, error: "Word ID is required" },
        { status: 400 }
      )
    }

    const userId = session.user.id

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

    // Get current progress
    const currentProgress = await prisma.userWordProgress.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId
        }
      }
    })

    // Calculate grade if not provided
    const finalGrade = grade !== undefined 
      ? grade 
      : getGradeFromUserInput(responseTime, wasCorrect, confidence)

    // Calculate new SM-2 values
    const sm2Result = calculateSM2(finalGrade, currentProgress || undefined)

    // Update or create progress
    const updatedProgress = await prisma.userWordProgress.upsert({
      where: {
        userId_wordId: {
          userId,
          wordId
        }
      },
      update: {
        easeFactor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        lastReviewed: new Date(),
        nextReview: sm2Result.nextReview,
        totalReviews: {
          increment: 1
        },
        correctReviews: wasCorrect ? {
          increment: 1
        } : undefined,
        streak: wasCorrect ? {
          increment: 1
        } : 0,
        isLearned: isWordLearned({
          id: currentProgress?.id || '',
          userId,
          wordId,
          createdAt: currentProgress?.createdAt || new Date(),
          updatedAt: new Date(),
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          lastReviewed: new Date(),
          nextReview: sm2Result.nextReview,
          totalReviews: (currentProgress?.totalReviews || 0) + 1,
          correctReviews: (currentProgress?.correctReviews || 0) + (wasCorrect ? 1 : 0),
          streak: wasCorrect ? (currentProgress?.streak || 0) + 1 : 0,
          isLearned: false
        }),
        updatedAt: new Date()
      },
      create: {
        userId,
        wordId,
        easeFactor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        lastReviewed: new Date(),
        nextReview: sm2Result.nextReview,
        totalReviews: 1,
        correctReviews: wasCorrect ? 1 : 0,
        streak: wasCorrect ? 1 : 0,
        isLearned: false
      }
    })

    // Create review record
    await prisma.review.create({
      data: {
        userId,
        wordId,
        rating: finalGrade,
        responseTime,
        reviewType: "flashcard",
        isCorrect: wasCorrect
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        progress: updatedProgress,
        sm2Result,
        grade: finalGrade
      },
      message: wasCorrect ? "Great job!" : "Keep practicing!"
    })

  } catch (error) {
    console.error("Review API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to record review"
      },
      { status: 500 }
    )
  }
}