import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudyStats, getDueWordsCount } from "@/lib/spaced-repetition"
import { ApiResponse, StudyStats } from "@/types"

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<StudyStats>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user progress
    const userProgress = await prisma.userWordProgress.findMany({
      where: { userId }
    })

    // Get recent reviews for weekly progress
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentReviews = await prisma.review.findMany({
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calculate basic stats
    const basicStats = getStudyStats(userProgress)

    // Calculate weekly progress
    const weeklyProgress = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayReviews = recentReviews.filter(review => {
        const reviewDate = review.createdAt.toISOString().split('T')[0]
        return reviewDate === dateStr
      })

      weeklyProgress.push({
        date: dateStr,
        reviews: dayReviews.length,
        correct: dayReviews.filter(r => r.isCorrect).length
      })
    }

    // Calculate today's progress toward daily goal
    const today = new Date().toISOString().split('T')[0]
    const todayReviews = recentReviews.filter(review => {
      const reviewDate = review.createdAt.toISOString().split('T')[0]
      return reviewDate === today
    })

    const dailyGoal = 20 // Could be user-configurable
    const dailyProgress = todayReviews.length

    // Calculate average response time
    const reviewsWithTime = recentReviews.filter(r => r.responseTime)
    const averageResponseTime = reviewsWithTime.length > 0
      ? reviewsWithTime.reduce((sum, r) => sum + (r.responseTime || 0), 0) / reviewsWithTime.length
      : 0

    // Get current streak
    const streak = Math.max(...userProgress.map(p => p.streak), 0)

    const stats: StudyStats = {
      totalWords: basicStats.totalWords,
      learnedWords: basicStats.learnedWords,
      reviewsDue: basicStats.reviewsDue,
      streak,
      accuracy: basicStats.accuracy,
      averageResponseTime: Math.round(averageResponseTime),
      dailyGoal,
      dailyProgress,
      weeklyProgress
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error("Stats API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch stats"
      },
      { status: 500 }
    )
  }
}