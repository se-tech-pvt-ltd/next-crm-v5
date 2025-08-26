# Education Management System

A comprehensive education management system built with React and Node.js in a monorepo structure.

## Project Structure

```
root/
│
├── package.json          # Workspace-level scripts & dependencies
├── pnpm-workspace.yaml   # Workspace configuration
├── README.md
├── .gitignore
│
├── frontend/             # React + Vite app
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Page-level components
│       ├── hooks/        # Custom React hooks
│       ├── context/      # React context providers
│       ├── services/     # API calls (axios/fetch)
│       ├── utils/        # Helper functions
│       └── main.jsx
│
└── backend/              # Node.js app (MVC pattern)
    ├── package.json
    ├── src/
    │   ├── server.js     # App entry point
    │   ├── config/       # DB config, environment variables
    │   ├── routes/       # API route definitions
    │   ├── controllers/  # Request handling logic
    │   ├── models/       # Database models (Drizzle ORM)
    │   ├── services/     # Business logic, reusable code
    │   ├── middlewares/  # Express middleware (auth, error handling, etc.)
    │   ├── utils/        # Utility functions/helpers
    │   └── tests/        # Unit/integration tests
```

## Features

- **Lead Management**: Track and manage potential students
- **Student Management**: Comprehensive student profiles and tracking
- **Application Management**: Handle university applications
- **Admission Management**: Track admission decisions and processes
- **Activity Tracking**: Complete audit trail of all actions
- **Role-based Access Control**: Different access levels for counselors, managers, and admin staff
- **File Upload**: Profile picture management
- **Search Functionality**: Search across leads and students

## Tech Stack

### Frontend
- React 18
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- React Query for state management
- Wouter for routing

### Backend
- Node.js with Express
- Drizzle ORM with MySQL
- Zod for validation
- Multer for file uploads
- bcryptjs for password hashing

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL database
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables in backend/.env:
   ```env
   DATABASE_URL=mysql://username:password@host:port/database
   NODE_ENV=development
   ```

4. Push database schema:
   ```bash
   npm run db:push
   ```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them separately:
```bash
# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend
```

### Building for Production

```bash
npm run build
```

### Starting Production Server

```bash
npm run start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Applications
- `GET /api/applications` - Get all applications
- `POST /api/applications` - Create new application
- `PUT /api/applications/:id` - Update application

### Admissions
- `GET /api/admissions` - Get all admissions
- `POST /api/admissions` - Create new admission
- `PUT /api/admissions/:id` - Update admission

### File Upload
- `POST /api/upload/profile-picture` - Upload profile picture

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
