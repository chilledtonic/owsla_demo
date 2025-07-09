"use client"

import { OtherResource } from "@/lib/actions"
import { Badge } from "./badge"
import { Button } from "./button"
import { Input } from "./input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { ExternalLink, FileText, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { handleResourceClick } from "@/lib/utils"
import { useState, useMemo } from "react"

interface ResourcesTableProps {
  resources: OtherResource[]
}

type SortField = 'title' | 'author' | 'year' | 'type' | 'readingTime' | 'day' | 'curriculumTitle'
type SortDirection = 'asc' | 'desc'

export function ResourcesTable({ resources }: ResourcesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>('day')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources.filter(resource => 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.curriculumTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort resources
    filtered.sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      // Handle special cases
      if (sortField === 'readingTime') {
        // Extract number from "18 minutes" format
        aVal = parseInt(aVal.match(/\d+/)?.[0] || '0')
        bVal = parseInt(bVal.match(/\d+/)?.[0] || '0')
      } else if (sortField === 'year') {
        aVal = aVal || 0
        bVal = bVal || 0
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [resources, searchTerm, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedResources.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentResources = filteredAndSortedResources.slice(startIndex, endIndex)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No additional resources required for your current curricula
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(parseInt(value))
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedResources.length)} of {filteredAndSortedResources.length} resources
          {searchTerm && ` (filtered from ${resources.length} total)`}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead 
                  className="text-xs font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-1">
                    Resource
                    {getSortIcon('title')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-xs font-medium w-24 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('author')}
                >
                  <div className="flex items-center gap-1">
                    Author
                    {getSortIcon('author')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-xs font-medium w-16 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {getSortIcon('type')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-xs font-medium w-16 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('readingTime')}
                >
                  <div className="flex items-center gap-1">
                    Time
                    {getSortIcon('readingTime')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-xs font-medium w-16 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('day')}
                >
                  <div className="flex items-center gap-1">
                    Day
                    {getSortIcon('day')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-xs font-medium w-20 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('curriculumTitle')}
                >
                  <div className="flex items-center gap-1">
                    Course
                    {getSortIcon('curriculumTitle')}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium w-12">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentResources.map((resource, index) => (
                <TableRow 
                  key={`${resource.curriculumId}-${resource.day}-${index}`}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleResourceClick(resource)}
                >
                  <TableCell className="py-3 pr-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs line-clamp-2 leading-tight">
                          {resource.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {resource.moduleTitle}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-2">
                    <div className="w-24">
                      <p className="text-xs truncate font-medium">{resource.author}</p>
                      {resource.year && resource.year > 0 && (
                        <p className="text-xs text-muted-foreground">{resource.year}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-1">
                    <Badge variant="outline" className="text-xs px-2 py-0.5 h-5">
                      {resource.type === 'research_paper' ? 'Paper' : 
                       resource.type === 'article' ? 'Article' :
                       resource.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-1">
                    <p className="text-xs font-medium">{resource.readingTime}</p>
                  </TableCell>
                  <TableCell className="py-3 px-1">
                    <div className="w-8 h-6 rounded bg-primary/10 flex items-center justify-center">
                      <p className="text-xs font-bold text-primary">{resource.day}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-1">
                    <p className="text-xs truncate font-medium" title={resource.curriculumTitle}>
                      {resource.curriculumTitle}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 pl-1">
                    {resource.doi ? (
                      <ExternalLink className="h-3 w-3 text-blue-600" />
                    ) : (
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* No results message */}
      {filteredAndSortedResources.length === 0 && searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No resources found matching "{searchTerm}"</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSearchTerm("")}
            className="mt-2"
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  )
} 