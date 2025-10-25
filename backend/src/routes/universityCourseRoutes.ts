import { Router } from "express";
import UniversityCourseController from "../controllers/UniversityCourseController.js";

const universityCourseRoutes = Router();

// GET /api/university-courses
universityCourseRoutes.get('/', UniversityCourseController.list);

export default universityCourseRoutes;
