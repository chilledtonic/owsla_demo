import { encode, decode } from "steggy-noencrypt"
import { CourseData } from "@/types/course-editor"

export interface EmbeddedCourseData extends CourseData {
  export_timestamp: string
  export_version: string
}

/**
 * Decodes course data from a steganographic PNG file
 * @param file - The PNG file containing embedded course data
 * @returns Promise<EmbeddedCourseData | null> - The decoded course data or null if decoding fails
 */
export async function decodeCourseDataFromPNG(file: File): Promise<EmbeddedCourseData | null> {
  try {
    // Convert file to array buffer
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    // Decode the embedded data
    const decodedData = decode(uint8Array)
    
    // Parse the JSON data
    const courseData: EmbeddedCourseData = JSON.parse(decodedData)
    
    return courseData
  } catch (error) {
    console.error('Failed to decode course data from PNG:', error)
    return null
  }
}

/**
 * Encodes course data into a PNG image using steganography
 * @param imageBuffer - The original PNG image as Uint8Array
 * @param courseData - The course data to embed
 * @returns Uint8Array - The steganographic image with embedded data
 */
export function encodeCourseDataToPNG(imageBuffer: Uint8Array, courseData: CourseData): Uint8Array {
  try {
    const dataToEmbed = JSON.stringify({
      ...courseData,
      export_timestamp: new Date().toISOString(),
      export_version: "1.0"
    })
    
    // Check if data is too large for the image
    if (dataToEmbed.length > imageBuffer.length / 8) {
      throw new Error('Course data too large for steganographic embedding')
    }
    
    return encode(imageBuffer, dataToEmbed)
  } catch (error) {
    console.error('Error encoding course data:', error)
    throw error
  }
}

/**
 * Validates if a file appears to be a PNG with embedded course data
 * @param file - The file to validate
 * @returns boolean - True if file appears to be a valid PNG
 */
export function isValidPNGFile(file: File): boolean {
  return file.type === 'image/png' && file.size > 0
}

/**
 * Creates a downloadable blob from course data and image buffer
 * @param imageBuffer - The original image buffer
 * @param courseData - The course data to embed
 * @returns Blob - The steganographic image as a blob
 */
export function createStegPNGBlob(imageBuffer: Uint8Array, courseData: CourseData): Blob {
  const stegImage = encodeCourseDataToPNG(imageBuffer, courseData)
  return new Blob([stegImage], { type: 'image/png' })
} 