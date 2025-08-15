"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ApiResponse, ImportResult } from "@/types"
import { 
  Shield, 
  Upload, 
  Database, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  ArrowLeft 
} from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const { data: session } = useSession()
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/import', {
        method: 'POST'
      })
      
      const result: ApiResponse<ImportResult> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Import failed')
      }
      
      return result.data!
    },
    onSuccess: (data) => {
      setImportResult(data)
    }
  })

  // Get basic stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats')
      const result = await response.json()
      return result.success ? result.data : null
    },
    enabled: !!session?.user?.isAdmin
  })

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access the admin panel.
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

  if (!session.user.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleImport = () => {
    setImportResult(null)
    importMutation.mutate()
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
            <h1 className="text-3xl font-bold flex items-center">
              <Shield className="h-8 w-8 mr-2" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Manage SAT Flashcards system
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          Admin: {session.user.email}
        </Badge>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Words</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWords}</div>
              <p className="text-xs text-muted-foreground">
                In vocabulary database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Reviews</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyProgress}</div>
              <p className="text-xs text-muted-foreground">
                Reviews today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Word Import Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Word Import
          </CardTitle>
          <CardDescription>
            Import words from words.txt file and update the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Import Process</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Reads words.txt from the project root</li>
              <li>• Parses format: Word — definition — example sentence</li>
              <li>• Updates existing words and adds new ones</li>
              <li>• Creates backup file in data/words-txt.json</li>
            </ul>
          </div>

          <Separator />

          <div className="flex space-x-4">
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importMutation.isPending ? "Importing..." : "Import Words"}
            </Button>
          </div>

          {/* Import Results */}
          {importMutation.error && (
            <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Import Failed</span>
              </div>
              <p className="text-sm mt-1 text-destructive">
                {importMutation.error.message}
              </p>
            </div>
          )}

          {importResult && (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center space-x-2 text-green-700 dark:text-green-400 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Import Completed</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Successful:</span>
                  <span className="ml-2 font-medium">{importResult.success}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Errors:</span>
                  <span className="ml-2 font-medium">{importResult.errors}</span>
                </div>
              </div>

              {importResult.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    Warnings ({importResult.warnings.length}):
                  </p>
                  <ul className="text-xs mt-1 space-y-1">
                    {importResult.warnings.slice(0, 5).map((warning, index) => (
                      <li key={index} className="text-yellow-600 dark:text-yellow-500">
                        • {warning}
                      </li>
                    ))}
                    {importResult.warnings.length > 5 && (
                      <li className="text-yellow-600 dark:text-yellow-500">
                        • ... and {importResult.warnings.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            System Information
          </CardTitle>
          <CardDescription>
            Application details and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Environment:</span>
              <span className="ml-2 font-medium">
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Database:</span>
              <span className="ml-2 font-medium">SQLite (dev.db)</span>
            </div>
            <div>
              <span className="text-muted-foreground">Auth Provider:</span>
              <span className="ml-2 font-medium">NextAuth.js</span>
            </div>
            <div>
              <span className="text-muted-foreground">Admin User:</span>
              <span className="ml-2 font-medium">{session.user.email}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-medium">Available Actions</h3>
            <div className="space-y-2">
              <Link href="/words">
                <Button variant="outline" size="sm" className="mr-2">
                  Browse Words
                </Button>
              </Link>
              <Link href="/stats">
                <Button variant="outline" size="sm" className="mr-2">
                  View Statistics
                </Button>
              </Link>
              <a 
                href="http://localhost:5555" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  Prisma Studio
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}