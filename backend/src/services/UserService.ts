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

  static async getSubPartnerUsers(partnerId: string): Promise<User[]> {
    return await UserModel.findSubPartnersByPartnerId(partnerId);
  }

  static async searchUsers(searchQuery: string, roles?: string[], limit?: number): Promise<User[]> {
    return await UserModel.searchUsers(searchQuery, roles, limit);
  }

  static async getCounselors(): Promise<User[]> {
    return await UserModel.findCounselors();
  }

  static async createUser(userData: any): Promise<User> {
    if (!userData.email) throw new Error('email is required');
    if (!userData.roleId) throw new Error('roleId is required');

    const email = String(userData.email).trim().toLowerCase();
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new Error('email already exists');

    let roleId = String(userData.roleId);
    const { UserRoleModel } = await import('../models/UserRole.js');
    const roleById = await UserRoleModel.findById(roleId);
    if (!roleById) {
      const roleByName = await UserRoleModel.findByRoleName(roleId);
      if (roleByName?.id) roleId = String(roleByName.id);
    }

    const data: any = {
      ...userData,
      email,
      roleId,
      departmentId: userData.departmentId || userData.department || null,
      isActive: false,
      isRegistrationEmailSent: false,
      isProfileComplete: false,
    } as any;
    return await UserModel.create(data as any);
  }

  static async createUserWithPassword(userData: any, password: string): Promise<User> {
    if (!userData.email) throw new Error('email is required');
    if (!userData.roleId) throw new Error('roleId is required');

    const email = String(userData.email).trim().toLowerCase();
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new Error('email already exists');

    let roleId = String(userData.roleId);
    const { UserRoleModel } = await import('../models/UserRole.js');
    const roleById = await UserRoleModel.findById(roleId);
    if (!roleById) {
      const roleByName = await UserRoleModel.findByRoleName(roleId);
      if (roleByName?.id) roleId = String(roleByName.id);
    }

    const data: any = {
      ...userData,
      email,
      roleId,
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

  static async updateUserProfileImage(userId: string, profileImageId: string): Promise<User | undefined> {
    return await UserModel.update(userId, { profileImageId } as any);
  }
}
