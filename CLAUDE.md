# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `bun dev` (uses Next.js with Turbopack)
- **Build production**: `bun build`

## High-Level Architecture

This is a **Next.js 15 + React 19** curriculum management application for educational contentm called Owsla. It uses the **App Router** with server components and actions.

### Core Architecture Components

**Authentication & User Management**
- Uses **Stack Framework** (`@stackframe/stack`) for authentication
- Stack provider wraps the entire app in `src/app/layout.tsx`
- User authentication handled via `useUser()` hook with redirect patterns

**Database Layer**
- **Neon Postgres** serverless database via `@neondatabase/serverless`
- Database functions in `src/lib/database.ts` with TypeScript interfaces
- Server actions in `src/lib/actions.ts` provide the API layer between UI and database
- Main entities: `CurriculumData` and `ActiveJobData`

**UI Architecture**
- **Radix UI** components with **Tailwind CSS** for styling
- **shadcn/ui** component library pattern in `src/components/ui/`
- **App Layout** pattern with persistent sidebar (`src/components/app-layout.tsx`)
- Responsive design with mobile-first approach

**Data Flow Pattern**
- Server actions (`'use server'`) handle all data mutations and fetching
- Client components use `useUser()` for authentication state
- Database queries wrapped in try/catch with structured error returns
- Loading states and error handling built into all data-fetching components

### Key Application Features

**Curriculum Management**
- Create new curricula via webhook integration to n8n workflow
- View, edit, and delete existing curricula
- Dashboard with learning calendar and progress tracking
- Library view for resource management

**Job Processing**
- Active job queue system for curriculum generation
- Job status tracking and progress indicators
- Integration with external webhook for processing

**Resource Handling**
- Book resources with ISBN support and Open Library integration
- Supplementary reading materials and papers
- Resource tables with clickable links (DOI, ISBN)

## File Structure Conventions

- `src/app/`: Next.js App Router pages and API routes
- `src/components/`: Reusable React components
- `src/components/ui/`: shadcn/ui styled components
- `src/lib/`: Utility functions, database, and server actions
- `src/hooks/`: Custom React hooks

## Environment Requirements

- `DATABASE_URL`: Neon Postgres connection string
- `HOOK_USER` and `HOOK_PASS`: Webhook authentication credentials
- Stack Framework environment variables (configured automatically)

## Development Notes

- Uses server components by default, client components marked with `"use client"`
- All database operations use server actions for security
- Error handling follows consistent pattern with success/error response objects
- TypeScript strict mode enabled
- Image optimization configured for Open Library book covers