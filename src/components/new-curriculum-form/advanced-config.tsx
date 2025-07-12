"use client"

import { memo } from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"

// Memoized slider component for better performance
const OptimizedSlider = memo(({ value, onValueChange, ...props }: {
  value: number[]
  onValueChange: (value: number[]) => void
  [key: string]: unknown
}) => (
  <Slider value={value} onValueChange={onValueChange} {...props} />
))

OptimizedSlider.displayName = 'OptimizedSlider'

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

interface AdvancedConfigProps {
  formData: CurriculumFormData
  setFormData: (data: CurriculumFormData | ((prev: CurriculumFormData) => CurriculumFormData)) => void
  toggleFocusArea: (area: string) => void
  toggleStudyDay: (day: string) => void
}

export function AdvancedConfig({
  formData,
  setFormData,
  toggleFocusArea,
  toggleStudyDay
}: AdvancedConfigProps) {
  const isMobile = useIsMobile()
  
  const focusAreaOptions = ["theory", "research", "practical", "historical", "contemporary", "application"]
  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  return (
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
  )
} 