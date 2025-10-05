import { Router } from 'express';
import { LeadService } from '../services/LeadService.js';

export const makeRoutes = Router();

makeRoutes.post('/lead', async (req: any, res: any) => {
  try {
    const auth = (req.headers && req.headers.authorization) ? String(req.headers.authorization) : '';
    if (!auth.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = auth.split(' ')[1];
    const expected = String(process.env.MAKE_TOKEN || 'b3a49f4c28de79e83f6c15d0a27b64f2d98e5ca0b7fd14a9c0f2d8e19b6a3e74');
    if (token !== expected) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { name, city, email, phone } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ message: 'Missing required fields: name and email' });
    }

    const payload: any = {
      name: String(name),
      email: String(email).toLowerCase(),
      phone: phone ? String(phone) : null,
      city: city ? String(city) : null,
      source: 'make',
      status: 'new',
      createdBy: 'make',
      updatedBy: 'make',
    };

    const lead = await LeadService.createLead(payload, 'make');
    return res.status(201).json(lead);
  } catch (error) {
    console.error('Make lead error:', error);
    return res.status(500).json({ message: 'Failed to create lead' });
  }
});

export default makeRoutes;
