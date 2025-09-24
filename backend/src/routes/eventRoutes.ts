import { Router } from "express";
import { EventController } from "../controllers/EventController.js";
import { requireAuth } from "../middlewares/auth.js";

export const eventRoutes = Router();

eventRoutes.get("/", requireAuth, EventController.list);

eventRoutes.get("/:id", requireAuth, EventController.get);
eventRoutes.post("/", requireAuth, EventController.create);
eventRoutes.put("/:id", requireAuth, EventController.update);
eventRoutes.delete("/:id", requireAuth, EventController.remove);

export default eventRoutes;
