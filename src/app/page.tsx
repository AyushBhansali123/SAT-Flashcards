import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { BookOpen, Brain, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SAT Flashcards</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/study">
              <Button variant="ghost">Study</Button>
            </Link>
            <Link href="/words">
              <Button variant="ghost">Words</Button>
            </Link>
            <Link href="/quiz">
              <Button variant="ghost">Quiz</Button>
            </Link>
            <Link href="/stats">
              <Button variant="ghost">Stats</Button>
            </Link>
            <ThemeToggle />
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Master SAT Vocabulary
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Study with flashcards, track your progress with spaced repetition, and boost your SAT scores with our comprehensive vocabulary system.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/study">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Studying Now
            </Button>
          </Link>
          <Link href="/words">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Browse Vocabulary
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose SAT Flashcards?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Spaced Repetition</CardTitle>
              <CardDescription>
                Our SM-2 algorithm optimizes your study schedule for maximum retention
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Comprehensive Vocab</CardTitle>
              <CardDescription>
                Over 1000+ SAT words with definitions and example sentences
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Detailed analytics to monitor your learning journey
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Multiple Modes</CardTitle>
              <CardDescription>
                Flashcards, quizzes, and interactive study sessions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold mb-2">1000+</h3>
              <p className="text-lg">SAT Vocabulary Words</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">Smart</h3>
              <p className="text-lg">Spaced Repetition Algorithm</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">Offline</h3>
              <p className="text-lg">PWA Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Improve Your SAT Score?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of students who have improved their vocabulary and boosted their SAT scores.
        </p>
        <Link href="/study">
          <Button size="lg" className="text-lg px-8 py-6">
            Start Your Free Study Session
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 SAT Flashcards. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  )
}