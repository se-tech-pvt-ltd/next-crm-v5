import { Router } from 'express';
import { RegionController } from '../controllers/RegionController.js';

const router = Router();

router.get('/', RegionController.list);
router.post('/', RegionController.create);
router.put('/:id', RegionController.update);

export default router;
