import { Router } from "express";
import { FollowUpController } from "../controllers/FollowUpController.js";

export const followUpRoutes = Router();

followUpRoutes.get("/", FollowUpController.list);

export default followUpRoutes;
