import * as bcrypt from "bcryptjs";
import { UserModel } from "../models/User.js";
import { type User, type InsertUser } from "../shared/schema.js";

export class AuthService {
  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await UserModel.findByEmail(email);
    
    if (!user || !user.passwordHash) {
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  static async createUserWithPassword(userData: InsertUser, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user = await UserModel.create({
      ...userData,
      passwordHash,
    });

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  static async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const updated = await UserModel.update(userId, { passwordHash });
    return !!updated;
  }
}
