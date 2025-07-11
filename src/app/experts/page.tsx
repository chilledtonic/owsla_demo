"use client"

import { useUser } from "@stackframe/stack"
import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  Search, 
  MessageSquare,
  ArrowUp,
  Eye, 
  User,
  Plus,
  CheckCircle,
  Bookmark,
  Share
} from "lucide-react"

interface User {
  id: string
  name: string
  title: string
  avatar: string
  verified: boolean
  reputation: number
  specialties: string[]
}

interface Answer {
  id: string
  user: User
  content: string
  upvotes: number
  downvotes: number
  timeAgo: string
  isAccepted?: boolean
  hasUpvoted?: boolean
  hasDownvoted?: boolean
}

interface Question {
  id: string
  title: string
  content: string
  author: User
  timeAgo: string
  views: number
  answers: Answer[]
  tags: string[]
  upvotes: number
  hasUpvoted?: boolean
  hasBookmarked?: boolean
}

// Mock users (famous scientists and educators)
const mockUsers: User[] = [
  {
    id: "1",
    name: "Dr. Marie Curie",
    title: "Nobel Prize Winner in Physics & Chemistry",
    avatar: "/api/placeholder/40/40",
    verified: true,
    reputation: 15240,
    specialties: ["Physics", "Chemistry", "Research Methods"]
  },
  {
    id: "2",
    name: "Albert Einstein",
    title: "Theoretical Physicist",
    avatar: "/api/placeholder/40/40",
    verified: true,
    reputation: 22100,
    specialties: ["Physics", "Mathematics", "Philosophy"]
  },
  {
    id: "3",
    name: "Richard Feynman",
    title: "Quantum Physicist & Educator",
    avatar: "/api/placeholder/40/40",
    verified: true,
    reputation: 18750,
    specialties: ["Physics", "Teaching", "Problem Solving"]
  },
  {
    id: "4",
    name: "Carl Sagan",
    title: "Astronomer & Science Communicator",
    avatar: "/api/placeholder/40/40",
    verified: true,
    reputation: 14320,
    specialties: ["Astronomy", "Science Communication", "Philosophy"]
  },
  {
    id: "5",
    name: "Katherine Johnson",
    title: "Mathematician & NASA Pioneer",
    avatar: "/api/placeholder/40/40",
    verified: true,
    reputation: 12890,
    specialties: ["Mathematics", "Engineering", "Space Science"]
  },
  {
    id: "6",
    name: "Neil deGrasse Tyson",
    title: "Astrophysicist & Director of Hayden Planetarium",
    avatar: "/api/placeholder/40/40",
    verified: true,
    reputation: 16540,
    specialties: ["Astrophysics", "Science Education", "Public Speaking"]
  }
]

