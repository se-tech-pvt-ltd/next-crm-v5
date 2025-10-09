import { type Event, type InsertEvent } from "../shared/schema.js";
import { db } from "../config/database.js";
import { events, type Event, type InsertEvent } from "../shared/schema.js";
import { EventModel } from "../models/Event.js";
import { eq, desc } from "drizzle-orm";

interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export class EventService {
  static async getEvents(userId?: string, userRole?: string, pagination?: PaginationOptions, regionId?: string, branchId?: string): Promise<Event[]> {
    // Counselors see events they're assigned to
    if (userRole === 'counselor' && userId) {
      return await db.select().from(events).where(eq(events.counsellorId, userId)).orderBy(desc(events.createdAt));
    }

    // Admission officers see events they're assigned to
    if (userRole === 'admission_officer' && userId) {
      return await db.select().from(events).where(eq(events.admissionOfficerId, userId)).orderBy(desc(events.createdAt));
    }

    // Partners see only events tied to their partner id
    if (userRole === 'partner' && userId) {
      return await db.select().from(events).where(eq(events.partner, userId)).orderBy(desc(events.createdAt));
    }

    // Branch managers see events for their branch
    if (userRole === 'branch_manager') {
      if (branchId) {
        return await db.select().from(events).where(eq(events.branchId, branchId)).orderBy(desc(events.createdAt));
      }
      return [];
    }

    // Regional managers see events for their region
    if (userRole === 'regional_manager') {
      if (regionId) {
        return await db.select().from(events).where(eq(events.regionId, regionId)).orderBy(desc(events.createdAt));
      }
      return [];
    }

    // Linked branch users (any role with a branch, except super_admin) see only their branch events
    if (branchId && userRole !== 'super_admin') {
      return await db.select().from(events).where(eq(events.branchId, branchId)).orderBy(desc(events.createdAt));
    }

    // Default: if user has a region, scope by region unless super_admin
    if (regionId && userRole !== 'super_admin') {
      return await db.select().from(events).where(eq(events.regionId, regionId)).orderBy(desc(events.createdAt));
    }

    // Fallback for super_admin or users without region/branch context
    return await EventModel.findAll();
  }

  static async getEvent(id: string, userId?: string, userRole?: string, regionId?: string, branchId?: string): Promise<Event | undefined> {
    const event = await EventModel.findById(id);
    if (!event) return undefined;

    // Check role-based access
    if (userRole === 'counselor' && userId && (event as any).counsellorId !== userId) {
      return undefined;
    }
    if (userRole === 'admission_officer' && userId && (event as any).admissionOfficerId !== userId) {
      return undefined;
    }

    // Partner scoping
    if (userRole === 'partner' && userId && (event as any).partner !== userId) {
      return undefined;
    }

    // Branch manager scoping
    if (userRole === 'branch_manager') {
      if (!branchId) return undefined;
      if ((event as any).branchId !== branchId) return undefined;
    }

    // Linked branch users (any role with a branch, except special roles/super_admin)
    if (
      branchId &&
      userRole !== 'super_admin' &&
      userRole !== 'branch_manager' &&
      userRole !== 'counselor' &&
      userRole !== 'admission_officer'
    ) {
      if ((event as any).branchId !== branchId) return undefined;
    }

    // Region scoping for any role that has a region (except super_admin and branch_manager)
    if (regionId && userRole !== 'super_admin' && userRole !== 'branch_manager') {
      if ((event as any).regionId !== regionId) return undefined;
    }

    return event;
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
