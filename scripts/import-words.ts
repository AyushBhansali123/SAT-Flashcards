#!/usr/bin/env tsx

import fs from "fs/promises"
import path from "path"
import { PrismaClient } from "@prisma/client"
import { ImportedWord, ImportResult } from "../src/types"

const prisma = new PrismaClient()

interface ParsedWord {
  word: string
  definition: string
  example?: string
  partOfSpeech?: string
  difficulty: number
}

function parsePartOfSpeech(definition: string): { cleanDefinition: string; partOfSpeech?: string } {
  const posRegex = /^(n\.|v\.|adj\.|adv\.|prep\.|conj\.|interj\.)\s+(.+)/
  const match = definition.match(posRegex)
  
  if (match) {
    return {
      cleanDefinition: match[2],
      partOfSpeech: match[1].replace(".", "")
    }
  }
  
  return { cleanDefinition: definition }
}

function assignDifficulty(word: string): number {
  // Simple heuristic based on word length and complexity
  const length = word.length
  if (length <= 5) return 1
  if (length <= 7) return 2
  if (length <= 9) return 3
  if (length <= 11) return 4
  return 5
}

function parseWordsFile(content: string): { words: ParsedWord[]; warnings: string[] } {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean)
  const words: ParsedWord[] = []
  const warnings: string[] = []
  
  // Check if this is a single-line format (word — definition — example)
  const firstLine = lines[0] || ""
  const isSingleLineFormat = firstLine.includes("—") || firstLine.includes(" - ") || firstLine.includes(" : ")
  
  if (isSingleLineFormat) {
    // Parse single-line format
    for (const line of lines) {
      // Support multiple separators
      let parts: string[]
      if (line.includes(" — ")) {
        parts = line.split(" — ")
      } else if (line.includes(" - ")) {
        parts = line.split(" - ")
      } else if (line.includes(" : ")) {
        parts = line.split(" : ")
      } else {
        continue
      }
      
      if (parts.length >= 2) {
        const word = parts[0].trim()
        const definition = parts[1].trim()
        const example = parts.length > 2 ? parts[2].trim() : undefined
        
        // Parse part of speech from definition
        const { cleanDefinition, partOfSpeech } = parsePartOfSpeech(definition)
        
        // Validate word
        if (word.length < 2) {
          warnings.push(`Skipping word "${word}" - too short`)
          continue
        }
        
        if (cleanDefinition.length < 5) {
          warnings.push(`Skipping word "${word}" - definition too short`)
          continue
        }
        
        words.push({
          word: word.charAt(0).toUpperCase() + word.slice(1), // Title case
          definition: cleanDefinition,
          example,
          partOfSpeech,
          difficulty: assignDifficulty(word)
        })
      }
    }
    
    return { words, warnings }
  }
  
  // Original multi-line format parsing
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    
    // Skip header lines or empty lines
    if (line === "Word" || line === "Definition" || line === "Example Sentence" || !line) {
      i++
      continue
    }
    
    // Look for word pattern - should be title case and not contain certain patterns
    const isWord = /^[A-Z][a-z]*/.test(line) && 
                   !line.includes("to ") && 
                   !line.includes("adj.") && 
                   !line.includes("v.") && 
                   !line.includes("n.") &&
                   !line.includes("adv.") &&
                   line.length < 50 // Definitions are usually longer
    
    if (isWord && i + 1 < lines.length) {
      const word = line.toLowerCase() // Normalize to lowercase
      const definition = lines[i + 1]
      
      // Skip if definition looks like another word
      if (/^[A-Z][a-z]*$/.test(definition) && definition.length < 20) {
        i++
        continue
      }
      
      let example: string | undefined
      
      // Check if next line is an example (not starting with capital or contains personal pronouns)
      if (i + 2 < lines.length) {
        const potentialExample = lines[i + 2]
        const isExample = potentialExample.includes("I ") || 
                         potentialExample.includes("My ") ||
                         potentialExample.includes("The ") ||
                         potentialExample.includes("She ") ||
                         potentialExample.includes("He ") ||
                         potentialExample.includes("They ") ||
                         potentialExample.includes("We ") ||
                         /[.!?]$/.test(potentialExample) // Ends with punctuation
        
        if (isExample && !potentialExample.startsWith("adj.") && 
            !potentialExample.startsWith("v.") && 
            !potentialExample.startsWith("n.") &&
            potentialExample.length > 10) {
          example = potentialExample
          i += 3 // Skip word, definition, and example
        } else {
          i += 2 // Skip word and definition
        }
      } else {
        i += 2 // Skip word and definition
      }
      
      // Parse part of speech from definition
      const { cleanDefinition, partOfSpeech } = parsePartOfSpeech(definition)
      
      // Validate word
      if (word.length < 2) {
        warnings.push(`Skipping word "${word}" - too short`)
        continue
      }
      
      if (cleanDefinition.length < 5) {
        warnings.push(`Skipping word "${word}" - definition too short`)
        continue
      }
      
      words.push({
        word: word.charAt(0).toUpperCase() + word.slice(1), // Title case
        definition: cleanDefinition,
        example,
        partOfSpeech,
        difficulty: assignDifficulty(word)
      })
    } else {
      i++
    }
  }
  
  return { words, warnings }
}

