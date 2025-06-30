"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Clock } from "lucide-react"
import * as React from "react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

const tasks = [
  {
    title: "Complete Chapter 1-3 Reading",
    type: "Reading",
    due: "Today",
    priority: "high",
  },
  {
    title: "Sigil Construction Exercise",
    type: "Practical",
    due: "Tomorrow",
    priority: "medium",
  },
]

const papers = [
  "Urban, Hugh B. 'Unleashing the Beast: Aleister Crowley...'",
  "Partridge, Christopher. 'Lost Horizon: P.D. Ouspensky...'",
  "Lynch, Gordon. 'What is this Religion in the Study...'",
  "Carroll, Peter J. 'The Paradigmatic Pirate'",
  "Sherwin, Ray. 'The Theatre of Magick'",
  "Hine, Phil. 'Chaos Servitors: A User Guide'",
]

export function RightSidebar() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="w-80 border-l bg-muted/10 p-4 space-y-4">
      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarComponent mode="single" selected={date} onSelect={setDate} className="border-0" />
        </CardContent>
      </Card>

      {/* Task Blocks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Task Blocks</CardTitle>
          <CardDescription className="text-xs">Upcoming assignments and activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-none space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{task.title}</span>
                <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                  {task.type}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.due}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Paper Database */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Paper Database
          </CardTitle>
          <CardDescription className="text-xs">Reference materials and academic sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {papers.map((paper, index) => (
              <div
                key={index}
                className="p-2 bg-muted/30 rounded-none text-xs leading-relaxed hover:bg-muted/50 cursor-pointer transition-colors"
              >
                {paper}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
