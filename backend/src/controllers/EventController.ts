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
      const data = insertEventSchema.parse(req.body);
      const created = await EventService.createEvent(data);
      res.status(201).json(created);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid event data", errors: e.errors });
      res.status(500).json({ message: "Failed to create event" });
    }
  }
  static async update(req: Request, res: Response) {
    try {
      const data = insertEventSchema.partial().parse(req.body);
      const updated = await EventService.updateEvent(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Event not found" });
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid event data", errors: e.errors });
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
