import type { Request, Response } from "express";
import { z } from "zod";
import { DropdownService } from "../services/DropdownService.js";
import { insertDropdownSchema } from "../shared/schema.js";

export class DropdownController {
  static async getDropdownsByModule(req: Request, res: Response) {
    try {
      const { moduleName } = req.params;
      
      if (!moduleName) {
        return res.status(400).json({ message: "Module name is required" });
      }

      const dropdowns = await DropdownService.getDropdownsGroupedByField(moduleName);
      res.json(dropdowns);
    } catch (error) {
      console.error("Get dropdowns by module error:", error);
      res.status(500).json({ message: "Failed to fetch dropdowns" });
    }
  }

  static async getDropdownsByModuleAndField(req: Request, res: Response) {
    try {
      const { moduleName, fieldName } = req.params;
      
      if (!moduleName || !fieldName) {
        return res.status(400).json({ message: "Module name and field name are required" });
      }

      const dropdowns = await DropdownService.getDropdownsByModuleAndField(moduleName, fieldName);
      res.json(dropdowns);
    } catch (error) {
      console.error("Get dropdowns by module and field error:", error);
      res.status(500).json({ message: "Failed to fetch dropdowns" });
    }
  }

  static async getAllDropdowns(req: Request, res: Response) {
    try {
      const dropdowns = await DropdownService.getAllDropdowns();
      res.json(dropdowns);
    } catch (error) {
      console.error("Get all dropdowns error:", error);
      res.status(500).json({ message: "Failed to fetch dropdowns" });
    }
  }

  static async createDropdown(req: Request, res: Response) {
    try {
      const dropdownData = insertDropdownSchema.parse(req.body);
      const dropdown = await DropdownService.createDropdown(dropdownData);
      res.json(dropdown);
    } catch (error) {
      console.error("Create dropdown error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid dropdown data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create dropdown" });
    }
  }

  static async deleteDropdown(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Dropdown ID is required" });
      }

      const success = await DropdownService.deleteDropdown(id);
      
      if (success) {
        res.json({ message: "Dropdown deleted successfully" });
      } else {
        res.status(404).json({ message: "Dropdown not found" });
      }
    } catch (error) {
      console.error("Delete dropdown error:", error);
      res.status(500).json({ message: "Failed to delete dropdown" });
    }
  }
}