async function importWords(): Promise<ImportResult> {
  try {
    console.log("🔍 Reading words.txt file...")
    const filePath = path.join(process.cwd(), "words.txt")
    const content = await fs.readFile(filePath, "utf-8")
    
    console.log("📝 Parsing words...")
    const { words, warnings } = parseWordsFile(content)
    
    if (words.length === 0) {
      throw new Error("No valid words found in file")
    }
    
    console.log(`📊 Found ${words.length} words to import`)
    
    // Create or update the main list
    console.log("📋 Creating/updating word list...")
    const list = await prisma.list.upsert({
      where: { 
        name: "All SAT Words (Local File)"
      },
      update: {
        description: `Complete SAT vocabulary from words.txt - ${words.length} words`,
        updatedAt: new Date()
      },
      create: {
        name: "All SAT Words (Local File)",
        description: `Complete SAT vocabulary from words.txt - ${words.length} words`,
        isPublic: true
      }
    })
    
    console.log("💾 Importing words to database...")
    let successCount = 0
    let errorCount = 0
    
    for (const wordData of words) {
      try {
        // Upsert word
        const word = await prisma.word.upsert({
          where: { word: wordData.word },
          update: {
            definition: wordData.definition,
            example: wordData.example,
            partOfSpeech: wordData.partOfSpeech,
            difficulty: wordData.difficulty,
            sourceSlug: "words-txt",
            tags: JSON.stringify(["sat"]),
            updatedAt: new Date()
          },
          create: {
            word: wordData.word,
            definition: wordData.definition,
            example: wordData.example,
            partOfSpeech: wordData.partOfSpeech,
            difficulty: wordData.difficulty,
            sourceSlug: "words-txt",
            tags: JSON.stringify(["sat"])
          }
        })
        
        // Add to list if not already present
        await prisma.listItem.upsert({
          where: {
            listId_wordId: {
              listId: list.id,
              wordId: word.id
            }
          },
          update: {},
          create: {
            listId: list.id,
            wordId: word.id,
            order: successCount
          }
        })
        
        successCount++
      } catch (error) {
        console.error(`Error importing word "${wordData.word}":`, error)
        errorCount++
        warnings.push(`Failed to import word "${wordData.word}": ${error}`)
      }
    }
    
    // Save parsed data for transparency
    console.log("💾 Saving parsed data backup...")
    const dataDir = path.join(process.cwd(), "data")
    await fs.mkdir(dataDir, { recursive: true })
    
    const outputPath = path.join(dataDir, "words-txt.json")
    await fs.writeFile(outputPath, JSON.stringify({
      importDate: new Date().toISOString(),
      totalWords: words.length,
      successfulImports: successCount,
      errors: errorCount,
      warnings,
      words: words.map(w => ({
        word: w.word,
        definition: w.definition,
        example: w.example,
        partOfSpeech: w.partOfSpeech,
        difficulty: w.difficulty,
        tags: ["sat"]
      }))
    }, null, 2))
    
    console.log(`✅ Import completed!`)
    console.log(`   Successful: ${successCount}`)
    console.log(`   Errors: ${errorCount}`)
    console.log(`   Warnings: ${warnings.length}`)
    console.log(`   Backup saved to: ${outputPath}`)
    
    return {
      success: successCount,
      errors: errorCount,
      warnings,
      words: words as ImportedWord[]
    }
    
  } catch (error) {
    console.error("❌ Import failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  importWords()
    .then((result) => {
      console.log("\n🎉 Import summary:")
      console.log(JSON.stringify(result, null, 2))
      process.exit(0)
    })
    .catch((error) => {
      console.error("\n💥 Import failed:", error.message)
      process.exit(1)
    })
}

export { importWords }