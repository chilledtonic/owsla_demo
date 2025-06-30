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
                <TableHead className="text-sm min-w-[200px]">Title</TableHead>
                <TableHead className="text-sm min-w-[120px]">Author</TableHead>
                <TableHead className="text-sm min-w-[100px]">Source</TableHead>
                <TableHead className="text-sm min-w-[80px]">Type</TableHead>
                <TableHead className="text-sm min-w-[80px]">Time</TableHead>
                <TableHead className="text-sm min-w-[100px]">Module</TableHead>
                <TableHead className="text-sm min-w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource, index) => (
                <TableRow 
                  key={`${resource.curriculumId}-${resource.day}-${index}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/curriculum/${resource.curriculumId}`)}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 max-w-[180px]">
                        <p className="font-medium text-sm line-clamp-2">
                          {resource.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.curriculumTitle}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="max-w-[100px]">
                      <p className="text-sm truncate">{resource.author}</p>
                      {resource.year && (
                        <p className="text-xs text-muted-foreground">{resource.year}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm truncate max-w-[80px]">{resource.journal}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm">{resource.readingTime}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="max-w-[80px]">
                      <p className="text-sm font-medium">Day {resource.day}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {resource.moduleTitle}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      {resource.doi && (
                        <a
                          href={`https://doi.org/${resource.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          DOI
                        </a>
                      )}
                    </div>
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