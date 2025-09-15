import type { Request, Response } from "express";
import { ConfigurationService } from "../services/ConfigurationService.js";
import { v4 as uuidv4 } from 'uuid';

function currentUserId(): string {
  try {
    // In a real app, use req.user from auth middleware
    return 'system';
  } catch {
    return 'system';
  }
}

export class ConfigurationController {
  static async getByName(req: Request, res: Response) {
    try {
      const { name } = req.params as { name: string };
      const data = await ConfigurationService.getConfig(name);
      res.json({ name, data });
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch configuration' });
    }
  }

  static async setByName(req: Request, res: Response) {
    try {
      const { name } = req.params as { name: string };
      const { data } = req.body as { data: any };
      const userId = currentUserId();
      const saved = await ConfigurationService.setConfig(name, data, userId);
      res.json({ name: saved.name, data: saved.data });
    } catch (e) {
      res.status(500).json({ message: 'Failed to save configuration' });
    }
  }

  // Branch helpers built on top of configurations(name='branches')
  static async listBranches(req: Request, res: Response) {
    try {
      const cfg = (await ConfigurationService.getConfig('branches')) || {};
      const items = Array.isArray(cfg.items) ? cfg.items : [];
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: 'Failed to list branches' });
    }
  }

  static async createBranch(req: Request, res: Response) {
    try {
      const { name, code, city, address, managerId, status } = req.body || {};
      if (!name || !code) {
        return res.status(400).json({ message: 'name and code are required' });
      }
      const cfg = (await ConfigurationService.getConfig('branches')) || {};
      const items = Array.isArray(cfg.items) ? cfg.items : [];
      const branch = { id: uuidv4(), name, code, city: city || '', address: address || '', managerId: managerId || '', status: status || 'active' };
      const next = { ...cfg, items: [...items, branch] };
      const userId = currentUserId();
      await ConfigurationService.setConfig('branches', next, userId);
      res.json(branch);
    } catch (e) {
      res.status(500).json({ message: 'Failed to create branch' });
    }
  }
}
