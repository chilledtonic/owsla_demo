"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TopicTabProps {
  topic: string
  onTopicChange: (topic: string) => void
}

export function TopicTab({ topic, onTopicChange }: TopicTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Topic-Based Learning</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
          Enter any topic you&apos;d like to explore, and our AI agent will create a comprehensive multi-day curriculum 
          with curated books, texts, and learning materials. Perfect for deep dives into subjects like philosophy, 
          science, history, or any area of knowledge.
        </p>
      </div>
      <div>
        <Label htmlFor="topic" className="text-base font-medium">What would you like to learn?</Label>
        <Input
          id="topic"
          placeholder="e.g., Chaos Magick, Machine Learning, Ancient History..."
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          required
          className="mt-2 h-12"
        />
      </div>
    </div>
  )
} 