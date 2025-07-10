import { CourseData, DailyModule, PrimaryResource } from "@/types/course-editor"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateCourse(course: CourseData): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!course.title || course.title.trim().length === 0) {
    errors.push("Course title is required")
  }

  if (!course.executive_overview || course.executive_overview.trim().length === 0) {
    warnings.push("Executive overview is recommended")
  }

  // Primary resource validation
  if (!course.primary_resource.title || !course.primary_resource.author) {
    warnings.push("Primary resource information is incomplete")
  }

  // Daily modules validation
  if (course.daily_modules.length === 0) {
    errors.push("At least one daily module is required")
  }

  course.daily_modules.forEach((module, index) => {
    const moduleErrors = validateDailyModule(module, index + 1)
    errors.push(...moduleErrors.errors)
    warnings.push(...moduleErrors.warnings)
  })

  // Knowledge framework validation
  const frameworkFields = ['foundational_concepts', 'advanced_applications', 'synthesis_goals'] as const
  const emptyFrameworkFields = frameworkFields.filter(field => 
    !course.knowledge_framework[field] || course.knowledge_framework[field].trim().length === 0
  )

  if (emptyFrameworkFields.length > 0) {
    warnings.push(`Knowledge framework incomplete: ${emptyFrameworkFields.join(', ')} missing`)
  }

  // Visual learning path validation
  const expectedDays = course.daily_modules.length
  const actualDays = Object.keys(course.visual_learning_path).length
  
  if (actualDays !== expectedDays) {
    warnings.push(`Visual learning path should have ${expectedDays} days, but has ${actualDays}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateDailyModule(module: DailyModule, moduleNumber: number): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!module.title || module.title.trim().length === 0) {
    errors.push(`Day ${moduleNumber}: Title is required`)
  }

  if (!module.date) {
    errors.push(`Day ${moduleNumber}: Date is required`)
  }

  // Date validation
  if (module.date) {
    const date = new Date(module.date)
    if (isNaN(date.getTime())) {
      errors.push(`Day ${moduleNumber}: Invalid date format`)
    }
  }

  // Content validation
  if (module.key_insights.length === 0) {
    warnings.push(`Day ${moduleNumber}: No key insights defined`)
  }

  if (module.core_concepts.length === 0) {
    warnings.push(`Day ${moduleNumber}: No core concepts defined`)
  }

  if (!module.practical_connections || module.practical_connections.trim().length === 0) {
    warnings.push(`Day ${moduleNumber}: Practical connections not defined`)
  }

  if (!module.primary_reading_focus || module.primary_reading_focus.trim().length === 0) {
    warnings.push(`Day ${moduleNumber}: Primary reading focus not defined`)
  }

  // Time allocation validation
  if (!module.time_allocation.total || module.time_allocation.total.trim().length === 0) {
    warnings.push(`Day ${moduleNumber}: Total time allocation not specified`)
  }

  // Knowledge benchmark validation
  const benchmarkFields = ['connect', 'explain', 'awareness', 'recognize', 'understand'] as const
  const emptyBenchmarkFields = benchmarkFields.filter(field => 
    !module.knowledge_benchmark[field] || module.knowledge_benchmark[field].trim().length === 0
  )

  if (emptyBenchmarkFields.length > 0) {
    warnings.push(`Day ${moduleNumber}: Knowledge benchmark incomplete (${emptyBenchmarkFields.join(', ')})`)
  }

  // Resource validation
  if (module.supplementary_readings.length === 0) {
    warnings.push(`Day ${moduleNumber}: No supplementary resources added`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validatePrimaryResource(resource: PrimaryResource): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!resource.title || resource.title.trim().length === 0) {
    errors.push("Primary resource title is required")
  }

  if (!resource.author || resource.author.trim().length === 0) {
    errors.push("Primary resource author is required")
  }

  if (!resource.publisher || resource.publisher.trim().length === 0) {
    warnings.push("Primary resource publisher is recommended")
  }

  if (!resource.year || resource.year.trim().length === 0) {
    warnings.push("Primary resource year is recommended")
  } else {
    const year = parseInt(resource.year, 10)
    const currentYear = new Date().getFullYear()
    if (isNaN(year) || year < 1900 || year > currentYear + 5) {
      warnings.push("Primary resource year seems invalid")
    }
  }

  if (!resource.isbn || resource.isbn.trim().length === 0) {
    warnings.push("Primary resource ISBN is recommended for better integration")
  } else {
    // Basic ISBN format validation (10 or 13 digits, allowing hyphens)
    const cleanISBN = resource.isbn.replace(/[-\s]/g, '')
    if (!/^\d{10}$|^\d{13}$/.test(cleanISBN)) {
      warnings.push("Primary resource ISBN format appears invalid")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function getCourseSummary(course: CourseData) {
  const totalDays = course.daily_modules.length
  const totalResources = course.daily_modules.reduce((acc, module) => 
    acc + module.supplementary_readings.length, 0
  )
  
  const datesSet = course.daily_modules.every(module => module.date)
  const hasOverview = course.executive_overview.trim().length > 0
  const hasPrimaryResource = course.primary_resource.title && course.primary_resource.author
  const hasKnowledgeFramework = Object.values(course.knowledge_framework).some(value => 
    value && value.trim().length > 0
  )

  const completeness = [
    course.title.trim().length > 0 ? 1 : 0,
    hasOverview ? 1 : 0,
    hasPrimaryResource ? 1 : 0,
    hasKnowledgeFramework ? 1 : 0,
    totalDays > 0 ? 1 : 0,
    datesSet ? 1 : 0
  ].reduce((acc, val) => acc + val, 0) / 6

  return {
    totalDays,
    totalResources,
    completeness: Math.round(completeness * 100),
    datesSet,
    hasOverview,
    hasPrimaryResource,
    hasKnowledgeFramework
  }
} 