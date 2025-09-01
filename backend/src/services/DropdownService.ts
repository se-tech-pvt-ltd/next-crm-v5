import { DropdownModel } from "../models/Dropdown.js";
import { type Dropdown, type InsertDropdown } from "../shared/schema.js";

export class DropdownService {
  static async getDropdownsByModuleAndField(moduleName: string, fieldName: string): Promise<Dropdown[]> {
    const rows = await DropdownModel.findByModuleAndField(moduleName, fieldName);
    return rows.map((d: any) => ({ ...d, key: d.id }));
  }

  static async getDropdownsByModule(moduleName: string): Promise<Dropdown[]> {
    const rows = await DropdownModel.findByModule(moduleName);
    return rows.map((d: any) => ({ ...d, key: d.id }));
  }

  static async getAllDropdowns(): Promise<Dropdown[]> {
    const rows = await DropdownModel.findAll();
    return rows.map((d: any) => ({ ...d, key: d.id }));
  }

  static async createDropdown(dropdownData: InsertDropdown): Promise<Dropdown> {
    return await DropdownModel.create(dropdownData);
  }

  static async deleteDropdown(id: string): Promise<boolean> {
    return await DropdownModel.delete(id);
  }

  // Helper method to get dropdowns organized by field for a specific module
  static async getDropdownsGroupedByField(moduleName: string): Promise<Record<string, Dropdown[]>> {
    const rows = await DropdownModel.findByModule(moduleName);
    const mapped = rows.map((d: any) => ({ ...d, key: d.id }));

    return mapped.reduce((acc: Record<string, Dropdown[]>, dropdown: any) => {
      if (!acc[dropdown.fieldName]) {
        acc[dropdown.fieldName] = [] as any;
      }
      (acc[dropdown.fieldName] as any).push(dropdown);
      return acc;
    }, {} as Record<string, Dropdown[]>);
  }
}
