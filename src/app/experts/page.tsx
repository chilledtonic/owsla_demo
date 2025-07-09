"use client"

import { useState } from "react"
import { useUser } from "@stackframe/stack"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MessageSquare, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Share, 
  Bookmark,
  MoreHorizontal,
  Clock,
  Eye,
  Plus,
  TrendingUp,
  BookOpen,
  Users,
  Award,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
        content: "I always tell students: embrace the weirdness! Quantum mechanics is supposed to feel counterintuitive - that's what makes it so fascinating. Use online simulations and visualizations. There are great interactive tools that let you 'see' wave functions evolve. Also, join study groups - explaining concepts to others often clarifies your own understanding.",
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
        downvotes: 3,
        timeAgo: "12 hours ago",
        hasUpvoted: false
      }
    ]
  },
  {
    id: "4",
    title: "Best practices for collaborative learning in STEM subjects?",
    content: "I'm organizing a study group for advanced calculus. What are the most effective formats and approaches for group learning in mathematics? How can we ensure everyone contributes and benefits?",
    author: {
      id: "student4",
      name: "Emma Rodriguez",
      title: "Mathematics Major",
      avatar: "/api/placeholder/40/40",
      verified: false,
      reputation: 67,
      specialties: ["Mathematics Student"]
    },
    timeAgo: "3 days ago",
    views: 189,
    upvotes: 15,
    hasUpvoted: false,
    hasBookmarked: false,
    tags: ["collaborative-learning", "mathematics", "study-groups", "calculus"],
    answers: [
      {
        id: "4a",
        user: mockUsers[4], // Katherine Johnson
        content: "Assign rotating roles: presenter, questioner, note-taker, devil's advocate. Each person explains one concept per session. Set ground rules: no question is too basic, mistakes are learning opportunities. Work problems together on a board - the act of writing helps everyone follow the logic. Schedule regular check-ins to ensure balanced participation.",
        upvotes: 32,
        downvotes: 1,
        timeAgo: "2 days ago",
        isAccepted: true,
        hasUpvoted: true
      },
      {
        id: "4b",
        user: mockUsers[1], // Einstein
        content: "The most beautiful thing about group learning is that explaining forces you to truly understand. Create an environment where teaching each other is the primary goal. When someone struggles, others should guide them to the answer rather than giving it directly. This way, both the teacher and student benefit from the interaction.",
        upvotes: 26,
        downvotes: 0,
        timeAgo: "1 day ago",
        hasUpvoted: false
      }
    ]
  }
]

export default function ExpertsPage() {
  useUser({ or: "redirect" })
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterTag, setFilterTag] = useState("all")

  // Get all unique tags
  const allTags = Array.from(new Set(mockQuestions.flatMap(q => q.tags)))

  // Filter and sort questions
  const filteredQuestions = mockQuestions
    .filter(question => {
      const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesTag = filterTag === "all" || question.tags.includes(filterTag)
      
      return matchesSearch && matchesTag
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return 0 // Keep original order (most recent first)
        case "popular":
          return b.upvotes - a.upvotes
        case "answers":
          return b.answers.length - a.answers.length
        default:
          return 0
      }
    })

  const handleVote = (questionId: string, isUpvote: boolean) => {
    // In a real app, this would make an API call
    console.log(`${isUpvote ? 'Upvoted' : 'Downvoted'} question ${questionId}`)
  }

  const handleAnswerVote = (questionId: string, answerId: string, isUpvote: boolean) => {
    // In a real app, this would make an API call
    console.log(`${isUpvote ? 'Upvoted' : 'Downvoted'} answer ${answerId} on question ${questionId}`)
  }

  const handleBookmark = (questionId: string) => {
    // In a real app, this would make an API call
    console.log(`Bookmarked question ${questionId}`)
  }

  return (
    <AppLayout
      rightSidebar={
        <div className="p-4">
          {/* Top Contributors */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Top Contributors
            </h3>
            <div className="space-y-3">
              {mockUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-medium truncate">{user.name}</p>
                      {user.verified && <CheckCircle className="h-3 w-3 text-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.reputation.toLocaleString()} rep</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-1">
              {allTags.slice(0, 8).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setFilterTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-3">
            <div className="p-3 rounded bg-background/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Questions Asked</span>
                <span className="text-xs">{mockQuestions.length}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Total Answers</span>
                <span className="text-xs">{mockQuestions.reduce((acc, q) => acc + q.answers.length, 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Active Experts</span>
                <span className="text-xs">{mockUsers.length}</span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="h-full overflow-auto">
        {/* Header */}
        <div className="border-b">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Expert Forum</h1>
                <p className="text-muted-foreground">
                  Ask questions, share knowledge, and learn from world-class experts
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ask Question
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions, answers, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="answers">Most Answers</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="p-6">
          <div className="space-y-6">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="border-b pb-6 last:border-b-0">
                {/* Question Header */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <button 
                      onClick={() => handleVote(question.id, true)}
                      className={cn(
                        "p-1 rounded hover:bg-muted transition-colors",
                        question.hasUpvoted && "bg-blue-100 text-blue-600"
                      )}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium">{question.upvotes}</span>
                    <button 
                      onClick={() => handleVote(question.id, false)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/experts/question/${question.id}`}
                      className="block hover:bg-muted/30 -m-2 p-2 rounded transition-colors"
                    >
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary">
                        {question.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                        {question.content}
                      </p>
                    </Link>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {question.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Question Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={question.author.avatar} alt={question.author.name} />
                            <AvatarFallback className="text-xs">
                              {question.author.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{question.author.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{question.timeAgo}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{question.views} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{question.answers.length} answers</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleBookmark(question.id)}
                          className={cn(
                            "p-1 rounded hover:bg-muted transition-colors",
                            question.hasBookmarked && "bg-yellow-100 text-yellow-600"
                          )}
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                        <button className="p-1 rounded hover:bg-muted transition-colors">
                          <Share className="h-4 w-4" />
                        </button>
                        <button className="p-1 rounded hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Featured Answer Preview */}
                    {question.answers.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-muted">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={question.answers[0].user.avatar} alt={question.answers[0].user.name} />
                            <AvatarFallback className="text-xs">
                              {question.answers[0].user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{question.answers[0].user.name}</span>
                          {question.answers[0].user.verified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                          {question.answers[0].isAccepted && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Accepted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {question.answers[0].content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{question.answers[0].upvotes} upvotes</span>
                          <span>{question.answers[0].timeAgo}</span>
                          <Link 
                            href={`/experts/question/${question.id}`}
                            className="text-primary hover:underline"
                          >
                            View all {question.answers.length} answers
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No questions found</p>
                <p className="text-sm">Try adjusting your search or filters, or ask the first question!</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Ask Question
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}