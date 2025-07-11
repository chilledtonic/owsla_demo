'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { getLatestCurriculumByUserId, getCurriculumsByUserId, getCurriculumById, deleteCurriculumById, getActiveJobsByUserId, getAllJobsByUserId, createCurriculum, updateCurriculum } from './database'
import type { CurriculumData } from './database'
import type { CourseData } from '@/types/course-editor'

export async function fetchLatestCurriculum(userId: string) {
  // Prevent caching of dynamic user data
  'use server'
  
  try {
    const curriculum = await getLatestCurriculumByUserId(userId)
    return { success: true, data: curriculum }
  } catch (error) {
    console.error('Error fetching latest curriculum:', error)
    return { success: false, error: 'Failed to fetch curriculum' }
  }
}

export async function fetchUserCurricula(userId: string) {
  // Prevent caching of dynamic user data
  'use server'
  
  try {
    const curricula = await getCurriculumsByUserId(userId)
    return { success: true, data: curricula }
  } catch (error) {
    console.error('Error fetching user curricula:', error)
    return { success: false, error: 'Failed to fetch curricula' }
  }
}

export async function fetchCurriculumById(id: number) {
  // Allow caching for individual curriculum as it doesn't change often
  'use server'
  
  try {
    const curriculum = await getCurriculumById(id)
    return { success: true, data: curriculum }
  } catch (error) {
    console.error('Error fetching curriculum:', error)
    return { success: false, error: 'Failed to fetch curriculum' }
  }
}

export async function deleteCurriculum(id: number) {
  try {
    await deleteCurriculumById(id)
    
    // Revalidate server cache after deletion
    revalidatePath('/') // Dashboard
    revalidatePath(`/curriculum/${id}`) // Specific curriculum page (will 404, but clears cache)
    revalidateTag('user-curricula') // Tag-based revalidation for user curricula
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting curriculum:', error)
    return { success: false, error: 'Failed to delete curriculum' }
  }
}

// Helper function to convert CourseData to CurriculumData format
function convertCourseDataToCurriculum(courseData: CourseData, userId: string): Omit<CurriculumData, 'id' | 'created_at' | 'updated_at'> {
  // Calculate start and end dates based on daily modules
  const startDate = courseData.daily_modules.length > 0 ? courseData.daily_modules[0].date : new Date().toISOString().split('T')[0]
  const endDate = courseData.daily_modules.length > 0 ? courseData.daily_modules[courseData.daily_modules.length - 1].date : new Date().toISOString().split('T')[0]
  
  // Determine course type and extract appropriate fields
  const isVideoType = courseData.type === 'video' || courseData.primary_video
  const curriculumType = isVideoType ? 'video' : 'text'
  
  // Extract topic from title or use a default
  const topic = courseData.title || 'Custom Course'
  
  return {
    title: courseData.title,
    topic: topic,
    executive_overview: courseData.executive_overview || null,
    length_of_study: courseData.daily_modules.length,
    depth_level: null, // Could be derived from course complexity
    education_level: null, // Could be set based on course content
    start_date: startDate,
    end_date: endDate,
    curriculum_type: curriculumType,
    // Text-based fields
    primary_resource_title: courseData.primary_resource?.title || null,
    primary_resource_author: courseData.primary_resource?.author || null,
    primary_resource_year: courseData.primary_resource?.year ? parseInt(courseData.primary_resource.year) : null,
    primary_resource_isbn: courseData.primary_resource?.isbn || null,
    // Video-based fields
    primary_video_id: courseData.primary_video?.video_id || null,
    primary_video_channel: courseData.primary_video?.channel || null,
    primary_video_duration: courseData.primary_video?.duration || null,
    primary_video_url: courseData.primary_video?.url || null,
    primary_video_published: courseData.primary_video?.published || null,
    // Store the complete course data as JSON
    full_curriculum_data: {
      title: courseData.title,
      executive_overview: courseData.executive_overview,
      visual_learning_path: courseData.visual_learning_path,
      primary_resource: courseData.primary_resource,
      primary_video: courseData.primary_video,
      daily_modules: courseData.daily_modules.map(module => ({
        day: module.day,
        date: module.date,
        title: module.title,
        video_segment: module.video_segment,
        time_allocation: {
          total: module.time_allocation.total,
          video_viewing: module.time_allocation.video_viewing,
          preparation: module.time_allocation.preparation,
          supplementary_materials: module.time_allocation.supplementary_materials,
          synthesis: module.time_allocation.synthesis
        },
        supplementary_readings: module.supplementary_readings.map(reading => ({
          title: reading.title,
          author: reading.author,
          year: reading.year ? parseInt(reading.year) : undefined,
          isbn: reading.isbn,
          doi: reading.doi,
          journal: reading.journal,
          publisher: reading.publisher,
          reading_time: reading.reading_time,
          focus: reading.focus
        })),
        key_insights: module.key_insights,
        core_concepts: module.core_concepts,
        knowledge_benchmark: {
          connect: module.knowledge_benchmark.connect,
          explain: module.knowledge_benchmark.explain,
          awareness: module.knowledge_benchmark.awareness,
          recognize: module.knowledge_benchmark.recognize,
          understand: module.knowledge_benchmark.understand
        },
        practical_connections: module.practical_connections,
        primary_reading_focus: module.primary_reading_focus,
        pre_viewing_primer: module.pre_viewing_primer,
        post_viewing_synthesis: module.post_viewing_synthesis
      }))
    },
    user_id: userId
  }
}

