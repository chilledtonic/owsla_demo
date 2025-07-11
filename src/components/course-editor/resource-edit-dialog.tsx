"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Resource } from "@/types/course-editor"

interface ResourceEditDialogProps {
  resource: Resource
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedResource: Resource) => void
}

export function ResourceEditDialog({ resource, open, onOpenChange, onSave }: ResourceEditDialogProps) {
  const [editedResource, setEditedResource] = useState<Resource>(resource)

  // Auto-suggest resource type based on available data
  const suggestResourceType = (res: Resource): Resource['type'] => {
    if (res.doi && res.doi !== 'N/A') return 'paper'
    if (res.journal && res.journal !== 'N/A') return 'paper'
    if (res.isbn && res.isbn !== 'N/A' && !res.journal) return 'book'
    if (res.publisher && !res.journal && !res.doi) return 'book'
    return res.type || 'other'
  }

  // Update resource when dialog opens with better type suggestion
  useEffect(() => {
    if (open) {
      const suggestedType = suggestResourceType(resource)
      if (suggestedType !== resource.type) {
        setEditedResource(prev => ({ ...prev, type: suggestedType }))
      } else {
        setEditedResource(resource)
      }
    }
  }, [open, resource])

  const handleFieldChange = (field: keyof Resource, value: string) => {
    setEditedResource(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTypeChange = (newType: Resource['type']) => {
    setEditedResource(prev => {
      const updated = { ...prev, type: newType }
      
      // Clear fields that don't apply to the new type
      if (newType === 'book') {
        updated.doi = ''
        updated.journal = ''
      } else if (newType === 'paper' || newType === 'article') {
        updated.isbn = ''
        updated.publisher = ''
      } else {
        // For other types
        updated.isbn = ''
        updated.doi = ''
        updated.journal = ''
        updated.publisher = ''
      }
      
      return updated
    })
  }

  const handleSave = () => {
    onSave(editedResource)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setEditedResource(resource) // Reset to original
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={editedResource.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Resource title"
            />
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={editedResource.author}
              onChange={(e) => handleFieldChange('author', e.target.value)}
              placeholder="Author name"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select 
              value={editedResource.type} 
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="paper">Academic Paper</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {editedResource.type === 'book' && "Books typically have ISBNs and publishers"}
              {editedResource.type === 'paper' && "Academic papers have DOIs and are published in journals"}
              {editedResource.type === 'article' && "Articles may have DOIs and are published in magazines or journals"}
              {editedResource.type === 'other' && "Other resources like websites, documents, etc."}
            </p>
          </div>

          {/* ISBN (for books) */}
          {editedResource.type === 'book' && (
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={editedResource.isbn || ''}
                onChange={(e) => handleFieldChange('isbn', e.target.value)}
                placeholder="978-0123456789"
              />
            </div>
          )}

          {/* DOI (for papers) */}
          {(editedResource.type === 'paper' || editedResource.type === 'article') && (
            <div className="space-y-2">
              <Label htmlFor="doi">DOI</Label>
              <Input
                id="doi"
                value={editedResource.doi || ''}
                onChange={(e) => handleFieldChange('doi', e.target.value)}
                placeholder="10.1000/xyz123"
              />
            </div>
          )}

          {/* Journal (for papers) */}
          {(editedResource.type === 'paper' || editedResource.type === 'article') && (
            <div className="space-y-2">
              <Label htmlFor="journal">Journal</Label>
              <Input
                id="journal"
                value={editedResource.journal || ''}
                onChange={(e) => handleFieldChange('journal', e.target.value)}
                placeholder="Journal name"
              />
            </div>
          )}

          {/* Publisher (for books) */}
          {editedResource.type === 'book' && (
            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={editedResource.publisher || ''}
                onChange={(e) => handleFieldChange('publisher', e.target.value)}
                placeholder="Publisher name"
              />
            </div>
          )}

          {/* Year */}
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              value={editedResource.year || ''}
              onChange={(e) => handleFieldChange('year', e.target.value)}
              placeholder="2024"
              type="number"
            />
          </div>

          {/* Reading Time */}
          <div className="space-y-2">
            <Label htmlFor="reading_time">Reading Time</Label>
            <Input
              id="reading_time"
              value={editedResource.reading_time || ''}
              onChange={(e) => handleFieldChange('reading_time', e.target.value)}
              placeholder="e.g., 30 minutes, 2 hours"
            />
          </div>

          {/* Focus */}
          <div className="space-y-2">
            <Label htmlFor="focus">Focus/Description</Label>
            <Textarea
              id="focus"
              value={editedResource.focus || ''}
              onChange={(e) => handleFieldChange('focus', e.target.value)}
              placeholder="Brief description of what this resource covers..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 