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
      const { email, firstName, lastName, roleId, role, branchId, department, profileImageId, regionId } = req.body || {};
      if (!email || !roleId) {
        return res.status(400).json({ message: 'email and roleId are required' });
      }
      const id = (await import('uuid')).v4();
      const password = generateNumericPassword(10);
      const created = await UserService.createUserWithPassword({ id, email, firstName, lastName, roleId, branchId, department, profileImageId } as any, password);

      try {
        // If regional manager is set, update the region head mapping
        const { connection } = await import('../config/database.js');
        const { UserRoleModel } = await import('../models/UserRole.js');
        let resolvedRoleName: string | undefined;
        if (roleId) {
          const roleRow: any = await UserRoleModel.findById(String(roleId));
          resolvedRoleName = String(roleRow?.roleName || roleRow?.role_name || '').toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
        } else if (role) {
          resolvedRoleName = String(role).toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
        }
        if (resolvedRoleName === 'regional_manager' && regionId) {
          await connection.query('UPDATE regions SET region_head_id = ? WHERE id = ?', [id, String(regionId)]);
        }
        if (resolvedRoleName === 'branch_manager' && branchId) {
          await connection.query('UPDATE branches SET branch_head_id = ? WHERE id = ?', [id, String(branchId)]);
        }
        // For counselor or admission_officer, create branch_emps mapping
        if ((resolvedRoleName === 'counsellor' || resolvedRoleName === 'admission_officer') && branchId) {
          const beId = (await import('uuid')).v4();
          const [existing] = await connection.query<any[]>('SELECT id FROM branch_emps WHERE user_id = ? AND branch_id = ? LIMIT 1', [id, String(branchId)]);
          const exists = Array.isArray(existing) && existing.length > 0;
          if (!exists) {
            await connection.query('INSERT INTO branch_emps (id, branch_id, user_id) VALUES (?, ?, ?)', [beId, String(branchId), id]);
          }
        }
      } catch (sideErr) {
        console.error('Post-create side effects error:', sideErr);
      }

      // Send invite/notification email using template "new registration"
      try {
        console.log("Sending email")
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
        try {
          await UserService.updateUser(String(created.id), { isRegistrationEmailSent: true } as any);
          (created as any).isRegistrationEmailSent = true;
        } catch (flagErr) {
          console.error('Failed to set is_registration_email_sent flag:', flagErr);
        }
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
      const { email, firstName, lastName, roleId, role, branchId, department, profileImageId, regionId } = req.body || {};
      if (!email || !roleId) {
        return res.status(400).json({ message: 'email and roleId are required' });
      }
      const id = (await import('uuid')).v4();
      const created = await UserService.createUser({ id, email, firstName, lastName, roleId, branchId, department, profileImageId } as any);

      try {
        const { connection } = await import('../config/database.js');
        const { UserRoleModel } = await import('../models/UserRole.js');
        let resolvedRoleName: string | undefined;
        if (roleId) {
          const roleRow: any = await UserRoleModel.findById(String(roleId));
          resolvedRoleName = String(roleRow?.roleName || roleRow?.role_name || '').toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
        } else if (role) {
          resolvedRoleName = String(role).toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
        }
        if (resolvedRoleName === 'regional_manager' && regionId) {
          await connection.query('UPDATE regions SET region_head_id = ? WHERE id = ?', [id, String(regionId)]);
        }
        if (resolvedRoleName === 'branch_manager' && branchId) {
          await connection.query('UPDATE branches SET branch_head_id = ? WHERE id = ?', [id, String(branchId)]);
        }
        // For counselor or admission_officer, create branch_emps mapping
        if ((resolvedRoleName === 'counselor' || resolvedRoleName === 'admission_officer') && branchId) {
          const beId = (await import('uuid')).v4();
          const [existing] = await connection.query<any[]>('SELECT id FROM branch_emps WHERE user_id = ? AND branch_id = ? LIMIT 1', [id, String(branchId)]);
          const exists = Array.isArray(existing) && existing.length > 0;
          if (!exists) {
            await connection.query('INSERT INTO branch_emps (id, branch_id, user_id) VALUES (?, ?, ?)', [beId, String(branchId), id]);
          }
        }
      } catch (sideErr) {
        console.error('Post-invite side effects error:', sideErr);
      }

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
      const updates = { ...req.body } as any;
      if ('role' in updates) delete updates.role;
      if (typeof updates.email === 'string') {
        updates.email = String(updates.email).trim().toLowerCase();
      }

      const updatedUser = await UserService.updateUser(userId, updates);

      try {
        const { connection } = await import('../config/database.js');
        const { UserRoleModel } = await import('../models/UserRole.js');
        const roleId = updates.roleId || updates.role;
        let resolvedRoleName: string | undefined;
        if (roleId) {
          const roleRow: any = await UserRoleModel.findById(String(roleId));
          resolvedRoleName = String(roleRow?.roleName || roleRow?.role_name || '').toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
        } else if (typeof updates.role === 'string') {
          resolvedRoleName = String(updates.role).toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
        }
        if (resolvedRoleName === 'regional_manager' && updates.regionId) {
          await connection.query('UPDATE regions SET region_head_id = ? WHERE id = ?', [userId, String(updates.regionId)]);
        }
        if (resolvedRoleName === 'branch_manager' && updates.branchId) {
          await connection.query('UPDATE branches SET branch_head_id = ? WHERE id = ?', [userId, String(updates.branchId)]);
        }
        // For counselor or admission_officer, create branch_emps mapping when branch provided
        if ((resolvedRoleName === 'counselor' || resolvedRoleName === 'admission_officer') && updates.branchId) {
          const beId = (await import('uuid')).v4();
          const [existing] = await connection.query<any[]>('SELECT id FROM branch_emps WHERE user_id = ? AND branch_id = ? LIMIT 1', [userId, String(updates.branchId)]);
          const exists = Array.isArray(existing) && existing.length > 0;
          if (!exists) {
            await connection.query('INSERT INTO branch_emps (id, branch_id, user_id) VALUES (?, ?, ?)', [beId, String(updates.branchId), userId]);
          }
        }
      } catch (sideErr) {
        console.error('Post-update side effects error:', sideErr);
      }

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Update user error:", error);
      const msg = String(error?.message || 'Failed to update user');
      const low = msg.toLowerCase();
      const status = (msg.includes('already assigned') || low.includes('already exists') || low.includes('duplicate entry')) ? 409 : (msg.includes('required') ? 400 : 500);
      res.status(status).json({ message: msg });
    }
  }

  static async updateProfileImage(req: Request, res: Response) {
    try {
      const currentUser = UserController.getCurrentUser();
      const { profileImageId } = req.body;
      
      const updatedUser = await UserService.updateUserProfileImage(currentUser.id, profileImageId);
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
