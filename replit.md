# Student Management System

## Overview

This is a full-stack student recruitment and management application built with React, TypeScript, Express, and PostgreSQL. The system helps educational institutions manage leads, students, applications, and admissions through a comprehensive dashboard interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot reloading with Vite middleware integration

## Key Components

### Database Schema
The application uses four main entities:

1. **Leads**: Prospective students with contact information and initial program interest
2. **Students**: Converted leads with detailed academic and personal information
3. **Applications**: University applications submitted by students
4. **Admissions**: Admission decisions and visa processing status

### API Structure
RESTful API endpoints organized by entity:
- `/api/leads` - Lead management (CRUD operations)
- `/api/students` - Student management (CRUD operations)
- `/api/applications` - Application tracking (CRUD operations)
- `/api/admissions` - Admission and visa status (CRUD operations)
- `/api/search` - Global search functionality

### UI Components
- **Layout System**: Sidebar navigation with responsive design
- **Dashboard**: Metrics visualization and activity tracking
- **Data Tables**: Sortable, filterable tables for each entity
- **Forms**: Validated forms using React Hook Form with Zod schemas
- **Modals**: Dynamic modals for creating and editing records
- **Search**: Global search with real-time results

## Data Flow

1. **Lead Capture**: New leads are created through forms or API
2. **Lead Qualification**: Leads are reviewed and updated with additional information
3. **Student Conversion**: Qualified leads are converted to students
4. **Application Management**: Students create applications for universities
5. **Admission Tracking**: Admission decisions and visa status are tracked
6. **Reporting**: Dashboard provides insights and conversion metrics

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database queries and migrations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form validation and management
- **zod**: Runtime type validation
- **wouter**: Lightweight React routing

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date manipulation utilities

## Deployment Strategy

### Development
- Uses Vite dev server with Express middleware integration
- Hot module replacement for React components
- TypeScript compilation with strict mode
- ESLint and TypeScript checking

### Production Build
- Frontend: Vite builds optimized React bundle
- Backend: esbuild bundles Express server
- Database: Drizzle migrations applied via `db:push`
- Environment: Configured for Node.js production environment

### Database Management
- **Migrations**: Drizzle Kit handles schema migrations
- **Configuration**: Environment-based database URL
- **Dialect**: PostgreSQL with connection pooling
- **Schema**: Shared TypeScript schema definitions

## Changelog

```
Changelog:
- July 06, 2025. Initial setup and full feature implementation
- July 06, 2025. Migrated from in-memory storage to PostgreSQL database
- July 06, 2025. Added comprehensive modal detail views for all entities
- July 06, 2025. Implemented activity tracking system with comments and change logging
- July 06, 2025. Made table rows clickable to open detail modals directly
- July 06, 2025. Improved modals with status dropdowns and streamlined action buttons
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
User interested in understanding high-level architecture and development processes.
```

## Database Migration Steps

When adding a database to a functional app:

1. **Database Setup**: Create database connection and configure environment variables
2. **Schema Design**: Define data models, relationships, and constraints
3. **Migration Tools**: Use ORM migrations to version control schema changes
4. **Storage Layer**: Implement database-specific storage that adheres to existing interface
5. **API Integration**: Update routes to use new database storage
6. **Testing**: Add sample data and test all CRUD operations
7. **Deployment**: Configure database hosting and connection security