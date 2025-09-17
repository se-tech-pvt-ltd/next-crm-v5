import express from 'express';
import { UserRoleController } from '../controllers/UserRoleController.js';

const router = express.Router();

// GET / -> list roles. optional query param departmentId
router.get('/', UserRoleController.listRoles);

export default router;
