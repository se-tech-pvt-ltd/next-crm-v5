import type { Request, Response } from "express";
import { UserService } from "../services/UserService.js";

export class UserController {
  private static getCurrentUser() {
    return {
      id: 'admin1',
      role: 'admin_staff'
    };
  }

  static async createUser(req: Request, res: Response) {
    try {
      const { email, firstName, lastName, role, branchId, department } = req.body || {};
      if (!email || !role) {
        return res.status(400).json({ message: 'email and role are required' });
      }
      const id = (await import('uuid')).v4();
      const created = await UserService.createUser({ id, email, firstName, lastName, role, branchId, department } as any);
      res.status(201).json(created);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  }

  static async inviteUser(req: Request, res: Response) {
    try {
      const { email, firstName, lastName, role, branchId, department } = req.body || {};
      if (!email || !role) {
        return res.status(400).json({ message: 'email and role are required' });
      }
      const id = (await import('uuid')).v4();
      const created = await UserService.createUser({ id, email, firstName, lastName, role, branchId, department } as any);
      res.status(201).json({ ...created, invited: true });
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({ message: 'Failed to invite user' });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const { search, role, limit } = req.query;

      let users;

      if (search && typeof search === 'string' && search.trim()) {
        // Parse roles if provided
        const roles = role ?
          (typeof role === 'string' ? role.split(',') : Array.isArray(role) ? role : [])
          : undefined;

        // Parse limit if provided
        const limitNum = limit && typeof limit === 'string' ? parseInt(limit) : undefined;

        users = await UserService.searchUsers(search.trim(), roles, limitNum);
      } else {
        // If no search query, return filtered by roles or all users
        users = await UserService.getAllUsers();

        // Filter by roles if provided but no search
        if (role && typeof role === 'string') {
          const roles = role.split(',');
          users = users.filter(user => roles.includes(user.role));
        }

        // Apply limit if provided
        if (limit && typeof limit === 'string') {
          const limitNum = parseInt(limit);
          if (!isNaN(limitNum)) {
            users = users.slice(0, limitNum);
          }
        }
      }

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
