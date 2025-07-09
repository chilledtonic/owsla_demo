"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MessageSquare, Phone, Users, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Expert {
  id: string
  name: string
  title: string
  specialties: string[]
  rating: number
  reviewCount: number
  availability: "available" | "busy" | "offline"
  hourlyRate: number
  avatar: string
  responseTime: string
}

// Mock experts data (same as experts page)
const mockExperts: Expert[] = [
  {
    id: "1",
    name: "Dr. Marie Curie",
    title: "Nobel Prize Winner in Physics & Chemistry",
    specialties: ["Radioactivity", "Nuclear Physics", "Chemistry", "Research Methods"],
    rating: 4.9,
    reviewCount: 127,
    availability: "available",
    hourlyRate: 85,
    avatar: "/api/placeholder/150/150",
    responseTime: "2 hours"
  },
  {
    id: "2",
    name: "Dr. Albert Einstein",
    title: "Theoretical Physicist",
    specialties: ["Relativity Theory", "Quantum Mechanics", "Mathematical Physics", "Philosophy of Science"],
    rating: 5.0,
    reviewCount: 203,
    availability: "busy",
    hourlyRate: 120,
    avatar: "/api/placeholder/150/150",
    responseTime: "4 hours"
  },
  {
    id: "3",
    name: "Dr. Charles Darwin",
    title: "Naturalist & Evolutionary Biologist",
    specialties: ["Evolution", "Natural Selection", "Biology", "Scientific Method"],
    rating: 4.8,
    reviewCount: 89,
    availability: "available",
    hourlyRate: 75,
    avatar: "/api/placeholder/150/150",
    responseTime: "3 hours"
  },
  {
    id: "4",
    name: "Dr. Nikola Tesla",
    title: "Inventor & Electrical Engineer",
    specialties: ["Electrical Engineering", "Electromagnetics", "Innovation", "Patent Strategy"],
    rating: 4.7,
    reviewCount: 156,
    availability: "available",
    hourlyRate: 95,
    avatar: "/api/placeholder/150/150",
    responseTime: "1 hour"
  },
  {
    id: "5",
    name: "Dr. Rosalind Franklin",
    title: "X-ray Crystallographer & Molecular Biologist",
    specialties: ["X-ray Crystallography", "Molecular Biology", "DNA Structure", "Research Techniques"],
    rating: 4.9,
    reviewCount: 94,
    availability: "offline",
    hourlyRate: 80,
    avatar: "/api/placeholder/150/150",
    responseTime: "6 hours"
  },
  {
    id: "6",
    name: "Dr. Alan Turing",
    title: "Mathematician & Computer Scientist",
    specialties: ["Computer Science", "Cryptography", "Mathematical Logic", "Artificial Intelligence"],
    rating: 5.0,
    reviewCount: 178,
    availability: "available",
    hourlyRate: 100,
    avatar: "/api/placeholder/150/150",
    responseTime: "2 hours"
  }
]

interface ExpertRecommendationProps {
  curriculumTitle: string
  curriculumTopics?: string[]
  className?: string
}

export function ExpertRecommendation({ 
  curriculumTitle, 
  curriculumTopics = [],
  className 
}: ExpertRecommendationProps) {
  
  // Simple matching algorithm based on curriculum title and topics
  const findRelevantExpert = () => {
    const titleLower = curriculumTitle.toLowerCase()
    const topicsLower = curriculumTopics.map(topic => topic.toLowerCase())
    
    // Define subject keywords and their matching experts
    const subjectMatches = {
      physics: ["1", "2", "4"], // Marie Curie, Einstein, Tesla
      chemistry: ["1", "5"], // Marie Curie, Franklin
      biology: ["3", "5"], // Darwin, Franklin
      mathematics: ["2", "6"], // Einstein, Turing
      computer: ["6"], // Turing
      engineering: ["4"], // Tesla
      research: ["1", "3", "5"], // Curie, Darwin, Franklin
      science: ["1", "2", "3", "4", "5", "6"], // All experts
    }
    
    // Find matches based on curriculum content
    const matchingExpertIds: string[] = []
    
    for (const [subject, expertIds] of Object.entries(subjectMatches)) {
      if (titleLower.includes(subject) || topicsLower.some(topic => topic.includes(subject))) {
        matchingExpertIds.push(...expertIds)
      }
    }
    
    // Remove duplicates and get unique experts
    const uniqueExpertIds = Array.from(new Set(matchingExpertIds))
    
    // Get the experts and filter available ones first
    const relevantExperts = mockExperts.filter(expert => 
      uniqueExpertIds.includes(expert.id)
    )
    
    // Sort by availability (available first) and then by rating
    relevantExperts.sort((a, b) => {
      if (a.availability === "available" && b.availability !== "available") return -1
      if (a.availability !== "available" && b.availability === "available") return 1
      return b.rating - a.rating
    })
    
    // Return the best match or a default expert
    return relevantExperts[0] || mockExperts[0]
  }
  
  const recommendedExpert = findRelevantExpert()
  
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available": return "bg-green-500"
      case "busy": return "bg-yellow-500"
      case "offline": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }
  
  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case "available": return "Available"
      case "busy": return "Busy"
      case "offline": return "Offline"
      default: return "Unknown"
    }
  }
  
  return (
    <Card className={cn("border-2 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-700 dark:text-blue-300">
            Get Expert Help
          </CardTitle>
        </div>
        <CardDescription>
          Connect with an expert who specializes in your curriculum topics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={recommendedExpert.avatar} alt={recommendedExpert.name} />
              <AvatarFallback>
                {recommendedExpert.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-3 h-3 rounded border-2 border-white",
              getAvailabilityColor(recommendedExpert.availability)
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{recommendedExpert.name}</h4>
              <Badge variant="outline" className="text-xs">
                {getAvailabilityText(recommendedExpert.availability)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {recommendedExpert.title}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{recommendedExpert.rating}</span>
                <span>({recommendedExpert.reviewCount})</span>
              </div>
              <div className="font-medium">
                ${recommendedExpert.hourlyRate}/hr
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="text-xs font-medium text-muted-foreground">Specialties:</div>
          <div className="flex flex-wrap gap-1">
            {recommendedExpert.specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              disabled={recommendedExpert.availability === "offline"}
            >
              <Phone className="h-3 w-3 mr-2" />
              Book Call
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              disabled={recommendedExpert.availability === "offline"}
            >
              <MessageSquare className="h-3 w-3 mr-2" />
              Message
            </Button>
          </div>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full text-xs"
            onClick={() => window.open('/experts', '_blank')}
          >
            Browse All Experts
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        {recommendedExpert.availability === "offline" && (
          <div className="mt-3 p-2 bg-muted rounded">
            <p className="text-xs text-muted-foreground">
              This expert is currently offline. Check our other available experts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}