// Helper function to convert CurriculumData to CourseData format
function convertCurriculumToCourseData(curriculum: CurriculumData): CourseData {
  const fullData = curriculum.full_curriculum_data
  
  return {
    id: curriculum.id.toString(),
    type: curriculum.curriculum_type === 'video' ? 'video' : 'book',
    title: curriculum.title,
    executive_overview: curriculum.executive_overview || '',
    daily_modules: fullData?.daily_modules?.map(module => ({
      day: module.day,
      date: module.date,
      title: module.title,
      video_segment: module.video_segment ? {
        start: module.video_segment.start || '00:00',
        end: module.video_segment.end || '00:00',
        duration: module.video_segment.duration || '00:00',
        chapters: module.video_segment.chapters || [],
        rewatch_segments: module.video_segment.rewatch_segments
      } : undefined,
      key_insights: module.key_insights || [],
      core_concepts: module.core_concepts || [],
      time_allocation: {
        total: module.time_allocation?.total || '3 hours',
        primary_text: module.time_allocation?.video_viewing || '120 minutes',
        supplementary_materials: module.time_allocation?.supplementary_materials || '60 minutes',
        video_viewing: module.time_allocation?.video_viewing,
        preparation: module.time_allocation?.preparation,
        synthesis: module.time_allocation?.synthesis
      },
      knowledge_benchmark: (typeof module.knowledge_benchmark === 'object' && module.knowledge_benchmark) ? {
        connect: module.knowledge_benchmark.connect || '',
        explain: module.knowledge_benchmark.explain || '',
        awareness: module.knowledge_benchmark.awareness || '',
        recognize: module.knowledge_benchmark.recognize || '',
        understand: module.knowledge_benchmark.understand || ''
      } : {
        connect: '',
        explain: '',
        awareness: '',
        recognize: '',
        understand: ''
      },
      practical_connections: module.practical_connections || '',
      primary_reading_focus: module.primary_reading_focus || '',
      supplementary_readings: module.supplementary_readings?.map(reading => ({
        id: reading.title + '-' + reading.author,
        title: reading.title,
        author: reading.author,
        reading_time: reading.reading_time,
        focus: reading.focus,
        isbn: reading.isbn,
        doi: reading.doi,
        year: reading.year?.toString() || '',
        journal: reading.journal || '',
        publisher: reading.publisher || '',
        // Improved type determination logic
        type: (() => {
          // If it has a DOI, it's most likely a paper
          if (reading.doi && reading.doi !== 'N/A') return 'paper' as const
          // If it has a journal, it's definitely a paper
          if (reading.journal && reading.journal !== 'N/A') return 'paper' as const
          // If it has an ISBN but no journal/DOI, it's likely a book
          if (reading.isbn && reading.isbn !== 'N/A' && !reading.journal) return 'book' as const
          // Default to paper if we can't determine clearly
          return 'paper' as const
        })()
      })) || [],
      pre_viewing_primer: module.pre_viewing_primer,
      post_viewing_synthesis: module.post_viewing_synthesis
    })) || [],
    primary_resource: {
      isbn: curriculum.primary_resource_isbn || '',
      year: curriculum.primary_resource_year?.toString() || '',
      title: curriculum.primary_resource_title || '',
      author: curriculum.primary_resource_author || '',
      publisher: ''
    },
    primary_video: curriculum.curriculum_type === 'video' ? {
      title: curriculum.title || '',
      channel: curriculum.primary_video_channel || '',
      duration: curriculum.primary_video_duration || '',
      url: curriculum.primary_video_url || '',
      published: curriculum.primary_video_published || '',
      video_id: curriculum.primary_video_id || ''
    } : undefined,
    knowledge_framework: {
      synthesis_goals: '',
      advanced_applications: '',
      foundational_concepts: ''
    },
    visual_learning_path: fullData?.visual_learning_path || {},
    resource_requirements: {
      primary_book: {
        isbn: curriculum.primary_resource_isbn || '',
        year: curriculum.primary_resource_year?.toString() || '',
        title: curriculum.primary_resource_title || '',
        author: curriculum.primary_resource_author || '',
        publisher: ''
      },
      primary_video: curriculum.curriculum_type === 'video' ? {
        title: curriculum.title || '',
        channel: curriculum.primary_video_channel || '',
        duration: curriculum.primary_video_duration || '',
        url: curriculum.primary_video_url || '',
        published: curriculum.primary_video_published || '',
        video_id: curriculum.primary_video_id || ''
      } : undefined,
      academic_papers: [],
      equipment_needed: '',
      total_reading_time: '',
      total_time_commitment: '',
      supplementary_books: []
    }
  }
}