// Mock questions and answers
const mockQuestions: Question[] = [
  {
    id: "1",
    title: "How do I effectively study quantum mechanics without getting overwhelmed by the mathematics?",
    content: "I'm a physics undergraduate struggling with quantum mechanics. The mathematical formalism seems incredibly dense and I often lose sight of the physical intuition. What strategies have worked for others when approaching this subject? Are there particular resources or mental models that help bridge the gap between the math and the physics?",
    author: {
      id: "student1",
      name: "Alex Chen",
      title: "Physics Undergraduate",
      avatar: "/api/placeholder/40/40",
      verified: false,
      reputation: 45,
      specialties: ["Physics Student"]
    },
    timeAgo: "2 hours ago",
    views: 234,
    upvotes: 12,
    hasUpvoted: false,
    hasBookmarked: true,
    tags: ["quantum-mechanics", "study-methods", "physics", "mathematics"],
    answers: [
      {
        id: "1a",
        user: mockUsers[2], // Feynman
        content: "The key is to always ask yourself: 'What is this equation telling me about the world?' Don't just memorize the math - try to visualize what's happening. Start with the simplest cases: a particle in a box, harmonic oscillator. Draw diagrams of wave functions. Use analogies - though imperfect, they help build intuition. Remember, if you can't explain it simply, you don't understand it well enough yourself.",
        upvotes: 45,
        downvotes: 2,
        timeAgo: "1 hour ago",
        isAccepted: true,
        hasUpvoted: true
      },
      {
        id: "1b",
        user: mockUsers[1], // Einstein
        content: "Mathematics is the language in which the universe speaks to us. But like any language, you must first understand the grammar before appreciating the poetry. I recommend studying the historical development - how Planck, Bohr, and Schrödinger each contributed. Understanding why these equations were necessary helps demystify them. Also, work through many problems - mathematics becomes intuitive through practice.",
        upvotes: 38,
        downvotes: 1,
        timeAgo: "45 minutes ago",
        hasUpvoted: false
      },
      {
        id: "1c",
        user: mockUsers[5], // Neil deGrasse Tyson
        content: "I always tell learners: embrace the weirdness! Quantum mechanics is supposed to feel counterintuitive - that's what makes it so fascinating. Use online simulations and visualizations. There are great interactive tools that let you 'see' wave functions evolve. Also, join study groups - explaining concepts to others often clarifies your own understanding.",
        upvotes: 22,
        downvotes: 0,
        timeAgo: "30 minutes ago",
        hasUpvoted: false
      }
    ]
  },
  {
    id: "2",
    title: "What's the most effective way to read and retain information from dense academic papers?",
    content: "I'm working on my thesis and need to read dozens of research papers, but I find myself forgetting details shortly after reading. How do experienced researchers approach reading academic literature? What note-taking systems work best?",
    author: {
      id: "student2",
      name: "Sarah Martinez",
      title: "Graduate Student in Chemistry",
      avatar: "/api/placeholder/40/40",
      verified: false,
      reputation: 78,
      specialties: ["Chemistry Student"]
    },
    timeAgo: "5 hours ago",
    views: 156,
    upvotes: 8,
    hasUpvoted: true,
    hasBookmarked: false,
    tags: ["research", "study-methods", "academic-papers", "note-taking"],
    answers: [
      {
        id: "2a",
        user: mockUsers[0], // Marie Curie
        content: "I developed a three-pass system: First, read abstract and conclusions to grasp the main idea. Second, read introduction and skim methodology. Third, read thoroughly with detailed notes. Always summarize the key findings in your own words - this forces deeper understanding. Keep a research log with connections between papers.",
        upvotes: 28,
        downvotes: 0,
        timeAgo: "3 hours ago",
        isAccepted: true,
        hasUpvoted: false
      },
      {
        id: "2b",
        user: mockUsers[4], // Katherine Johnson
        content: "Create concept maps linking ideas across papers. I use different colors for methodology, results, and implications. Most importantly, always ask: 'How does this relate to my research question?' If you can't answer that, you might be reading too broadly. Focus on papers that directly contribute to your thesis narrative.",
        upvotes: 19,
        downvotes: 1,
        timeAgo: "2 hours ago",
        hasUpvoted: true
      }
    ]
  },
  {
    id: "3",
    title: "How can I maintain motivation during long-term learning projects?",
    content: "I'm working through several multi-month curricula and sometimes lose motivation halfway through. The initial excitement fades and the daily grind sets in. How do experienced learners maintain momentum and enthusiasm over months or years of study?",
    author: {
      id: "student3",
      name: "Mike Johnson",
      title: "Self-taught Programmer",
      avatar: "/api/placeholder/40/40",
      verified: false,
      reputation: 123,
      specialties: ["Programming", "Self-directed Learning"]
    },
    timeAgo: "1 day ago",
    views: 412,
    upvotes: 24,
    hasUpvoted: false,
    hasBookmarked: true,
    tags: ["motivation", "self-study", "long-term-learning", "discipline"],
    answers: [
      {
        id: "3a",
        user: mockUsers[3], // Carl Sagan
        content: "Wonder is the antidote to routine. Regularly step back and marvel at what you've learned. Connect new knowledge to the bigger picture - how does this programming concept relate to problem-solving in the universe? Set mini-milestones and celebrate them. Share your progress with others - teaching reinforces your own learning and provides accountability.",
        upvotes: 67,
        downvotes: 2,
        timeAgo: "18 hours ago",
        isAccepted: true,
        hasUpvoted: true
      },
      {
        id: "3b",
        user: mockUsers[2], // Feynman
        content: "I learned to play bongos while studying physics - it kept my mind fresh! Don't just study - play with the concepts. Build silly projects, explain things to your rubber duck, take tangents when something interests you. The goal isn't just to complete the curriculum, but to become the kind of person who loves learning. That intrinsic motivation sustains you forever.",
        upvotes: 41,
        downvotes: 0,
        timeAgo: "16 hours ago",
        hasUpvoted: false
      }
    ]
  }
]

