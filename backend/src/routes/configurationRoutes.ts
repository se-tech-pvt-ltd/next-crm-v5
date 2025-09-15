import { Router } from 'express';
import { ConfigurationController } from '../controllers/ConfigurationController.js';

const configurationRoutes = Router();

// Generic configuration endpoints
configurationRoutes.get('/:name', ConfigurationController.getByName);
configurationRoutes.put('/:name', ConfigurationController.setByName);

// Branch management endpoints
configurationRoutes.get('/branches/list/all', ConfigurationController.listBranches);
configurationRoutes.post('/branches', ConfigurationController.createBranch);

export default configurationRoutes;
