import { z } from "zod";
import { insertEventSchema } from "../shared/schema.js";
import { EventService } from "../services/EventService.js";

export class EventController {
  static getFallbackUser() {
    return { id: 'admin1', role: 'admin_staff' };
  }

  static async list(req: Request, res: Response) {
    try {
      const currentUser = (req && req.user) ? req.user : EventController.getFallbackUser();
      const items = await EventService.getEvents(currentUser.id, currentUser.role, undefined, (currentUser as any).regionId, (currentUser as any).branchId);
      res.json(items);
    } catch (e) {
      console.error('Get events error:', e);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const currentUser = (req && req.user) ? req.user : EventController.getFallbackUser();
      const item = await EventService.getEvent(id, currentUser.id, currentUser.role, (currentUser as any).regionId, (currentUser as any).branchId);
      if (!item) return res.status(404).json({ message: "Event not found" });
      res.json(item);
    } catch (e) {
      console.error('Get event error:', e);
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

      const currentUser = (req && req.user) ? req.user : EventController.getFallbackUser();
      const role = String((currentUser as any)?.role || '').toLowerCase();
      const userRegionId = (currentUser as any)?.regionId;
      const userBranchId = (currentUser as any)?.branchId;

      const payload = { ...raw } as any;
      if (role === 'regional_manager' && userRegionId) payload.regionId = userRegionId;
      if (role === 'branch_manager') {
        if (userRegionId) payload.regionId = userRegionId;
        if (userBranchId) payload.branchId = userBranchId;
      }

      const created = await EventService.createEvent(payload);
      res.status(201).json(created);
    } catch (e) {
      console.error('Event create error:', e);
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: e.errors });
      }
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
      console.error('Event delete error:', e);
      res.status(500).json({ message: "Failed to delete event" });
    }
  }
}
