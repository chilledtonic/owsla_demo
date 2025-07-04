"use client"

import { CurriculumData } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { BookOpen, Calendar, Clock, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface CurriculaOverviewProps {
  curricula: CurriculumData[]
}

export function CurriculaOverview({ curricula }: CurriculaOverviewProps) {
  const router = useRouter()

  if (curricula.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Learning Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Start Your Learning Journey</h3>
              <p className="text-muted-foreground mb-4">
                Create your first curriculum to begin personalized learning
              </p>
              <Button onClick={() => router.push("/new-curriculum")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Curriculum
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Active Curricula ({curricula.length})</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push("/new-curriculum")}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Curriculum
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {curricula.map((curriculum) => {
            const startDate = new Date(curriculum.start_date)
            const endDate = new Date(curriculum.end_date)
            const today = new Date()
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
            const daysPassed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24)))
            const progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100))
            
            return (
              <Card 
                key={curriculum.id}
                className="cursor-pointer hover:shadow-md transition-shadow min-w-0"
                onClick={() => router.push(`/curriculum/${curriculum.id}`)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3 min-w-0">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                        {curriculum.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {curriculum.topic}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {curriculum.education_level && (
                        <Badge variant="secondary" className="text-xs">
                          {curriculum.education_level}
                        </Badge>
                      )}
                      {curriculum.depth_level && (
                        <Badge variant="outline" className="text-xs">
                          Level {curriculum.depth_level}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-xs min-w-0">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{curriculum.length_of_study} days</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                          {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {curriculum.primary_resource_title && (
                      <div className="pt-2 border-t min-w-0">
                        <p className="text-xs text-muted-foreground">Primary Resource:</p>
                        <p className="text-xs font-medium line-clamp-1">
                          {curriculum.primary_resource_title}
                        </p>
                        {curriculum.primary_resource_author && (
                          <p className="text-xs text-muted-foreground truncate">
                            by {curriculum.primary_resource_author}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 