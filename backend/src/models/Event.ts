import { db } from "../config/database.js";
import { events, type Event, type InsertEvent } from "../shared/schema.js";
import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";

export class EventModel {
  static async findById(id: string): Promise<Event | undefined> {
    const rows = await db.select().from(events).where(eq(events.id, id));
    const [event] = rows as any[];
    return event as any;
  }

  static async findAll(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  static async create(data: InsertEvent): Promise<Event> {
    const id = randomUUID();
    await db.insert(events).values({ ...data, id });
    const created = await EventModel.findById(id);
    if (!created) throw new Error("Failed to create event");
    return created;
  }

  static async update(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events).set({ ...data, updatedAt: new Date() }).where(eq(events.id, id));
    if ((result as any).rowsAffected === 0) return undefined;
    return await EventModel.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return ((result as any).rowCount || 0) > 0;
  }
}
