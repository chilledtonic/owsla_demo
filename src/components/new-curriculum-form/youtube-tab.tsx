"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Eye, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ExtendedYoutubeMetadata {
  title: string
  author_name: string
  thumbnail_url: string
  html: string
  duration?: number
  durationString?: string
}

interface YoutubeTabProps {
  youtubeUrl: string
  onUrlChange: (url: string) => void
  youtubeMetadata: ExtendedYoutubeMetadata | null
  fetchingMetadata: boolean
  metadataError: string | null
  durationError: string | null
}

export function YoutubeTab({ 
  youtubeUrl, 
  onUrlChange, 
  youtubeMetadata, 
  fetchingMetadata, 
  metadataError, 
  durationError 
}: YoutubeTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">YouTube Video Courses</h4>
        <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
          Transform any YouTube video (30+ minutes) into a structured learning experience. Perfect for video essays, 
          tutorials, lectures, or documentaries. The AI will break down the content into digestible daily lessons 
          with supplementary materials and exercises.
        </p>
      </div>
      <div>
        <Label htmlFor="youtube-url" className="text-base font-medium">YouTube Course URL</Label>
        <Input
          id="youtube-url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => onUrlChange(e.target.value)}
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
  )
} 