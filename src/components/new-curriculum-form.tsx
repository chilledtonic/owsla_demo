"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { useUser } from "@stackframe/stack"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Youtube, BookOpen, ArrowRight, Library } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { submitNewCurriculum, submitYoutubeCurriculum, submitSourceCurriculum } from "@/lib/actions"
import { TopicTab } from "./new-curriculum-form/topic-tab"
import { YoutubeTab } from "./new-curriculum-form/youtube-tab"
import { SourceTab } from "./new-curriculum-form/source-tab"
import { QuickSetup } from "./new-curriculum-form/quick-setup"
import { AdvancedConfig } from "./new-curriculum-form/advanced-config"
import { Resource } from "@/types/course-editor"

interface YoutubeMetadata {
  title: string
  author_name: string
  thumbnail_url: string
  html: string
}

interface ExtendedYoutubeMetadata extends YoutubeMetadata {
  duration?: number // Duration in seconds
  durationString?: string // Human readable duration
}

interface NewCurriculumFormProps {
  onCancel?: () => void
  onSuccess?: () => void
}

interface CurriculumFormData {
  topic: string
  preliminaries: string
  course_parameters: {
    length_of_study: number
    daily_time_commitment: number
    depth_level: number
    pace: "fast" | "moderate" | "slow"
  }
  learner_profile: {
    education_level: "novice" | "undergraduate" | "graduate" | "professional"
    prior_knowledge: "none" | "basic" | "intermediate" | "advanced"
    learning_style: "visual" | "conceptual" | "practical" | "mixed"
  }
  curriculum_preferences: {
    focus_areas: string[]
    supplementary_material_ratio: number
    contemporary_vs_classical: number
  }
  schedule: {
    study_days: string[]
    break_weeks: string[]
  }
}

// Helper function to convert seconds to readable format
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Calculate recommended days based on video duration
const calculateRecommendedDays = (durationInSeconds: number): number => {
  const minutes = durationInSeconds / 60
  
  if (minutes < 30) {
    return 3 // Minimum for short videos
  } else if (minutes <= 60) {
    return 7 // 1 hour = 7 days
  } else if (minutes <= 120) {
    return 8 // 2 hours = 8 days  
  } else if (minutes <= 180) {
    return 9 // 3 hours = 9 days
  } else if (minutes <= 360) {
    return 10 // 6 hours = 10 days
  } else {
    // For very long videos, scale more gradually
    return Math.min(15, Math.ceil(10 + (minutes - 360) / 120))
  }
}

// Get YouTube video duration using oEmbed and page scraping
const getYouTubeVideoDuration = async (videoId: string): Promise<number | null> => {
  try {
    // Method 1: Try to scrape from YouTube watch page
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`)
    
    if (response.ok) {
      const data = await response.json()
      
      // Check if we got duration from oEmbed (some providers include it)
      if (data.duration) {
        return parseInt(data.duration, 10)
      }
      
      // Look for duration in the HTML response
      if (data.html) {
        const durationMatch = data.html.match(/duration[":=][\s]*['"]*(\d+)['"]*/)
        if (durationMatch) {
          return parseInt(durationMatch[1], 10)
        }
      }
    }
    
    // Method 2: Try YouTube's own oEmbed endpoint  
    const youtubeOEmbedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`)
    
    if (youtubeOEmbedResponse.ok) {
      const youtubeData = await youtubeOEmbedResponse.json()
      
      // Parse duration from title if it includes it (some videos have it)
      if (youtubeData.title) {
        const titleDurationMatch = youtubeData.title.match(/\((\d+):(\d+)\)|\[(\d+):(\d+)\]/)
        if (titleDurationMatch) {
          const minutes = parseInt(titleDurationMatch[1] || titleDurationMatch[3], 10)
          const seconds = parseInt(titleDurationMatch[2] || titleDurationMatch[4], 10)
          return minutes * 60 + seconds
        }
      }
    }
    
    // Method 3: Estimate based on common patterns or return null for graceful degradation
    // For now, we'll return a default duration that passes validation so the form isn't blocked
    // In production, you'd implement a proper YouTube API integration or server-side solution
    console.warn('Could not determine video duration for', videoId)
    return 3600 // Default to 1 hour (passes 30-minute minimum)
    
  } catch (error) {
    console.error('Error fetching video duration:', error)
    // Return default duration to not block the form
    return 3600 // Default to 1 hour
  }
}

