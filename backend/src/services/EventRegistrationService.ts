import { type EventRegistration, type InsertEventRegistration, type InsertLead, leads } from "../shared/schema.js";
import { EventRegistrationModel } from "../models/EventRegistration.js";
import { LeadService } from "./LeadService.js";
import { EventService } from "./EventService.js";
import { type EventRegistration, type InsertEventRegistration, type InsertLead } from "../shared/schema.js";

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
    const dupEmail = await EventRegistrationModel.existsByEventEmail(data.eventId, data.email);
    const dupNumber = await EventRegistrationModel.existsByEventNumber(data.eventId, data.number);
    if (dupEmail || dupNumber) {
      const err = new Error('DUPLICATE');
      (err as any).fields = { email: dupEmail, number: dupNumber };
      throw err;
    }
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

    // disallow if already converted
    if ((reg as any).isConverted === 1 || (reg as any).isConverted === '1') {
      const err = new Error('ALREADY_CONVERTED');
      // @ts-expect-error attach code
      (err as any).code = 'ALREADY_CONVERTED';
      throw err;
    }

    const payload: InsertLead = {
      name: reg.name,
      email: reg.email || "",
      phone: reg.number || "",
      city: reg.city || "",
      source: reg.source || "",
      status: "new",
      eventRegId: reg.id,
    } as any;

    const lead = await LeadService.createLead(payload);

    // mark registration as converted
    try {
      await EventRegistrationModel.update(id, ( { isConverted: 1 } ) as any);
    } catch (e) {
      // log and continue
      console.warn('[EventRegistrationService.convertToLead] Failed to mark registration converted', e);
    }

    return lead;
  }
}
