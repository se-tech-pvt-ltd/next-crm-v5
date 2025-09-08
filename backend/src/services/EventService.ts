import { type Event, type InsertEvent } from "../shared/schema.js";
import { EventModel } from "../models/Event.js";

export class EventService {
  static async getEvents(): Promise<Event[]> {
    return await EventModel.findAll();
  }

  static async getEvent(id: string): Promise<Event | undefined> {
    return await EventModel.findById(id);
  }

  static async createEvent(data: InsertEvent): Promise<Event> {
    return await EventModel.create(data);
  }

  static async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    return await EventModel.update(id, data);
  }

  static async deleteEvent(id: string): Promise<boolean> {
    return await EventModel.delete(id);
  }
}
