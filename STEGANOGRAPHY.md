# Steganographic Course Pack Export

## Overview

The course editor now supports exporting course packs as PNG images with embedded course data using steganography. This allows the complete course structure, including metadata, daily modules, and resources, to be invisibly embedded within the exported image.

## Features

- **Invisible Data Embedding**: Course data is embedded using the `steggy-noencrypt` library without affecting the visual appearance of the image
- **Complete Course Preservation**: All course data including title, overview, daily modules, resources, and metadata is preserved
- **Export Metadata**: Includes export timestamp and version for tracking
- **Fallback Support**: If steganography fails, a standard PNG export is provided as fallback

## How It Works

1. **Image Generation**: The course pack layout is rendered as HTML and converted to PNG using `html-to-image`
2. **Font Optimization**: Uses `skipFonts: true` and system fonts to avoid web font normalization issues
3. **Data Preparation**: Course data is serialized to JSON with additional metadata
4. **Steganographic Embedding**: Data is embedded into the PNG using least significant bit (LSB) steganography
5. **Download**: The final image with embedded data is provided for download

## Exported Data Structure

```typescript
interface EmbeddedCourseData {
  // Original course data
  title: string
  executive_overview: string
  daily_modules: DailyModule[]
  primary_resource: PrimaryResource
  knowledge_framework: KnowledgeFramework
  visual_learning_path: Record<string, string>
  resource_requirements: ResourceRequirements
  
  // Export metadata
  export_timestamp: string
  export_version: string
}
```

## Usage

### Exporting
1. Open the Course Editor
2. Navigate to the "Export Preview" tab
3. Click "Export PNG" button
4. The downloaded PNG contains both the visual course pack and embedded data

### Decoding (for developers)
```typescript
import { decodeCourseDataFromPNG } from "@/lib/steg-utils"

// Decode data from an uploaded PNG file
const courseData = await decodeCourseDataFromPNG(pngFile)
if (courseData) {
  console.log("Course Title:", courseData.title)
  console.log("Export Date:", courseData.export_timestamp)
  console.log("Daily Modules:", courseData.daily_modules.length)
}
```

## Technical Details

- **Library**: Uses `steggy-noencrypt` for steganography operations
- **Image Format**: PNG only (required for lossless data embedding)
- **Image Dimensions**: Variable height based on content, 1200px width
- **Design Style**: Brutalist/minimalist infographic layout with day-by-day breakdown
- **Font Handling**: System fonts used to avoid web font loading issues
- **Error Handling**: Automatic fallback to standard PNG export if steganography fails

## Benefits

1. **Portability**: Course packs can be shared as regular images that contain complete course data
2. **Visual Appeal**: Maintains the aesthetic appeal of a traditional course pack poster
3. **Data Integrity**: Complete course structure is preserved and can be extracted programmatically
4. **Social Sharing**: Images can be shared on social media while retaining full course information
5. **Backup**: Serves as a visual and data backup of course content

## Error Handling

The export process includes robust error handling:

1. **Primary Export**: Attempts to create PNG with embedded data
2. **Fallback Export**: If steganography fails, exports standard PNG as `*_basic.png`
3. **Complete Failure**: Shows error message and suggests retry

## File Naming

- **Standard Export**: `{course_title}_course_pack.png`
- **Fallback Export**: `{course_title}_course_pack_basic.png`

Course titles are sanitized to use only alphanumeric characters and underscores for filename compatibility. 