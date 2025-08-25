# StudyBridge CRM

A comprehensive Customer Relationship Management system for educational consultancy, helping manage leads, students, applications, and admissions.

## 🚀 Quick Start on Builder.io

### Database Setup
This project uses **MySQL** database with the following credentials:
- **Host:** 151.106.112.145
- **Database:** sales-crm
- **Username:** setcrminternet
- **Password:** password

### Environment Variables
The following environment variable is already configured:
```
DATABASE_URL=mysql://setcrminternet:password@151.106.112.145/sales-crm
```

### Installation & Running
1. Install dependencies: `npm install`
2. Push database schema: `npm run db:push`
3. Seed test users: `npx tsx scripts/seed-test-users.ts`
4. Start development server: `npm run dev`

## 🔐 Test Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@studybridge.com | admin123 |
| **Counselor** | counselor@studybridge.com | counselor123 |
| **Branch Manager** | manager@studybridge.com | manager123 |

## 📋 Features
- **Lead Management** - Track and manage potential students
- **Student Records** - Comprehensive student information management
- **Application Tracking** - Monitor university applications
- **Admission Management** - Handle admission decisions and processes
- **Role-based Access** - Different permissions for counselors, managers, and admin staff
- **Activity Tracking** - Audit trail for all actions

## 🛠️ Technology Stack
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Express.js + TypeScript
- **Database:** MySQL with Drizzle ORM
- **Authentication:** bcrypt for password hashing
- **UI Components:** Radix UI + shadcn/ui

## 📁 Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared schemas and types
├── scripts/         # Database seeding scripts
└── uploads/         # File uploads directory
```

---
*Ready to use on Builder.io - all dependencies installed and database configured!*
