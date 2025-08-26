# Development Guide

## Project Structure

This is a monorepo with separate frontend and backend applications:

- `frontend/` - React + Vite application
- `backend/` - Node.js + Express API with MVC pattern
- `shared/` - Shared types and schemas (copied to both apps)

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL database
- npm or pnpm

### Installation

1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

3. Push database schema:
   ```bash
   npm run db:push
   ```

### Development

Start both applications in development mode:
```bash
npm run dev
```

Or start them separately:
```bash
# Backend only (API server on port 5000)
npm run dev:backend

# Frontend only (Vite dev server on port 3000)
npm run dev:frontend
```

The frontend automatically proxies API requests to the backend.

### API Testing

Test the backend API:
```bash
curl http://localhost:5000/api/leads
```

### Building for Production

```bash
npm run build
```

This builds both the frontend and backend applications.

### Project Architecture

#### Backend (MVC Pattern)
- `src/models/` - Database models with CRUD operations
- `src/services/` - Business logic and role-based access control
- `src/controllers/` - HTTP request handlers
- `src/routes/` - API route definitions
- `src/middlewares/` - Express middleware (auth, logging, uploads)
- `src/config/` - Database and app configuration
- `src/utils/` - Helper functions and utilities

#### Frontend
- `src/components/` - Reusable UI components
- `src/pages/` - Page-level components
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React context providers
- `src/lib/` - Utilities and configurations
- `src/shared/` - Shared types and schemas

### Available Scripts

#### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build both applications
- `npm run start` - Start production server
- `npm run check` - Run TypeScript checks

#### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema
