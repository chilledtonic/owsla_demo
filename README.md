# Owsla - Intelligent Learning Management Platform

A modern, curriculum-based learning management system built with Next.js that provides structured educational pathways with AI-powered curriculum generation, expert recommendations, and comprehensive learning analytics.

## ✨ Features

### 📚 Curriculum Management
- **Structured Learning Paths**: Create and manage comprehensive curricula with daily modules
- **AI-Powered Content Generation**: Automated curriculum creation based on educational objectives
- **Flexible Scheduling**: Customizable study schedules with time allocation tracking
- **Progress Tracking**: Real-time learning progress monitoring and analytics

### 🎯 Personalized Learning
- **Expert Recommendations**: AI-curated expert suggestions based on learning goals
- **Adaptive Content**: Dynamic content delivery based on user progress and preferences
- **Knowledge Benchmarks**: Structured assessment points throughout the learning journey
- **Practical Connections**: Real-world application exercises and projects

### 📊 Analytics & Insights
- **Learning Dashboard**: Comprehensive overview of all active curricula and progress
- **Study Time Analytics**: Track total study hours and time allocation per subject
- **Calendar Integration**: Visual learning calendar with upcoming modules and deadlines
- **Resource Management**: Centralized library of books, articles, and supplementary materials

### 🔧 Technical Features
- **Modern Stack**: Built with Next.js 15, React 19, and TypeScript
- **Database**: Neon PostgreSQL serverless database with optimized queries
- **Authentication**: Secure user authentication with Stack Auth
- **Responsive Design**: Mobile-first design with Tailwind CSS and Radix UI
- **Cloud Deployment**: Optimized for Cloudflare Pages deployment

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun runtime
- PostgreSQL database (Neon recommended)
- Stack Auth account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd demo
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=your_neon_database_url
   NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
   STACK_SECRET_SERVER_KEY=your_stack_secret_key
   ```

4. **Initialize Stack Auth**
   ```bash
   npx @stackframe/init-stack . --no-browser
   ```

5. **Start the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── curriculum/[id]/   # Individual curriculum pages
│   ├── dashboard/         # User dashboard
│   ├── experts/           # Expert recommendations
│   ├── library/           # Resource library
│   ├── new-curriculum/    # Curriculum creation
│   └── handler/           # Stack Auth handlers
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui components
│   ├── app-layout.tsx    # Main application layout
│   ├── curriculum-*.tsx  # Curriculum-specific components
│   └── expert-*.tsx      # Expert recommendation components
├── lib/                  # Utility functions and database
│   ├── actions.ts        # Server actions
│   ├── database.ts       # Database queries and types
│   └── utils.ts          # Utility functions
└── hooks/                # Custom React hooks
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Components**: Radix UI primitives with shadcn/ui
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation

### Backend & Database
- **Database**: Neon PostgreSQL serverless
- **ORM**: Direct SQL queries with Neon serverless driver
- **Authentication**: Stack Auth (@stackframe/stack)
- **API**: Next.js API routes and Server Actions

### Deployment & DevOps
- **Hosting**: Cloudflare Pages
- **Build Tool**: Turbopack (Next.js)
- **Package Manager**: Bun (recommended) or npm
- **CI/CD**: Cloudflare Pages deployment pipeline

## 🗄️ Database Schema

### Core Tables
- **curriculums**: Main curriculum data with JSON content
- **active_jobs**: Background job processing queue
- **users**: User profiles and authentication (managed by Stack Auth)

### Key Data Structures
- **Daily Modules**: Structured learning units with time allocation
- **Knowledge Benchmarks**: Assessment criteria and learning objectives
- **Resource References**: Books, articles, and supplementary materials
- **Progress Tracking**: User completion status and analytics

## 🚀 Deployment

### Cloudflare Pages
1. **Build the project**
   ```bash
   bun run pages:build
   ```

2. **Deploy to Cloudflare Pages**
   ```bash
   bun run pages:deploy
   ```

3. **Set up environment variables** in Cloudflare Dashboard

### Environment Configuration
Ensure all environment variables are configured in your deployment platform:
- Database connection strings
- Stack Auth credentials
- Any API keys for external services

## 🔄 Development Scripts

```bash
# Development server with Turbopack
bun dev

# Production build
bun run build

# Start production server
bun start

# Lint code
bun run lint

# Cloudflare Pages build
bun run pages:build

# Cloudflare Pages deployment
bun run pages:deploy

# Local Cloudflare Pages development
bun run pages:dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Neon](https://neon.tech/) for serverless PostgreSQL
- [Stack Auth](https://stackframe.co/) for authentication infrastructure
- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
