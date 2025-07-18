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

export async function createCurriculum(curriculumData: Omit<CurriculumData, 'id' | 'created_at' | 'updated_at'>): Promise<CurriculumData> {
  try {
    const result = await sql`
      INSERT INTO curriculums (
        title,
        topic,
        executive_overview,
        length_of_study,
        depth_level,
        education_level,
        start_date,
        end_date,
        curriculum_type,
        primary_resource_title,
        primary_resource_author,
        primary_resource_year,
        primary_resource_isbn,
        primary_video_id,
        primary_video_channel,
        primary_video_duration,
        primary_video_url,
        primary_video_published,
        full_curriculum_data,
        user_id
      ) VALUES (
        ${curriculumData.title},
        ${curriculumData.topic},
        ${curriculumData.executive_overview},
        ${curriculumData.length_of_study},
        ${curriculumData.depth_level},
        ${curriculumData.education_level},
        ${curriculumData.start_date},
        ${curriculumData.end_date},
        ${curriculumData.curriculum_type},
        ${curriculumData.primary_resource_title},
        ${curriculumData.primary_resource_author},
        ${curriculumData.primary_resource_year},
        ${curriculumData.primary_resource_isbn},
        ${curriculumData.primary_video_id},
        ${curriculumData.primary_video_channel},
        ${curriculumData.primary_video_duration},
        ${curriculumData.primary_video_url},
        ${curriculumData.primary_video_published},
        ${curriculumData.full_curriculum_data}::jsonb,
        ${curriculumData.user_id}
      ) RETURNING *
    `
    
    if (result.length === 0) {
      throw new Error('Failed to create curriculum')
    }
    
    return result[0] as CurriculumData
  } catch (error) {
    console.error('Error creating curriculum:', error)
    throw new Error('Failed to create curriculum')
  }
}

export async function updateCurriculum(id: number, curriculumData: Partial<Omit<CurriculumData, 'id' | 'created_at' | 'updated_at'>>): Promise<CurriculumData> {
  try {
    console.log('Updating curriculum:', id, 'with data:', curriculumData.title)
    
    const result = await sql`
      UPDATE curriculums SET
        title = COALESCE(${curriculumData.title}, title),
        topic = COALESCE(${curriculumData.topic}, topic),
        executive_overview = COALESCE(${curriculumData.executive_overview}, executive_overview),
        length_of_study = COALESCE(${curriculumData.length_of_study}, length_of_study),
        depth_level = COALESCE(${curriculumData.depth_level}, depth_level),
        education_level = COALESCE(${curriculumData.education_level}, education_level),
        start_date = COALESCE(${curriculumData.start_date}, start_date),
        end_date = COALESCE(${curriculumData.end_date}, end_date),
        curriculum_type = COALESCE(${curriculumData.curriculum_type}, curriculum_type),
        primary_resource_title = COALESCE(${curriculumData.primary_resource_title}, primary_resource_title),
        primary_resource_author = COALESCE(${curriculumData.primary_resource_author}, primary_resource_author),
        primary_resource_year = COALESCE(${curriculumData.primary_resource_year}, primary_resource_year),
        primary_resource_isbn = COALESCE(${curriculumData.primary_resource_isbn}, primary_resource_isbn),
        primary_video_id = COALESCE(${curriculumData.primary_video_id}, primary_video_id),
        primary_video_channel = COALESCE(${curriculumData.primary_video_channel}, primary_video_channel),
        primary_video_duration = COALESCE(${curriculumData.primary_video_duration}, primary_video_duration),
        primary_video_url = COALESCE(${curriculumData.primary_video_url}, primary_video_url),
        primary_video_published = COALESCE(${curriculumData.primary_video_published}, primary_video_published),
        full_curriculum_data = COALESCE(${curriculumData.full_curriculum_data}::jsonb, full_curriculum_data),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    
    console.log('Update result:', result.length > 0 ? 'SUCCESS' : 'NO_ROWS_AFFECTED')
    
    if (result.length === 0) {
      throw new Error('Curriculum not found or no changes made')
    }
    
    return result[0] as CurriculumData
  } catch (error) {
    console.error('Error updating curriculum:', error)
    throw new Error('Failed to update curriculum')
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

export interface UserIntegrationData {
  id: number
  user_id: string
  integration_type: 'zotero'
  is_enabled: boolean
  api_key_encrypted: string | null
  settings: Record<string, unknown>
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface ZoteroResourceData {
  id: number
  user_id: string
  zotero_key: string
  zotero_version: number
  item_type: 'book' | 'journalArticle'
  title: string
  authors: string[] | null
  year: number | null
  publisher: string | null
  isbn: string | null
  doi: string | null
  abstract: string | null
  tags: string[] | null
  collections: string[] | null
  raw_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

// User Integrations functions
export async function getUserIntegration(userId: string, integrationType: 'zotero'): Promise<UserIntegrationData | null> {
  try {
    const result = await sql`
      SELECT * FROM user_integrations 
      WHERE user_id = ${userId} AND integration_type = ${integrationType}
    `
    
    if (result.length === 0) {
      return null
    }
    
    return result[0] as UserIntegrationData
  } catch (error) {
    console.error('Error fetching user integration:', error)
    throw new Error('Failed to fetch user integration')
  }
}

export async function upsertUserIntegration(
  userId: string, 
  integrationType: 'zotero', 
  data: {
    is_enabled: boolean
    api_key_encrypted?: string | null
    settings?: Record<string, unknown>
  }
): Promise<UserIntegrationData> {
  try {
    const result = await sql`
      INSERT INTO user_integrations (
        user_id,
        integration_type,
        is_enabled,
        api_key_encrypted,
        settings
      ) VALUES (
        ${userId},
        ${integrationType},
        ${data.is_enabled},
        ${data.api_key_encrypted || null},
        ${data.settings ? JSON.stringify(data.settings) : '{}'}::jsonb
      )
      ON CONFLICT (user_id, integration_type)
      DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        api_key_encrypted = COALESCE(EXCLUDED.api_key_encrypted, user_integrations.api_key_encrypted),
        settings = EXCLUDED.settings,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `
    
    if (result.length === 0) {
      throw new Error('Failed to upsert user integration')
    }
    
    return result[0] as UserIntegrationData
  } catch (error) {
    console.error('Error upserting user integration:', error)
    throw new Error('Failed to upsert user integration')
  }
}

export async function deleteUserIntegration(userId: string, integrationType: 'zotero'): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM user_integrations 
      WHERE user_id = ${userId} AND integration_type = ${integrationType}
    `
    
    return Array.isArray(result) ? result.length > 0 : true
  } catch (error) {
    console.error('Error deleting user integration:', error)
    throw new Error('Failed to delete user integration')
  }
}

