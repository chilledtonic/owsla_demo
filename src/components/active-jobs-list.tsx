"use client"

import { useEffect, useState } from "react"
import { useUser } from "@stackframe/stack"
import { getActiveJobs } from "@/lib/actions"
import { ActiveJob } from "@/lib/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface ActiveJobsListProps {
  onJobComplete?: (job: ActiveJob) => void
}

export function ActiveJobsList({ onJobComplete }: ActiveJobsListProps) {
  const user = useUser()
  const [jobs, setJobs] = useState<ActiveJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadActiveJobs() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const result = await getActiveJobs(user.id)
        if (result.success && result.data) {
          setJobs(result.data)
          
          // Check for newly completed jobs
          result.data.forEach((job: ActiveJob) => {
            if (job.status === 'completed' && job.progress >= 100) {
              onJobComplete?.(job)
            }
          })
        }
      } catch (error) {
        console.error('Error loading active jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadActiveJobs()
    
    // Poll for updates every 10 seconds
    const interval = setInterval(loadActiveJobs, 10000)
    
    return () => clearInterval(interval)
  }, [user?.id, onJobComplete])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Curriculum Generation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curriculum Generation Status</CardTitle>
        <CardDescription>
          Track the progress of your curriculum generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(job.status)}
                  <h3 className="font-medium truncate">{job.topic}</h3>
                </div>
                <Badge className={getStatusColor(job.status)}>
                  {job.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{job.progress}%</span>
                </div>
                <Progress value={job.progress} className="h-2" />
              </div>
              
              {job.error_message && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {job.error_message}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Started: {new Date(job.created_at).toLocaleString()}
                {job.updated_at !== job.created_at && (
                  <span> • Updated: {new Date(job.updated_at).toLocaleString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 