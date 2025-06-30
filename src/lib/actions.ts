'use server'

import { getLatestCurriculumByUserId, getCurriculumsByUserId, getCurriculumById } from './database'

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

// New function to submit curriculum to webhook
export async function submitNewCurriculum(payload: any) {
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

 