import { UserModel } from "../models/User.js";
import { type User, type InsertUser } from "../shared/schema.js";
import { AuthService } from "./AuthService.js";

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

  static async createUser(userData: any): Promise<User> {
    if (!userData.email) throw new Error('email is required');
    // role is required in new schema
    if (!userData.role && !userData.roleId) throw new Error('role is required');

    const email = String(userData.email).trim().toLowerCase();
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new Error('email already exists');

    const data: any = {
      ...userData,
      email,
      roleId: userData.roleId || userData.role,
      departmentId: userData.departmentId || userData.department || null,
      isActive: false,
      isRegistrationEmailSent: false,
      isProfileComplete: false,
    } as any;
    return await UserModel.create(data as any);
  }

  static async createUserWithPassword(userData: any, password: string): Promise<User> {
    if (!userData.email) throw new Error('email is required');
    if (!userData.role && !userData.roleId) throw new Error('role is required');

    const email = String(userData.email).trim().toLowerCase();
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new Error('email already exists');

    const data: any = {
      ...userData,
      email,
      roleId: userData.roleId || userData.role,
      departmentId: userData.departmentId || userData.department || null,
      isActive: false,
      isRegistrationEmailSent: false,
      isProfileComplete: false,
    } as any;
    const user = await AuthService.createUserWithPassword(data as any, password);
    return user;
  }

  static async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
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
