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