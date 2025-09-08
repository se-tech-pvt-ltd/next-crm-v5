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

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist and serve uploaded files statically
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Register all routes
  app.use('/api/auth', authRoutes);
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

  // Search routes
  app.use('/api/search', leadRoutes); // This includes search functionality
  app.use('/api/search', studentRoutes); // This includes search functionality

  const httpServer = createServer(app);
  return httpServer;
}
