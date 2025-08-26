import { Router } from "express";
import { LeadController } from "../controllers/LeadController.js";

export const leadRoutes = Router();

leadRoutes.get("/", LeadController.getLeads);
leadRoutes.get("/:id", LeadController.getLead);
leadRoutes.post("/", LeadController.createLead);
leadRoutes.put("/:id", LeadController.updateLead);
leadRoutes.delete("/:id", LeadController.deleteLead);

// Search route
leadRoutes.get("/search/leads", LeadController.searchLeads);
