import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertStudentSchema, insertApplicationSchema, insertAdmissionSchema, insertActivitySchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  const createUserSchema = z.object({
    user: insertUserSchema,
    password: z.string().min(6),
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { user: userData, password } = createUserSchema.parse(req.body);
      const user = await storage.createUserWithPassword(userData, password);
      res.json(user);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  // Mock current user for demonstration (in production, this would come from authentication)
  const getCurrentUser = () => ({
    id: 'admin1',
    role: 'admin_staff' // Change this to test different roles: 'counselor', 'branch_manager', 'admin_staff'
  });

  // Lead routes
  app.get("/api/leads", async (req, res) => {
    try {
      const currentUser = getCurrentUser();
      const leads = await storage.getLeads(currentUser.id, currentUser.role);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = getCurrentUser();
      const lead = await storage.getLead(id, currentUser.id, currentUser.role);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(id, validatedData);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLead(id);
      if (!success) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Student routes
  app.get("/api/students", async (req, res) => {
    try {
      const currentUser = getCurrentUser();
      const students = await storage.getStudents(currentUser.id, currentUser.role);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = getCurrentUser();
      const student = await storage.getStudent(id, currentUser.id, currentUser.role);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(id, validatedData);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Application routes
  app.get("/api/applications", async (req, res) => {
    try {
      const currentUser = getCurrentUser();
      const applications = await storage.getApplications(currentUser.id, currentUser.role);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const currentUser = getCurrentUser();
      const applications = await storage.getApplicationsByStudent(studentId, currentUser.id, currentUser.role);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const validatedData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.put("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertApplicationSchema.partial().parse(req.body);
      const application = await storage.updateApplication(id, validatedData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Admission routes
  app.get("/api/admissions", async (req, res) => {
    try {
      const currentUser = getCurrentUser();
      const admissions = await storage.getAdmissions(currentUser.id, currentUser.role);
      res.json(admissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admissions" });
    }
  });

  app.get("/api/admissions/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const currentUser = getCurrentUser();
      const admissions = await storage.getAdmissionsByStudent(studentId, currentUser.id, currentUser.role);
      res.json(admissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admissions" });
    }
  });

  app.post("/api/admissions", async (req, res) => {
    try {
      const validatedData = insertAdmissionSchema.parse(req.body);
      const admission = await storage.createAdmission(validatedData);
      res.status(201).json(admission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create admission" });
    }
  });

  app.put("/api/admissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAdmissionSchema.partial().parse(req.body);
      const admission = await storage.updateAdmission(id, validatedData);
      if (!admission) {
        return res.status(404).json({ message: "Admission not found" });
      }
      res.json(admission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update admission" });
    }
  });

  // Search routes
  app.get("/api/search/leads", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const leads = await storage.searchLeads(query);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to search leads" });
    }
  });

  app.get("/api/search/students", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const students = await storage.searchStudents(query);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to search students" });
    }
  });

  // Activity routes
  app.get("/api/activities/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const id = parseInt(entityId);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid entity ID" });
      }
      const activities = await storage.getActivities(entityType, id);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