export async function saveCurriculum(courseData: CourseData, userId: string) {
  try {
    const curriculumData = convertCourseDataToCurriculum(courseData, userId)
    
    if (courseData.id) {
      // Update existing curriculum
      const updated = await updateCurriculum(parseInt(courseData.id), curriculumData)
      
      // Revalidate server cache after update
      revalidatePath('/') // Dashboard
      revalidatePath(`/curriculum/${courseData.id}`) // Specific curriculum page
      revalidatePath('/new-curriculum') // New curriculum page might show recent curricula
      revalidateTag('user-curricula') // Tag-based revalidation for user curricula
      
      return { success: true, data: convertCurriculumToCourseData(updated) }
    } else {
      // Create new curriculum
      const created = await createCurriculum(curriculumData)
      
      // Revalidate server cache after creation
      revalidatePath('/') // Dashboard
      revalidatePath('/new-curriculum') // New curriculum page
      revalidateTag('user-curricula') // Tag-based revalidation for user curricula
      
      return { success: true, data: convertCurriculumToCourseData(created) }
    }
  } catch (error) {
    console.error('Error saving curriculum:', error)
    return { success: false, error: 'Failed to save curriculum' }
  }
}

export async function forkCurriculum(originalId: number, userId: string, newTitle?: string) {
  try {
    // Get the original curriculum
    const original = await getCurriculumById(originalId)
    if (!original) {
      return { success: false, error: 'Original curriculum not found' }
    }
    
    // Convert to course data format
    const courseData = convertCurriculumToCourseData(original)
    
    // Modify for the fork
    courseData.id = undefined // Remove ID to create new
    courseData.title = newTitle || `${courseData.title} (Copy)`
    
    // Create the forked curriculum
    const curriculumData = convertCourseDataToCurriculum(courseData, userId)
    const forked = await createCurriculum(curriculumData)
    
    // Revalidate server cache after fork creation
    revalidatePath('/') // Dashboard
    revalidatePath(`/curriculum/${originalId}`) // Original curriculum page
    revalidateTag('user-curricula') // Tag-based revalidation for user curricula
    
    return { success: true, data: convertCurriculumToCourseData(forked) }
  } catch (error) {
    console.error('Error forking curriculum:', error)
    return { success: false, error: 'Failed to fork curriculum' }
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

// New function to submit YouTube curriculum to webhook
export async function submitYoutubeCurriculum(payload: {
  body: {
    youtubeURL: string
    videoID: string
    videoTitle: string
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
    const webhookUrl = "https://owslaio.app.n8n.cloud/webhook/ae212955-503a-4f69-b9bf-c36b6e0b4d1e"
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
    console.error('Error submitting YouTube curriculum:', error)
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
  curriculumType: string // 'text' or 'video'
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
      // Add primary book resource if available (only for text curricula)
      if (curriculum.curriculum_type === 'text' && curriculum.primary_resource_title) {
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
            // Text curriculum fields
            primary_text?: string
            supplementary_materials?: string
            // Video curriculum fields
            video_viewing?: string
            preparation?: string
            synthesis?: string
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
          // Determine the correct time allocation fields based on curriculum type
          let primaryTime = '42 minutes'
          let supplementaryTime = '18 minutes'
          
          if (curriculum.curriculum_type === 'video') {
            // For video curricula, use video-specific time allocations
            primaryTime = module.time_allocation?.video_viewing || '25 minutes'
            supplementaryTime = (module.time_allocation?.preparation || '20 minutes') + ' + ' + 
                              (module.time_allocation?.synthesis || '30 minutes')
          } else {
            // For text curricula, use traditional book-based time allocations
            primaryTime = module.time_allocation?.primary_text || '42 minutes'
            supplementaryTime = module.time_allocation?.supplementary_materials || '18 minutes'
          }

          // Add daily module with curriculum type information
          dailyModules.push({
            curriculumId: curriculum.id,
            curriculumTitle: curriculum.title,
            curriculumType: curriculum.curriculum_type, // Use actual curriculum type
            day: module.day,
            date: module.date,
            title: module.title,
            totalTime: module.time_allocation?.total || '60 minutes',
            primaryReadingTime: primaryTime,
            supplementaryTime: supplementaryTime
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

// IMPORTANT: Dedicated server action for cache revalidation when background jobs complete
export async function revalidateCurriculumCache(userId: string) {
  'use server'
  
  try {
    // Revalidate all routes that might show curriculum data
    revalidatePath('/') // Dashboard
    revalidatePath('/library') // Library page
    revalidatePath('/new-curriculum') // New curriculum page
    
    // Tag-based revalidation for user-specific data
    revalidateTag('user-curricula')
    revalidateTag(`user-${userId}-curricula`)
    
    console.log(`Server cache revalidated for user: ${userId}`)
    return { success: true }
  } catch (error) {
    console.error('Error revalidating cache:', error)
    return { success: false, error: 'Failed to revalidate cache' }
  }
}

 