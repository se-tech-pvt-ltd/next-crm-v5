import type { Request, Response } from "express";
import { CurrencyModel } from "../models/Currency.js";

export class CurrencyController {
  static async getByCountry(req: Request, res: Response) {
    try {
      const country = String(req.query.country || req.params.country || '').trim();
      if (!country) return res.status(400).json({ message: 'country is required' });
      const row = await CurrencyModel.findByCountry(country);
      if (!row) return res.status(404).json({ message: 'currency not found' });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || 'failed to fetch currency' });
    }
  }
}
