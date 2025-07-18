import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper function to create Amazon.ca search URL for an ISBN
 */
export function getAmazonIsbnUrl(isbn: string): string | null {
  if (!isbn || isbn === 'N/A') return null
  // Clean ISBN - remove any non-digit characters except X
  const cleanIsbn = isbn.replace(/[-\s]/g, '')
  return `https://amazon.com/dp/${cleanIsbn}`
}

/**
 * Helper function to create DOI lookup URL
 */
export function getDoiUrl(doi: string): string {
  if (!doi) return ""
  // Clean DOI - remove any extra whitespace
  const cleanDoi = doi.trim()
  return `https://doi.org/${encodeURIComponent(cleanDoi)}`
}

/**
 * Helper function to handle resource clicks based on resource type
 */
export function handleResourceClick(resource: { title?: string, author?: string, isbn?: string | null, doi?: string | null }) {
  // Prioritize DOI for academic papers
  if (resource.doi && resource.doi !== 'N/A') {
    // It's an academic paper - go to DOI lookup
    const url = getDoiUrl(resource.doi)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
  }
  
  // For books, always use title/author search (more accurate than ISBN)
  if (resource.title && resource.author) {
    const title = encodeURIComponent(resource.title);
    const author = encodeURIComponent(resource.author);
    const url = `https://www.amazon.com/s?k=${title}+${author}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// Helper function to deduplicate books by normalized title
export function deduplicateBooks<T extends { title: string; type: 'primary' | 'supplementary'; author: string | null; year: number | null; isbn: string | null }>(books: T[]): T[] {
  // Helper function to normalize titles for better matching
  const normalizeTitle = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      // Remove everything after a dash
      .replace(/\s*-.*$/, '')
      // Remove everything in parentheses except standalone years
      .replace(/\s*\([^)]*\)/g, (match) => {
        // Keep if it's just a year (4 digits)
        const yearMatch = match.match(/^\s*\((\d{4})\)\s*$/)
        return yearMatch ? yearMatch[0] : ''
      })
      // Remove edition information
      .replace(/\s*\d+(st|nd|rd|th)\s+edition/gi, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Helper function to get the core title for similarity matching
  const getCoreTitle = (title: string): string => {
    const normalized = normalizeTitle(title)
    // Extract the main title before any dash or colon
    const mainPart = normalized.split(/\s*[-:]\s*/)[0].trim()
    return mainPart || normalized
  }

  // Deduplicate by normalized title
  const deduplicatedBooks = books.reduce((acc, book) => {
    const normalizedTitle = normalizeTitle(book.title)
    const coreTitle = getCoreTitle(book.title)
    
    // Check for exact normalized match first
    let matchKey = normalizedTitle
    let existingEntry = acc.get(matchKey)
    
    // If no exact match, check for core title similarity
    if (!existingEntry) {
      // Look for books with the same core title
      for (const [key, value] of acc.entries()) {
        const existingCore = getCoreTitle(value.title)
        if (existingCore === coreTitle && existingCore.length > 3) { // Avoid matching very short titles
          matchKey = key
          existingEntry = value
          break
        }
      }
    }
    
    // If we haven't seen this title (or similar) before, add it
    if (!existingEntry) {
      acc.set(matchKey, book)
    } else {
      // If we have seen it, prefer primary over supplementary
      if (book.type === 'primary' && existingEntry.type === 'supplementary') {
        acc.set(matchKey, book)
      }
      // If both are same type, prefer the one with more complete data
      else if (book.type === existingEntry.type) {
        const bookScore = (book.author ? 1 : 0) + (book.year ? 1 : 0) + (book.isbn && book.isbn !== 'N/A' ? 1 : 0)
        const existingScore = (existingEntry.author ? 1 : 0) + (existingEntry.year ? 1 : 0) + (existingEntry.isbn && existingEntry.isbn !== 'N/A' ? 1 : 0)
        if (bookScore > existingScore) {
          acc.set(matchKey, book)
        }
        // If scores are equal, prefer the shorter, cleaner title
        else if (bookScore === existingScore && book.title.length < existingEntry.title.length) {
          acc.set(matchKey, book)
        }
      }
    }
    
    return acc
  }, new Map<string, T>())

  return Array.from(deduplicatedBooks.values())
}

export function calculateCurrentCurriculumDay(dailyModules: Array<{ day: number; date: string }>): { currentDay: number; actualDay: number } {
  const today = new Date()
  const todayString = today.toISOString().split('T')[0] // Format: YYYY-MM-DD
  
  // Find the module that matches today's date exactly
  const todayModule = dailyModules.find(module => module.date === todayString)
  if (todayModule) {
    return {
      currentDay: todayModule.day,
      actualDay: todayModule.day
    }
  }
  
  // If no exact match, find the latest module date that has passed
  const passedModules = dailyModules
    .filter(module => {
      const moduleDate = new Date(module.date)
      return moduleDate <= today
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  if (passedModules.length > 0) {
    // User is past the start date - set to the latest passed module
    const latestPassedModule = passedModules[0]
    return {
      currentDay: latestPassedModule.day,
      actualDay: latestPassedModule.day
    }
  }
  
  // If today is before the course start date, default to day 1
  const futureModules = dailyModules
    .filter(module => {
      const moduleDate = new Date(module.date)
      return moduleDate > today
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  if (futureModules.length > 0) {
    // Course hasn't started yet - set to day 1 but actualDay to 0
    return {
      currentDay: 1,
      actualDay: 0
    }
  }
  
  // Fallback to day 1 if no dates are found or other edge cases
  return {
    currentDay: 1,
    actualDay: 1
  }
}

export function getCurriculumProgressStatus(currentDay: number, actualDay: number, currentModuleDate: string): {
  status: 'on-schedule' | 'ahead' | 'behind' | 'preview'
  message: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
} {
  const dateInfo = getRelativeDateInfo(currentModuleDate)
  
  if (currentDay === actualDay && dateInfo.isToday) {
    return {
      status: 'on-schedule',
      message: "You're on schedule for today",
      variant: 'default'
    }
  }
  
  if (currentDay === actualDay && dateInfo.isPast) {
    return {
      status: 'on-schedule',
      message: "Current progress",
      variant: 'default'
    }
  }
  
  if (currentDay > actualDay) {
    return {
      status: 'preview',
      message: dateInfo.isFuture 
        ? `Previewing content for ${dateInfo.formattedDate}` 
        : "Previewing upcoming content",
      variant: 'secondary'
    }
  }
  
  if (currentDay < actualDay) {
    return {
      status: 'behind',
      message: "Reviewing previous content",
      variant: 'outline'
    }
  }
  
  if (dateInfo.isFuture) {
    const daysUntil = Math.abs(dateInfo.daysFromToday)
    return {
      status: 'ahead',
      message: daysUntil === 1 ? "Course starts tomorrow" : `Course starts in ${daysUntil} days`,
      variant: 'default'
    }
  }
  
  return {
    status: 'on-schedule',
    message: "Current progress",
    variant: 'default'
  }
}

export function getRelativeDateInfo(moduleDate: string): {
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  daysFromToday: number
  formattedDate: string
} {
  const today = new Date()
  const moduleDateTime = new Date(moduleDate)
  
  // Reset time to compare just dates
  today.setHours(0, 0, 0, 0)
  moduleDateTime.setHours(0, 0, 0, 0)
  
  const diffTime = moduleDateTime.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  return {
    isToday: diffDays === 0,
    isPast: diffDays < 0,
    isFuture: diffDays > 0,
    daysFromToday: diffDays,
    formattedDate: moduleDateTime.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: moduleDateTime.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }
}

// Course completion utilities
export interface ModuleCompletion {
  id: number
  user_id: string
  curriculum_id: number
  module_number: number
  completed_at: string
  created_at: string
  updated_at: string
}

export interface CourseCompletionStatus {
  curriculumId: number
  totalModules: number
  completedModules: number
  completionPercentage: number
  isFullyCompleted: boolean
}

/**
 * Calculate completion status for a curriculum based on module completions
 */
export function calculateCourseCompletion(
  curriculumId: number,
  totalModules: number,
  moduleCompletions: ModuleCompletion[]
): CourseCompletionStatus {
  const curriculumCompletions = moduleCompletions.filter(
    completion => completion.curriculum_id === curriculumId
  )
  
  const completedModules = curriculumCompletions.length
  const completionPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
  
  // FIXED: If totalModules is 0, the course cannot be fully completed
  // This prevents courses from being filtered out when module counting fails
  const isFullyCompleted = totalModules > 0 && completedModules === totalModules
  
  console.log(`📊 Course ${curriculumId} completion calculation:`, {
    curriculumId,
    totalModules,
    completedModules,
    completionPercentage,
    isFullyCompleted,
    availableCompletions: curriculumCompletions.map(c => c.module_number)
  })
  
  return {
    curriculumId,
    totalModules,
    completedModules,
    completionPercentage,
    isFullyCompleted
  }
}

/**
 * Filter curricula to only include active (not fully completed) courses
 */
export function filterActiveCourses<T extends { id: number }>(
  courses: T[],
  moduleCompletions: ModuleCompletion[],
  moduleCounts: Map<number, number>
): T[] {
  return courses.filter(course => {
    const totalModules = moduleCounts.get(course.id) || 0
    
    // DEFENSIVE: If totalModules is 0, always keep the course (it might be a data issue)
    if (totalModules === 0) {
      console.warn(`⚠️ Course ${course.id} has 0 total modules - keeping course by default`)
      return true
    }
    
    const completion = calculateCourseCompletion(course.id, totalModules, moduleCompletions)
    
    // Debug logging for each course
    console.log(`🔍 Course ${course.id} filtering:`, {
      courseId: course.id,
      totalModules,
      completedModules: completion.completedModules,
      completionPercentage: completion.completionPercentage,
      isFullyCompleted: completion.isFullyCompleted,
      willKeep: !completion.isFullyCompleted
    })
    
    return !completion.isFullyCompleted
  })
}

/**
 * Filter curricula to only include completed courses
 */
export function filterCompletedCourses<T extends { id: number }>(
  courses: T[],
  moduleCompletions: ModuleCompletion[],
  moduleCounts: Map<number, number>
): T[] {
  return courses.filter(course => {
    const totalModules = moduleCounts.get(course.id) || 0
    const completion = calculateCourseCompletion(course.id, totalModules, moduleCompletions)
    return completion.isFullyCompleted
  })
}

/**
 * Get completion status for all provided courses
 */
export function getCourseCompletionStatuses(
  courses: { id: number }[],
  moduleCompletions: ModuleCompletion[],
  moduleCounts: Map<number, number>
): Map<number, CourseCompletionStatus> {
  const statusMap = new Map<number, CourseCompletionStatus>()
  
  courses.forEach(course => {
    const totalModules = moduleCounts.get(course.id) || 0
    const status = calculateCourseCompletion(course.id, totalModules, moduleCompletions)
    statusMap.set(course.id, status)
  })
  
  return statusMap
}
