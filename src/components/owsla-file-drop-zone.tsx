"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Upload, 
  FileText, 
  BookOpen, 
  Video, 
  Calendar, 
  Clock, 
  Check,
  Loader2
} from "lucide-react"
import { CourseData } from "@/types/course-editor"
import { saveCurriculum } from "@/lib/actions"
import { useUser } from "@stackframe/stack"
import { toast } from "sonner"

interface OwslaFileDropZoneProps {
  onImportSuccess?: (courseId: string) => void
}

interface ParsedCourseData extends CourseData {
  export_timestamp?: string
  export_version?: string
}

export function OwslaFileDropZone({ onImportSuccess }: OwslaFileDropZoneProps) {
  const user = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<ParsedCourseData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [startDate, setStartDate] = useState<string>('')

  const parseOwslaFile = useCallback(async (file: File): Promise<ParsedCourseData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const parsed = JSON.parse(content) as ParsedCourseData
          
          // Validate that it's a valid course data structure
          if (!parsed.title || !parsed.daily_modules || !Array.isArray(parsed.daily_modules)) {
            throw new Error('Invalid course data structure')
          }
          
          resolve(parsed)
        } catch (error) {
          reject(new Error('Failed to parse course file: ' + (error as Error).message))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const handleFileSelect = useCallback(async (files: FileList) => {
    const file = files[0]
    if (!file) return

    // Check file extension
    if (!file.name.endsWith('.owsla')) {
      toast.error('Please select a valid .owsla file')
      return
    }

    setIsProcessing(true)
    try {
      const courseData = await parseOwslaFile(file)
      // Remove ID to ensure it's treated as a new course
      delete courseData.id
      setPreviewData(courseData)
      
      // Set default start date to today
      const today = new Date()
      setStartDate(today.toISOString().split('T')[0])
      
      setShowPreview(true)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }, [parseOwslaFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }, [handleFileSelect])

  // Function to recalculate dates based on start date
  const recalculateDates = useCallback((courseData: ParsedCourseData, newStartDate: string) => {
    if (!newStartDate || courseData.daily_modules.length === 0) return courseData

    const startDateObj = new Date(newStartDate)
    const updatedModules = courseData.daily_modules.map((module, index) => {
      const moduleDate = new Date(startDateObj)
      moduleDate.setDate(startDateObj.getDate() + index)
      
      return {
        ...module,
        date: moduleDate.toISOString().split('T')[0] // YYYY-MM-DD format
      }
    })

    return {
      ...courseData,
      daily_modules: updatedModules
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!previewData || !user?.id) {
      toast.error('Unable to import: missing data or user not signed in')
      return
    }

    if (!startDate) {
      toast.error('Please select a start date for the course')
      return
    }

    setIsImporting(true)
    try {
      // Recalculate dates based on selected start date
      const updatedCourseData = recalculateDates(previewData, startDate)
      
      const result = await saveCurriculum(updatedCourseData, user.id)
      
      if (result.success) {
        toast.success('Course imported successfully!')
        setShowPreview(false)
        setPreviewData(null)
        setStartDate('')
        onImportSuccess?.(result.data?.id || '')
      } else {
        toast.error(result.error || 'Failed to import course')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('An unexpected error occurred during import')
    } finally {
      setIsImporting(false)
    }
  }, [previewData, user?.id, startDate, recalculateDates, onImportSuccess])

  const closePreview = useCallback(() => {
    setShowPreview(false)
    setPreviewData(null)
    setStartDate('')
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <>
      <div className="w-full">
        <div
          className={`
            border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
            ${isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".owsla"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-2">
            {isProcessing ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="text-sm">
              <p className="font-medium">
                {isProcessing ? 'Processing...' : 'Drop .owsla files here'}
              </p>
              <p className="text-muted-foreground">
                {isProcessing ? 'Reading course data' : 'or click to browse'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Import Course
            </DialogTitle>
            <DialogDescription>
              Review the course details before importing
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {/* Start Date Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Course Schedule
                    </CardTitle>
                    <CardDescription>
                      Choose when you want to start this {previewData.daily_modules.length}-day course
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full"
                      />
                      {startDate && (
                        <p className="text-sm text-muted-foreground">
                          Course will run from {formatDate(startDate)} to {formatDate(
                            new Date(new Date(startDate).getTime() + (previewData.daily_modules.length - 1) * 24 * 60 * 60 * 1000)
                              .toISOString().split('T')[0]
                          )}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Course Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {previewData.type === 'video' ? (
                        <Video className="h-5 w-5" />
                      ) : (
                        <BookOpen className="h-5 w-5" />
                      )}
                      {previewData.title}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">
                          {previewData.type === 'video' ? 'Video Course' : 'Book Course'}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {previewData.daily_modules.length} days
                        </span>
                        {previewData.export_timestamp && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Exported {formatDate(previewData.export_timestamp)}
                          </span>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  {previewData.executive_overview && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {previewData.executive_overview}
                      </p>
                    </CardContent>
                  )}
                </Card>

                {/* Primary Resource */}
                {(previewData.primary_resource?.title || previewData.primary_video?.title) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Primary Resource</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {previewData.primary_resource?.title && (
                        <div className="space-y-2">
                          <p className="font-medium">{previewData.primary_resource.title}</p>
                          {previewData.primary_resource.author && (
                            <p className="text-sm text-muted-foreground">
                              by {previewData.primary_resource.author}
                            </p>
                          )}
                          {previewData.primary_resource.year && (
                            <p className="text-sm text-muted-foreground">
                              Published: {previewData.primary_resource.year}
                            </p>
                          )}
                        </div>
                      )}
                      {previewData.primary_video?.title && (
                        <div className="space-y-2">
                          <p className="font-medium">{previewData.primary_video.title}</p>
                          {previewData.primary_video.channel && (
                            <p className="text-sm text-muted-foreground">
                              by {previewData.primary_video.channel}
                            </p>
                          )}
                          {previewData.primary_video.duration && (
                            <p className="text-sm text-muted-foreground">
                              Duration: {previewData.primary_video.duration}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Course Structure Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Course Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {previewData.daily_modules.slice(0, 5).map((module, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="w-12 justify-center">
                            Day {module.day}
                          </Badge>
                          <span className="flex-1">{module.title}</span>
                        </div>
                      ))}
                      {previewData.daily_modules.length > 5 && (
                        <p className="text-sm text-muted-foreground">
                          ... and {previewData.daily_modules.length - 5} more days
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closePreview}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting || !startDate}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Import Course
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 