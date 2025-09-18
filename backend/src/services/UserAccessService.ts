import { UserAccessModel } from "../models/UserAccess.js";
import { type UserAccess, type InsertUserAccess } from "../shared/schema.js";

export class UserAccessService {
  static async listAccess(): Promise<UserAccess[]> {
    return await UserAccessModel.findAll();
  }

  static async getAccess(id: string): Promise<UserAccess | undefined> {
    return await UserAccessModel.findById(id);
  }

  static async createAccess(data: InsertUserAccess): Promise<UserAccess> {
    return await UserAccessModel.create(data);
  }

  static async updateAccess(id: string, data: Partial<InsertUserAccess>): Promise<UserAccess | null> {
    return await UserAccessModel.update(id, data);
  }

  static async deleteAccess(id: string): Promise<boolean> {
    return await UserAccessModel.delete(id);
  }
}
