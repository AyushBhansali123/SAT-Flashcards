"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { StudyCard, ApiResponse, QuizQuestion } from "@/types"
import { Brain, Target, Trophy, ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"

export default function QuizPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [startTime, setStartTime] = useState<number>(Date.now())

  // Generate quiz questions from study cards
  const { data: studyData, isLoading, error, refetch } = useQuery({
    queryKey: ['quiz-cards'],
    queryFn: async (): Promise<StudyCard[]> => {
      const response = await fetch('/api/study?limit=10')
      const result: ApiResponse<StudyCard[]> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch quiz questions')
      }
      
      return result.data || []
    }
  })

  // Generate quiz questions
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])

  useEffect(() => {
    if (studyData && studyData.length >= 4) {
      const questions: QuizQuestion[] = studyData.slice(0, 10).map((card, index) => {
        // Get wrong answers from other cards
        const otherCards = studyData.filter(c => c.id !== card.id)
        const wrongAnswers = otherCards
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(c => c.definition)

        // Create options array with correct answer
        const options = [card.definition, ...wrongAnswers]
          .sort(() => Math.random() - 0.5)

        return {
          id: card.id,
          word: card.word,
          options,
          correctAnswer: card.definition,
          type: "definition"
        }
      })
      
      setQuizQuestions(questions)
      setStartTime(Date.now())
    }
  }, [studyData])

  // Review mutation for quiz answers
  const reviewMutation = useMutation({
    mutationFn: async ({ wordId, wasCorrect, responseTime }: {
      wordId: string
      wasCorrect: boolean
      responseTime: number
    }) => {
      const response = await fetch('/api/study/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId,
          wasCorrect,
          responseTime,
          confidence: wasCorrect ? 'high' : 'low'
        })
      })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }
      
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })

  const currentQuestion = quizQuestions[currentQuestionIndex]
  const hasMoreQuestions = currentQuestionIndex < quizQuestions.length - 1

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer
    const responseTime = Date.now() - startTime
    
    // Record the answer
    const newAnswers = [...answers, isCorrect]
    setAnswers(newAnswers)
    
    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    // Submit review if user is logged in
    if (session?.user) {
      try {
        await reviewMutation.mutateAsync({
          wordId: currentQuestion.id,
          wasCorrect: isCorrect,
          responseTime
        })
      } catch (error) {
        console.error('Failed to record quiz answer:', error)
      }
    }

    setShowResult(true)

    // Auto-advance after showing result
    setTimeout(() => {
      if (hasMoreQuestions) {
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer("")
        setShowResult(false)
        setStartTime(Date.now())
      } else {
        setQuizCompleted(true)
      }
    }, 2000)
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer("")
    setShowResult(false)
    setQuizCompleted(false)
    setScore(0)
    setAnswers([])
    setStartTime(Date.now())
    refetch()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Brain className="h-12 w-12 animate-pulse mx-auto text-primary" />
            <p className="text-lg">Preparing your quiz...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !studyData || studyData.length < 4) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Quiz Unavailable</CardTitle>
            <CardDescription>
              {studyData && studyData.length < 4 
                ? "Need at least 4 words to generate a quiz. Study more words first!"
                : "Failed to load quiz questions. Please try again."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/study">
              <Button className="w-full">Study Words</Button>
            </Link>
            <Link href="/words">
              <Button variant="outline" className="w-full">Browse Vocabulary</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Quiz completed
  if (quizCompleted) {
    const percentage = Math.round((score / quizQuestions.length) * 100)
    const grade = percentage >= 90 ? "Excellent!" : 
                  percentage >= 80 ? "Great job!" :
                  percentage >= 70 ? "Good work!" :
                  percentage >= 60 ? "Not bad!" : "Keep practicing!"

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>Quiz Complete!</CardTitle>
            <CardDescription>{grade}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {score}/{quizQuestions.length}
              </div>
              <div className="text-lg text-muted-foreground mb-4">
                {percentage}% Correct
              </div>
              <Progress value={percentage} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-green-600">Correct</div>
                <div>{score}</div>
              </div>
              <div>
                <div className="font-semibold text-red-600">Incorrect</div>
                <div>{quizQuestions.length - score}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleRestart} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Take Another Quiz
              </Button>
              <Link href="/study">
                <Button variant="outline" className="w-full">
                  Study More Words
                </Button>
              </Link>
              <Link href="/stats">
                <Button variant="ghost" className="w-full">
                  View Progress
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100

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
              <Target className="h-6 w-6 mr-2" />
              Vocabulary Quiz
            </h1>
            <p className="text-muted-foreground">
              Test your knowledge
            </p>
          </div>
        </div>

        <div className="text-right text-sm">
          <div className="font-bold">{score}/{currentQuestionIndex}</div>
          <div className="text-muted-foreground">Correct</div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2 mb-8">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      {currentQuestion && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {currentQuestion.word}
            </CardTitle>
            <CardDescription className="text-center">
              What does this word mean?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showResult ? (
              <>
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={handleAnswerSelect}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer"
                      onClick={() => handleAnswerSelect(option)}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label 
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="w-full"
                >
                  Submit Answer
                </Button>
              </>
            ) : (
              <div className="text-center space-y-4">
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <div className="space-y-2">
                    <Badge variant="default" className="bg-green-600 text-white text-lg py-2 px-4">
                      ✓ Correct!
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      You got it right!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Badge variant="destructive" className="text-lg py-2 px-4">
                      ✗ Incorrect
                    </Badge>
                    <div className="text-sm space-y-1">
                      <p><strong>Your answer:</strong> {selectedAnswer}</p>
                      <p><strong>Correct answer:</strong> {currentQuestion.correctAnswer}</p>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  {hasMoreQuestions ? "Moving to next question..." : "Calculating results..."}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}