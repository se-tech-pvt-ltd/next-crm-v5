import { Router } from 'express';
import { BranchController } from '../controllers/BranchController.js';

const router = Router();

router.get('/', BranchController.list);

export default router;
