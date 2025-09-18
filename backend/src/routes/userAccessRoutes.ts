import { Router } from "express";
import { UserAccessController } from "../controllers/UserAccessController.js";

export const userAccessRoutes = Router();

userAccessRoutes.get("/", UserAccessController.list);
userAccessRoutes.get("/:id", UserAccessController.get);
userAccessRoutes.post("/", UserAccessController.create);
userAccessRoutes.put("/:id", UserAccessController.update);
userAccessRoutes.delete("/:id", UserAccessController.remove);

export default userAccessRoutes;