// Zotero Resources functions
export async function getZoteroResources(
  userId: string, 
  options?: {
    search?: string
    itemType?: 'book' | 'journalArticle'
    limit?: number
    offset?: number
  }
): Promise<ZoteroResourceData[]> {
  try {
    let query = sql`
      SELECT * FROM zotero_resources 
      WHERE user_id = ${userId}
    `
    
    if (options?.itemType) {
      query = sql`${query} AND item_type = ${options.itemType}`
    }
    
    if (options?.search) {
      const searchTerm = `%${options.search}%`
      query = sql`
        ${query} AND (
          title ILIKE ${searchTerm} OR
          ${searchTerm} = ANY(authors) OR
          ${searchTerm} = ANY(tags)
        )
      `
    }
    
    query = sql`${query} ORDER BY updated_at DESC`
    
    if (options?.limit) {
      query = sql`${query} LIMIT ${options.limit}`
    }
    
    if (options?.offset) {
      query = sql`${query} OFFSET ${options.offset}`
    }
    
    const result = await query
    return result as ZoteroResourceData[]
  } catch (error) {
    console.error('Error fetching Zotero resources:', error)
    throw new Error('Failed to fetch Zotero resources')
  }
}

export async function upsertZoteroResources(userId: string, resources: Omit<ZoteroResourceData, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  try {
    if (resources.length === 0) return
    
    // Use individual upserts for Neon compatibility
    for (const resource of resources) {
      await sql`
        INSERT INTO zotero_resources (
          user_id,
          zotero_key,
          zotero_version,
          item_type,
          title,
          authors,
          year,
          publisher,
          isbn,
          doi,
          abstract,
          tags,
          collections,
          raw_data
        ) VALUES (
          ${userId},
          ${resource.zotero_key},
          ${resource.zotero_version},
          ${resource.item_type},
          ${resource.title},
          ${resource.authors || null}::text[],
          ${resource.year || null},
          ${resource.publisher || null},
          ${resource.isbn || null},
          ${resource.doi || null},
          ${resource.abstract || null},
          ${resource.tags || null}::text[],
          ${resource.collections || null}::text[],
          ${JSON.stringify(resource.raw_data)}::jsonb
        )
        ON CONFLICT (user_id, zotero_key)
        DO UPDATE SET
          zotero_version = EXCLUDED.zotero_version,
          item_type = EXCLUDED.item_type,
          title = EXCLUDED.title,
          authors = EXCLUDED.authors,
          year = EXCLUDED.year,
          publisher = EXCLUDED.publisher,
          isbn = EXCLUDED.isbn,
          doi = EXCLUDED.doi,
          abstract = EXCLUDED.abstract,
          tags = EXCLUDED.tags,
          collections = EXCLUDED.collections,
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP
      `
    }
  } catch (error) {
    console.error('Error upserting Zotero resources:', error)
    throw new Error('Failed to upsert Zotero resources')
  }
}

