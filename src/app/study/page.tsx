"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Flashcard } from "@/components/flashcard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StudyCard, ApiResponse, ReviewGrade } from "@/types"
import { BookOpen, Brain, Target, TrendingUp, ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function StudyPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [completedCards, setCompletedCards] = useState(0)
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0,
    streak: 0,
    currentStreak: 0
  })

  // Fetch study cards
  const { data: studyData, isLoading, error, refetch } = useQuery({
    queryKey: ['study-cards'],
    queryFn: async (): Promise<StudyCard[]> => {
      const response = await fetch('/api/study?limit=20')
      const result: ApiResponse<StudyCard[]> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch study cards')
      }
      
      return result.data || []
    }
  })

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ wordId, grade, responseTime }: {
      wordId: string
      grade: ReviewGrade
      responseTime: number
    }) => {
      const response = await fetch('/api/study/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId,
          grade,
          responseTime,
          wasCorrect: grade >= 3
        })
      })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }
      
      return result
    },
    onSuccess: () => {
      // Invalidate stats after successful review
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })

  // Star mutation
  const starMutation = useMutation({
    mutationFn: async (wordId: string) => {
      const currentCard = studyData?.[currentCardIndex]
      if (!currentCard) return
      
      const method = currentCard.isStarred ? 'DELETE' : 'POST'
      const response = await fetch(`/api/words/${wordId}/star`, { method })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }
      
      return result
    },
    onSuccess: () => {
      // Update the card's starred status in the local data
      queryClient.setQueryData(['study-cards'], (oldData: StudyCard[] | undefined) => {
        if (!oldData) return oldData
        
        return oldData.map((card, index) => 
          index === currentCardIndex 
            ? { ...card, isStarred: !card.isStarred }
            : card
        )
      })
    }
  })

  const currentCard = studyData?.[currentCardIndex]
  const hasMoreCards = studyData && currentCardIndex < studyData.length - 1

  const handleGrade = async (grade: ReviewGrade, responseTime: number) => {
    console.log('StudyPage: handleGrade called with grade:', grade, 'responseTime:', responseTime)
    console.log('StudyPage: currentCard:', currentCard?.word)
    console.log('StudyPage: session user:', session?.user?.id)

    if (!currentCard) {
      console.error('StudyPage: No current card available')
      return
    }

    // Allow anonymous users to continue with flashcards without saving progress
    if (!session?.user) {
      console.log('StudyPage: Anonymous user - updating local state only')
      // Update session stats for anonymous users
      const wasCorrect = grade >= 3
      setSessionStats(prev => ({
        correct: prev.correct + (wasCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: wasCorrect ? prev.currentStreak + 1 : Math.max(prev.streak, prev.currentStreak),
        currentStreak: wasCorrect ? prev.currentStreak + 1 : 0
      }))

      setCompletedCards(prev => prev + 1)

      // Move to next card or finish session
      if (hasMoreCards) {
        setTimeout(() => {
          setCurrentCardIndex(prev => prev + 1)
        }, 1000)
      }
      return
    }

    try {
      console.log('StudyPage: Calling reviewMutation.mutateAsync')
      await reviewMutation.mutateAsync({
        wordId: currentCard.id,
        grade,
        responseTime
      })

      console.log('StudyPage: Review mutation successful')

      // Update session stats
      const wasCorrect = grade >= 3
      setSessionStats(prev => ({
        correct: prev.correct + (wasCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: wasCorrect ? prev.currentStreak + 1 : Math.max(prev.streak, prev.currentStreak),
        currentStreak: wasCorrect ? prev.currentStreak + 1 : 0
      }))

      setCompletedCards(prev => prev + 1)

      // Move to next card or finish session
      if (hasMoreCards) {
        setTimeout(() => {
          setCurrentCardIndex(prev => prev + 1)
        }, 1000)
      }
    } catch (error) {
      console.error('StudyPage: Failed to record review:', error)
      // Even if the API call fails, continue with the session locally
      const wasCorrect = grade >= 3
      setSessionStats(prev => ({
        correct: prev.correct + (wasCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: wasCorrect ? prev.currentStreak + 1 : Math.max(prev.streak, prev.currentStreak),
        currentStreak: wasCorrect ? prev.currentStreak + 1 : 0
      }))

      setCompletedCards(prev => prev + 1)

      // Move to next card or finish session
      if (hasMoreCards) {
        setTimeout(() => {
          setCurrentCardIndex(prev => prev + 1)
        }, 1000)
      }
    }
  }

  const handleStar = () => {
    if (!currentCard) return
    starMutation.mutate(currentCard.id)
  }

  const handleRestart = () => {
    setCurrentCardIndex(0)
    setCompletedCards(0)
    setSessionStats({ correct: 0, total: 0, streak: 0, currentStreak: 0 })
    refetch()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Brain className="h-12 w-12 animate-pulse mx-auto text-primary" />
            <p className="text-lg">Loading your study session...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              Failed to load study cards. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!studyData || studyData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Cards Available</CardTitle>
            <CardDescription>
              {session?.user 
                ? "You're all caught up! Check back later for more words to review."
                : "Sign in to track your progress and get personalized study sessions."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/words">
              <Button className="w-full">Browse Vocabulary</Button>
            </Link>
            {!session?.user && (
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Session completed
  if (completedCards >= studyData.length) {
    const accuracy = sessionStats.total > 0 ? (sessionStats.correct / sessionStats.total) * 100 : 0
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>Session Complete!</CardTitle>
            <CardDescription>
              Great job studying {sessionStats.total} words
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{sessionStats.correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{Math.round(accuracy)}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>
            
            {sessionStats.streak > 0 && (
              <div className="text-center">
                <Badge variant="secondary" className="text-lg py-2 px-4">
                  🔥 {sessionStats.streak} streak
                </Badge>
              </div>
            )}

            <div className="space-y-2">
              <Button onClick={handleRestart} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Study More Words
              </Button>
              <Link href="/stats">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Progress
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold flex items-center">
              <BookOpen className="h-6 w-6 mr-2" />
              Study Session
            </h1>
            <p className="text-muted-foreground">
              {session?.user ? "Personalized review" : "Anonymous practice"}
            </p>
          </div>
        </div>

        {/* Session Stats */}
        <div className="flex space-x-4 text-sm">
          <div className="text-center">
            <div className="font-bold">{sessionStats.correct}/{sessionStats.total}</div>
            <div className="text-muted-foreground">Correct</div>
          </div>
          {sessionStats.currentStreak > 0 && (
            <div className="text-center">
              <div className="font-bold">🔥 {sessionStats.currentStreak}</div>
              <div className="text-muted-foreground">Streak</div>
            </div>
          )}
        </div>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <Flashcard
          card={currentCard}
          currentIndex={currentCardIndex}
          totalCards={studyData.length}
          onGrade={handleGrade}
          onStar={session?.user ? handleStar : undefined}
          isStarring={starMutation.isPending}
        />
      )}
    </div>
  )
}