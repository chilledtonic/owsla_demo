"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { toPng } from "html-to-image"
import { deduplicateBooks } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookCover } from "@/components/ui/book-cover"
import { 
  Download,
  Play,
  Clock,
  FileText,
  BookOpen,
  Calendar,
  Target,
  Lightbulb
} from "lucide-react"
import { CourseData } from "@/types/course-editor"

interface TopstersExportProps {
  course: CourseData
  onClose?: () => void
  customBookCover?: string | null
  customVideoThumbnail?: string | null
  customSupplementaryCovers?: Map<string, string>
}

// Helper function to convert course resources to the format expected by deduplicateBooks
function prepareResourcesForDeduplication(course: CourseData) {
  const allResources: Array<{
    title: string
    author: string | null
    year: number | null
    isbn: string | null
    type: 'primary' | 'supplementary'
    id?: string
  }> = []

  // Add primary resource if it exists
  if (course.primary_resource?.title) {
    allResources.push({
      title: course.primary_resource.title,
      author: course.primary_resource.author || null,
      year: course.primary_resource.year ? parseInt(course.primary_resource.year.toString()) : null,
      isbn: course.primary_resource.isbn || null,
      type: 'primary',
      id: 'primary'
    })
  }

  // Add all supplementary readings from daily modules
  course.daily_modules.forEach(module => {
    module.supplementary_readings?.forEach(reading => {
      if (reading.type === 'book' && reading.isbn) {
        allResources.push({
          title: reading.title,
          author: reading.author || null,
          year: reading.year ? parseInt(reading.year.toString()) : null,
          isbn: reading.isbn,
          type: 'supplementary',
          id: reading.id || `${reading.title}-${reading.author}`
        })
      }
    })
  })

  return deduplicateBooks(allResources)
}

// Utility function to extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/user\/[^\/]+#p\/[a-z]\/[0-9]+\/([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

