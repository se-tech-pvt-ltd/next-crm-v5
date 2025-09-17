import type { Request, Response } from "express";
import { UserService } from "../services/UserService.js";
import { EmailService } from "../services/EmailService.js";
import { generateNumericPassword } from "../utils/helpers.js";

export class UserController {
  private static getCurrentUser() {
    return {
      id: 'admin1',
      role: 'admin_staff'
    };
  }

  static async createUser(req: Request, res: Response) {
    try {
      const { email, firstName, lastName, role, branchId, department, profileImageUrl } = req.body || {};
      if (!email || !role) {
        return res.status(400).json({ message: 'email and role are required' });
      }
      const id = (await import('uuid')).v4();
      const password = generateNumericPassword(10);
      const created = await UserService.createUserWithPassword({ id, email, firstName, lastName, role, branchId, department, profileImageUrl } as any, password);

      // Send invite/notification email using template "new registration"
      try {
        await EmailService.sendTemplatedEmail({
          to: email,
          templateName: 'new registration',
          subject: 'Your account has been created',
          variables: {
            first_name: String(firstName || ''),
            last_name: String(lastName || ''),
            email: String(email),
            password: String(password),
          },
        });
      } catch (mailErr: any) {
        console.error('Email send error:', mailErr?.message || mailErr);
      }

      res.status(201).json(created);
    } catch (error: any) {
      console.error('Create user error:', error);
      const msg = String(error?.message || 'Failed to create user');
      const status = (msg.includes('already assigned') || msg.includes('already exists') || msg.toLowerCase().includes('duplicate entry')) ? 409 : (msg.includes('required') ? 400 : 500);
      res.status(status).json({ message: msg });
    }
  }

  static async inviteUser(req: Request, res: Response) {
    try {
      const { email, firstName, lastName, role, branchId, department, profileImageUrl } = req.body || {};
      if (!email || !role) {
        return res.status(400).json({ message: 'email and role are required' });
      }
      const id = (await import('uuid')).v4();
      const created = await UserService.createUser({ id, email, firstName, lastName, role, branchId, department, profileImageUrl } as any);
      res.status(201).json({ ...created, invited: true });
    } catch (error: any) {
      console.error('Invite user error:', error);
      const msg = String(error?.message || 'Failed to invite user');
      const status = (msg.includes('already assigned') || msg.includes('already exists') || msg.toLowerCase().includes('duplicate entry')) ? 409 : (msg.includes('required') ? 400 : 500);
      res.status(status).json({ message: msg });
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
    } catch (error: any) {
      console.error("Update user error:", error);
      const msg = String(error?.message || 'Failed to update user');
      const status = msg.includes('already assigned') ? 409 : (msg.includes('required') ? 400 : 500);
      res.status(status).json({ message: msg });
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
