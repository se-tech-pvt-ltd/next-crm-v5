import { z } from "zod";
import { insertEventSchema } from "../shared/schema.js";
import { EventService } from "../services/EventService.js";

export class EventController {
  static async list(req: Request, res: Response) {
    try {
      const items = await EventService.getEvents();
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  }
  static async get(req: Request, res: Response) {
    try {
      const item = await EventService.getEvent(req.params.id);
      if (!item) return res.status(404).json({ message: "Event not found" });
      res.json(item);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  }
  static async create(req: Request, res: Response) {
    try {
      const raw = { ...req.body } as any;
      const required = ['name','type','date','venue','time'] as const;
      for (const k of required) {
        if (!raw[k]) return res.status(400).json({ message: `Missing field: ${k}` });
      }
      if (typeof raw.date === 'string') {
        const d = new Date(raw.date);
        if (Number.isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid date format' });
        raw.date = d;
      }
      const created = await EventService.createEvent(raw);
      res.status(201).json(created);
    } catch (e) {
      console.error('Event create error:', e);
      res.status(500).json({ message: "Failed to create event" });
    }
  }
  static async update(req: Request, res: Response) {
    try {
      const raw = { ...req.body } as any;
      if (raw.date && typeof raw.date === 'string') {
        const d = new Date(raw.date);
        if (Number.isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid date format' });
        raw.date = d;
      }
      const updated = await EventService.updateEvent(req.params.id, raw);
      if (!updated) return res.status(404).json({ message: "Event not found" });
      res.json(updated);
    } catch (e) {
      console.error('Event update error:', e);
      res.status(500).json({ message: "Failed to update event" });
    }
  }
  static async remove(req: Request, res: Response) {
    try {
      const ok = await EventService.deleteEvent(req.params.id);
      if (!ok) return res.status(404).json({ message: "Event not found" });
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  }
}
