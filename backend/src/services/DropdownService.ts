import { DropdownModel } from "../models/Dropdown.js";
import { type Dropdown, type InsertDropdown } from "../shared/schema.js";

export class DropdownService {
  static async getDropdownsByModuleAndField(moduleName: string, fieldName: string): Promise<Dropdown[]> {
    return await DropdownModel.findByModuleAndField(moduleName, fieldName);
  }

  static async getDropdownsByModule(moduleName: string): Promise<Dropdown[]> {
    return await DropdownModel.findByModule(moduleName);
  }

  static async getAllDropdowns(): Promise<Dropdown[]> {
    return await DropdownModel.findAll();
  }

  static async createDropdown(dropdownData: InsertDropdown): Promise<Dropdown> {
    return await DropdownModel.create(dropdownData);
  }

  static async deleteDropdown(id: number): Promise<boolean> {
    return await DropdownModel.delete(id);
  }

  // Helper method to get dropdowns organized by field for a specific module
  static async getDropdownsGroupedByField(moduleName: string): Promise<Record<string, Dropdown[]>> {
    const dropdowns = await DropdownModel.findByModule(moduleName);
    
    return dropdowns.reduce((acc, dropdown) => {
      if (!acc[dropdown.fieldName]) {
        acc[dropdown.fieldName] = [];
      }
      acc[dropdown.fieldName].push(dropdown);
      return acc;
    }, {} as Record<string, Dropdown[]>);
  }
}
