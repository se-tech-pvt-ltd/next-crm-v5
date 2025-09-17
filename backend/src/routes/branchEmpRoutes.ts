import express from 'express';
import { BranchEmpController } from '../controllers/BranchEmpController.js';

const router = express.Router();

router.get('/', BranchEmpController.list);
router.get('/:id', BranchEmpController.getById);
router.post('/', BranchEmpController.create);
router.delete('/:id', BranchEmpController.remove);

export default router;
