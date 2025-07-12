"use client"

import { memo } from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { AlertTriangle } from "lucide-react"

// Memoized slider component for better performance
const OptimizedSlider = memo(({ value, onValueChange, ...props }: {
  value: number[]
  onValueChange: (value: number[]) => void
  [key: string]: unknown
}) => (
  <Slider value={value} onValueChange={onValueChange} {...props} />
))

OptimizedSlider.displayName = 'OptimizedSlider'

interface QuickSetupProps {
  depth: number[]
  setDepth: (value: number[]) => void
  lengthOfStudy: number[]
  setLengthOfStudy: (value: number[]) => void
  educationLevel: number[]
  setEducationLevel: (value: number[]) => void
  activeTab: string
  youtubeMetadata?: { duration?: number; durationString?: string } | null
  calculateRecommendedDays: (duration: number) => number
  advancedFromBasic: {
    course_parameters: {
      daily_time_commitment: number
      pace: string
    }
  }
}

export function QuickSetup({
  depth,
  setDepth,
  lengthOfStudy,
  setLengthOfStudy,
  educationLevel,
  setEducationLevel,
  activeTab,
  youtubeMetadata,
  calculateRecommendedDays,
  advancedFromBasic
}: QuickSetupProps) {
  return (
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
              {advancedFromBasic.course_parameters.daily_time_commitment} hours
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Total Hours:</span>
            <div className="font-medium">
              {Math.round(lengthOfStudy[0] * advancedFromBasic.course_parameters.daily_time_commitment)} hours
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Pace:</span>
            <div className="font-medium capitalize">
              {advancedFromBasic.course_parameters.pace}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 