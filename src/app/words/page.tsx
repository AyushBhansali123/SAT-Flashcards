"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { WordWithProgress, ApiResponse, PaginatedResponse } from "@/types"
import { Search, Star, Volume2, Filter, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import Link from "next/link"

export default function WordsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState("")
  const [difficulty, setDifficulty] = useState<number[]>([])
  const [learned, setLearned] = useState<boolean | null>(null)
  const [starred, setStarred] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<"word" | "difficulty" | "createdAt">("word")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Fetch words
  const { data: wordsData, isLoading, error } = useQuery({
    queryKey: ['words', { search, difficulty, learned, starred, page, sortBy, sortOrder }],
    queryFn: async (): Promise<PaginatedResponse<WordWithProgress>> => {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder
      })
      
      if (difficulty.length > 0) {
        params.append('difficulty', difficulty.join(','))
      }
      
      if (learned !== null) {
        params.append('learned', learned.toString())
      }
      
      if (starred) {
        params.append('starred', 'true')
      }

      const response = await fetch(`/api/words?${params}`)
      const result: ApiResponse<PaginatedResponse<WordWithProgress>> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch words')
      }
      
      return result.data!
    }
  })

  // Star mutation
  const starMutation = useMutation({
    mutationFn: async (wordId: string) => {
      const word = wordsData?.items.find(w => w.id === wordId)
      if (!word) return
      
      const method = word.isStarred ? 'DELETE' : 'POST'
      const response = await fetch(`/api/words/${wordId}/star`, { method })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }
      
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] })
    }
  })

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const handleDifficultyChange = (value: string, checked: boolean) => {
    const difficultyNum = parseInt(value)
    setDifficulty(prev => 
      checked 
        ? [...prev, difficultyNum]
        : prev.filter(d => d !== difficultyNum)
    )
    setPage(1)
  }

  const clearFilters = () => {
    setSearch("")
    setDifficulty([])
    setLearned(null)
    setStarred(false)
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <BookOpen className="h-12 w-12 animate-pulse mx-auto text-primary" />
            <p className="text-lg">Loading vocabulary...</p>
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
              Failed to load vocabulary. Please try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BookOpen className="h-8 w-8 mr-2" />
            SAT Vocabulary
          </h1>
          <p className="text-muted-foreground">
            {wordsData?.totalCount} words • Browse and study
          </p>
        </div>
        <Link href="/study">
          <Button>Start Studying</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search words or definitions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`difficulty-${level}`}
                      checked={difficulty.includes(level)}
                      onCheckedChange={(checked) => 
                        handleDifficultyChange(level.toString(), checked as boolean)
                      }
                    />
                    <label htmlFor={`difficulty-${level}`} className="text-sm">
                      {level}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Learned Status */}
            {session?.user && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Progress</label>
                <Select value={learned?.toString() || "all"} onValueChange={(value) => {
                  setLearned(value === "all" ? null : value === "true")
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Words</SelectItem>
                    <SelectItem value="true">Learned</SelectItem>
                    <SelectItem value="false">Not Learned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Starred */}
            {session?.user && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Starred</label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="starred"
                    checked={starred}
                    onCheckedChange={(checked) => {
                      setStarred(checked as boolean)
                      setPage(1)
                    }}
                  />
                  <label htmlFor="starred" className="text-sm">Show only starred</label>
                </div>
              </div>
            )}

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort</label>
              <div className="flex space-x-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="word">Word</SelectItem>
                    <SelectItem value="difficulty">Difficulty</SelectItem>
                    <SelectItem value="createdAt">Date Added</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </div>

          {(search || difficulty.length > 0 || learned !== null || starred) && (
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Word List */}
      <div className="grid gap-4">
        {wordsData?.items.map((word) => (
          <Card key={word.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-semibold">{word.word}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => speakWord(word.word)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    {session?.user && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => starMutation.mutate(word.id)}
                        disabled={starMutation.isPending}
                        className={`h-8 w-8 ${word.isStarred ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Star className={`h-4 w-4 ${word.isStarred ? 'fill-current' : ''}`} />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {word.partOfSpeech && (
                      <Badge variant="secondary">{word.partOfSpeech}</Badge>
                    )}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < word.difficulty ? 'bg-orange-400' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    {word.userProgress?.isLearned && (
                      <Badge variant="default">Learned</Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground">{word.definition}</p>
                  
                  {word.example && (
                    <p className="text-sm italic text-muted-foreground">
                      "{word.example}"
                    </p>
                  )}

                  {word.userProgress && (
                    <div className="text-xs text-muted-foreground pt-2">
                      Reviews: {word.userProgress.totalReviews} • 
                      Accuracy: {word.userProgress.totalReviews > 0 
                        ? Math.round((word.userProgress.correctReviews / word.userProgress.totalReviews) * 100)
                        : 0}% • 
                      Streak: {word.userProgress.streak}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {wordsData && wordsData.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, wordsData.totalCount)} of {wordsData.totalCount} words
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={!wordsData.hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, wordsData.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(
                  wordsData.totalPages - 4,
                  Math.max(1, page - 2)
                )) + i
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setPage(pageNum)}
                    className="w-10 h-10"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setPage(prev => prev + 1)}
              disabled={!wordsData.hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}