// Memoized slider component for better performance
const OptimizedSlider = memo(({ value, onValueChange, ...props }: {
  value: number[]
  onValueChange: (value: number[]) => void
  [key: string]: unknown
}) => (
  <Slider value={value} onValueChange={onValueChange} {...props} />
))

OptimizedSlider.displayName = 'OptimizedSlider'

export function NewCurriculumForm({ onCancel, onSuccess }: NewCurriculumFormProps) {
  const user = useUser()
  const isMobile = useIsMobile()
  const [isAdvanced, setIsAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [activeTab, setActiveTab] = useState<"topic" | "youtube" | "source">("topic")

  // YouTube-specific state
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [youtubeMetadata, setYoutubeMetadata] = useState<ExtendedYoutubeMetadata | null>(null)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [durationError, setDurationError] = useState<string | null>(null)

  // Source-specific state
  const [primaryResource, setPrimaryResource] = useState<Resource | null>(null)
  const [secondaryResources, setSecondaryResources] = useState<Resource[]>([])
  const [academicPapers, setAcademicPapers] = useState<Resource[]>([])
  
  // Course outline state
  const [courseOutline, setCourseOutline] = useState("")

  // Basic mode state (3 sliders)
  const [depth, setDepth] = useState([5])
  const [lengthOfStudy, setLengthOfStudy] = useState([7])
  const [educationLevel, setEducationLevel] = useState([5])

  // Advanced mode state
  const [curriculumFormData, setCurriculumFormData] = useState<CurriculumFormData>({
    topic: "",
    preliminaries: "",
    course_parameters: {
      length_of_study: 7,
      daily_time_commitment: 3,
      depth_level: 5,
      pace: "moderate" as "fast" | "moderate" | "slow"
    },
    learner_profile: {
      education_level: "undergraduate" as "novice" | "undergraduate" | "graduate" | "professional",
      prior_knowledge: "basic" as "none" | "basic" | "intermediate" | "advanced",
      learning_style: "mixed" as "visual" | "conceptual" | "practical" | "mixed"
    },
    curriculum_preferences: {
      focus_areas: ["practical", "contemporary"],
      supplementary_material_ratio: 0.3,
      contemporary_vs_classical: 0.7
    },
    schedule: {
      study_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      break_weeks: []
    }
  })

  // Extract YouTube video ID from URL
  const extractYouTubeVideoId = useCallback((url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    return null
  }, [])

  // Fetch YouTube metadata with duration
  const fetchYoutubeMetadata = useCallback(async (url: string) => {
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      setMetadataError("Invalid YouTube URL. Please check the URL and try again.")
      setYoutubeMetadata(null)
      setDurationError(null)
      return
    }

    setFetchingMetadata(true)
    setMetadataError(null)
    setDurationError(null)

    try {
      // Fetch basic metadata from oEmbed
      const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
      
      if (!oembedResponse.ok) {
        throw new Error("Video not found or unavailable")
      }

      const metadata: YoutubeMetadata = await oembedResponse.json()
      
      // Fetch duration separately
      const duration = await getYouTubeVideoDuration(videoId)
      
      const extendedMetadata: ExtendedYoutubeMetadata = {
        ...metadata,
        duration: duration || undefined,
        durationString: duration ? formatDuration(duration) : undefined
      }

      // Validate duration
      if (duration && duration < 30 * 60) { // Less than 30 minutes
        setDurationError("Video must be at least 30 minutes long for curriculum creation")
      } else {
        setDurationError(null)
      }

      // Auto-adjust length of study based on video duration
      if (duration && activeTab === "youtube") {
        const recommendedDays = calculateRecommendedDays(duration)
        setLengthOfStudy([recommendedDays])
        if (isAdvanced) {
          setCurriculumFormData(prev => ({
            ...prev,
            course_parameters: {
              ...prev.course_parameters,
              length_of_study: recommendedDays
            }
          }))
        }
      }
      
      setYoutubeMetadata(extendedMetadata)
    } catch (error) {
      console.error('Error fetching YouTube metadata:', error)
      setMetadataError("Failed to fetch video information. Please check the URL and try again.")
      setYoutubeMetadata(null)
      setDurationError(null)
    } finally {
      setFetchingMetadata(false)
    }
  }, [extractYouTubeVideoId, activeTab, isAdvanced])

  // Debounce YouTube URL changes with useCallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (youtubeUrl) {
        fetchYoutubeMetadata(youtubeUrl)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [youtubeUrl, fetchYoutubeMetadata])

  // Memoized calculation for advanced parameters
  const advancedFromBasic = useMemo(() => {
    const depthValue = depth[0]
    const lengthValue = lengthOfStudy[0]
    const educationValue = educationLevel[0]

    const baseTimeFromDepth = 0.5 + (depthValue / 10) * 3.5
    const timeMultiplierFromDays = Math.max(0.7, Math.min(1.5, 10 / lengthValue))
    const dailyTime = Math.round((baseTimeFromDepth * timeMultiplierFromDays) * 2) / 2

    const intensityRatio = (depthValue * dailyTime) / lengthValue
    const pace = intensityRatio > 2.5 ? "fast" : intensityRatio > 1.2 ? "moderate" : "slow"

    let mappedEducationLevel: "novice" | "undergraduate" | "graduate" | "professional"
    let priorKnowledge: "none" | "basic" | "intermediate" | "advanced"
    
    if (educationValue <= 2) {
      mappedEducationLevel = "novice"
      priorKnowledge = "none"
    } else if (educationValue <= 5) {
      mappedEducationLevel = "undergraduate" 
      priorKnowledge = educationValue <= 3 ? "none" : "basic"
    } else if (educationValue <= 8) {
      mappedEducationLevel = "graduate"
      priorKnowledge = educationValue <= 6 ? "basic" : "intermediate"
    } else {
      mappedEducationLevel = "professional"
      priorKnowledge = "advanced"
    }

    let focusAreas: string[] = []
    if (depthValue <= 3) {
      focusAreas = ["practical"]
    } else if (depthValue <= 6) {
      focusAreas = ["practical", "contemporary"]
    } else if (depthValue <= 8) {
      focusAreas = ["theory", "practical", "contemporary"]
    } else {
      focusAreas = educationValue > 6 ? 
        ["theory", "research", "historical", "contemporary"] : 
        ["theory", "research", "practical"]
    }

    const supplementaryRatio = Math.min(0.9, 0.2 + (depthValue / 10) * 0.5 + (educationValue / 10) * 0.2)
    const contemporaryVsClassical = educationValue > 6 ? 
      (0.4 + (depthValue / 10) * 0.4) : 
      (0.6 + Math.min(0.3, educationValue / 10))

    return {
      course_parameters: {
        length_of_study: lengthValue,
        daily_time_commitment: Math.max(0.5, Math.min(6, dailyTime)),
        depth_level: depthValue,
        pace: pace
      },
      learner_profile: {
        education_level: mappedEducationLevel,
        prior_knowledge: priorKnowledge,
        learning_style: "mixed" as const
      },
      curriculum_preferences: {
        focus_areas: focusAreas,
        supplementary_material_ratio: supplementaryRatio,
        contemporary_vs_classical: contemporaryVsClassical
      }
    }
  }, [depth, lengthOfStudy, educationLevel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !startDate) return

    setIsSubmitting(true)

    try {
      if (activeTab === "youtube") {
        if (!youtubeUrl || !youtubeMetadata) {
          throw new Error("Please enter a valid YouTube URL")
        }

        const videoId = extractYouTubeVideoId(youtubeUrl)
        if (!videoId) {
          throw new Error("Could not extract video ID from URL")
        }

        const submissionData = isAdvanced ? curriculumFormData : {
          ...curriculumFormData,
          ...advancedFromBasic
        }

        const payload = {
          body: {
            youtubeURL: youtubeUrl,
            videoID: videoId,
            videoTitle: youtubeMetadata.title,
            preliminaries: submissionData.preliminaries,
            course_parameters: submissionData.course_parameters,
            learner_profile: submissionData.learner_profile,
            curriculum_preferences: submissionData.curriculum_preferences,
            schedule: {
              start_date: format(startDate, "yyyy-MM-dd"),
              study_days: submissionData.schedule.study_days,
              break_weeks: submissionData.schedule.break_weeks
            }
          },
          user_context: {
            user_id: user.id,
            user_email: user.primaryEmail || "",
            user_name: user.displayName || null
          }
        }

        await submitYoutubeCurriculum(payload)
      } else if (activeTab === "source") {
        // Validate source selection
        if (!primaryResource) {
          throw new Error("Please select a primary resource")
        }

        const submissionData = isAdvanced ? curriculumFormData : {
          ...curriculumFormData,
          ...advancedFromBasic
        }

        const payload = {
          body: {
            primaryResource: {
              title: primaryResource.title,
              author: primaryResource.author,
              year: primaryResource.year,
              publisher: primaryResource.publisher,
              isbn: primaryResource.isbn,
              type: primaryResource.type
            },
            secondaryResources: secondaryResources.map(resource => ({
              title: resource.title,
              author: resource.author,
              year: resource.year,
              publisher: resource.publisher,
              isbn: resource.isbn,
              type: resource.type
            })),
            academicPapers: academicPapers.map(paper => ({
              title: paper.title,
              authors: paper.author, // Map author to authors for consistency with expected format
              year: paper.year,
              journal: paper.journal,
              doi: paper.doi
            })),
            courseOutline: courseOutline,
            preliminaries: submissionData.preliminaries,
            course_parameters: submissionData.course_parameters,
            learner_profile: submissionData.learner_profile,
            curriculum_preferences: submissionData.curriculum_preferences,
            schedule: {
              start_date: format(startDate, "yyyy-MM-dd"),
              study_days: submissionData.schedule.study_days,
              break_weeks: submissionData.schedule.break_weeks
            }
          },
          user_context: {
            user_id: user.id,
            user_email: user.primaryEmail || "",
            user_name: user.displayName || null
          }
        }

        await submitSourceCurriculum(payload)
      } else {
        // Topic-based curriculum
        const submissionData = isAdvanced ? curriculumFormData : {
          ...curriculumFormData,
          ...advancedFromBasic
        }

        const payload = {
          body: {
            topic: submissionData.topic,
            preliminaries: submissionData.preliminaries,
            course_parameters: submissionData.course_parameters,
            learner_profile: submissionData.learner_profile,
            curriculum_preferences: submissionData.curriculum_preferences,
            schedule: {
              start_date: format(startDate, "yyyy-MM-dd"),
              study_days: submissionData.schedule.study_days,
              break_weeks: submissionData.schedule.break_weeks
            }
          },
          user_context: {
            user_id: user.id,
            user_email: user.primaryEmail || "",
            user_name: user.displayName || null
          }
        }

        await submitNewCurriculum(payload)
      }

      onSuccess?.()
    } catch (error) {
      console.error('Error submitting curriculum:', error)
      // Handle error appropriately
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleFocusArea = (area: string) => {
    setCurriculumFormData(prev => ({
      ...prev,
      curriculum_preferences: {
        ...prev.curriculum_preferences,
        focus_areas: prev.curriculum_preferences.focus_areas.includes(area)
          ? prev.curriculum_preferences.focus_areas.filter(a => a !== area)
          : [...prev.curriculum_preferences.focus_areas, area]
      }
    }))
  }

  const toggleStudyDay = (day: string) => {
    setCurriculumFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        study_days: prev.schedule.study_days.includes(day)
          ? prev.schedule.study_days.filter(d => d !== day)
          : [...prev.schedule.study_days, day]
      }
    }))
  }



  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Create New Curriculum
              </h1>
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                Design a personalized learning curriculum
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onCancel} size={isMobile ? "sm" : "default"}>
                Cancel
              </Button>
            </div>
          </div>

          {/* Course Type Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "topic" | "youtube" | "source")} className="w-full">
            <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'h-9' : 'h-11'}`}>
              <TabsTrigger value="topic" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className={isMobile ? 'text-xs' : 'text-sm'}>Topic</span>
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                <span className={isMobile ? 'text-xs' : 'text-sm'}>YouTube Video</span>
              </TabsTrigger>
              <TabsTrigger value="source" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                <span className={isMobile ? 'text-xs' : 'text-sm'}>Sources</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Form */}
      <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-6 py-8'}`}>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Course Source Section */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "topic" | "youtube" | "source")} className="w-full">
              <TabsContent value="topic" className="space-y-6 mt-0">
                <TopicTab
                  topic={curriculumFormData.topic}
                  onTopicChange={(topic) => setCurriculumFormData(prev => ({ ...prev, topic }))}
                />
              </TabsContent>

              <TabsContent value="youtube" className="space-y-6 mt-0">
                <YoutubeTab
                  youtubeUrl={youtubeUrl}
                  onUrlChange={setYoutubeUrl}
                  youtubeMetadata={youtubeMetadata}
                  fetchingMetadata={fetchingMetadata}
                  metadataError={metadataError}
                  durationError={durationError}
                />
              </TabsContent>

              <TabsContent value="source" className="space-y-6 mt-0">
                <SourceTab
                  primaryResource={primaryResource}
                  setPrimaryResource={setPrimaryResource}
                  secondaryResources={secondaryResources}
                  setSecondaryResources={setSecondaryResources}
                  academicPapers={academicPapers}
                  setAcademicPapers={setAcademicPapers}
                  courseOutline={courseOutline}
                  setCourseOutline={setCourseOutline}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Additional Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Label htmlFor="preliminaries" className="text-base font-medium">Prerequisites (Optional)</Label>
              <Textarea
                id="preliminaries"
                placeholder="Any background knowledge or prerequisites..."
                value={curriculumFormData.preliminaries}
                onChange={(e) => setCurriculumFormData(prev => ({ ...prev, preliminaries: e.target.value }))}
                className="mt-2 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2 h-12",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Configuration Mode Toggle */}
          <div className="flex items-center justify-between py-4 border-t border-b">
            <div className="flex items-center space-x-3">
              <Switch
                id="mode-toggle"
                checked={isAdvanced}
                onCheckedChange={setIsAdvanced}
              />
              <div>
                <Label htmlFor="mode-toggle" className="text-base font-medium cursor-pointer">
                  {isAdvanced ? "Advanced Configuration" : "Quick Setup"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isAdvanced ? "Full control over all parameters" : "Simplified with smart defaults"}
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Content */}
          {!isAdvanced ? (
            <QuickSetup
              depth={depth}
              setDepth={setDepth}
              lengthOfStudy={lengthOfStudy}
              setLengthOfStudy={setLengthOfStudy}
              educationLevel={educationLevel}
              setEducationLevel={setEducationLevel}
              activeTab={activeTab}
              youtubeMetadata={youtubeMetadata}
              calculateRecommendedDays={calculateRecommendedDays}
              advancedFromBasic={advancedFromBasic}
            />
          ) : (
            <AdvancedConfig
              formData={curriculumFormData}
              setFormData={setCurriculumFormData}
              toggleFocusArea={toggleFocusArea}
              toggleStudyDay={toggleStudyDay}
            />
          )}

          {/* Submit Section */}
          <div className="flex items-center justify-between pt-8 border-t">
            <div className="text-sm text-muted-foreground">
              {startDate && (
                <span>Starting {format(startDate, "MMMM d, yyyy")}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  isSubmitting || 
                  !startDate || 
                  (activeTab === "topic" && !curriculumFormData.topic) || 
                  (activeTab === "youtube" && (!youtubeUrl || !youtubeMetadata || !!durationError)) ||
                  (activeTab === "source" && !primaryResource)
                }
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Curriculum
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 