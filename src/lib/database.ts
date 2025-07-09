import { neon } from '@neondatabase/serverless'

// Create a Neon serverless connection
const sql = neon(process.env.DATABASE_URL!)

export interface CurriculumData {
  id: number
  title: string
  topic: string
  executive_overview: string | null
  length_of_study: number
  depth_level: number | null
  education_level: string | null
  start_date: string
  end_date: string
  curriculum_type: string // 'text' or 'video'
  // Text-based curriculum fields
  primary_resource_title: string | null
  primary_resource_author: string | null
  primary_resource_year: number | null
  primary_resource_isbn: string | null
  // Video-based curriculum fields
  primary_video_id: string | null
  primary_video_channel: string | null
  primary_video_duration: string | null
  primary_video_url: string | null
  primary_video_published: string | null
  full_curriculum_data: {
    title?: string
    executive_overview?: string
    visual_learning_path?: Record<string, string>
    primary_video?: {
      title?: string
      channel?: string
      duration?: string
      url?: string
      published?: string
      video_id?: string
    }
    daily_modules?: Array<{
      day: number
      date: string
      title: string
      video_segment?: {
        start?: string
        end?: string
        duration?: string
        chapters?: string[]
        rewatch_segments?: string[]
      }
      time_allocation?: {
        total?: string
        video_viewing?: string
        preparation?: string
        supplementary_materials?: string
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
        focus?: string
      }>
      key_insights?: string[]
      core_concepts?: string[]
      knowledge_benchmark?: Record<string, string>
      practical_connections?: string
      primary_reading_focus?: string
      pre_viewing_primer?: string
      post_viewing_synthesis?: string
    }>
    primary_resource?: {
      title?: string
      author?: string
      isbn?: string
    }
  } | null
  created_at: string
  updated_at: string
  user_id: string | null
}



export async function getCurriculumById(id: number): Promise<CurriculumData | null> {
  try {
    const result = await sql`
      SELECT * FROM curriculums WHERE id = ${id}
    `
    
    if (result.length === 0) {
      return null
    }
    
    return result[0] as CurriculumData
  } catch (error) {
    console.error('Error fetching curriculum by ID:', error)
    throw new Error('Failed to fetch curriculum')
  }
}

export async function getCurriculumsByUserId(userId: string): Promise<CurriculumData[]> {
  try {
    const result = await sql`
      SELECT * FROM curriculums WHERE user_id = ${userId} ORDER BY created_at DESC
    `
    
    return result as CurriculumData[]
  } catch (error) {
    console.error('Error fetching curriculums by user ID:', error)
    throw new Error('Failed to fetch curriculums')
  }
}

export async function getLatestCurriculumByUserId(userId: string): Promise<CurriculumData | null> {
  try {
    const result = await sql`
      SELECT * FROM curriculums WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
    `
    
    if (result.length === 0) {
      return null
    }
    
    return result[0] as CurriculumData
  } catch (error) {
    console.error('Error fetching latest curriculum:', error)
    throw new Error('Failed to fetch latest curriculum')
  }
}

export async function getAllCurricula(): Promise<CurriculumData[]> {
  try {
    const result = await sql`
      SELECT * FROM curriculums ORDER BY created_at DESC
    `
    
    return result as CurriculumData[]
  } catch (error) {
    console.error('Error fetching all curricula:', error)
    throw new Error('Failed to fetch curricula')
  }
}

export async function deleteCurriculumById(id: number): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM curriculums WHERE id = ${id}
    `
    
    // For DELETE operations, check if any rows were affected
    return Array.isArray(result) ? result.length > 0 : true
  } catch (error) {
    console.error('Error deleting curriculum:', error)
    throw new Error('Failed to delete curriculum')
  }
}

export interface ActiveJobData {
  id: number
  curriculum_id: number | null
  user_id: string | null
  topic: string | null
  job_type: string | null
  progress: number | null
  created_at: string | null
  updated_at: string | null
  error_message: string | null
  result_data: Record<string, unknown> | null
  status: string | null
}

export async function getActiveJobsByUserId(userId: string): Promise<ActiveJobData[]> {
  try {
    const result = await sql`
      SELECT * FROM active_jobs 
      WHERE user_id = ${userId} AND status IN ('pending', 'true')
      ORDER BY created_at DESC
    `
    
    return result as ActiveJobData[]
  } catch (error) {
    console.error('Error fetching active jobs by user ID:', error)
    throw new Error('Failed to fetch active jobs')
  }
}

export async function getAllJobsByUserId(userId: string): Promise<ActiveJobData[]> {
  try {
    const result = await sql`
      SELECT * FROM active_jobs 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    
    return result as ActiveJobData[]
  } catch (error) {
    console.error('Error fetching all jobs by user ID:', error)
    throw new Error('Failed to fetch jobs')
  }
}

 