import { z } from "zod";
import { insertEventRegistrationSchema } from "../shared/schema.js";
import { EventRegistrationService } from "../services/EventRegistrationService.js";

export class EventRegistrationController {
  static async list(req: Request, res: Response) {
    try {
      const items = await EventRegistrationService.getRegistrations();
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  }
  static async listByEvent(req: Request, res: Response) {
    try {
      const items = await EventRegistrationService.getRegistrationsByEvent(req.params.eventId);
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  }
  static async get(req: Request, res: Response) {
    try {
      const item = await EventRegistrationService.getRegistration(req.params.id);
      if (!item) return res.status(404).json({ message: "Registration not found" });
      res.json(item);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch registration" });
    }
  }
  static async create(req: Request, res: Response) {
    try {
      const data = insertEventRegistrationSchema.parse(req.body);
      const created = await EventRegistrationService.createRegistration(data);
      res.status(201).json(created);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid registration data", errors: e.errors });
      if (e instanceof Error) {
        if (e.message === 'DUPLICATE') {
          const f = (e as any).fields || {};
          const emailDup = !!f.email;
          const numberDup = !!f.number;
          const msg = emailDup && numberDup
            ? 'Duplicate email and number for this event'
            : emailDup
              ? 'Duplicate email for this event'
              : numberDup
                ? 'Duplicate number for this event'
                : 'Duplicate for this event';
          return res.status(409).json({ message: msg, fields: { email: emailDup, number: numberDup } });
        }
        if (e.message === 'DUPLICATE_EMAIL' || e.message === 'DUPLICATE_NUMBER') {
          const field = e.message === 'DUPLICATE_EMAIL' ? 'email' : 'number';
          return res.status(409).json({ message: `Duplicate ${field} for this event`, fields: { email: e.message === 'DUPLICATE_EMAIL', number: e.message === 'DUPLICATE_NUMBER' } });
        }
      }
      res.status(500).json({ message: "Failed to create registration" });
    }
  }
  static async update(req: Request, res: Response) {
    try {
      const data = insertEventRegistrationSchema.partial().parse(req.body);
      const updated = await EventRegistrationService.updateRegistration(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Registration not found" });
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid registration data", errors: e.errors });
      res.status(500).json({ message: "Failed to update registration" });
    }
  }
  static async remove(req: Request, res: Response) {
    try {
      const ok = await EventRegistrationService.deleteRegistration(req.params.id);
      if (!ok) return res.status(404).json({ message: "Registration not found" });
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete registration" });
    }
  }
  static async convertToLead(req: Request, res: Response) {
    try {
      const lead = await EventRegistrationService.convertToLead(req.params.id);
      if (!lead) return res.status(404).json({ message: "Registration not found" });
      res.json(lead);
    } catch (e) {
      if (e instanceof Error && (e as any).code === 'ALREADY_CONVERTED') {
        return res.status(400).json({ message: 'Registration has already been converted to a lead' });
      }
      res.status(500).json({ message: "Failed to convert to lead" });
    }
  }
}
