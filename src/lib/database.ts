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
  primary_resource_title: string | null
  primary_resource_author: string | null
  primary_resource_year: number | null
  primary_resource_isbn: string | null
  full_curriculum_data: any
  created_at: string
  updated_at: string
  user_id: string | null
}

export interface ActiveJob {
  id: number
  user_id: string
  job_type: string
  status: string
  topic: string
  progress: number
  created_at: string
  updated_at: string
  error_message?: string | null
  result_data?: any
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

// Active Jobs functions
export async function getActiveJobsByUserId(userId: string): Promise<ActiveJob[]> {
  try {
    const result = await sql`
      SELECT * FROM active_jobs 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `
    
    return result as ActiveJob[]
  } catch (error) {
    console.error('Error fetching active jobs by user ID:', error)
    throw new Error('Failed to fetch active jobs')
  }
}

export async function getActiveJobById(id: number): Promise<ActiveJob | null> {
  try {
    const result = await sql`
      SELECT * FROM active_jobs WHERE id = ${id}
    `
    
    if (result.length === 0) {
      return null
    }
    
    return result[0] as ActiveJob
  } catch (error) {
    console.error('Error fetching active job by ID:', error)
    throw new Error('Failed to fetch active job')
  }
}

export async function updateActiveJobProgress(id: number, progress: number, status: string): Promise<void> {
  try {
    await sql`
      UPDATE active_jobs 
      SET progress = ${progress}, status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `
  } catch (error) {
    console.error('Error updating active job progress:', error)
    throw new Error('Failed to update active job progress')
  }
} 