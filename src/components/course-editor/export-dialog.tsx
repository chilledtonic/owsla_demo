"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TopstersExport } from "./topsters-export"
import { CourseData } from "@/types/course-editor"

interface ExportDialogProps {
  course: CourseData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ course, open, onOpenChange }: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Course Pack</DialogTitle>
        </DialogHeader>
        <TopstersExport 
          course={course} 
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
} 