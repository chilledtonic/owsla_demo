# Owsla - Intelligent Learning Management Platform

A modern, curriculum-based learning management system built with Next.js that provides structured educational pathways with AI-powered curriculum generation, expert recommendations, and comprehensive learning analytics.

## ✨ Features

### 📚 Curriculum Management
- **Structured Learning Paths**: Create and manage comprehensive curricula with daily modules.
- **Multiple Creation Methods**:
    - **Topic-based**: Generate a curriculum from a single topic.
    - **YouTube Video**: Create a curriculum based on a YouTube video.
    - **Source-based**: Build a curriculum from a collection of primary and secondary resources.
- **Drag-and-Drop Course Editor**: Easily organize and edit your curriculum with a drag-and-drop interface.
- **Flexible Scheduling**: Customizable study schedules with time allocation tracking.
- **Progress Tracking**: Real-time learning progress monitoring and analytics.

### 🎯 Personalized Learning
- **Expert Recommendations**: AI-curated expert suggestions based on learning goals.
- **Adaptive Content**: Dynamic content delivery based on user progress and preferences.
- **Knowledge Benchmarks**: Structured assessment points throughout the learning journey.
- **Practical Connections**: Real-world application exercises and projects.

### 📊 Analytics & Insights
- **Learning Dashboard**: Comprehensive overview of all active curricula and progress.
- **Study Time Analytics**: Track total study hours and time allocation per subject.
- **Calendar Integration**: Visual learning calendar with upcoming modules and deadlines.
- **Resource Management**: Centralized library of books, articles, and supplementary materials.

### 🔧 Technical Features
- **Modern Stack**: Built with Next.js, React, and TypeScript.
- **Database**: Serverless PostgreSQL database with optimized queries.
- **Authentication**: Secure user authentication.
- **Responsive Design**: Mobile-first design with Tailwind CSS.
- **Cloud Deployment**: Optimized for modern cloud platforms.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun runtime
- A PostgreSQL database
- Appropriate environment variables for authentication and database connection.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with the necessary credentials for your database and authentication service.

4. **Start the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                      # Next.js app router pages
│   ├── api/                  # API routes for integrations
│   ├── course-editor/        # Page for editing curricula
│   ├── curriculum/[id]/      # Page for viewing a curriculum
│   ├── new-curriculum/       # Page for creating a new curriculum
│   └── page.tsx              # The main dashboard page
├── components/               # Reusable UI components
│   ├── ui/                   # Shadcn/ui components
│   ├── app-layout.tsx        # Main application layout
│   ├── course-editor.tsx     # The main course editor component
│   ├── new-curriculum-form.tsx # The form for creating new curricula
│   └── ...
├── lib/                      # Utility functions and database access
│   ├── actions.ts            # Server actions
│   ├── database.ts           # Database queries and types
│   └── utils.ts              # Utility functions
└── ...
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js with App Router
- **UI Library**: React with TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI primitives with shadcn/ui
- **Charts**: Recharts for data visualization

### Backend & Database
- **Database**: Serverless PostgreSQL
- **Authentication**: Stack Auth (@stackframe/stack)
- **API**: Next.js API routes and Server Actions

### Deployment & DevOps
- **Hosting**: Configured for Vercel/Cloudflare Pages
- **Build Tool**: Next.js default (SWC)
- **Package Manager**: Bun (recommended) or npm

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
