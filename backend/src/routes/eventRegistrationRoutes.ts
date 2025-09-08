import { Router } from "express";
import { EventRegistrationController } from "../controllers/EventRegistrationController.js";

export const eventRegistrationRoutes = Router();

eventRegistrationRoutes.get("/", EventRegistrationController.list);
eventRegistrationRoutes.get("/event/:eventId", EventRegistrationController.listByEvent);
eventRegistrationRoutes.get("/:id", EventRegistrationController.get);
eventRegistrationRoutes.post("/", EventRegistrationController.create);
eventRegistrationRoutes.put("/:id", EventRegistrationController.update);
eventRegistrationRoutes.delete("/:id", EventRegistrationController.remove);
eventRegistrationRoutes.post("/:id/convert", EventRegistrationController.convertToLead);

export default eventRegistrationRoutes;
