
# OWSLA Database Schema Documentation

## Overview
The OWSLA database is a PostgreSQL database hosted on Neon that manages educational curricula with support for both traditional text-based and video-based learning materials.

## Core Tables

### `curriculums`
The main table storing all curriculum information with support for both text and video content types.

#### Key Columns:
- **`id`** (integer, PK) - Auto-incrementing primary key
- **`curriculum_type`** (text, NOT NULL) - Either 'text' or 'video' (defaults to 'text')
- **`title`** (text, NOT NULL) - Curriculum title
- **`topic`** (text, NOT NULL) - Subject matter/topic
- **`executive_overview`** (text) - High-level summary of the curriculum
- **`user_id`** (text, FK) - Links to `neon_auth.users_sync`

#### Temporal Fields:
- **`start_date`** (date, NOT NULL) - When the curriculum begins
- **`end_date`** (date, NOT NULL) - When the curriculum ends
- **`length_of_study`** (integer, NOT NULL) - Duration in days
- **`created_at`** (timestamp with time zone) - Record creation time
- **`updated_at`** (timestamp with time zone) - Last modification time

#### Educational Metadata:
- **`depth_level`** (integer) - Difficulty/depth rating (1-10)
- **`education_level`** (text) - One of: 'novice', 'undergraduate', 'graduate', 'professional'

#### Text-Based Curriculum Fields:
- **`primary_resource_title`** (text) - Main book/resource title
- **`primary_resource_author`** (text) - Author name(s)
- **`primary_resource_year`** (integer) - Publication year
- **`primary_resource_isbn`** (text) - ISBN number

#### Video-Based Curriculum Fields:
- **`primary_video_id`** (text) - Video platform ID (e.g., YouTube video ID)
- **`primary_video_channel`** (text) - Channel/creator name
- **`primary_video_duration`** (text) - Duration format (e.g., "6H36M22S")
- **`primary_video_url`** (text) - Full video URL
- **`primary_video_published`** (timestamp with time zone) - Video publication date

#### JSON Storage:
- **`full_curriculum_data`** (jsonb, NOT NULL) - Complete curriculum structure including daily modules, readings, insights, etc.

### `daily_modules`
Stores individual day-by-day learning modules.

### `module_concepts`
Core concepts covered in each module.

### `module_insights`
Key insights and takeaways from modules.

### `curriculum_resources`
Additional resources and materials linked to curricula.

### `active_jobs`
Background job processing table.

## Authentication Schema

### `neon_auth.users_sync`
User authentication table synced with Stack Auth, containing user identities but no credentials.

## Indexes

The `curriculums` table has several performance indexes:
- **`curriculums_pkey`** - Primary key index
- **`idx_curriculums_user_id`** - Fast user lookups
- **`idx_curriculums_user_topic`** - User + topic queries
- **`idx_curriculums_user_education_level`** - User + education level filtering
- **`idx_curriculums_user_created_at`** - Chronological user content queries

## Constraints

- **Check Constraints:**
  - `depth_level` must be between 1 and 10
  - `education_level` must be one of the predefined values
  - `curriculum_type` must be either 'text' or 'video'

- **Foreign Keys:**
  - `curriculums.user_id` → `neon_auth.users_sync.id` (CASCADE DELETE)

## Usage Patterns

### Text-Based Curricula
- Set `curriculum_type` = 'text'
- Populate ISBN, author, year fields
- Leave video fields NULL

### Video-Based Curricula
- Set `curriculum_type` = 'video'
- Populate video ID, channel, duration, URL, and published fields
- Leave ISBN/author fields NULL

### JSONB Structure
The `full_curriculum_data` column stores the complete curriculum structure, including:
- Daily modules with time allocations
- Knowledge benchmarks
- Core concepts
- Supplementary readings/resources
- Visual learning paths
- Synthesis goals

This flexible schema allows for rich educational content while maintaining queryable metadata at the table level.