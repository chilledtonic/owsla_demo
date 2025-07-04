'use server'

import { getLatestCurriculumByUserId, getCurriculumsByUserId, getCurriculumById, deleteCurriculumById, getActiveJobsByUserId, getAllJobsByUserId } from './database'

export async function fetchLatestCurriculum(userId: string) {
  try {
    const curriculum = await getLatestCurriculumByUserId(userId)
    return { success: true, data: curriculum }
  } catch (error) {
    console.error('Error fetching latest curriculum:', error)
    return { success: false, error: 'Failed to fetch curriculum' }
  }
}

export async function fetchUserCurricula(userId: string) {
  try {
    const curricula = await getCurriculumsByUserId(userId)
    return { success: true, data: curricula }
  } catch (error) {
    console.error('Error fetching user curricula:', error)
    return { success: false, error: 'Failed to fetch curricula' }
  }
}

export async function fetchCurriculumById(id: number) {
  try {
    const curriculum = await getCurriculumById(id)
    return { success: true, data: curriculum }
  } catch (error) {
    console.error('Error fetching curriculum by ID:', error)
    return { success: false, error: 'Failed to fetch curriculum' }
  }
}

export async function deleteCurriculum(id: number) {
  try {
    const success = await deleteCurriculumById(id)
    if (success) {
      return { success: true, message: 'Curriculum deleted successfully' }
    } else {
      return { success: false, error: 'Curriculum not found or already deleted' }
    }
  } catch (error) {
    console.error('Error deleting curriculum:', error)
    return { success: false, error: 'Failed to delete curriculum' }
  }
}

// New function to submit curriculum to webhook
export async function submitNewCurriculum(payload: {
  body: {
    topic: string
    preliminaries: string
    course_parameters: {
      length_of_study: number
      daily_time_commitment: number
      depth_level: number
      pace: string
    }
    learner_profile: {
      education_level: string
      prior_knowledge: string
      learning_style: string
    }
    curriculum_preferences: {
      focus_areas: string[]
      supplementary_material_ratio: number
      contemporary_vs_classical: number
    }
    schedule: {
      start_date: string
      study_days: string[]
      break_weeks: string[]
    }
  }
  user_context: {
    user_id: string
    user_email: string
    user_name: string | null
  }
}) {
  try {
    const webhookUrl = "https://owslaio.app.n8n.cloud/webhook/bf680982-c224-4bc2-a17f-3023d9e99ceb"
    const hookUser = process.env.HOOK_USER
    const hookPass = process.env.HOOK_PASS

    if (!hookUser || !hookPass) {
      throw new Error('Webhook credentials not configured')
    }

    const credentials = Buffer.from(`${hookUser}:${hookPass}`).toString('base64')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Webhook submission failed: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, data: result }
  } catch (error) {
    console.error('Error submitting curriculum:', error)
    throw error
  }
}

export async function fetchActiveJobs(userId: string) {
  try {
    const jobs = await getActiveJobsByUserId(userId)
    return { success: true, data: jobs }
  } catch (error) {
    console.error('Error fetching active jobs:', error)
    return { success: false, error: 'Failed to fetch active jobs' }
  }
}

export async function fetchAllUserJobs(userId: string) {
  try {
    const jobs = await getAllJobsByUserId(userId)
    return { success: true, data: jobs }
  } catch (error) {
    console.error('Error fetching user jobs:', error)
    return { success: false, error: 'Failed to fetch user jobs' }
  }
}

// New helper functions for dashboard data
export interface DailyModule {
  curriculumId: number
  curriculumTitle: string
  day: number
  date: string
  title: string
  totalTime: string
  primaryReadingTime: string
  supplementaryTime: string
}

export interface BookResource {
  curriculumId: number
  curriculumTitle: string
  title: string
  author: string | null
  year: number | null
  isbn: string | null
  type: 'primary' | 'supplementary'
}

export interface OtherResource {
  curriculumId: number
  curriculumTitle: string
  title: string
  author: string
  year: number
  journal: string
  doi: string | null
  type: string
  readingTime: string
  day: number
  moduleTitle: string
}

export async function fetchDashboardData(userId: string) {
  try {
    const result = await fetchUserCurricula(userId)
    if (!result.success || !result.data) {
      return { success: false, error: 'Failed to fetch curricula' }
    }

    const curricula = result.data
    const dailyModules: DailyModule[] = []
    const bookResources: BookResource[] = []
    const otherResources: OtherResource[] = []

    curricula.forEach(curriculum => {
      // Add primary book resource if available
      if (curriculum.primary_resource_title) {
        bookResources.push({
          curriculumId: curriculum.id,
          curriculumTitle: curriculum.title,
          title: curriculum.primary_resource_title,
          author: curriculum.primary_resource_author,
          year: curriculum.primary_resource_year,
          isbn: curriculum.primary_resource_isbn,
          type: 'primary'
        })
      }

      // Extract daily modules and resources from full_curriculum_data
      if (curriculum.full_curriculum_data?.daily_modules) {
        curriculum.full_curriculum_data.daily_modules.forEach((module: {
          day: number
          date: string
          title: string
          time_allocation?: {
            total?: string
            primary_text?: string
            supplementary_materials?: string
          }
          supplementary_readings?: Array<{
            title: string
            author: string
            year?: number
            isbn?: string
            doi?: string
            journal?: string
            publisher?: string
            reading_time?: string
          }>
        }) => {
          // Add daily module
          dailyModules.push({
            curriculumId: curriculum.id,
            curriculumTitle: curriculum.title,
            day: module.day,
            date: module.date,
            title: module.title,
            totalTime: module.time_allocation?.total || '60 minutes',
            primaryReadingTime: module.time_allocation?.primary_text || '42 minutes',
            supplementaryTime: module.time_allocation?.supplementary_materials || '18 minutes'
          })

          // Add supplementary resources
          if (module.supplementary_readings) {
            module.supplementary_readings.forEach((reading: {
              title: string
              author: string
              year?: number
              isbn?: string
              doi?: string
              journal?: string
              publisher?: string
              reading_time?: string
            }) => {
              if (reading.isbn && reading.isbn !== 'N/A') {
                // This is a book
                bookResources.push({
                  curriculumId: curriculum.id,
                  curriculumTitle: curriculum.title,
                  title: reading.title,
                  author: reading.author,
                  year: reading.year ?? null,
                  isbn: reading.isbn,
                  type: 'supplementary'
                })
              } else {
                // This is a paper or other resource
                otherResources.push({
                  curriculumId: curriculum.id,
                  curriculumTitle: curriculum.title,
                  title: reading.title,
                  author: reading.author,
                  year: reading.year ?? 0,
                  journal: reading.journal || reading.publisher || 'Unknown',
                  doi: reading.doi && reading.doi !== 'N/A' ? reading.doi : null,
                  type: reading.journal ? 'Paper' : 'Resource',
                  readingTime: reading.reading_time || '18 minutes',
                  day: module.day,
                  moduleTitle: module.title
                })
              }
            })
          }
        })
      }
    })

    // Sort daily modules by date
    dailyModules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      success: true,
      data: {
        curricula,
        dailyModules,
        bookResources,
        otherResources
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return { success: false, error: 'Failed to fetch dashboard data' }
  }
}

 