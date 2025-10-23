import { Router } from 'express';
import { CurrencyController } from '../controllers/CurrencyController.js';

const router = Router();

// GET /api/currencies?country=United%20Kingdom
router.get('/', CurrencyController.getByCountry);

export default router;
