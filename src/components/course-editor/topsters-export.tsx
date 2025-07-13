"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { snapdom } from "@zumer/snapdom";
import { deduplicateBooks } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BookCover } from "@/components/ui/book-cover"
import { 
  Download,
  Play,
  Clock,
  FileText,
  BookOpen,
  Calendar,
  Target,
  Lightbulb,
  Loader2
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

// Helper function to create and download zip file
async function downloadAsZip(files: { name: string; blob: Blob }[], zipName: string) {
  // Dynamic import of JSZip
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  
  // Add files to zip
  files.forEach(file => {
    zip.file(file.name, file.blob)
  })
  
  // Generate zip and download
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function TopstersExport({ 
  course, 
  onClose,
  customBookCover,
  customVideoThumbnail,
  customSupplementaryCovers
}: TopstersExportProps) {
  const card1Ref = useRef<HTMLDivElement>(null)
  const card2Ref = useRef<HTMLDivElement>(null)
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [isExportingZip, setIsExportingZip] = useState(false)
  const [isExportingJson, setIsExportingJson] = useState(false)

  const isVideoCourse = course.type === 'video' || course.primary_video
  const deduplicatedBooks = prepareResourcesForDeduplication(course)
  
  // Separate supplementary books from primary
  const supplementaryBooks = deduplicatedBooks.filter(book => book.type === 'supplementary')
  
  // Get all papers from daily modules
  const allPapers = course.daily_modules.flatMap(module => 
    module.supplementary_readings?.filter(reading => reading.type === 'paper') || []
  )

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

  const exportCard = useCallback(async (cardRef: React.RefObject<HTMLDivElement | null>) => {
    if (cardRef.current === null) return null

    try {
      // Ensure all content is rendered before capturing
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Create the PNG image using snapdom
      const result = await snapdom(cardRef.current, {
        backgroundColor: '#ffffff',
        width: 1200,
        height: 800,
        format: 'png',
        useProxy: 'https://api.allorigins.win/raw?url='
      })
      
      return result.toBlob()
      
    } catch (error) {
      console.error('Error exporting card:', error)
      return null
    }
  }, [])

  // Function to export course data as JSON (.owsla file)
  const exportCourseJson = useCallback(async () => {
    setIsExportingJson(true)
    try {
      const courseData = {
        ...course,
        export_timestamp: new Date().toISOString(),
        export_version: "1.0"
      }
      
      const jsonString = JSON.stringify(courseData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      const courseType = isVideoCourse ? 'video' : 'book'
      const filename = `owsla_${courseType}_${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.owsla`
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error exporting JSON:', error)
      alert('JSON export failed. Please try again.')
    } finally {
      setIsExportingJson(false)
    }
  }, [course, isVideoCourse])

  const exportBothCards = useCallback(async () => {
    setIsExportingZip(true)
    try {
      const [card1Blob, card2Blob] = await Promise.all([
        exportCard(card1Ref),
        exportCard(card2Ref)
      ])
      
      if (!card1Blob || !card2Blob) {
        alert('Export failed. Please try again.')
        return
      }
      
      const courseType = isVideoCourse ? 'video' : 'book'
      const baseFilename = `owsla_${courseType}_${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
      
      // Create course data JSON for inclusion in zip
      const courseData = {
        ...course,
        export_timestamp: new Date().toISOString(),
        export_version: "1.0"
      }
      const jsonString = JSON.stringify(courseData, null, 2)
      const jsonBlob = new Blob([jsonString], { type: 'application/json' })
      
      const files = [
        { name: `${baseFilename}_overview.png`, blob: card1Blob },
        { name: `${baseFilename}_schedule.png`, blob: card2Blob },
        { name: `${baseFilename}.owsla`, blob: jsonBlob }
      ]
      
      await downloadAsZip(files, `${baseFilename}_syllabus.zip`)
      
    } catch (error) {
      console.error('Error creating zip:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExportingZip(false)
    }
  }, [exportCard, course, isVideoCourse])

  const cardStyle = {
    width: '1200px',
    height: '800px',
    fontFamily: 'var(--font-sans)',
    backgroundColor: '#ffffff',
    color: '#111827'
  }

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Export Course Pack</h2>
          <p className="text-sm text-muted-foreground">Visual syllabus cards + course data (.owsla file)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCourseJson} size="sm" variant="outline" disabled={isExportingJson}>
            {isExportingJson ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {isExportingJson ? 'Exporting...' : 'Export Course File'}
          </Button>
          <Button onClick={exportBothCards} size="sm" disabled={isExportingZip}>
            {isExportingZip ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExportingZip ? 'Exporting...' : 'Export Full Pack'}
          </Button>
          {onClose && (
            <Button onClick={onClose} size="sm" variant="ghost">
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 flex flex-col items-center">
        {/* Card 1: Course Overview with Books, Papers, and Description */}
        <div 
          ref={card1Ref}
          className="max-w-none border border-gray-200 rounded-lg overflow-hidden shadow-lg"
          style={cardStyle}
        >
          <div className="p-6 h-full flex flex-col">
            {/* Header with Title and Branding */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src="/logo.png" 
                    alt="Owsla" 
                    className="h-8 w-8"
                  />
                  <span className="text-xl font-bold text-gray-800">owsla.io</span>
                </div>
                <h1 className="text-3xl font-bold leading-tight mb-2">{course.title}</h1>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {course.daily_modules.length} Days
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {deduplicatedBooks.length} Books
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {allPapers.length} Papers
                  </span>
                  {isVideoCourse && course.primary_video && (
                    <span className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      {course.primary_video.duration}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Primary Resource Cover - Larger */}
              <div className="ml-6">
                {isVideoCourse ? (
                  videoThumbnailUrl && !thumbnailError ? (
                    <div className="w-64 h-36 relative rounded-lg overflow-hidden shadow-lg">
                      <img 
                        src={videoThumbnailUrl} 
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                        onError={() => setThumbnailError(true)}
                      />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-64 h-36 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <div className="text-white text-center">
                        <Play className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-sm">Video Course</div>
                      </div>
                    </div>
                  )
                ) : (
                  course.primary_resource?.title && (
                    customBookCover ? (
                      <img 
                        src={customBookCover} 
                        alt="Primary resource cover"
                        className="h-48 w-36 object-cover rounded-lg border shadow-lg"
                      />
                    ) : course.primary_resource.isbn ? (
                      <BookCover 
                        isbn={course.primary_resource.isbn}
                        title={course.primary_resource.title}
                        className="h-48 w-36 shadow-lg"
                      />
                    ) : (
                      <div className="h-48 w-36 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <div className="text-white text-center p-3">
                          <BookOpen className="h-6 w-6 mx-auto mb-2" />
                          <div className="text-sm font-medium text-center leading-tight">
                            {course.primary_resource.title.substring(0, 40)}
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            {/* Course Overview - Compact */}
            {course.executive_overview && (
              <div className="mb-4">
                <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Course Overview
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                  {course.executive_overview}
                </p>
              </div>
            )}

            <div className="flex-1 flex gap-6">
              {/* Books Section - More Visual */}
              <div className="flex-1">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Required Reading
                </h2>
                
                {/* Primary Resource Info */}
                {course.primary_resource && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Primary Text</div>
                    <div className="font-semibold text-sm text-gray-900">{course.primary_resource.title}</div>
                    <div className="text-xs text-gray-600">{course.primary_resource.author}</div>
                  </div>
                )}

                {/* Supplementary Books - Larger and More Prominent */}
                {supplementaryBooks.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Supplementary Texts</div>
                    <div className="grid grid-cols-8 gap-2">
                      {supplementaryBooks.slice(0, 16).map((book, index) => {
                        const resourceId = book.id || `${book.title}-${book.author}`
                        const customCover = customSupplementaryCovers?.get(resourceId)
                        
                        return (
                          <div key={index} className="text-center">
                            {customCover || book.isbn ? (
                              customCover ? (
                                <img 
                                  src={customCover} 
                                  alt="Book cover"
                                  className="h-24 w-16 object-cover rounded border shadow-md mx-auto hover:shadow-lg transition-shadow"
                                />
                              ) : (
                                <BookCover 
                                  isbn={book.isbn}
                                  title={book.title}
                                  className="h-24 w-16 shadow-md mx-auto hover:shadow-lg transition-shadow"
                                />
                              )
                            ) : (
                              <div className="h-24 w-16 bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300 rounded flex items-center justify-center mx-auto shadow-md">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-1 leading-tight font-medium">
                              {book.title.length > 12 ? book.title.substring(0, 12) + '...' : book.title}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {supplementaryBooks.length > 16 && (
                      <div className="text-xs text-gray-500 text-center mt-2">
                        +{supplementaryBooks.length - 16} more books
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Papers Section - Compact */}
              {allPapers.length > 0 && (
                <div className="w-80">
                  <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Academic Papers ({allPapers.length})
                  </h2>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {allPapers.map((paper, index) => (
                      <div key={index} className="border-l-2 border-green-200 pl-2 py-1">
                        <div className="text-xs font-medium text-gray-800 leading-tight">
                          {paper.title}
                        </div>
                        <div className="text-xs text-gray-600 leading-tight">
                          {paper.author}
                        </div>
                        {(paper.journal || paper.year) && (
                          <div className="text-xs text-gray-500 leading-tight">
                            {paper.journal && paper.year ? `${paper.journal} (${paper.year})` : 
                             paper.journal || paper.year}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2 border-t border-gray-200 flex justify-between items-center">
              <div className="text-xs text-gray-500">Course Syllabus • Page 1 of 2</div>
              <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Card 2: Daily Learning Schedule - Horizontal Layout */}
        <div 
          ref={card2Ref}
          className="max-w-none border border-gray-200 rounded-lg overflow-hidden shadow-lg"
          style={cardStyle}
        >
          <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src="/logo.png" 
                    alt="Owsla" 
                    className="h-6 w-6"
                  />
                  <span className="text-lg font-bold text-gray-800">owsla.io</span>
                </div>
                <h1 className="text-2xl font-bold leading-tight">{course.title}</h1>
                <div className="text-sm text-gray-600">{course.daily_modules.length}-Day Learning Schedule</div>
              </div>
            </div>

            {/* Daily Modules - Horizontal Timeline Layout */}
            <div className="flex-1 overflow-hidden">
              {/* Days Timeline */}
              <div className="grid gap-2 h-full" style={{ gridTemplateColumns: `repeat(${Math.min(course.daily_modules.length, 5)}, 1fr)` }}>
                {course.daily_modules.map((module, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <span className="text-base font-bold text-gray-800">Day {module.day}</span>
                      {module.time_allocation && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {module.time_allocation.total}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-2 flex-shrink-0">
                      {module.title.length > 50 ? module.title.substring(0, 50) + '...' : module.title}
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-2">
                      {/* Video segment for video courses */}
                      {isVideoCourse && module.video_segment && (
                        <div>
                          <div className="text-xs text-gray-600 font-medium flex items-center gap-1 mb-1">
                            <Play className="h-3 w-3" />
                            {module.video_segment.start}-{module.video_segment.end}
                          </div>
                          {module.video_segment.chapters && module.video_segment.chapters.length > 0 && (
                            <div className="text-xs text-gray-700 leading-tight">
                              {module.video_segment.chapters.slice(0, 2).join(', ')}
                              {module.video_segment.chapters.length > 2 && ` +${module.video_segment.chapters.length - 2}`}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reading focus */}
                      {module.primary_reading_focus && (
                        <div>
                          <div className="text-xs text-gray-600 font-medium flex items-center gap-1 mb-1">
                            <BookOpen className="h-3 w-3" />
                            Focus
                          </div>
                          <div className="text-xs text-gray-700 leading-tight">
                            {module.primary_reading_focus.length > 60 ? 
                              module.primary_reading_focus.substring(0, 60) + '...' : 
                              module.primary_reading_focus}
                          </div>
                        </div>
                      )}

                      {/* Supplementary readings */}
                      {module.supplementary_readings && module.supplementary_readings.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-600 font-medium flex items-center gap-1 mb-1">
                            <FileText className="h-3 w-3" />
                            Materials ({module.supplementary_readings.length})
                          </div>
                          <div className="text-xs text-gray-700 leading-tight">
                            {module.supplementary_readings.slice(0, 2).map(r => {
                              const shortTitle = r.title.length > 25 ? r.title.substring(0, 25) + '...' : r.title
                              return shortTitle
                            }).join(', ')}
                            {module.supplementary_readings.length > 2 && ` +${module.supplementary_readings.length - 2}`}
                          </div>
                        </div>
                      )}

                      {/* Key insight */}
                      {module.key_insights && module.key_insights.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-600 font-medium flex items-center gap-1 mb-1">
                            <Lightbulb className="h-3 w-3" />
                            Key Takeaway
                          </div>
                          <div className="text-xs text-gray-700 leading-tight">
                            {module.key_insights[0].length > 80 ? 
                              module.key_insights[0].substring(0, 80) + '...' : 
                              module.key_insights[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional rows for courses with more than 5 days */}
              {course.daily_modules.length > 5 && (
                <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(course.daily_modules.length - 5, 5)}, 1fr)` }}>
                  {course.daily_modules.slice(5, 10).map((module, index) => (
                    <div key={index + 5} className="bg-gray-50 rounded-lg p-3 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <span className="text-base font-bold text-gray-800">Day {module.day}</span>
                        {module.time_allocation && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {module.time_allocation.total}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-2 flex-shrink-0">
                        {module.title.length > 50 ? module.title.substring(0, 50) + '...' : module.title}
                      </h3>

                      <div className="flex-1 overflow-y-auto space-y-2">
                        {/* Condensed content similar to above */}
                        {isVideoCourse && module.video_segment && (
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">Watch:</span> {module.video_segment.start}-{module.video_segment.end}
                          </div>
                        )}

                        {module.primary_reading_focus && (
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">Focus:</span> {module.primary_reading_focus.substring(0, 40)}...
                          </div>
                        )}

                        {module.key_insights && module.key_insights.length > 0 && (
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">Key:</span> {module.key_insights[0].substring(0, 60)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Third row for courses with more than 10 days */}
              {course.daily_modules.length > 10 && (
                <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(course.daily_modules.length - 10, 5)}, 1fr)` }}>
                  {course.daily_modules.slice(10, 15).map((module, index) => (
                    <div key={index + 10} className="bg-gray-50 rounded-lg p-3 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-1 flex-shrink-0">
                        <span className="text-base font-bold text-gray-800">Day {module.day}</span>
                        {module.time_allocation && (
                          <span className="text-xs text-gray-500">{module.time_allocation.total}</span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-2 flex-shrink-0">
                        {module.title.length > 40 ? module.title.substring(0, 40) + '...' : module.title}
                      </h3>

                      <div className="flex-1 text-xs text-gray-700 space-y-1">
                        {module.primary_reading_focus && (
                          <div>{module.primary_reading_focus.substring(0, 35)}...</div>
                        )}
                        {module.key_insights && module.key_insights.length > 0 && (
                          <div className="italic">{module.key_insights[0].substring(0, 45)}...</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2 border-t border-gray-200 flex justify-between items-center">
              <div className="text-xs text-gray-500">Learning Schedule • Page 2 of 2</div>
              <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 