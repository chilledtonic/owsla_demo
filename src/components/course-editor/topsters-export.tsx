"use client"

import { useRef, useCallback } from "react"
import { toPng, toJpeg, toBlob } from "html-to-image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookCover } from "@/components/ui/book-cover"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Download, 
  BookOpen, 
  FileText, 
  Youtube, 
  Globe,
  Calendar,
  Clock,
  Target,
  Brain
} from "lucide-react"
import { CourseData, Resource } from "@/types/course-editor"

interface TopstersExportProps {
  course: CourseData
  onClose?: () => void
}

function ResourceGrid({ resources, title }: { resources: Resource[]; title: string }) {
  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'book':
        return <BookOpen className="h-3 w-3" />
      case 'paper':
      case 'article':
        return <FileText className="h-3 w-3" />
      case 'video':
        return <Youtube className="h-3 w-3" />
      default:
        return <Globe className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="grid grid-cols-6 gap-2">
        {resources.slice(0, 12).map((resource, index) => (
          <div key={index} className="aspect-square relative group">
            {resource.isbn ? (
              <BookCover 
                isbn={resource.isbn}
                title={resource.title}
                className="w-full h-full object-cover rounded border"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded border flex items-center justify-center">
                {getResourceIcon(resource.type)}
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded flex items-center justify-center">
              <div className="text-white text-xs text-center opacity-0 group-hover:opacity-100 p-1">
                <div className="font-medium truncate">{resource.title}</div>
                <div className="text-xs opacity-75 truncate">{resource.author}</div>
              </div>
            </div>
          </div>
        ))}
        {resources.length > 12 && (
          <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
            <span className="text-xs text-gray-500">+{resources.length - 12}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function TopstersExport({ course, onClose }: TopstersExportProps) {
  const exportRef = useRef<HTMLDivElement>(null)

  const allResources = course.daily_modules.flatMap(module => module.supplementary_readings)
  const bookResources = allResources.filter(r => r.type === 'book')
  const paperResources = allResources.filter(r => r.type === 'paper' || r.type === 'article')
  const videoResources = allResources.filter(r => r.type === 'video')
  const otherResources = allResources.filter(r => !['book', 'paper', 'article', 'video'].includes(r.type))

  const exportAsPNG = useCallback(async () => {
    if (exportRef.current === null) return

    try {
      const dataUrl = await toPng(exportRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1200,
        height: 1600,
      })
      
      const link = document.createElement('a')
      link.download = `${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_course_pack.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error exporting image:', error)
    }
  }, [course.title])

  const exportAsJPEG = useCallback(async () => {
    if (exportRef.current === null) return

    try {
      const dataUrl = await toJpeg(exportRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1200,
        height: 1600,
      })
      
      const link = document.createElement('a')
      link.download = `${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_course_pack.jpg`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error exporting image:', error)
    }
  }, [course.title])

  const shareToSocial = useCallback(async () => {
    if (exportRef.current === null) return

    try {
      const blob = await toBlob(exportRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1200,
        height: 1600,
      })
      
      if (blob && navigator.share) {
        const file = new File([blob], `${course.title}_course_pack.png`, { type: 'image/png' })
        await navigator.share({
          title: `${course.title} - Course Pack`,
          text: `Check out this ${course.daily_modules.length}-day course pack: ${course.title}`,
          files: [file]
        })
      } else if (blob) {
        // Fallback: copy to clipboard
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
        alert('Course pack copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }, [course.title, course.daily_modules.length])

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Export Course Pack</h2>
        <div className="flex gap-2">
          <Button onClick={exportAsPNG} size="sm">
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          <Button onClick={exportAsJPEG} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            JPEG
          </Button>
          <Button onClick={shareToSocial} size="sm" variant="outline">
            Share
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
          className="w-[600px] bg-white p-8 space-y-6 border shadow-lg"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Header */}
          <div className="text-center space-y-3 border-b pb-6">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {course.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{course.daily_modules.length} Days</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{allResources.length} Resources</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Course Pack</span>
              </div>
            </div>
            {course.executive_overview && (
              <p className="text-sm text-gray-700 max-w-md mx-auto leading-relaxed">
                {course.executive_overview.length > 200 
                  ? course.executive_overview.substring(0, 200) + '...'
                  : course.executive_overview
                }
              </p>
            )}
          </div>

          {/* Primary Resource */}
          {course.primary_resource.title && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Primary Resource
              </h3>
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                {course.primary_resource.isbn && (
                  <BookCover 
                    isbn={course.primary_resource.isbn}
                    title={course.primary_resource.title}
                    className="h-16 w-12 flex-shrink-0"
                  />
                )}
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900">{course.primary_resource.title}</h4>
                  <p className="text-sm text-gray-600">{course.primary_resource.author}</p>
                  <p className="text-xs text-gray-500">
                    {course.primary_resource.publisher} • {course.primary_resource.year}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resource Collections */}
          <div className="space-y-4">
            {bookResources.length > 0 && (
              <ResourceGrid resources={bookResources} title="📚 Books" />
            )}
            
            {paperResources.length > 0 && (
              <ResourceGrid resources={paperResources} title="📄 Papers & Articles" />
            )}
            
            {videoResources.length > 0 && (
              <ResourceGrid resources={videoResources} title="🎥 Videos" />
            )}
            
            {otherResources.length > 0 && (
              <ResourceGrid resources={otherResources} title="🔗 Other Resources" />
            )}
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Learning Path</h3>
            <div className="grid grid-cols-7 gap-1">
              {course.daily_modules.map((module, index) => (
                <div key={index} className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded p-1 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-gray-800">{module.day}</div>
                  <div className="text-xs text-gray-600 leading-tight truncate w-full">
                    {module.title.split(' ').slice(0, 2).join(' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 flex justify-between items-center text-xs text-gray-500">
            <div>Created with Owsla Course Editor</div>
            <div>{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>This is how your course pack will appear when exported. The image will be 1200x1600 pixels.</p>
      </div>
    </div>
  )
} 