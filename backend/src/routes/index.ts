import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { authRoutes } from "./authRoutes.js";
import { leadRoutes } from "./leadRoutes.js";
import { studentRoutes } from "./studentRoutes.js";
import { applicationRoutes } from "./applicationRoutes.js";
import { admissionRoutes } from "./admissionRoutes.js";
import { activityRoutes } from "./activityRoutes.js";
import { userRoutes } from "./userRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import { dropdownRoutes } from "./dropdownRoutes.js";
import eventRoutes from "./eventRoutes.js";
import eventRegistrationRoutes from "./eventRegistrationRoutes.js";
import branchRoutes from './branchRoutes.js';
import universityRoutes from './universityRoutes.js';

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist and serve uploaded files statically (repo root)
  const uploadsDir = path.resolve(process.cwd(), '..', 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Public Make integration routes (no auth required) - try to load if present
  try {
    const { default: makeRoutes } = await import('./makeRoutes.js');
    app.use('/make', makeRoutes);
  } catch (e) {
    // not available - continue
  }

  // Register auth route first (public)
  app.use('/api/auth', authRoutes);

  // Public version endpoint for diagnostics
  app.get('/api/version', (_req, res) => {
    res.json({
      startedAt: process.env.SERVER_STARTED_AT || null,
      nodeEnv: process.env.NODE_ENV || null,
    });
  });

  // Enforce authentication for all subsequent /api routes
  const { requireAuth } = await import('../middlewares/auth.js');
  app.use('/api', requireAuth);

  // Register protected routes
  app.use('/api/leads', leadRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/admissions', admissionRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/dropdowns', dropdownRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/event-registrations', eventRegistrationRoutes);
  app.use('/api/universities', universityRoutes);
  app.use('/api/configurations', (await import('./configurationRoutes.js')).default);

  // Branches
  app.use('/api/branches', branchRoutes);

  // Branch employees (mappings)
  app.use('/api/branch-emps', (await import('./branchEmpRoutes.js')).default);

  // User departments and roles
  app.use('/api/user-departments', (await import('./userDepartmentRoutes.js')).default);
  app.use('/api/user-roles', (await import('./userRoleRoutes.js')).default);
  app.use('/api/user-access', (await import('./userAccessRoutes.js')).default);

  // Regions
  app.use('/api/regions', (await import('./regionRoutes.js')).default);

  // Search routes (protected)
  app.use('/api/search', leadRoutes); // This includes search functionality
  app.use('/api/search', studentRoutes); // This includes search functionality

  const httpServer = createServer(app);
  return httpServer;
}