export default function ExpertsPage() {
  useUser({ or: "redirect" })
  const [questions] = useState<Question[]>(mockQuestions)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)
  const isMobile = useIsMobile()

  const handleVote = (questionId: string, isUpvote: boolean) => {
    // Handle voting logic
    console.log(`Vote on question ${questionId}: ${isUpvote ? 'upvote' : 'downvote'}`)
  }

  const handleBookmark = (questionId: string) => {
    // Handle bookmark logic
    console.log(`Bookmark question ${questionId}`)
  }

  const filteredQuestions = questions.filter(question =>
    searchQuery === "" ||
    question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    question.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const sortedQuestions = filteredQuestions.sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.upvotes - a.upvotes
      case "views":
        return b.views - a.views
      case "answers":
        return b.answers.length - a.answers.length
      default: // recent
        return new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime()
    }
  })

  if (isMobile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4">
          {/* Mobile Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Expert Q&A</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredQuestions.length} questions
                </p>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Ask
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="views">Most Viewed</SelectItem>
                    <SelectItem value="answers">Most Answers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {sortedQuestions.map((question) => (
              <div
                key={question.id}
                className="p-4 rounded-lg border bg-background space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedQuestion(selectedQuestion === question.id ? null : question.id)}
              >
                {/* Question Header */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2">
                    {question.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        {question.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {question.answers.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {question.views}
                      </span>
                    </div>
                    <span>{question.timeAgo}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {question.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {question.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{question.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {selectedQuestion === question.id && (
                  <div className="space-y-3 pt-2 border-t">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {question.content}
                    </p>
                    
                    {/* Top Answer Preview */}
                    {question.answers.length > 0 && (
                      <div className="p-3 rounded bg-muted/50">
                        <div className="flex items-start gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={question.answers[0].user.avatar} />
                            <AvatarFallback className="text-xs">
                              {question.answers[0].user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium">
                                {question.answers[0].user.name}
                              </span>
                              {question.answers[0].user.verified && (
                                <CheckCircle className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                          </div>
                          {question.answers[0].isAccepted && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              ✓ Accepted
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {question.answers[0].content}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVote(question.id, true)
                          }}
                          className="h-8 px-2"
                        >
                          <ArrowUp className="h-3 w-3 mr-1" />
                          {question.upvotes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBookmark(question.id)
                          }}
                          className="h-8 px-2"
                        >
                          <Bookmark className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" className="h-8">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Answer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No questions found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search terms or browse all questions
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ask a Question
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    )
  }

  // Desktop layout (simplified from original)
  return (
    <AppLayout>
      <div className="h-full p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Expert Q&A</h1>
              <p className="text-muted-foreground">
                Get answers from renowned experts and educators
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ask Question
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions, topics, or experts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="answers">Most Answers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Questions Grid */}
          <div className="grid grid-cols-1 gap-6">
            {sortedQuestions.map((question) => (
              <div key={question.id} className="p-6 rounded-lg border bg-background">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 leading-tight">
                      {question.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="h-4 w-4" />
                        {question.upvotes} votes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {question.answers.length} answers
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {question.views} views
                      </span>
                      <span>Asked {question.timeAgo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(question.id, true)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmark(question.id)}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Question Content */}
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {question.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Top Answer Preview */}
                {question.answers.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/20 border">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={question.answers[0].user.avatar} />
                        <AvatarFallback>
                          {question.answers[0].user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {question.answers[0].user.name}
                          </span>
                          {question.answers[0].user.verified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                          {question.answers[0].isAccepted && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              ✓ Accepted Answer
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {question.answers[0].user.title}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-3">
                      {question.answers[0].content}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" />
                          {question.answers[0].upvotes}
                        </span>
                        <span>{question.answers[0].timeAgo}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        View All Answers ({question.answers.length})
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Answer Question
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    by {question.author.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No questions found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search terms or browse all questions
              </p>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Ask a Question
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}