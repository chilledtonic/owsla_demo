"use client"

import { useState } from "react"
import { useUser } from "@stackframe/stack"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Clock, MapPin, MessageSquare, Phone, Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface Expert {
  id: string
  name: string
  title: string
  specialties: string[]
  rating: number
  reviewCount: number
  experience: number
  location: string
  availability: "available" | "busy" | "offline"
  description: string
  hourlyRate: number
  responseTime: string
  languages: string[]
  avatar: string
  subjects: string[]
}

// Mock data using famous scientists
const mockExperts: Expert[] = [
  {
    id: "1",
    name: "Dr. Marie Curie",
    title: "Nobel Prize Winner in Physics & Chemistry",
    specialties: ["Radioactivity", "Nuclear Physics", "Chemistry", "Research Methods"],
    rating: 4.9,
    reviewCount: 127,
    experience: 15,
    location: "Paris, France",
    availability: "available",
    description: "Pioneering researcher in radioactivity with expertise in experimental physics and chemistry. Excellent at explaining complex scientific concepts to students of all levels. Passionate about encouraging women in STEM fields.",
    hourlyRate: 85,
    responseTime: "2 hours",
    languages: ["English", "French", "Polish"],
    avatar: "/api/placeholder/150/150",
    subjects: ["Physics", "Chemistry", "Mathematics", "Research Methods"]
  },
  {
    id: "2",
    name: "Dr. Albert Einstein",
    title: "Theoretical Physicist",
    specialties: ["Relativity Theory", "Quantum Mechanics", "Mathematical Physics", "Philosophy of Science"],
    rating: 5.0,
    reviewCount: 203,
    experience: 20,
    location: "Princeton, USA",
    availability: "busy",
    description: "Revolutionary theoretical physicist known for developing the theory of relativity. Exceptional at making complex physics concepts accessible through thought experiments and analogies. Great mentor for advanced physics students.",
    hourlyRate: 120,
    responseTime: "4 hours",
    languages: ["English", "German"],
    avatar: "/api/placeholder/150/150",
    subjects: ["Physics", "Mathematics", "Philosophy", "Astronomy"]
  },
  {
    id: "3",
    name: "Dr. Charles Darwin",
    title: "Naturalist & Evolutionary Biologist",
    specialties: ["Evolution", "Natural Selection", "Biology", "Scientific Method"],
    rating: 4.8,
    reviewCount: 89,
    experience: 18,
    location: "Cambridge, UK",
    availability: "available",
    description: "Expert in evolutionary biology and natural history. Skilled at teaching observational skills and scientific reasoning. Perfect for students interested in biology, ecology, and understanding life sciences through a scientific lens.",
    hourlyRate: 75,
    responseTime: "3 hours",
    languages: ["English"],
    avatar: "/api/placeholder/150/150",
    subjects: ["Biology", "Ecology", "Geology", "Scientific Method"]
  },
  {
    id: "4",
    name: "Dr. Nikola Tesla",
    title: "Inventor & Electrical Engineer",
    specialties: ["Electrical Engineering", "Electromagnetics", "Innovation", "Patent Strategy"],
    rating: 4.7,
    reviewCount: 156,
    experience: 22,
    location: "New York, USA",
    availability: "available",
    description: "Brilliant inventor and electrical engineer with expertise in electromagnetic fields and wireless technology. Excellent at explaining practical applications of physics and engineering principles. Inspiring mentor for aspiring inventors.",
    hourlyRate: 95,
    responseTime: "1 hour",
    languages: ["English", "Serbian", "German"],
    avatar: "/api/placeholder/150/150",
    subjects: ["Physics", "Engineering", "Mathematics", "Innovation"]
  },
  {
    id: "5",
    name: "Dr. Rosalind Franklin",
    title: "X-ray Crystallographer & Molecular Biologist",
    specialties: ["X-ray Crystallography", "Molecular Biology", "DNA Structure", "Research Techniques"],
    rating: 4.9,
    reviewCount: 94,
    experience: 12,
    location: "London, UK",
    availability: "offline",
    description: "Expert in X-ray crystallography and molecular biology. Meticulous researcher with strong skills in experimental design and data analysis. Excellent at teaching precision in scientific research and interpretation of structural data.",
    hourlyRate: 80,
    responseTime: "6 hours",
    languages: ["English", "French"],
    avatar: "/api/placeholder/150/150",
    subjects: ["Biology", "Chemistry", "Physics", "Research Methods"]
  },
  {
    id: "6",
    name: "Dr. Alan Turing",
    title: "Mathematician & Computer Scientist",
    specialties: ["Computer Science", "Cryptography", "Mathematical Logic", "Artificial Intelligence"],
    rating: 5.0,
    reviewCount: 178,
    experience: 16,
    location: "Cambridge, UK",
    availability: "available",
    description: "Pioneering mathematician and computer scientist. Expert in computational theory, cryptography, and early artificial intelligence concepts. Perfect for students interested in the intersection of mathematics and computer science.",
    hourlyRate: 100,
    responseTime: "2 hours",
    languages: ["English", "German"],
    avatar: "/api/placeholder/150/150",
    subjects: ["Mathematics", "Computer Science", "Logic", "Cryptography"]
  }
]

export default function ExpertsPage() {
  useUser({ or: "redirect" })
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")

  // Get unique subjects for filter
  const allSubjects = Array.from(new Set(mockExperts.flatMap(expert => expert.subjects)))

  // Filter experts based on search and filters
  const filteredExperts = mockExperts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.specialties.some(specialty => 
                           specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         expert.subjects.some(subject => 
                           subject.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSubject = subjectFilter === "all" || expert.subjects.includes(subjectFilter)
    const matchesAvailability = availabilityFilter === "all" || expert.availability === availabilityFilter

    return matchesSearch && matchesSubject && matchesAvailability
  })

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
    <AppLayout>
      <div className="h-full p-4 overflow-x-hidden">
        <div className="space-y-6 min-w-0">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Expert Network</h1>
            <p className="text-sm text-muted-foreground">
              Connect with world-class experts to accelerate your learning
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search experts by name, specialty, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {allSubjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {filteredExperts.length} expert{filteredExperts.length !== 1 ? 's' : ''} found
          </div>

          {/* Expert Cards */}
          <div className="grid gap-6">
            {filteredExperts.map((expert) => (
              <Card key={expert.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={expert.avatar} alt={expert.name} />
                          <AvatarFallback className="text-lg">
                            {expert.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                          getAvailabilityColor(expert.availability)
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{expert.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getAvailabilityText(expert.availability)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{expert.title}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{expert.rating}</span>
                            <span>({expert.reviewCount} reviews)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{expert.experience} years exp</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{expert.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${expert.hourlyRate}/hr</div>
                      <div className="text-xs text-muted-foreground">
                        Responds in {expert.responseTime}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{expert.description}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Specialties</h4>
                        <div className="flex flex-wrap gap-1">
                          {expert.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Subjects</h4>
                        <div className="flex flex-wrap gap-1">
                          {expert.subjects.map((subject, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Languages</h4>
                        <div className="flex flex-wrap gap-1">
                          {expert.languages.map((language, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1" 
                        disabled={expert.availability === "offline"}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Book a Call
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        disabled={expert.availability === "offline"}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredExperts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No experts found</p>
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}