export async function updateZoteroSyncTime(userId: string): Promise<void> {
  try {
    await sql`
      UPDATE user_integrations 
      SET last_sync_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND integration_type = 'zotero'
    `
  } catch (error) {
    console.error('Error updating Zotero sync time:', error)
    throw new Error('Failed to update Zotero sync time')
  }
}

export async function deleteZoteroResources(userId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM zotero_resources 
      WHERE user_id = ${userId}
    `
  } catch (error) {
    console.error('Error deleting Zotero resources:', error)
    throw new Error('Failed to delete Zotero resources')
  }
}

// Module completion functions
export interface ModuleCompletion {
  id: number
  user_id: string
  curriculum_id: number
  module_number: number
  completed_at: string
  created_at: string
  updated_at: string
}

export async function getModuleCompletions(userId: string, curriculumId: number): Promise<ModuleCompletion[]> {
  try {
    const result = await sql`
      SELECT * FROM module_completions 
      WHERE user_id = ${userId} AND curriculum_id = ${curriculumId}
      ORDER BY module_number
    `
    return result as ModuleCompletion[]
  } catch (error) {
    console.error('Error fetching module completions:', error)
    throw new Error('Failed to fetch module completions')
  }
}

export async function toggleModuleCompletion(
  userId: string,
  curriculumId: number,
  moduleNumber: number
): Promise<{ completed: boolean }> {
  try {
    // Check if completion exists
    const existing = await sql`
      SELECT * FROM module_completions 
      WHERE user_id = ${userId} 
      AND curriculum_id = ${curriculumId}
      AND module_number = ${moduleNumber}
    `

    if (existing.length > 0) {
      // Delete if exists (marking as incomplete)
      await sql`
        DELETE FROM module_completions 
        WHERE user_id = ${userId} 
        AND curriculum_id = ${curriculumId}
        AND module_number = ${moduleNumber}
      `
      return { completed: false }
    } else {
      // Insert if doesn't exist (marking as complete)
      await sql`
        INSERT INTO module_completions (user_id, curriculum_id, module_number)
        VALUES (${userId}, ${curriculumId}, ${moduleNumber})
      `
      return { completed: true }
    }
  } catch (error) {
    console.error('Error toggling module completion:', error)
    throw new Error('Failed to toggle module completion')
  }
}

export async function markModuleComplete(
  userId: string,
  curriculumId: number,
  moduleNumber: number
): Promise<void> {
  try {
    await sql`
      INSERT INTO module_completions (user_id, curriculum_id, module_number)
      VALUES (${userId}, ${curriculumId}, ${moduleNumber})
      ON CONFLICT (user_id, curriculum_id, module_number) DO NOTHING
    `
  } catch (error) {
    console.error('Error marking module complete:', error)
    throw new Error('Failed to mark module complete')
  }
}

export async function markModuleIncomplete(
  userId: string,
  curriculumId: number,
  moduleNumber: number
): Promise<void> {
  try {
    await sql`
      DELETE FROM module_completions 
      WHERE user_id = ${userId} 
      AND curriculum_id = ${curriculumId}
      AND module_number = ${moduleNumber}
    `
  } catch (error) {
    console.error('Error marking module incomplete:', error)
    throw new Error('Failed to mark module incomplete')
  }
}

export async function getCurriculumProgress(userId: string, curriculumId: number): Promise<{
  totalModules: number
  completedModules: number
  completionPercentage: number
}> {
  try {
    // Get total modules from curriculum data
    const curriculum = await getCurriculumById(curriculumId)
    if (!curriculum || !curriculum.full_curriculum_data?.daily_modules) {
      return { totalModules: 0, completedModules: 0, completionPercentage: 0 }
    }

    const totalModules = curriculum.full_curriculum_data.daily_modules.length

    // Get completed modules count
    const result = await sql`
      SELECT COUNT(*) as count FROM module_completions 
      WHERE user_id = ${userId} AND curriculum_id = ${curriculumId}
    `
    
    const completedModules = parseInt(result[0].count as string)
    const completionPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

    return { totalModules, completedModules, completionPercentage }
  } catch (error) {
    console.error('Error fetching curriculum progress:', error)
    throw new Error('Failed to fetch curriculum progress')
  }
}

 