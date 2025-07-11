"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { toPng } from "html-to-image"
import { createStegPNGBlob } from "@/lib/steg-utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookCover } from "@/components/ui/book-cover"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Download,
  CheckCircle,
  AlertCircle,
  Play,
  Clock,
  FileText,
  BookOpen,
  Calendar,
  Target
} from "lucide-react"
import { CourseData, Resource } from "@/types/course-editor"

interface TopstersExportProps {
  course: CourseData
  onClose?: () => void
  customBookCover?: string | null
  customVideoThumbnail?: string | null
  customSupplementaryCovers?: Map<string, string>
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

  const allResources = course.daily_modules.flatMap(module => module.supplementary_readings)
  const isVideoCourse = course.type === 'video' || course.primary_video

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
      // Create the base PNG image without web fonts to avoid font normalization issues
      const dataUrl = await toPng(exportRef.current, {
        quality: 1.0,
        pixelRatio: 1,
        backgroundColor: '#ffffff',
        skipFonts: true,
        style: {
          fontFamily: 'Arial, sans-serif',
        }
      })
      
      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      // Convert blob to buffer for steganography
      const buffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)
      
      // Create steganographic PNG with embedded course data
      const stegBlob = createStegPNGBlob(uint8Array, course)
      
      // Download the image
      const link = document.createElement('a')
      const courseType = isVideoCourse ? 'video' : 'book'
      link.download = `owsla_${courseType}_${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
      link.href = URL.createObjectURL(stegBlob)
      link.click()
      
      // Clean up
      URL.revokeObjectURL(link.href)
      
    } catch (error) {
      console.error('Error exporting image:', error)
      // Fallback: try without steganography
      try {
        const dataUrl = await toPng(exportRef.current, {
          quality: 1.0,
          pixelRatio: 1,
          backgroundColor: '#ffffff',
          skipFonts: true,
          style: {
            fontFamily: 'Arial, sans-serif',
          }
        })
        
        const link = document.createElement('a')
        const courseType = isVideoCourse ? 'video' : 'book'
        link.download = `owsla_${courseType}_${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_basic.png`
        link.href = dataUrl
        link.click()
      } catch (fallbackError) {
        console.error('Fallback export also failed:', fallbackError)
        alert('Export failed. Please try again.')
      }
    }
  }, [course, isVideoCourse])

  // Render video course export
  if (isVideoCourse) {
    return (
      <div className="space-y-4">
        {/* Export Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Export Video Course</h2>
            <p className="text-sm text-muted-foreground">Dense visual overview with embedded course data</p>
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
            className="w-[1800px] h-[1200px] max-w-none bg-white text-gray-900 p-8 flex flex-col"
            style={{ 
              fontFamily: 'var(--font-sans)'
            }}
          >
            {/* Header Section */}
            <div className="flex items-start gap-8 mb-6">
              {/* Video Thumbnail */}
              <div className="flex-shrink-0">
                {videoThumbnailUrl && !thumbnailError ? (
                  <div className="w-96 h-54 relative rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={videoThumbnailUrl} 
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      onError={() => setThumbnailError(true)}
                    />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white drop-shadow-lg" />
                    </div>
                  </div>
                ) : course.primary_video ? (
                  <div className="w-96 h-54 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <div className="text-white text-center">
                      <Play className="h-12 w-12 mx-auto mb-3" />
                      <div className="text-sm opacity-90">{course.primary_video.channel}</div>
                      <div className="text-xs opacity-75 mt-1">{course.primary_video.duration}</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-96 h-54 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center shadow-lg">
                    <div className="text-white text-center">
                      <Play className="h-12 w-12 mx-auto mb-3" />
                      <div className="text-sm">Video Course</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold leading-tight">{course.title}</h1>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {course.daily_modules.length} Days
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.primary_video?.duration || 'Video Course'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {allResources.length} Resources
                    </span>
                  </div>
                </div>
                
                {course.executive_overview && (
                  <p className="text-base text-gray-700 leading-relaxed">
                    {course.executive_overview}
                  </p>
                )}

                {course.primary_video && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Primary Video</div>
                    <div className="font-semibold text-lg">{course.primary_video.title}</div>
                    <div className="text-sm text-gray-600">{course.primary_video.channel}</div>
                    {course.primary_video.published && (
                      <div className="text-xs text-gray-500">
                        Published: {new Date(course.primary_video.published).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Daily Modules Grid */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Learning Journey
              </h2>
              
              <div className="grid grid-cols-4 gap-6 h-full">
                {course.daily_modules.map((module, index) => {
                  const dayResources = module.supplementary_readings || []
                  const books = dayResources.filter(r => r.type === 'book')
                  const papers = dayResources.filter(r => r.type === 'paper')
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4 flex flex-col">
                      {/* Day header */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-gray-800">Day {module.day}</span>
                          {module.video_segment && (
                            <Badge variant="outline" className="text-xs">
                              {module.video_segment.start} - {module.video_segment.end}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">{module.title}</h3>
                      </div>

                      {/* Video segments */}
                      {module.video_segment && module.video_segment.chapters.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">Key Chapters</div>
                          <div className="space-y-1">
                            {module.video_segment.chapters.map((chapter, idx) => (
                              <div key={idx} className="text-xs text-gray-700 bg-white rounded px-2 py-1">
                                {chapter}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      <div className="space-y-3 flex-1">
                        {/* Books section */}
                        {books.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              Books ({books.length})
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {books.map((book, bookIndex) => {
                                const resourceId = book.id || `${book.title}-${book.author}`
                                const customCover = customSupplementaryCovers?.get(resourceId)
                                
                                return (
                                  <div key={bookIndex} className="text-center">
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
                                        <BookOpen className="h-4 w-4 text-blue-600" />
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600 mt-1 line-clamp-2 leading-tight">
                                      {book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Papers section */}
                        {papers.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Papers ({papers.length})
                            </div>
                            <div className="space-y-1">
                              {papers.map((paper, paperIndex) => (
                                <div key={paperIndex} className="bg-green-50 border border-green-200 rounded p-2">
                                  <div className="text-xs font-medium text-green-800 line-clamp-2 leading-tight">
                                    {paper.title}
                                  </div>
                                  <div className="text-xs text-green-600 truncate">{paper.author}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Time allocation */}
                      {module.time_allocation && (
                        <div className="mt-auto pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            {module.time_allocation.total}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo.png" 
                  alt="Owsla" 
                  className="h-5 w-5"
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
          <p className="text-sm text-muted-foreground">Dense visual overview with embedded course data</p>
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
          className="w-[1800px] h-[1200px] max-w-none bg-white text-gray-900 p-8 flex flex-col"
          style={{ 
            fontFamily: 'var(--font-sans)'
          }}
        >
          {/* Header Section */}
          <div className="flex items-start gap-8 mb-6">
            {/* Primary Resource Cover */}
            <div className="flex-shrink-0">
              {course.primary_resource?.title && (
                customBookCover ? (
                  <img 
                    src={customBookCover} 
                    alt="Primary resource cover"
                    className="h-80 w-60 object-cover rounded-lg border shadow-lg"
                  />
                ) : course.primary_resource.isbn ? (
                  <BookCover 
                    isbn={course.primary_resource.isbn}
                    title={course.primary_resource.title}
                    className="h-80 w-60 shadow-lg"
                  />
                ) : (
                  <div className="h-80 w-60 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <div className="text-white text-center p-4">
                      <BookOpen className="h-12 w-12 mx-auto mb-3" />
                      <div className="text-sm font-medium text-center leading-tight">
                        {course.primary_resource.title}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Course Info */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h1 className="text-5xl font-bold leading-tight">{course.title}</h1>
                <div className="flex items-center gap-6 text-base text-gray-600">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {course.daily_modules.length} Days
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {allResources.length} Resources
                  </span>
                </div>
              </div>
              
              {course.executive_overview && (
                <p className="text-base text-gray-700 leading-relaxed">
                  {course.executive_overview}
                </p>
              )}

              {course.primary_resource && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="text-sm text-gray-500 uppercase tracking-wide">Primary Resource</div>
                  <div className="font-bold text-2xl">{course.primary_resource.title}</div>
                  <div className="text-lg text-gray-600">{course.primary_resource.author}</div>
                  <div className="text-sm text-gray-500">
                    {course.primary_resource.publisher} • {course.primary_resource.year}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily Modules Grid */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Daily Learning Plan
            </h2>
            
            <div className="grid grid-cols-4 gap-6 h-full">
              {course.daily_modules.map((module, index) => {
                const dayResources = module.supplementary_readings || []
                const books = dayResources.filter(r => r.type === 'book')
                const papers = dayResources.filter(r => r.type === 'paper')
                
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4 flex flex-col">
                    {/* Day header */}
                    <div className="space-y-2">
                      <span className="text-2xl font-bold text-gray-800">Day {module.day}</span>
                      <h3 className="text-sm font-semibold text-gray-900 leading-tight">{module.title}</h3>
                      {module.primary_reading_focus && (
                        <p className="text-xs text-gray-600 italic leading-tight">
                          {module.primary_reading_focus}
                        </p>
                      )}
                    </div>

                    {/* Resources with covers */}
                    <div className="space-y-4 flex-1">
                      {/* Books section */}
                      {books.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            Books ({books.length})
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {books.map((book, bookIndex) => {
                              const resourceId = book.id || `${book.title}-${book.author}`
                              const customCover = customSupplementaryCovers?.get(resourceId)
                              
                              return (
                                <div key={bookIndex} className="text-center">
                                  {customCover || book.isbn ? (
                                    customCover ? (
                                      <img 
                                        src={customCover} 
                                        alt="Book cover"
                                        className="h-24 w-18 object-cover rounded border shadow-sm mx-auto"
                                      />
                                    ) : (
                                      <BookCover 
                                        isbn={book.isbn}
                                        title={book.title}
                                        className="h-24 w-18 shadow-sm mx-auto"
                                      />
                                    )
                                  ) : (
                                    <div className="h-24 w-18 bg-blue-100 border border-blue-200 rounded flex items-center justify-center mx-auto">
                                      <BookOpen className="h-5 w-5 text-blue-600" />
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-600 mt-2 line-clamp-2 leading-tight">
                                    {book.title}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {book.author}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Papers section */}
                      {papers.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Papers ({papers.length})
                          </div>
                          <div className="space-y-2">
                            {papers.map((paper, paperIndex) => (
                              <div key={paperIndex} className="bg-green-50 border border-green-200 rounded p-2">
                                <div className="text-xs font-medium text-green-800 line-clamp-2 leading-tight">
                                  {paper.title}
                                </div>
                                <div className="text-xs text-green-600 truncate">{paper.author}</div>
                                {paper.journal && (
                                  <div className="text-xs text-green-500 truncate">{paper.journal}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Time allocation */}
                    {module.time_allocation && (
                      <div className="mt-auto pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />
                          {module.time_allocation.total}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="Owsla" 
                className="h-5 w-5"
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