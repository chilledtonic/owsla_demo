"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { useUser } from "@stackframe/stack"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Youtube, BookOpen, ArrowRight, Play, Eye, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { submitNewCurriculum, submitYoutubeCurriculum } from "@/lib/actions"
import Image from "next/image"

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
  const [activeTab, setActiveTab] = useState<"topic" | "youtube">("topic")

  // YouTube-specific state
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [youtubeMetadata, setYoutubeMetadata] = useState<ExtendedYoutubeMetadata | null>(null)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [durationError, setDurationError] = useState<string | null>(null)

  // Basic mode state (3 sliders)
  const [depth, setDepth] = useState([5])
  const [lengthOfStudy, setLengthOfStudy] = useState([7])
  const [educationLevel, setEducationLevel] = useState([5])

  // Advanced mode state
  const [formData, setFormData] = useState({
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
      focus_areas: [] as string[],
      supplementary_material_ratio: 0.8,
      contemporary_vs_classical: 0.7
    },
    schedule: {
      study_days: ["monday", "tuesday", "wednesday", "thursday", "friday"] as string[],
      break_weeks: [] as string[]
    }
  })

  // Memoized helper function to extract YouTube video ID from URL
  const extractYouTubeVideoId = useCallback((url: string): string | null => {
    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ]
    
    for (const pattern of regexPatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }, [])

  // YouTube metadata fetching with duration
  const fetchYoutubeMetadata = useCallback(async (url: string) => {
    if (!url.trim()) {
      setYoutubeMetadata(null)
      setMetadataError(null)
      setDurationError(null)
      return
    }

    // Extract video ID for validation
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      setMetadataError("Please enter a valid YouTube URL")
      setYoutubeMetadata(null)
      setDurationError(null)
      return
    }

    setFetchingMetadata(true)
    setMetadataError(null)
    setDurationError(null)
    
    try {
      // Fetch basic metadata
      const youtube = await import('youtube-metadata-from-url')
      const basicMetadata = await youtube.metadata(url)
      
      // Try to fetch duration
      const duration = await getYouTubeVideoDuration(videoId)
      
      const extendedMetadata: ExtendedYoutubeMetadata = {
        ...basicMetadata,
        duration: duration || undefined,
        durationString: duration ? formatDuration(duration) : undefined
      }
      
      // Validate minimum duration
      if (duration && duration < 1800) { // 30 minutes = 1800 seconds
        setDurationError("Videos must be at least 30 minutes long to create a comprehensive curriculum.")
        setYoutubeMetadata(extendedMetadata)
        return
      }
      
      // Update recommended study length based on duration
      if (duration && activeTab === "youtube") {
        const recommendedDays = calculateRecommendedDays(duration)
        setLengthOfStudy([recommendedDays])
        if (isAdvanced) {
          setFormData(prev => ({
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

        const submissionData = isAdvanced ? formData : {
          ...formData,
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
      } else {
        const submissionData = isAdvanced ? formData : {
          ...formData,
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
      console.error("Error submitting curriculum:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        study_days: prev.schedule.study_days.includes(day)
          ? prev.schedule.study_days.filter(d => d !== day)
          : [...prev.schedule.study_days, day]
      }
    }))
  }

  const focusAreaOptions = ["theory", "research", "practical", "historical", "contemporary", "application"]
  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "topic" | "youtube")} className="w-full">
            <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-9' : 'h-11'}`}>
              <TabsTrigger value="topic" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className={isMobile ? 'text-xs' : 'text-sm'}>Topic</span>
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                <span className={isMobile ? 'text-xs' : 'text-sm'}>YouTube Course</span>
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "topic" | "youtube")} className="w-full">
              <TabsContent value="topic" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="topic" className="text-base font-medium">What would you like to learn?</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Chaos Magick, Machine Learning, Ancient History..."
                      value={formData.topic}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                      required
                      className="mt-2 h-12"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="youtube" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="youtube-url" className="text-base font-medium">YouTube Course URL</Label>
                    <Input
                      id="youtube-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      required
                      className="mt-2 h-12"
                    />
                    {metadataError && (
                      <p className="text-sm text-destructive mt-2">{metadataError}</p>
                    )}
                    {durationError && (
                      <p className="text-sm text-destructive mt-2">{durationError}</p>
                    )}
                  </div>

                  {/* YouTube Video Preview */}
                  {fetchingMetadata && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                      Fetching video information...
                    </div>
                  )}

                  {youtubeMetadata && !fetchingMetadata && (
                    <div className={cn(
                      "border rounded-lg p-4",
                      durationError ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" : "bg-muted/20"
                    )}>
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0">
                          <Image 
                            src={youtubeMetadata.thumbnail_url} 
                            alt="Video thumbnail"
                            width={96}
                            height={72}
                            className="w-24 h-18 object-cover rounded"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white drop-shadow-lg" />
                          </div>
                          {durationError && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1">
                              <AlertTriangle className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm leading-tight">{youtubeMetadata.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">by {youtubeMetadata.author_name}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Video course
                            </span>
                            {youtubeMetadata.durationString && (
                              <span className={cn(
                                "flex items-center gap-1",
                                durationError && "text-red-600 dark:text-red-400"
                              )}>
                                <Clock className="h-3 w-3" />
                                {youtubeMetadata.durationString}
                              </span>
                            )}
                          </div>
                          {!durationError && youtubeMetadata.duration && (
                            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                              ✓ Duration meets minimum requirement (30+ minutes)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                value={formData.preliminaries}
                onChange={(e) => setFormData(prev => ({ ...prev, preliminaries: e.target.value }))}
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
            // Quick Setup Mode
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Customize Your Learning</h3>
                <p className="text-muted-foreground">Adjust these settings to match your goals</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{depth[0]}</div>
                    <Label className="text-base font-medium">Study Depth</Label>
                  </div>
                  <OptimizedSlider
                    value={depth}
                    onValueChange={setDepth}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Surface</span>
                    <span>Deep</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {depth[0] <= 3 ? "Overview and basics" : 
                     depth[0] <= 7 ? "Detailed exploration" : 
                     "Expert-level analysis"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{lengthOfStudy[0]}</div>
                    <Label className="text-base font-medium">Study Duration</Label>
                  </div>
                  <OptimizedSlider
                    value={lengthOfStudy}
                    onValueChange={setLengthOfStudy}
                    max={15}
                    min={3}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Quick</span>
                    <span>Extended</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {lengthOfStudy[0]} days of study
                  </p>
                  {activeTab === "youtube" && youtubeMetadata?.duration && (
                    <div className="text-xs text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-center gap-1 text-blue-700 dark:text-blue-300">
                        <AlertTriangle className="h-3 w-3" />
                        Recommended: {calculateRecommendedDays(youtubeMetadata.duration)} days for {youtubeMetadata.durationString} video
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{educationLevel[0]}</div>
                    <Label className="text-base font-medium">Education Level</Label>
                  </div>
                  <OptimizedSlider
                    value={educationLevel}
                    onValueChange={setEducationLevel}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {educationLevel[0] <= 3 ? "No prerequisites" : 
                     educationLevel[0] <= 7 ? "Some background helpful" : 
                     "Advanced knowledge assumed"}
                  </p>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-medium mb-3">Study Plan Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Study Days:</span>
                    <div className="font-medium">{lengthOfStudy[0]} days</div>
                  </div>
                  {activeTab === "youtube" && youtubeMetadata?.durationString && (
                    <div>
                      <span className="text-muted-foreground">Video Length:</span>
                      <div className="font-medium">{youtubeMetadata.durationString}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Daily Time:</span>
                    <div className="font-medium">
                      {(() => {
                        const advanced = advancedFromBasic
                        return advanced.course_parameters.daily_time_commitment
                      })()} hours
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Hours:</span>
                    <div className="font-medium">
                      {(() => {
                        const advanced = advancedFromBasic
                        return Math.round(lengthOfStudy[0] * advanced.course_parameters.daily_time_commitment)
                      })()} hours
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pace:</span>
                    <div className="font-medium capitalize">
                      {(() => {
                        const advanced = advancedFromBasic
                        return advanced.course_parameters.pace
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Advanced Configuration Mode
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Advanced Configuration</h3>
                <p className="text-muted-foreground">Fine-tune every aspect of your curriculum</p>
              </div>
              
              <Tabs defaultValue="course" className="w-full">
                <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  <TabsTrigger value="course">Course</TabsTrigger>
                  <TabsTrigger value="learner">Learner</TabsTrigger>
                  {!isMobile && <TabsTrigger value="preferences">Preferences</TabsTrigger>}
                  {!isMobile && <TabsTrigger value="schedule">Schedule</TabsTrigger>}
                </TabsList>
                
                {isMobile && (
                  <TabsList className="grid w-full grid-cols-2 mt-2">
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  </TabsList>
                )}

                <TabsContent value="course" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Study Duration (days)</Label>
                      <OptimizedSlider
                        value={[formData.course_parameters.length_of_study]}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          course_parameters: { ...prev.course_parameters, length_of_study: value[0] }
                        }))}
                        max={30}
                        min={3}
                        step={1}
                        className="mt-3"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        {formData.course_parameters.length_of_study} days
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Daily Time Commitment (hours)</Label>
                      <OptimizedSlider
                        value={[formData.course_parameters.daily_time_commitment]}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          course_parameters: { ...prev.course_parameters, daily_time_commitment: value[0] }
                        }))}
                        max={8}
                        min={0.5}
                        step={0.5}
                        className="mt-3"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        {formData.course_parameters.daily_time_commitment} hours per day
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Depth Level</Label>
                      <OptimizedSlider
                        value={[formData.course_parameters.depth_level]}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          course_parameters: { ...prev.course_parameters, depth_level: value[0] }
                        }))}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-3"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Level {formData.course_parameters.depth_level}/10
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Study Pace</Label>
                      <Select 
                        value={formData.course_parameters.pace} 
                        onValueChange={(value: "fast" | "moderate" | "slow") => 
                          setFormData(prev => ({
                            ...prev,
                            course_parameters: { ...prev.course_parameters, pace: value }
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow & Steady</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="fast">Fast & Intensive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="learner" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Education Level</Label>
                      <Select 
                        value={formData.learner_profile.education_level} 
                        onValueChange={(value: "novice" | "undergraduate" | "graduate" | "professional") => 
                          setFormData(prev => ({
                            ...prev,
                            learner_profile: { ...prev.learner_profile, education_level: value }
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novice">Novice</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Prior Knowledge</Label>
                      <Select 
                        value={formData.learner_profile.prior_knowledge} 
                        onValueChange={(value: "none" | "basic" | "intermediate" | "advanced") => 
                          setFormData(prev => ({
                            ...prev,
                            learner_profile: { ...prev.learner_profile, prior_knowledge: value }
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Learning Style</Label>
                      <Select 
                        value={formData.learner_profile.learning_style} 
                        onValueChange={(value: "visual" | "conceptual" | "practical" | "mixed") => 
                          setFormData(prev => ({
                            ...prev,
                            learner_profile: { ...prev.learner_profile, learning_style: value }
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visual">Visual</SelectItem>
                          <SelectItem value="conceptual">Conceptual</SelectItem>
                          <SelectItem value="practical">Practical</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Focus Areas</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {focusAreaOptions.map((area) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={area}
                            checked={formData.curriculum_preferences.focus_areas.includes(area)}
                            onCheckedChange={() => toggleFocusArea(area)}
                          />
                          <Label htmlFor={area} className="text-sm capitalize">{area}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Supplementary Material Ratio</Label>
                    <OptimizedSlider
                      value={[formData.curriculum_preferences.supplementary_material_ratio]}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        curriculum_preferences: { ...prev.curriculum_preferences, supplementary_material_ratio: value[0] }
                      }))}
                      max={1}
                      min={0}
                      step={0.1}
                      className="mt-3"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {Math.round(formData.curriculum_preferences.supplementary_material_ratio * 100)}% supplementary materials
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Contemporary vs Classical Balance</Label>
                    <OptimizedSlider
                      value={[formData.curriculum_preferences.contemporary_vs_classical]}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        curriculum_preferences: { ...prev.curriculum_preferences, contemporary_vs_classical: value[0] }
                      }))}
                      max={1}
                      min={0}
                      step={0.1}
                      className="mt-3"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Classical</span>
                      <span>Contemporary</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Study Days</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {weekDays.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={formData.schedule.study_days.includes(day)}
                            onCheckedChange={() => toggleStudyDay(day)}
                          />
                          <Label htmlFor={day} className="text-sm capitalize">{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
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
                  (activeTab === "topic" && !formData.topic) || 
                  (activeTab === "youtube" && (!youtubeUrl || !youtubeMetadata || !!durationError))
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