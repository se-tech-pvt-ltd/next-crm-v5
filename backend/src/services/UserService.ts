import { UserModel } from "../models/User.js";
import { type User, type InsertUser } from "../shared/schema.js";

export class UserService {
  static async getUser(id: string): Promise<User | undefined> {
    return await UserModel.findById(id);
  }

  static async getUserByEmail(email: string): Promise<User | undefined> {
    return await UserModel.findByEmail(email);
  }

  static async getAllUsers(): Promise<User[]> {
    return await UserModel.findAll();
  }

  static async searchUsers(searchQuery: string, roles?: string[], limit?: number): Promise<User[]> {
    return await UserModel.searchUsers(searchQuery, roles, limit);
  }

  static async getCounselors(): Promise<User[]> {
    return await UserModel.findCounselors();
  }

  static async createUser(userData: InsertUser): Promise<User> {
    if (!userData.email) throw new Error('email is required');
    if (!userData.branchId) throw new Error('branchId is required');
    if (userData.branchId) {
      const existing = await UserModel.findByBranchId(userData.branchId);
      if (existing) {
        throw new Error('branch already assigned to another user');
      }
    }
    return await UserModel.create(userData);
  }

  static async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    if (updates.branchId) {
      const existing = await UserModel.findByBranchId(updates.branchId);
      if (existing && existing.id !== id) {
        throw new Error('branch already assigned to another user');
      }
    }
    return await UserModel.update(id, updates);
  }

  static async upsertUser(userData: InsertUser): Promise<User> {
    return await UserModel.upsert(userData);
  }

  static async deleteUser(id: string): Promise<boolean> {
    return await UserModel.delete(id);
  }

  static async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined> {
    return await UserModel.update(userId, { profileImageUrl });
  }
}
