"use client"

import { signIn, getSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Mail, Chrome, User } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl)
      }
    })
  }, [callbackUrl, router])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      })
      
      if (result?.ok) {
        setEmailSent(true)
      }
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl })
    } catch (error) {
      console.error("Google sign in error:", error)
      setIsLoading(false)
    }
  }

  const handleAnonymousSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("anonymous", { callbackUrl })
    } catch (error) {
      console.error("Anonymous sign in error:", error)
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a sign-in link to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle>Welcome to SAT Flashcards</CardTitle>
          <CardDescription>
            Sign in to track your progress and access all features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error === "OAuthSignin" && "Error occurred during sign in. Please try again."}
              {error === "OAuthCallback" && "Error occurred during authentication. Please try again."}
              {error === "OAuthCreateAccount" && "Could not create account. Please try again."}
              {error === "EmailCreateAccount" && "Could not create account. Please try again."}
              {error === "Callback" && "Error occurred during sign in. Please try again."}
              {error === "OAuthAccountNotLinked" && "Account not linked. Please sign in with the same provider you used before."}
              {error === "EmailSignin" && "Email could not be sent. Please try again."}
              {error === "CredentialsSignin" && "Invalid credentials. Please try again."}
              {error === "SessionRequired" && "Please sign in to access this page."}
              {!error.match(/OAuth|Email|Credentials|Session/) && "An error occurred. Please try again."}
            </div>
          )}

          {/* Continue as Guest */}
          <Button
            onClick={handleAnonymousSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <User className="h-4 w-4 mr-2" />
            Continue as Guest
          </Button>

          <Separator />

          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Chrome className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>

          <Separator />

          {/* Email Sign In */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading || !email} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Sign in with Email
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}