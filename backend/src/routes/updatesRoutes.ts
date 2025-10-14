import { Router } from "express";
import { UpdatesController } from "../controllers/UpdatesController.js";

export const updatesRoutes = Router();

updatesRoutes.get("/", UpdatesController.list);
updatesRoutes.post("/", UpdatesController.create);

export default updatesRoutes;
