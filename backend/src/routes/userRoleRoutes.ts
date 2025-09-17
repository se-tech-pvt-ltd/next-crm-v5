import express from 'express';
import { UserRoleController } from '../controllers/UserRoleController.js';

const router = express.Router();

// GET / -> list departments when mounted at /api/user-departments
router.get('/', UserRoleController.listDepartments);

// For roles, we expect to mount this same router at /api/user-roles
export default router;
