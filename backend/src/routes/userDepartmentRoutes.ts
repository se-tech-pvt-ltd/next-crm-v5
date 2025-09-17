import express from 'express';
import { UserRoleController } from '../controllers/UserRoleController.js';

const router = express.Router();

// GET / -> list departments
router.get('/', UserRoleController.listDepartments);

export default router;
