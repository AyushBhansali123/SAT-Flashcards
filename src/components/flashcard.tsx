"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StudyCard } from "@/types"
import { cn } from "@/lib/utils"
import { Star, Volume2, RotateCcw, Eye } from "lucide-react"

interface FlashcardProps {
  card: StudyCard
  currentIndex: number
  totalCards: number
  onGrade: (grade: 0 | 1 | 2 | 3 | 4 | 5, responseTime: number) => void
  onStar?: () => void
  isStarring?: boolean
}

export function Flashcard({
  card,
  currentIndex,
  totalCards,
  onGrade,
  onStar,
  isStarring
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [showGrading, setShowGrading] = useState(false)

  useEffect(() => {
    // Reset card state when card changes
    setIsFlipped(false)
    setShowGrading(false)
    setStartTime(Date.now())
  }, [card.id])

  // Add keyboard event listeners
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!showGrading) {
        // Space or Enter to flip card
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault()
          handleFlip()
        }
      } else {
        // Number keys 0-5 for grading
        const grade = parseInt(event.key)
        if (grade >= 0 && grade <= 5) {
          event.preventDefault()
          handleGrade(grade as 0 | 1 | 2 | 3 | 4 | 5)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showGrading])

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true)
      setShowGrading(true)
    }
  }

  const handleGrade = (grade: 0 | 1 | 2 | 3 | 4 | 5) => {
    console.log('Flashcard: handleGrade called with grade:', grade)
    const responseTime = Date.now() - startTime
    console.log('Flashcard: responseTime:', responseTime)
    try {
      onGrade(grade, responseTime)
      console.log('Flashcard: onGrade called successfully')
    } catch (error) {
      console.error('Flashcard: Error in onGrade:', error)
    }
  }

  const speakWord = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(card.word)
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const progress = ((currentIndex + 1) / totalCards) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{currentIndex + 1} of {totalCards}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="relative">
        <Card 
          className={cn(
            "min-h-[400px] cursor-pointer transition-all duration-300 hover:shadow-lg",
            isFlipped && "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
          )}
          onClick={handleFlip}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
            {!isFlipped ? (
              // Front of card - Word
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <h1 className="text-4xl font-bold text-primary">
                      {card.word}
                    </h1>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        speakWord()
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Volume2 className="h-5 w-5" />
                    </Button>
                    {onStar && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onStar()
                        }}
                        disabled={isStarring}
                        className={cn(
                          "text-muted-foreground hover:text-foreground",
                          card.isStarred && "text-yellow-500"
                        )}
                      >
                        <Star className={cn("h-5 w-5", card.isStarred && "fill-current")} />
                      </Button>
                    )}
                  </div>
                  
                  {card.partOfSpeech && (
                    <p className="text-lg text-muted-foreground font-medium">
                      {card.partOfSpeech}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-center space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-3 h-3 rounded-full",
                          i < card.difficulty ? "bg-orange-400" : "bg-gray-200 dark:bg-gray-700"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center text-muted-foreground">
                  <Eye className="h-4 w-4 mr-2" />
                  <span>Click to reveal definition</span>
                </div>
              </>
            ) : (
              // Back of card - Definition & Example
              <div className="space-y-6 w-full">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">{card.word}</h2>
                  <p className="text-lg leading-relaxed">{card.definition}</p>
                  
                  {card.example && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Example:</p>
                      <p className="italic">{card.example}</p>
                    </div>
                  )}
                </div>

                {showGrading && (
                  <div className="space-y-4 border-t pt-6">
                    <p className="text-sm font-medium">How well did you know this word?</p>
                    <p className="text-xs text-muted-foreground">Click a button or press 0-5 on your keyboard</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGrade(0)
                        }}
                        className="text-sm"
                        type="button"
                      >
                        Didn't know (0)
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGrade(1)
                        }}
                        className="text-sm bg-red-600 hover:bg-red-700"
                        type="button"
                      >
                        Wrong but close (1)
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGrade(2)
                        }}
                        className="text-sm"
                        type="button"
                      >
                        Needed hint (2)
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGrade(3)
                        }}
                        className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white"
                        type="button"
                      >
                        Hard (3)
                      </Button>
                      <Button
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGrade(4)
                        }}
                        className="text-sm bg-green-600 hover:bg-green-700"
                        type="button"
                      >
                        Good (4)
                      </Button>
                      <Button
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGrade(5)
                        }}
                        className="text-sm bg-green-700 hover:bg-green-800"
                        type="button"
                      >
                        Perfect (5)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset button */}
        {isFlipped && (
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4"
            onClick={(e) => {
              e.stopPropagation()
              setIsFlipped(false)
              setShowGrading(false)
              setStartTime(Date.now())
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}