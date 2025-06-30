"use client"

import { OtherResource } from "@/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { ExternalLink, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

interface ResourcesTableProps {
  resources: OtherResource[]
}

export function ResourcesTable({ resources }: ResourcesTableProps) {
  const router = useRouter()

  if (resources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No additional resources required for your current curricula
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Academic Resources ({resources.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Resource</TableHead>
                <TableHead className="text-xs w-24">Author</TableHead>
                <TableHead className="text-xs w-16">Type</TableHead>
                <TableHead className="text-xs w-16">Time</TableHead>
                <TableHead className="text-xs w-16">Day</TableHead>
                <TableHead className="text-xs w-12">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource, index) => (
                <TableRow 
                  key={`${resource.curriculumId}-${resource.day}-${index}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/curriculum/${resource.curriculumId}`)}
                >
                  <TableCell className="py-2 pr-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs line-clamp-2 leading-tight">
                          {resource.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.curriculumTitle}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-2">
                    <div className="w-24">
                      <p className="text-xs truncate">{resource.author}</p>
                      {resource.year && (
                        <p className="text-xs text-muted-foreground">{resource.year}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-1">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {resource.type === 'research_paper' ? 'Paper' : 
                       resource.type === 'article' ? 'Article' :
                       resource.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-1">
                    <p className="text-xs">{resource.readingTime}</p>
                  </TableCell>
                  <TableCell className="py-2 px-1">
                    <p className="text-xs font-medium">{resource.day}</p>
                  </TableCell>
                  <TableCell className="py-2 pl-1">
                    {resource.doi && (
                      <a
                        href={`https://doi.org/${resource.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 