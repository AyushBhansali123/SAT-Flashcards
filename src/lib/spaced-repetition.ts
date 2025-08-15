import { UserWordProgress, ReviewGrade } from "@/types"

// SM-2 Spaced Repetition Algorithm Implementation
// Based on the SuperMemo SM-2 algorithm

export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: Date
}

export function calculateSM2(
  grade: ReviewGrade,
  currentProgress?: UserWordProgress
): SM2Result {
  // Initialize defaults for new words
  let easeFactor = currentProgress?.easeFactor || 2.5
  let interval = currentProgress?.interval || 1
  let repetitions = currentProgress?.repetitions || 0

  // Grade mapping:
  // 0 = Complete blackout
  // 1 = Incorrect response, but correct on second try  
  // 2 = Incorrect response, but remembered on hint
  // 3 = Correct response with serious difficulty
  // 4 = Correct response after hesitation
  // 5 = Perfect response

  if (grade >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  } else {
    // Incorrect response - reset repetitions but keep ease factor adjustments
    repetitions = 0
    interval = 1
  }

  // Adjust ease factor based on grade
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))

  // Ensure ease factor doesn't go below 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3
  }

  // Calculate next review date
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    interval,
    repetitions,
    nextReview
  }
}

export function getGradeFromUserInput(
  responseTime: number, // milliseconds
  wasCorrect: boolean,
  confidence: 'low' | 'medium' | 'high' = 'medium'
): ReviewGrade {
  if (!wasCorrect) {
    // Incorrect responses get 0-2 based on how close they were
    if (responseTime < 3000) return 1 // Quick wrong answer, probably knew something
    return 0 // Slow wrong answer, probably guessing
  }

  // Correct responses get 3-5 based on confidence and speed
  if (confidence === 'low' || responseTime > 8000) return 3 // Correct but difficult
  if (confidence === 'medium' || responseTime > 4000) return 4 // Correct with hesitation
  return 5 // Perfect response
}

export function getDueWordsCount(userProgress: UserWordProgress[]): number {
  const now = new Date()
  return userProgress.filter(progress => 
    progress.nextReview && progress.nextReview <= now
  ).length
}

export function getStudyStats(userProgress: UserWordProgress[]) {
  const total = userProgress.length
  const learned = userProgress.filter(p => p.isLearned).length
  const due = getDueWordsCount(userProgress)
  
  const totalReviews = userProgress.reduce((sum, p) => sum + p.totalReviews, 0)
  const correctReviews = userProgress.reduce((sum, p) => sum + p.correctReviews, 0)
  const accuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0

  const longestStreak = Math.max(...userProgress.map(p => p.streak), 0)
  const averageEase = userProgress.length > 0 
    ? userProgress.reduce((sum, p) => sum + p.easeFactor, 0) / userProgress.length
    : 2.5

  return {
    totalWords: total,
    learnedWords: learned,
    reviewsDue: due,
    accuracy: Math.round(accuracy * 100) / 100,
    longestStreak,
    averageEaseFactor: Math.round(averageEase * 100) / 100,
    retentionRate: learned > 0 ? (learned / total) * 100 : 0
  }
}

export function isWordLearned(progress: UserWordProgress): boolean {
  // Consider a word "learned" if:
  // - It has been reviewed at least 3 times successfully
  // - The interval is at least 7 days
  // - The ease factor is above 2.0
  return (
    progress.repetitions >= 3 &&
    progress.interval >= 7 &&
    progress.easeFactor >= 2.0 &&
    progress.correctReviews >= 3
  )
}

export function getReviewPriority(progress: UserWordProgress): number {
  const now = new Date()
  const nextReview = progress.nextReview || now
  
  // Calculate days overdue (negative if not due yet)
  const daysOverdue = (now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24)
  
  // Priority factors:
  // 1. How overdue the word is
  // 2. Lower ease factor = higher priority (harder words)
  // 3. Lower repetition count = higher priority (newer words)
  
  const overduePriority = Math.max(0, daysOverdue) * 10
  const easePriority = (3.0 - progress.easeFactor) * 5
  const repetitionPriority = Math.max(0, 5 - progress.repetitions)
  
  return overduePriority + easePriority + repetitionPriority
}

export function scheduleDailyReviews(
  userProgress: UserWordProgress[],
  targetDailyReviews: number = 20
): UserWordProgress[] {
  // Sort by priority and take the top words for today
  return userProgress
    .filter(p => p.nextReview && p.nextReview <= new Date())
    .sort((a, b) => getReviewPriority(b) - getReviewPriority(a))
    .slice(0, targetDailyReviews)
}