import { Router } from "express";
import { EventController } from "../controllers/EventController.js";

export const eventRoutes = Router();

eventRoutes.get("/", EventController.list);
export default eventRoutes;

eventRoutes.get("/:id", EventController.get);
eventRoutes.post("/", EventController.create);
eventRoutes.put("/:id", EventController.update);
eventRoutes.delete("/:id", EventController.remove);
