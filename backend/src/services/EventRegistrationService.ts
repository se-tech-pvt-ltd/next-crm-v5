import { type EventRegistration, type InsertEventRegistration, type InsertLead, leads } from "../shared/schema.js";
import { EventRegistrationModel } from "../models/EventRegistration.js";
import { LeadService } from "./LeadService.js";

export class EventRegistrationService {
  static async getRegistrations(): Promise<EventRegistration[]> {
    return await EventRegistrationModel.findAll();
  }

  static async getRegistrationsByEvent(eventId: string): Promise<EventRegistration[]> {
    return await EventRegistrationModel.findByEvent(eventId);
  }

  static async getRegistration(id: string): Promise<EventRegistration | undefined> {
    return await EventRegistrationModel.findById(id);
  }

  static async createRegistration(data: InsertEventRegistration): Promise<EventRegistration> {
    return await EventRegistrationModel.create(data);
  }

  static async updateRegistration(id: string, data: Partial<InsertEventRegistration>): Promise<EventRegistration | undefined> {
    return await EventRegistrationModel.update(id, data);
  }

  static async deleteRegistration(id: string): Promise<boolean> {
    return await EventRegistrationModel.delete(id);
  }

  static async convertToLead(id: string) {
    const reg = await EventRegistrationModel.findById(id);
    if (!reg) return undefined;

    const payload: InsertLead = {
      name: reg.name,
      email: reg.email || "",
      phone: reg.number || "",
      city: reg.city || "",
      source: reg.source || "",
      status: "new",
    } as any;

    const lead = await LeadService.createLead(payload);
    return lead;
  }
}
