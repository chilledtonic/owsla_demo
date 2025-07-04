"use client"

import { useState } from "react"
import { useUser } from "@stackframe/stack"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { submitNewCurriculum } from "@/lib/actions"

interface NewCurriculumFormProps {
  onCancel?: () => void
  onSuccess?: () => void
}

export function NewCurriculumForm({ onCancel, onSuccess }: NewCurriculumFormProps) {
  const user = useUser()
  const [isAdvanced, setIsAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<Date>()

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

  // Convert basic mode sliders to advanced parameters
  const getAdvancedFromBasic = () => {
    const depthValue = depth[0]
    const lengthValue = lengthOfStudy[0]
    const educationValue = educationLevel[0]

    // Smart daily time calculation: balance depth with available days
    // If high depth but few days, need more hours per day
    // If low depth or many days, can be more relaxed
    const baseTimeFromDepth = 0.5 + (depthValue / 10) * 3.5 // 0.5-4 hours base
    const timeMultiplierFromDays = Math.max(0.7, Math.min(1.5, 10 / lengthValue)) // Fewer days = more time per day
    const dailyTime = Math.round((baseTimeFromDepth * timeMultiplierFromDays) * 2) / 2 // Round to nearest 0.5

    // Pace calculation: depends on depth vs time available
    const intensityRatio = (depthValue * dailyTime) / lengthValue
    const pace = intensityRatio > 2.5 ? "fast" : intensityRatio > 1.2 ? "moderate" : "slow"

    // Education level mapping with more nuance
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

    // Focus areas based on depth and education level
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

    // Supplementary material increases with depth and education level
    const supplementaryRatio = Math.min(0.9, 0.2 + (depthValue / 10) * 0.5 + (educationValue / 10) * 0.2)

    // Contemporary vs classical based on education level and depth
    const contemporaryVsClassical = educationValue > 6 ? 
      (0.4 + (depthValue / 10) * 0.4) : // Higher ed: balance based on depth
      (0.6 + Math.min(0.3, educationValue / 10)) // Lower ed: lean contemporary

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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !startDate) return

    setIsSubmitting(true)

    try {
      const submissionData = isAdvanced ? formData : {
        ...formData,
        ...getAdvancedFromBasic()
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Create New Curriculum
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Design a personalized learning curriculum tailored to your needs
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Form */}
          <div className="xl:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mode Toggle Section */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="mode-toggle"
                    checked={isAdvanced}
                    onCheckedChange={setIsAdvanced}
                  />
                  <Label htmlFor="mode-toggle" className="text-lg font-medium">
                    {isAdvanced ? "Advanced Mode" : "Basic Mode"}
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {isAdvanced ? "Full control over all parameters" : "Simplified with intelligent defaults"}
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <Label htmlFor="topic" className="text-base font-medium">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Chaos Magick, Machine Learning, Ancient History..."
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
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

              <div>
                <Label htmlFor="preliminaries" className="text-base font-medium">Preliminaries (Optional)</Label>
                <Textarea
                  id="preliminaries"
                  placeholder="Any prerequisites or background information..."
                  value={formData.preliminaries}
                  onChange={(e) => setFormData(prev => ({ ...prev, preliminaries: e.target.value }))}
                  className="mt-2 min-h-[80px]"
                />
              </div>

              {/* Basic Mode - 3 Sliders with Intelligent Layout */}
              {!isAdvanced && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Customize Your Learning Experience</h3>
                    <p className="text-muted-foreground">Use these sliders to set your preferences</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-center mb-3">
                        <div className="text-2xl font-bold text-primary">{depth[0]}</div>
                        <Label className="text-base font-medium">Study Depth</Label>
                      </div>
                      <Slider
                        value={depth}
                        onValueChange={setDepth}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Surface</span>
                        <span>Deep</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {depth[0] <= 3 ? "Overview and basics" : 
                         depth[0] <= 7 ? "Detailed exploration" : 
                         "Expert-level analysis"}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-center mb-3">
                        <div className="text-2xl font-bold text-primary">{lengthOfStudy[0]}</div>
                        <Label className="text-base font-medium">Days of Study</Label>
                      </div>
                      <Slider
                        value={lengthOfStudy}
                        onValueChange={setLengthOfStudy}
                        max={15}
                        min={3}
                        step={1}
                        className="mt-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Quick</span>
                        <span>Extended</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Estimated completion: {startDate ? format(new Date(startDate.getTime() + lengthOfStudy[0] * 24 * 60 * 60 * 1000), "MMM d") : "Select start date"}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-center mb-3">
                        <div className="text-2xl font-bold text-primary">{educationLevel[0]}</div>
                        <Label className="text-base font-medium">Education Level</Label>
                      </div>
                      <Slider
                        value={educationLevel}
                        onValueChange={setEducationLevel}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Beginner</span>
                        <span>Expert</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {educationLevel[0] <= 3 ? "No prerequisites" : 
                         educationLevel[0] <= 7 ? "Some background helpful" : 
                         "Advanced knowledge assumed"}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Advanced Mode - Compact Tabs */}
              {isAdvanced && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Advanced Configuration</h3>
                    <p className="text-muted-foreground">Fine-tune every aspect of your curriculum</p>
                  </div>
                  
                  <Tabs defaultValue="course" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="course">Course</TabsTrigger>
                      <TabsTrigger value="learner">Learner</TabsTrigger>
                      <TabsTrigger value="preferences">Preferences</TabsTrigger>
                      <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    </TabsList>

                    <TabsContent value="course" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Length of Study (days)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            value={formData.course_parameters.length_of_study}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              course_parameters: {
                                ...prev.course_parameters,
                                length_of_study: parseInt(e.target.value) || 7
                              }
                            }))}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Daily Time (hours)</Label>
                          <Input
                            type="number"
                            min="0.5"
                            max="12"
                            step="0.5"
                            value={formData.course_parameters.daily_time_commitment}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              course_parameters: {
                                ...prev.course_parameters,
                                daily_time_commitment: parseFloat(e.target.value) || 3
                              }
                            }))}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Depth Level (1-10)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={formData.course_parameters.depth_level}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              course_parameters: {
                                ...prev.course_parameters,
                                depth_level: parseInt(e.target.value) || 10
                              }
                            }))}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Pace</Label>
                          <Select
                            value={formData.course_parameters.pace}
                            onValueChange={(value: "fast" | "moderate" | "slow") =>
                              setFormData(prev => ({
                                ...prev,
                                course_parameters: {
                                  ...prev.course_parameters,
                                  pace: value
                                }
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="slow">Slow</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="fast">Fast</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="learner" className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Education Level</Label>
                          <Select
                            value={formData.learner_profile.education_level}
                            onValueChange={(value: "novice" | "undergraduate" | "graduate" | "professional") =>
                              setFormData(prev => ({
                                ...prev,
                                learner_profile: {
                                  ...prev.learner_profile,
                                  education_level: value
                                }
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
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
                                learner_profile: {
                                  ...prev.learner_profile,
                                  prior_knowledge: value
                                }
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
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

                        <div>
                          <Label className="text-sm font-medium">Learning Style</Label>
                          <Select
                            value={formData.learner_profile.learning_style}
                            onValueChange={(value: "visual" | "conceptual" | "practical" | "mixed") =>
                              setFormData(prev => ({
                                ...prev,
                                learner_profile: {
                                  ...prev.learner_profile,
                                  learning_style: value
                                }
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
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

                    <TabsContent value="preferences" className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Focus Areas</Label>
                        <div className="grid grid-cols-3 gap-2">
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Supplementary Material: {formData.curriculum_preferences.supplementary_material_ratio.toFixed(1)}
                          </Label>
                          <Slider
                            value={[formData.curriculum_preferences.supplementary_material_ratio]}
                            onValueChange={([value]) => setFormData(prev => ({
                              ...prev,
                              curriculum_preferences: {
                                ...prev.curriculum_preferences,
                                supplementary_material_ratio: value
                              }
                            }))}
                            max={1}
                            min={0}
                            step={0.1}
                            className="mt-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Core Only</span>
                            <span>Rich Supplements</span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Contemporary vs Classical: {formData.curriculum_preferences.contemporary_vs_classical.toFixed(1)}
                          </Label>
                          <Slider
                            value={[formData.curriculum_preferences.contemporary_vs_classical]}
                            onValueChange={([value]) => setFormData(prev => ({
                              ...prev,
                              curriculum_preferences: {
                                ...prev.curriculum_preferences,
                                contemporary_vs_classical: value
                              }
                            }))}
                            max={1}
                            min={0}
                            step={0.1}
                            className="mt-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Classical</span>
                            <span>Contemporary</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="schedule" className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Study Days</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {weekDays.map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={day}
                                checked={formData.schedule.study_days.includes(day)}
                                onCheckedChange={() => toggleStudyDay(day)}
                              />
                              <Label htmlFor={day} className="text-sm capitalize">{day.slice(0, 3)}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center pt-6 border-t">
                <div className="flex gap-4">
                  {onCancel && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onCancel}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !startDate || !formData.topic}
                  >
                    {isSubmitting ? "Creating..." : "Create Curriculum"}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar with Live Preview/Summary */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Curriculum Preview</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Topic:</span>
                    <div className="font-medium">{formData.topic || "Not specified"}</div>
                  </div>
                  
                  {startDate && (
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <div className="font-medium">{format(startDate, "PPP")}</div>
                    </div>
                  )}

                  {!isAdvanced && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">{lengthOfStudy[0]} days</div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Depth Level:</span>
                        <div className="font-medium">
                          {depth[0]}/10 - {depth[0] <= 3 ? "Overview" : depth[0] <= 7 ? "Detailed" : "Expert"}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Education Level:</span>
                        <div className="font-medium">
                          {educationLevel[0]}/10 - {
                            educationLevel[0] <= 2 ? "Novice" : 
                            educationLevel[0] <= 5 ? "Undergraduate" : 
                            educationLevel[0] <= 8 ? "Graduate" : "Professional"
                          }
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Est. Daily Time:</span>
                        <div className="font-medium">
                          {(() => {
                            const advanced = getAdvancedFromBasic()
                            return advanced.course_parameters.daily_time_commitment
                          })()} hours
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Pace:</span>
                        <div className="font-medium capitalize">
                          {(() => {
                            const advanced = getAdvancedFromBasic()
                            return advanced.course_parameters.pace
                          })()}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Focus Areas:</span>
                        <div className="font-medium">
                          {(() => {
                            const advanced = getAdvancedFromBasic()
                            return advanced.curriculum_preferences.focus_areas
                              .map(area => area.charAt(0).toUpperCase() + area.slice(1))
                              .join(", ")
                          })()}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Total Hours:</span>
                        <div className="font-medium">
                          {(() => {
                            const advanced = getAdvancedFromBasic()
                            return Math.round(lengthOfStudy[0] * advanced.course_parameters.daily_time_commitment)
                          })()} hours
                        </div>
                      </div>

                      {startDate && (
                        <div>
                          <span className="text-muted-foreground">Est. Completion:</span>
                          <div className="font-medium">
                            {format(new Date(startDate.getTime() + lengthOfStudy[0] * 24 * 60 * 60 * 1000), "PPP")}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {isAdvanced && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">{formData.course_parameters.length_of_study} days</div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Daily Time:</span>
                        <div className="font-medium">{formData.course_parameters.daily_time_commitment}h</div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Total Hours:</span>
                        <div className="font-medium">
                          {(formData.course_parameters.length_of_study * formData.course_parameters.daily_time_commitment).toFixed(0)}h
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Pace:</span>
                        <div className="font-medium capitalize">{formData.course_parameters.pace}</div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Education Level:</span>
                        <div className="font-medium capitalize">{formData.learner_profile.education_level}</div>
                      </div>

                      {formData.curriculum_preferences.focus_areas.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Focus Areas:</span>
                          <div className="font-medium">
                            {formData.curriculum_preferences.focus_areas.map(area => area.charAt(0).toUpperCase() + area.slice(1)).join(", ")}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3">Quick Tips</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Higher depth levels include more theoretical content</p>
                  <p>• Longer durations allow for better retention</p>
                  <p>• Advanced mode gives you full control over all parameters</p>
                  <p>• Preview updates as you make changes</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 