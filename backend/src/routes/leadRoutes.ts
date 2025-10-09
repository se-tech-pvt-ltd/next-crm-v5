import { Router } from "express";
import { LeadController } from "../controllers/LeadController.js";
import { requireAuth } from "../middlewares/auth.js";

export const leadRoutes = Router();

leadRoutes.get("/", requireAuth, LeadController.getLeads);
leadRoutes.get("/stats", requireAuth, LeadController.getStats);
leadRoutes.get("/:id", requireAuth, LeadController.getLead);
leadRoutes.post("/", requireAuth, LeadController.createLead);
leadRoutes.put("/:id", requireAuth, LeadController.updateLead);
leadRoutes.delete("/:id", requireAuth, LeadController.deleteLead);

// Search route
leadRoutes.get("/search/leads", requireAuth, LeadController.searchLeads);
