"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StudyStats, ApiResponse } from "@/types"
import { TrendingUp, Target, Brain, Star, Calendar, Clock, BarChart3, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function StatsPage() {
  const { data: session } = useSession()

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: async (): Promise<StudyStats> => {
      const response = await fetch('/api/stats')
      const result: ApiResponse<StudyStats> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats')
      }
      
      return result.data!
    },
    enabled: !!session?.user
  })

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your study statistics and progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signin">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 animate-pulse mx-auto text-primary" />
            <p className="text-lg">Loading your progress...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              Failed to load your statistics. Please try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const learningProgress = stats.totalWords > 0 ? (stats.learnedWords / stats.totalWords) * 100 : 0
  const dailyProgressPercent = stats.dailyGoal > 0 ? (stats.dailyProgress / stats.dailyGoal) * 100 : 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <TrendingUp className="h-8 w-8 mr-2" />
              Study Statistics
            </h1>
            <p className="text-muted-foreground">Track your learning progress</p>
          </div>
        </div>
        <Link href="/study">
          <Button>Continue Studying</Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWords}</div>
            <p className="text-xs text-muted-foreground">
              {stats.learnedWords} learned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews Due</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewsDue}</div>
            <p className="text-xs text-muted-foreground">
              Ready to review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Overall correct rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak}</div>
            <p className="text-xs text-muted-foreground">
              Consecutive correct
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Learning Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>
              Words you've mastered through spaced repetition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Learned</span>
                <span>{stats.learnedWords} / {stats.totalWords}</span>
              </div>
              <Progress value={learningProgress} />
              <p className="text-xs text-muted-foreground">
                {Math.round(learningProgress)}% of vocabulary mastered
              </p>
            </div>
            
            {stats.reviewsDue > 0 && (
              <div className="mt-4">
                <Badge variant="secondary" className="text-xs">
                  {stats.reviewsDue} words ready for review
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Goal */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Goal</CardTitle>
            <CardDescription>
              Your progress toward today's study target
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Today's Reviews</span>
                <span>{stats.dailyProgress} / {stats.dailyGoal}</span>
              </div>
              <Progress value={Math.min(100, dailyProgressPercent)} />
              <p className="text-xs text-muted-foreground">
                {Math.round(dailyProgressPercent)}% of daily goal completed
              </p>
            </div>

            {stats.averageResponseTime > 0 && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Avg. response: {Math.round(stats.averageResponseTime / 1000)}s</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>
            Your study activity over the past 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.weeklyProgress.map((day, index) => {
              const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
              const accuracy = day.reviews > 0 ? (day.correct / day.reviews) * 100 : 0
              
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-12 text-sm text-muted-foreground">
                    {dayName}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">{day.reviews} reviews</span>
                      {day.reviews > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(accuracy)}% accuracy
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (day.reviews / 30) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium">
                    {day.correct}/{day.reviews}
                  </div>
                </div>
              )
            })}
          </div>

          {stats.weeklyProgress.every(day => day.reviews === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No study activity this week.</p>
              <p className="text-sm">Start studying to see your progress!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Keep Learning</CardTitle>
            <CardDescription>
              Continue your vocabulary journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.reviewsDue > 0 ? (
              <>
                <p className="text-sm">
                  You have {stats.reviewsDue} words ready for review.
                </p>
                <Link href="/study">
                  <Button className="w-full">Review Words</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm">
                  Great job! You're all caught up with reviews.
                </p>
                <Link href="/study">
                  <Button className="w-full">Learn New Words</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Explore Vocabulary</CardTitle>
            <CardDescription>
              Browse and search all SAT words
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Explore our complete collection of {stats.totalWords} SAT vocabulary words.
            </p>
            <Link href="/words">
              <Button variant="outline" className="w-full">
                Browse Words
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}