// Utility function to get YouTube thumbnail URL
function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'maxres'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`
}

export function TopstersExport({ 
  course, 
  onClose,
  customBookCover,
  customVideoThumbnail,
  customSupplementaryCovers
}: TopstersExportProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null)
  const [thumbnailError, setThumbnailError] = useState(false)

  const isVideoCourse = course.type === 'video' || course.primary_video
  const deduplicatedBooks = prepareResourcesForDeduplication(course)
  
  // Separate supplementary books from primary
  const supplementaryBooks = deduplicatedBooks.filter(book => book.type === 'supplementary')
  
  // Get all papers from daily modules
  const allPapers = course.daily_modules.flatMap(module => 
    module.supplementary_readings?.filter(reading => reading.type === 'paper') || []
  )

  // Calculate dynamic height based on content
  const calculateExportHeight = () => {
    // Base components heights
    const headerHeight = 300 // Course title, stats, executive overview
    const primaryResourceHeight = isVideoCourse ? 200 : 300 // Video thumbnail or book cover area
    const supplementaryBooksHeight = supplementaryBooks.length > 0 ? Math.ceil(supplementaryBooks.length / 6) * 120 + 50 : 0
    const papersHeight = allPapers.length > 0 ? Math.ceil(allPapers.length / 2) * 80 + 50 : 0
    const footerHeight = 60
    const sectionSpacing = 60 // Spacing between major sections
    
    // Daily modules section
    const moduleCount = course.daily_modules.length
    const fullRows = Math.floor(moduleCount / 3)
    const remainingModules = moduleCount % 3
    
    // Each module card is approximately 350px tall with content + spacing
    const moduleRowHeight = 380
    const fullRowsHeight = fullRows * moduleRowHeight
    
    // Remaining modules in centered layout (same height but fewer cards)
    const remainingRowHeight = remainingModules > 0 ? moduleRowHeight : 0
    
    const dailyModulesHeaderHeight = 60
    const totalModulesHeight = dailyModulesHeaderHeight + fullRowsHeight + remainingRowHeight
    
    // Add generous padding for safety
    const safetyPadding = 200
    
    const totalHeight = headerHeight + 
                       primaryResourceHeight + 
                       supplementaryBooksHeight + 
                       papersHeight + 
                       sectionSpacing + 
                       totalModulesHeight + 
                       footerHeight + 
                       safetyPadding
    
    return Math.max(1000, totalHeight)
  }

  const exportHeight = calculateExportHeight()

  // Extract and set video thumbnail URL
  useEffect(() => {
    if (customVideoThumbnail) {
      setVideoThumbnailUrl(customVideoThumbnail)
      return
    }

    if (course.primary_video) {
      // First try to use the provided video_id
      let videoId: string | null = course.primary_video.video_id
      
      // If no video_id, try to extract from URL
      if (!videoId && course.primary_video.url) {
        videoId = extractYouTubeVideoId(course.primary_video.url)
      }
      
      if (videoId) {
        // At this point, videoId is definitely a string, so we can safely cast it
        const validVideoId = videoId as string
        
        // Try maxres first, fallback to high quality
        const thumbnailUrl = getYouTubeThumbnailUrl(validVideoId, 'maxres')
        setVideoThumbnailUrl(thumbnailUrl)
        
        // Test if the thumbnail loads, fallback to high quality if it fails
        const img = new Image()
        img.onload = () => {
          // If maxres loaded successfully, keep it
          if (img.width > 120) { // maxres has width > 120, others are 120x90
            setVideoThumbnailUrl(thumbnailUrl)
          } else {
            // Fallback to high quality
            setVideoThumbnailUrl(getYouTubeThumbnailUrl(validVideoId, 'high'))
          }
        }
        img.onerror = () => {
          // If maxres fails, try high quality
          const fallbackUrl = getYouTubeThumbnailUrl(validVideoId, 'high')
          const fallbackImg = new Image()
          fallbackImg.onload = () => setVideoThumbnailUrl(fallbackUrl)
          fallbackImg.onerror = () => {
            // If high quality also fails, try standard
            const standardUrl = getYouTubeThumbnailUrl(validVideoId, 'standard')
            setVideoThumbnailUrl(standardUrl)
            setThumbnailError(true)
          }
          fallbackImg.src = fallbackUrl
        }
        img.src = thumbnailUrl
      }
    }
  }, [course.primary_video, customVideoThumbnail])

  const exportAsPNG = useCallback(async () => {
    if (exportRef.current === null) return

    try {
      // Log the actual dimensions for debugging
      const rect = exportRef.current.getBoundingClientRect()
      const finalHeight = Math.max(exportHeight, exportRef.current.scrollHeight)
      
      console.log('Export container dimensions:', {
        width: rect.width,
        height: rect.height,
        calculatedHeight: exportHeight,
        scrollHeight: exportRef.current.scrollHeight,
        finalHeight
      })

      // Check if the image is too large (browsers typically have limits around 32,767px)
      const maxSafeHeight = 25000 // Conservative limit to avoid browser issues
      let pixelRatio = 1
      let adjustedHeight = finalHeight
      
      if (finalHeight > maxSafeHeight) {
        // Scale down for very large courses
        pixelRatio = maxSafeHeight / finalHeight
        adjustedHeight = maxSafeHeight
        console.log(`Large course detected. Scaling down by ${pixelRatio.toFixed(2)}x`)
      }

      // Ensure all content is rendered before capturing
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Create the PNG image with appropriate scaling
      const dataUrl = await toPng(exportRef.current, {
        quality: 0.95, // Slightly reduce quality for very large images
        pixelRatio: pixelRatio,
        backgroundColor: '#ffffff',
        skipFonts: true,
        width: 1200,
        height: adjustedHeight,
        canvasWidth: 1200 * pixelRatio,
        canvasHeight: adjustedHeight * pixelRatio,
        style: {
          fontFamily: 'Arial, sans-serif',
          transform: `scale(${pixelRatio})`,
          transformOrigin: 'top left'
        }
      })
      
      // Download the image
      const link = document.createElement('a')
      const courseType = isVideoCourse ? 'video' : 'book'
      const scaleSuffix = pixelRatio < 1 ? '_scaled' : ''
      link.download = `owsla_${courseType}_${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}${scaleSuffix}.png`
      link.href = dataUrl
      link.click()
      
    } catch (error) {
      console.error('Error exporting image:', error)
      
      // Fallback: try with much more aggressive scaling
      try {
        console.log('Trying fallback export with aggressive scaling...')
        const dataUrl = await toPng(exportRef.current, {
          quality: 0.8,
          pixelRatio: 0.5,
          backgroundColor: '#ffffff',
          skipFonts: true,
          width: 1200,
          height: Math.min(exportHeight, 15000), // Hard limit
          style: {
            fontFamily: 'Arial, sans-serif',
            transform: 'scale(0.5)',
            transformOrigin: 'top left'
          }
        })
        
        const link = document.createElement('a')
        const courseType = isVideoCourse ? 'video' : 'book'
        link.download = `owsla_${courseType}_${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_compressed.png`
        link.href = dataUrl
        link.click()
        
        alert('Exported with reduced quality due to course size. For best quality, consider splitting very long courses.')
      } catch (fallbackError) {
        console.error('Fallback export also failed:', fallbackError)
        alert('Export failed due to course size. Very long courses may exceed browser limits. Consider splitting the course into smaller sections.')
      }
    }
  }, [course, isVideoCourse, exportHeight])

  // Render video course export
  if (isVideoCourse) {
    return (
      <div className="space-y-4">
        {/* Export Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Export Video Course</h2>
            <p className="text-sm text-muted-foreground">Compact visual overview with learning objectives</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportAsPNG} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PNG
            </Button>
            {onClose && (
              <Button onClick={onClose} size="sm" variant="ghost">
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Video Course Pack Visual */}
        <div className="flex justify-center">
                  <div 
          ref={exportRef}
          className="w-[1200px] max-w-none bg-white text-gray-900 p-6"
          style={{ 
            fontFamily: 'var(--font-sans)',
            minHeight: `${exportHeight}px`
          }}
        >
            {/* Header Section */}
            <div className="flex gap-6 mb-4">
              {/* Left Column: Video + Primary Info */}
              <div className="w-80 space-y-3">
                {/* Video Thumbnail */}
                {videoThumbnailUrl && !thumbnailError ? (
                  <div className="w-full h-44 relative rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={videoThumbnailUrl} 
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      onError={() => setThumbnailError(true)}
                    />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <Play className="h-10 w-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                ) : course.primary_video ? (
                  <div className="w-full h-44 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <div className="text-white text-center">
                      <Play className="h-10 w-10 mx-auto mb-2" />
                      <div className="text-sm opacity-90">{course.primary_video.channel}</div>
                      <div className="text-xs opacity-75 mt-1">{course.primary_video.duration}</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center shadow-lg">
                    <div className="text-white text-center">
                      <Play className="h-10 w-10 mx-auto mb-2" />
                      <div className="text-sm">Video Course</div>
                    </div>
                  </div>
                )}

                {/* Compact Primary Video Info */}
                {course.primary_video && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Primary Video</div>
                    <div className="font-semibold text-sm leading-snug">{course.primary_video.title}</div>
                    <div className="text-xs text-gray-600">{course.primary_video.channel}</div>
                    <div className="text-xs text-gray-500">
                      {course.primary_video.duration} • {course.daily_modules.length} days
                    </div>
                  </div>
                )}
              </div>

              {/* Center/Right: Course Info & Books */}
              <div className="flex-1 space-y-3">
                {/* Course Title & Stats */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold leading-tight">{course.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {course.daily_modules.length} Days
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {supplementaryBooks.length} Books
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.primary_video?.duration || 'Video Course'}
                    </span>
                  </div>
                </div>

                {course.executive_overview && (
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                    {course.executive_overview}
                  </p>
                )}

                {/* Supplementary Books */}
                {supplementaryBooks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Supplementary Reading</div>
                    <div className="grid grid-cols-6 gap-3">
                      {supplementaryBooks.map((book, index) => {
                        const resourceId = book.id || `${book.title}-${book.author}`
                        const customCover = customSupplementaryCovers?.get(resourceId)
                        
                        return (
                          <div key={index} className="text-center">
                            {customCover || book.isbn ? (
                              customCover ? (
                                <img 
                                  src={customCover} 
                                  alt="Book cover"
                                  className="h-20 w-14 object-cover rounded border shadow-sm mx-auto"
                                />
                              ) : (
                                <BookCover 
                                  isbn={book.isbn}
                                  title={book.title}
                                  className="h-20 w-14 shadow-sm mx-auto"
                                />
                              )
                            ) : (
                              <div className="h-20 w-14 bg-blue-100 border border-blue-200 rounded flex items-center justify-center mx-auto">
                                <BookOpen className="h-3 w-3 text-blue-600" />
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-1 leading-tight">
                              {book.title}
                            </div>
                            <div className="text-xs text-gray-500 leading-tight">
                              {book.author}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Learning Path - 3 Column Grid */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Daily Learning Path
              </h2>
              
              <div className="space-y-4">
                {/* Main grid for full rows */}
                <div className="grid grid-cols-3 gap-4">
                  {course.daily_modules.slice(0, Math.floor(course.daily_modules.length / 3) * 3).map((module, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3 flex flex-col">
                      {/* Day header */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-gray-800">Day {module.day}</span>
                          {module.video_segment && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {module.video_segment.start}-{module.video_segment.end}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">{module.title}</h3>
                      </div>

                      {/* Watch section */}
                      {module.video_segment?.chapters && module.video_segment.chapters.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                            <Play className="h-4 w-4" />
                            Watch
                          </div>
                          <div className="space-y-1">
                            {module.video_segment.chapters.slice(0, 3).map((chapter, idx) => (
                              <div key={idx} className="text-sm text-gray-700 leading-tight">
                                • {chapter}
                              </div>
                            ))}
                            {module.video_segment.chapters.length > 3 && (
                              <div className="text-sm text-gray-500">+{module.video_segment.chapters.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Read section */}
                      {module.supplementary_readings && module.supplementary_readings.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            Read
                          </div>
                          <div className="space-y-1">
                            {module.supplementary_readings.slice(0, 3).map((reading, idx) => (
                              <div key={idx} className="text-sm text-gray-700 leading-tight">
                                • {reading.title}
                              </div>
                            ))}
                            {module.supplementary_readings.length > 3 && (
                              <div className="text-sm text-gray-500">+{module.supplementary_readings.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Reading focus */}
                      {module.primary_reading_focus && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            Focus
                          </div>
                          <div className="text-sm text-gray-700 leading-tight">
                            {module.primary_reading_focus}
                          </div>
                        </div>
                      )}

                      {/* Key takeaway */}
                      {module.key_insights && module.key_insights.length > 0 && (
                        <div className="space-y-1 flex-1">
                          <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                            <Lightbulb className="h-4 w-4" />
                            Key Takeaway
                          </div>
                          <div className="text-sm text-gray-700 leading-tight">
                            {module.key_insights[0]}
                          </div>
                        </div>
                      )}

                      {/* Time allocation */}
                      {module.time_allocation && (
                        <div className="mt-auto pt-2 border-t border-gray-200">
                          <div className="text-sm text-gray-500 text-center flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4" />
                            {module.time_allocation.total}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Centered remaining modules */}
                {course.daily_modules.length % 3 !== 0 && (
                  <div className={`flex justify-center gap-4`}>
                    {course.daily_modules.slice(Math.floor(course.daily_modules.length / 3) * 3).map((module, index) => (
                      <div key={index + Math.floor(course.daily_modules.length / 3) * 3} className="bg-gray-50 rounded-lg p-4 space-y-3 flex flex-col w-80">
                        {/* Day header */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-gray-800">Day {module.day}</span>
                            {module.video_segment && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {module.video_segment.start}-{module.video_segment.end}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{module.title}</h3>
                        </div>

                        {/* Watch section */}
                        {module.video_segment?.chapters && module.video_segment.chapters.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                              <Play className="h-4 w-4" />
                              Watch
                            </div>
                            <div className="space-y-1">
                              {module.video_segment.chapters.slice(0, 3).map((chapter, idx) => (
                                <div key={idx} className="text-sm text-gray-700 leading-tight">
                                  • {chapter}
                                </div>
                              ))}
                              {module.video_segment.chapters.length > 3 && (
                                <div className="text-sm text-gray-500">+{module.video_segment.chapters.length - 3} more</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Read section */}
                        {module.supplementary_readings && module.supplementary_readings.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              Read
                            </div>
                            <div className="space-y-1">
                              {module.supplementary_readings.slice(0, 3).map((reading, idx) => (
                                <div key={idx} className="text-sm text-gray-700 leading-tight">
                                  • {reading.title}
                                </div>
                              ))}
                              {module.supplementary_readings.length > 3 && (
                                <div className="text-sm text-gray-500">+{module.supplementary_readings.length - 3} more</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Reading focus */}
                        {module.primary_reading_focus && (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              Focus
                            </div>
                            <div className="text-sm text-gray-700 leading-tight">
                              {module.primary_reading_focus}
                            </div>
                          </div>
                        )}

                        {/* Key takeaway */}
                        {module.key_insights && module.key_insights.length > 0 && (
                          <div className="space-y-1 flex-1">
                            <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                              <Lightbulb className="h-4 w-4" />
                              Key Takeaway
                            </div>
                            <div className="text-sm text-gray-700 leading-tight">
                              {module.key_insights[0]}
                            </div>
                          </div>
                        )}

                        {/* Time allocation */}
                        {module.time_allocation && (
                          <div className="mt-auto pt-2 border-t border-gray-200">
                            <div className="text-sm text-gray-500 text-center flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4" />
                              {module.time_allocation.total}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo.png" 
                  alt="Owsla" 
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold">owsla.io</span>
              </div>
              <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render book course export
  return (
    <div className="space-y-4">
      {/* Export Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Export Course Pack</h2>
          <p className="text-sm text-muted-foreground">Compact visual overview with learning objectives</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportAsPNG} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PNG
          </Button>
          {onClose && (
            <Button onClick={onClose} size="sm" variant="ghost">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Course Pack Visual */}
      <div className="flex justify-center">
        <div 
          ref={exportRef}
          className="w-[1200px] max-w-none bg-white text-gray-900 p-6"
          style={{ 
            fontFamily: 'var(--font-sans)',
            minHeight: `${exportHeight}px`
          }}
        >
          {/* Header Section */}
          <div className="flex gap-6 mb-4">
            {/* Left Column: Primary Book + Info */}
            <div className="w-72 space-y-3">
              {/* Primary Resource Cover */}
              {course.primary_resource?.title && (
                customBookCover ? (
                  <img 
                    src={customBookCover} 
                    alt="Primary resource cover"
                    className="h-64 w-48 object-cover rounded-lg border shadow-lg mx-auto"
                  />
                ) : course.primary_resource.isbn ? (
                  <BookCover 
                    isbn={course.primary_resource.isbn}
                    title={course.primary_resource.title}
                    className="h-64 w-48 shadow-lg mx-auto"
                  />
                ) : (
                  <div className="h-64 w-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg mx-auto">
                    <div className="text-white text-center p-4">
                      <BookOpen className="h-10 w-10 mx-auto mb-2" />
                      <div className="text-sm font-medium text-center leading-tight">
                        {course.primary_resource.title}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Compact Primary Resource Info */}
              {course.primary_resource && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Primary Resource</div>
                  <div className="font-bold text-base leading-snug">{course.primary_resource.title}</div>
                  <div className="text-sm text-gray-600 leading-snug">{course.primary_resource.author}</div>
                  <div className="text-xs text-gray-500">
                    {course.primary_resource.publisher} • {course.primary_resource.year}
                  </div>
                </div>
              )}
            </div>

            {/* Center/Right: Course Info & All Books */}
            <div className="flex-1 space-y-3">
              {/* Course Title & Stats */}
              <div className="space-y-2">
                <h1 className="text-4xl font-bold leading-tight">{course.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {course.daily_modules.length} Days
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {supplementaryBooks.length} Books
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {allPapers.length} Papers
                  </span>
                </div>
              </div>
              
              {course.executive_overview && (
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                  {course.executive_overview}
                </p>
              )}

              {/* Supplementary Books */}
              {supplementaryBooks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Supplementary Reading</div>
                  <div className="grid grid-cols-6 gap-3">
                    {supplementaryBooks.map((book, index) => {
                      const resourceId = book.id || `${book.title}-${book.author}`
                      const customCover = customSupplementaryCovers?.get(resourceId)
                      
                      return (
                        <div key={index} className="text-center">
                          {customCover || book.isbn ? (
                            customCover ? (
                              <img 
                                src={customCover} 
                                alt="Book cover"
                                className="h-20 w-14 object-cover rounded border shadow-sm mx-auto"
                              />
                            ) : (
                              <BookCover 
                                isbn={book.isbn}
                                title={book.title}
                                className="h-20 w-14 shadow-sm mx-auto"
                              />
                            )
                          ) : (
                            <div className="h-20 w-14 bg-blue-100 border border-blue-200 rounded flex items-center justify-center mx-auto">
                              <BookOpen className="h-3 w-3 text-blue-600" />
                            </div>
                          )}
                          <div className="text-xs text-gray-600 mt-1 leading-tight">
                            {book.title}
                          </div>
                          <div className="text-xs text-gray-500 leading-tight">
                            {book.author}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Academic Papers */}
              {allPapers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Academic Papers</div>
                  <div className="grid grid-cols-2 gap-2">
                    {allPapers.map((paper, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded p-2">
                        <div className="text-xs font-medium text-green-800 leading-tight">
                          {paper.title}
                        </div>
                        <div className="text-xs text-green-600 leading-tight">{paper.author}</div>
                        {paper.journal && (
                          <div className="text-xs text-green-500 leading-tight">{paper.journal}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily Learning Plan - 3 Column Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Daily Learning Plan
            </h2>
            
            <div className="space-y-4">
              {/* Main grid for full rows */}
              <div className="grid grid-cols-3 gap-4">
                {course.daily_modules.slice(0, Math.floor(course.daily_modules.length / 3) * 3).map((module, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3 flex flex-col">
                    {/* Day header */}
                    <div className="space-y-1">
                      <span className="text-xl font-bold text-gray-800">Day {module.day}</span>
                      <h3 className="text-sm font-semibold text-gray-900 leading-tight">{module.title}</h3>
                    </div>

                    {/* Reading focus */}
                    {module.primary_reading_focus && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          Focus
                        </div>
                        <div className="text-sm text-gray-700 leading-tight">
                          {module.primary_reading_focus}
                        </div>
                      </div>
                    )}

                    {/* Resources to review */}
                    {module.supplementary_readings && module.supplementary_readings.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Review
                        </div>
                        <div className="space-y-1">
                          {module.supplementary_readings.slice(0, 3).map((reading, idx) => (
                            <div key={idx} className="text-sm text-gray-700 leading-tight">
                              • {reading.title}
                            </div>
                          ))}
                          {module.supplementary_readings.length > 3 && (
                            <div className="text-sm text-gray-500">+{module.supplementary_readings.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key takeaway */}
                    {module.key_insights && module.key_insights.length > 0 && (
                      <div className="space-y-1 flex-1">
                        <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                          <Lightbulb className="h-4 w-4" />
                          Key Takeaway
                        </div>
                        <div className="text-sm text-gray-700 leading-tight">
                          {module.key_insights[0]}
                        </div>
                      </div>
                    )}

                    {/* Time allocation */}
                    {module.time_allocation && (
                      <div className="mt-auto pt-2 border-t border-gray-200">
                        <div className="text-sm text-gray-500 text-center flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4" />
                          {module.time_allocation.total}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Centered remaining modules */}
              {course.daily_modules.length % 3 !== 0 && (
                <div className={`flex justify-center gap-4`}>
                  {course.daily_modules.slice(Math.floor(course.daily_modules.length / 3) * 3).map((module, index) => (
                    <div key={index + Math.floor(course.daily_modules.length / 3) * 3} className="bg-gray-50 rounded-lg p-4 space-y-3 flex flex-col w-80">
                      {/* Day header */}
                      <div className="space-y-1">
                        <span className="text-xl font-bold text-gray-800">Day {module.day}</span>
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">{module.title}</h3>
                      </div>

                      {/* Reading focus */}
                      {module.primary_reading_focus && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            Focus
                          </div>
                          <div className="text-sm text-gray-700 leading-tight">
                            {module.primary_reading_focus}
                          </div>
                        </div>
                      )}

                      {/* Resources to review */}
                      {module.supplementary_readings && module.supplementary_readings.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Review
                          </div>
                          <div className="space-y-1">
                            {module.supplementary_readings.slice(0, 3).map((reading, idx) => (
                              <div key={idx} className="text-sm text-gray-700 leading-tight">
                                • {reading.title}
                              </div>
                            ))}
                            {module.supplementary_readings.length > 3 && (
                              <div className="text-sm text-gray-500">+{module.supplementary_readings.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Key takeaway */}
                      {module.key_insights && module.key_insights.length > 0 && (
                        <div className="space-y-1 flex-1">
                          <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                            <Lightbulb className="h-4 w-4" />
                            Key Takeaway
                          </div>
                          <div className="text-sm text-gray-700 leading-tight">
                            {module.key_insights[0]}
                          </div>
                        </div>
                      )}

                      {/* Time allocation */}
                      {module.time_allocation && (
                        <div className="mt-auto pt-2 border-t border-gray-200">
                          <div className="text-sm text-gray-500 text-center flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4" />
                            {module.time_allocation.total}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="Owsla" 
                className="h-4 w-4"
              />
              <span className="text-sm font-semibold">owsla.io</span>
            </div>
            <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
} 