# Growth Garden - Goal Management Application

## Overview

Growth Garden is a gamified goal management application that uses plant metaphors to help users track their progress. Users can create goals represented as different types of plants (sprouts, herbs, trees, flowers), complete actions to earn XP, and watch their virtual plants grow over time. The application features a modern tech stack with React frontend, Express backend, and PostgreSQL database.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Storage**: Dual storage implementation (memory and database)
- **API**: RESTful API with JSON responses

### UI Component System
- **Design System**: shadcn/ui with Radix UI primitives
- **Theme**: Custom garden-themed color palette with CSS variables
- **Components**: Comprehensive UI component library including forms, modals, cards, and data display components
- **Styling**: Tailwind CSS with custom color extensions for forest and earth tones

## Key Components

### Data Models
- **Goals**: Core entities with plant metaphors (sprout, herb, tree, flower)
  - Tracks level progression, XP, timeline, and health status
  - Includes "watering" mechanism based on last activity
- **Actions**: Tasks that contribute to goal progress
  - Reward XP when completed
  - Can have due dates and completion tracking
- **Achievements**: Unlockable rewards for user engagement

### Storage Layer
- **Interface-Based Design**: IStorage interface allows for flexible storage implementations
- **Memory Storage**: In-memory storage for development and testing
- **Database Integration**: Drizzle ORM with PostgreSQL for production
- **Migration Support**: Database schema migrations with Drizzle Kit

### Tree Health System
- **Health Calculation**: Trees require regular "watering" (activity) to stay healthy
- **Status Levels**: Healthy, Warning (3+ days), Withered (7+ days)
- **Visual Feedback**: Color-coded health indicators throughout the UI

### API Structure
- **RESTful Design**: Standard HTTP methods and status codes
- **Goal Management**: CRUD operations for goals with validation
- **Action Tracking**: Create, update, and complete actions
- **Achievement System**: Track and display user achievements

## Data Flow

1. **User Creates Goal**: Form submission → API validation → Database storage → UI update
2. **Action Completion**: User completes action → XP calculation → Goal level update → Tree "watering" → UI refresh
3. **Health Monitoring**: Background calculation of tree health based on last activity timestamp
4. **Progress Tracking**: Real-time updates to goal progress and statistics

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL for cloud-hosted database
- **ORM**: Drizzle ORM for type-safe database operations
- **UI Framework**: React with extensive Radix UI component ecosystem
- **State Management**: TanStack Query for server state synchronization
- **Validation**: Zod for runtime type checking and form validation

### Development Tools
- **Build System**: Vite with TypeScript support
- **Development Environment**: Replit-specific tooling and error handling
- **Code Quality**: TypeScript for static type checking

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations handle schema changes

### Environment Configuration
- **Development**: tsx for TypeScript execution with hot reload
- **Production**: Node.js serves built application
- **Database**: Environment variable configuration for database connection

### Scripts
- `dev`: Development server with hot reload
- `build`: Production build for both frontend and backend
- `start`: Production server startup
- `db:push`: Database schema synchronization

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```