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

  // SMTP: send test email using saved configuration or provided override
  static async testSmtp(req: Request, res: Response) {
    try {
      const { toEmail, config } = (req.body || {}) as { toEmail?: string; config?: any };
      const email = (toEmail || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Valid toEmail is required' });
      }

      const cfg = config && typeof config === 'object' ? config : await ConfigurationService.getConfig('smtp');
      if (!cfg || !cfg.host || !cfg.port || !cfg.user || !cfg.pass || !cfg.fromEmail) {
        return res.status(400).json({ message: 'Incomplete SMTP configuration. Please provide host, port, user, pass, and fromEmail.' });
      }

      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: Number(cfg.port),
        secure: !!cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
      });

      // Verify the transporter connectivity first (optional but helpful)
      try {
        await transporter.verify();
      } catch (verifyErr: any) {
        return res.status(400).json({ message: `SMTP verification failed: ${verifyErr?.message || 'Unknown error'}` });
      }

      const info = await transporter.sendMail({
        from: cfg.fromEmail,
        to: email,
        subject: 'Test email from Education Management System',
        text: 'This is a test email to verify your SMTP configuration is working.',
      });

      // Log detailed info for debugging
      try {
        console.log('[SMTP TEST] sendMail info:', JSON.stringify({
          messageId: info?.messageId,
          envelope: (info as any)?.envelope,
          accepted: (info as any)?.accepted,
          rejected: (info as any)?.rejected,
          pending: (info as any)?.pending,
          response: (info as any)?.response,
        }));
      } catch {}

      res.json({
        success: true,
        messageId: info?.messageId || '',
        envelope: (info as any)?.envelope ?? null,
        accepted: (info as any)?.accepted ?? null,
        rejected: (info as any)?.rejected ?? null,
        pending: (info as any)?.pending ?? null,
        response: (info as any)?.response ?? null,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || 'Failed to send test email' });
    }
  }
}
