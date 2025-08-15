import { User, Word, List, UserWordProgress, Review, StarredWord } from "@prisma/client"

// Base types from Prisma
export type { User, Word, List, UserWordProgress, Review, StarredWord }

// Extended types with relations
export type WordWithProgress = Word & {
  userWordProgress?: UserWordProgress[]
  isStarred?: boolean
  userProgress?: UserWordProgress
}

export type ListWithItems = List & {
  items: Array<{
    id: string
    word: Word
    order: number
  }>
  _count?: {
    items: number
  }
}

export type UserWithStats = User & {
  _count?: {
    userWordProgress: number
    reviews: number
    starredWords: number
    lists: number
  }
}

// Study session types
export type StudyCard = {
  id: string
  word: string
  definition: string
  example?: string
  partOfSpeech?: string
  difficulty: number
  userProgress?: UserWordProgress
  isStarred: boolean
}

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5

export type StudyMode = "flashcard" | "quiz" | "spaced-repetition"

export type QuizQuestion = {
  id: string
  word: string
  options: string[]
  correctAnswer: string
  type: "definition" | "word"
}

// Statistics types
export type StudyStats = {
  totalWords: number
  learnedWords: number
  reviewsDue: number
  streak: number
  accuracy: number
  averageResponseTime: number
  dailyGoal: number
  dailyProgress: number
  weeklyProgress: Array<{
    date: string
    reviews: number
    correct: number
  }>
}

// Import/Export types
export type ImportedWord = {
  word: string
  definition: string
  example?: string
  partOfSpeech?: string
  difficulty?: number
  tags?: string[]
}

export type ImportResult = {
  success: number
  errors: number
  warnings: string[]
  words: ImportedWord[]
}

// API response types
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = {
  items: T[]
  totalCount: number
  pageSize: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Filter and search types
export type WordFilter = {
  search?: string
  difficulty?: number[]
  tags?: string[]
  learned?: boolean
  starred?: boolean
  page?: number
  limit?: number
  sortBy?: "word" | "difficulty" | "createdAt" | "lastReviewed"
  sortOrder?: "asc" | "desc"
}

// Theme types
export type Theme = "light" | "dark" | "system"

// Error types
export type AppError = {
  code: string
  message: string
  details?: any
}