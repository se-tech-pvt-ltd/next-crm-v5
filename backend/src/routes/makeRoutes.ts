import { Router } from 'express';
import { EventRegistrationService } from '../services/EventRegistrationService.js';
import { EventModel } from '@/models/Event.js';

export const makeRoutes = Router();

makeRoutes.get('/registration', (req: any, res: any) => {
  try {
    const auth = (req.headers && req.headers.authorization) ? String(req.headers.authorization) : '';
    if (!auth.toLowerCase().startsWith('bearer ')) return res.status(401).json({ message: 'Unauthorized' });
    const token = auth.split(' ')[1];
    const expected = String(process.env.MAKE_TOKEN || 'b3a49f4c28de79e83f6c15d0a27b64f2d98e5ca0b7fd14a9c0f2d8e19b6a3e74');
    if (token !== expected) return res.status(401).json({ message: 'Invalid token' });
    return res.json({ valid: true });
  } catch (error) {
    console.error('Make token verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

makeRoutes.post('/registration', async (req: any, res: any) => {
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

    console.log('Creating event registration via Make integration:', req.body);
    console.log('Creating event registration via Make integration:', JSON.stringify(req.body));

    const { name, city, email, phone, eventName } = req.body || {};
    if (!name || !email || !city || !phone || !eventName) {
      return res.status(400).json({ message: 'Missing required fields: name, email, city, phone, or eventName' });
    }

    const event = await EventModel.findByName(eventName);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const payload: any = {
      name: String(name),
      email: String(email).toLowerCase(),
      number: phone ? String(phone) : null,
      city: city ? String(city) : null,
      source: 'b75b4253-840f-11f0-a5b5-92e8d4b3yy3',
      status: 'a576fe6c-8d7e-11f0-a5b5-92e8d4b3e6a5',
      createdBy: 'make',
      updatedBy: 'make',
      eventId: event.id,
      isConverted: 0,
    };
    const eventRegistration = await EventRegistrationService.createRegistration(payload);
    return res.status(201).json(eventRegistration);
  } catch (error) {
    console.error('Make registration error:', error);
    return res.status(500).json({ message: 'Failed to create registration' });
  }
});

export default makeRoutes;