"use client"

import { useState } from "react"
import { useUser } from "@stackframe/stack"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      depth_level: 10,
      pace: "moderate" as "fast" | "moderate" | "slow"
    },
    learner_profile: {
      education_level: "professional" as "beginner" | "intermediate" | "professional" | "expert",
      prior_knowledge: "advanced" as "none" | "basic" | "intermediate" | "advanced",
      learning_style: "conceptual" as "visual" | "conceptual" | "practical" | "mixed"
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

    return {
      course_parameters: {
        length_of_study: lengthValue,
        daily_time_commitment: Math.max(1, Math.round(depthValue / 2)),
        depth_level: depthValue,
        pace: depthValue <= 3 ? "slow" : depthValue <= 7 ? "moderate" : "fast"
      },
      learner_profile: {
        education_level: educationValue <= 2 ? "beginner" : educationValue <= 5 ? "intermediate" : educationValue <= 8 ? "professional" : "expert",
        prior_knowledge: educationValue <= 3 ? "none" : educationValue <= 5 ? "basic" : educationValue <= 8 ? "intermediate" : "advanced",
        learning_style: "mixed"
      },
      curriculum_preferences: {
        focus_areas: depthValue > 7 ? ["theory", "research"] : depthValue > 4 ? ["theory", "practical"] : ["practical"],
        supplementary_material_ratio: Math.min(0.9, 0.3 + (depthValue / 10) * 0.6),
        contemporary_vs_classical: educationValue > 5 ? 0.7 : 0.3
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
    <div className="h-full p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Curriculum</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Design a personalized learning curriculum tailored to your needs
          </p>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
                      <form onSubmit={handleSubmit} className="space-y-8">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between">
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

              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Label htmlFor="topic" className="text-lg font-medium">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Chaos Magick, Machine Learning, Ancient History..."
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    required
                    className="mt-2 h-12 text-lg"
                  />
                </div>

                <div>
                  <Label className="text-lg font-medium">Start Date</Label>
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
                <Label htmlFor="preliminaries" className="text-lg font-medium">Preliminaries (Optional)</Label>
                <Textarea
                  id="preliminaries"
                  placeholder="Any prerequisites or background information..."
                  value={formData.preliminaries}
                  onChange={(e) => setFormData(prev => ({ ...prev, preliminaries: e.target.value }))}
                  className="mt-2 min-h-[100px]"
                />
              </div>

                          {/* Basic Mode - 3 Sliders */}
              {!isAdvanced && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Customize Your Learning Experience</h3>
                    <p className="text-muted-foreground">Use these sliders to set your preferences - we'll handle the details</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="p-6">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-primary">{depth[0]}</div>
                        <Label className="text-lg font-medium">Study Depth</Label>
                      </div>
                      <Slider
                        value={depth}
                        onValueChange={setDepth}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-4"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-3">
                        <span>Surface Level</span>
                        <span>Deep Dive</span>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-primary">{lengthOfStudy[0]}</div>
                        <Label className="text-lg font-medium">Days of Study</Label>
                      </div>
                      <Slider
                        value={lengthOfStudy}
                        onValueChange={setLengthOfStudy}
                        max={90}
                        min={3}
                        step={1}
                        className="mt-4"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-3">
                        <span>Quick Study</span>
                        <span>Extended Course</span>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-primary">{educationLevel[0]}</div>
                        <Label className="text-lg font-medium">Education Level</Label>
                      </div>
                      <Slider
                        value={educationLevel}
                        onValueChange={setEducationLevel}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-4"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-3">
                        <span>Beginner</span>
                        <span>Expert</span>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

                          {/* Advanced Mode - Full Form */}
              {isAdvanced && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Advanced Configuration</h3>
                    <p className="text-muted-foreground">Fine-tune every aspect of your curriculum</p>
                  </div>
                  
                  <Tabs defaultValue="course" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-12">
                      <TabsTrigger value="course" className="text-sm font-medium">Course Parameters</TabsTrigger>
                      <TabsTrigger value="learner" className="text-sm font-medium">Learner Profile</TabsTrigger>
                      <TabsTrigger value="preferences" className="text-sm font-medium">Preferences</TabsTrigger>
                      <TabsTrigger value="schedule" className="text-sm font-medium">Schedule</TabsTrigger>
                    </TabsList>

                <TabsContent value="course" className="space-y-4">
                  <div>
                    <Label>Length of Study (days)</Label>
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
                    />
                  </div>

                  <div>
                    <Label>Daily Time Commitment (hours)</Label>
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
                    />
                  </div>

                  <div>
                    <Label>Depth Level (1-10)</Label>
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
                    />
                  </div>

                  <div>
                    <Label>Pace</Label>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="learner" className="space-y-4">
                  <div>
                    <Label>Education Level</Label>
                    <Select
                      value={formData.learner_profile.education_level}
                      onValueChange={(value: "beginner" | "intermediate" | "professional" | "expert") =>
                        setFormData(prev => ({
                          ...prev,
                          learner_profile: {
                            ...prev.learner_profile,
                            education_level: value
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Prior Knowledge</Label>
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
                      <SelectTrigger>
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
                    <Label>Learning Style</Label>
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
                      <SelectTrigger>
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
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <div>
                    <Label>Focus Areas</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {focusAreaOptions.map((area) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={area}
                            checked={formData.curriculum_preferences.focus_areas.includes(area)}
                            onCheckedChange={() => toggleFocusArea(area)}
                          />
                          <Label htmlFor={area} className="capitalize">{area}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Supplementary Material Ratio: {formData.curriculum_preferences.supplementary_material_ratio.toFixed(1)}</Label>
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
                  </div>

                  <div>
                    <Label>Contemporary vs Classical: {formData.curriculum_preferences.contemporary_vs_classical.toFixed(1)}</Label>
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
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Classical</span>
                      <span>Contemporary</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  <div>
                    <Label>Study Days</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {weekDays.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={formData.schedule.study_days.includes(day)}
                            onCheckedChange={() => toggleStudyDay(day)}
                          />
                          <Label htmlFor={day} className="capitalize">{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                                  </TabsContent>
                </Tabs>
                </div>
              )}

                          {/* Action Buttons */}
              <div className="flex justify-center pt-8 border-t">
                <div className="flex gap-4">
                  {onCancel && (
                    <Button type="button" variant="outline" size="lg" onClick={onCancel} className="px-8">
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !startDate || !formData.topic}
                    size="lg"
                    className="px-8"
                  >
                    {isSubmitting ? "Creating..." : "Create Curriculum"}
                  </Button>
                </div>
              </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
} 