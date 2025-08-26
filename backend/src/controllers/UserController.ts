import type { Request, Response } from "express";
import { UserService } from "../services/UserService.js";

export class UserController {
  private static getCurrentUser() {
    return {
      id: 'admin1',
      role: 'admin_staff'
    };
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const updates = req.body;
      
      const updatedUser = await UserService.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  }

  static async updateProfileImage(req: Request, res: Response) {
    try {
      const currentUser = UserController.getCurrentUser();
      const { profileImageUrl } = req.body;
      
      const updatedUser = await UserService.updateUserProfileImage(currentUser.id, profileImageUrl);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Update profile image error:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  }
}
