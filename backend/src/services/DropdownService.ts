import { DropdownModel } from "../models/Dropdown.js";
import { type Dropdown, type InsertDropdown } from "../shared/schema.js";

export class DropdownService {
  static async getDropdownsByModuleAndField(moduleName: string, fieldName: string): Promise<Dropdown[]> {
    const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const singularize = (s: string) => s.replace(/s$/, '');
    const targetModule = singularize(normalize(moduleName));
    const targetFieldNorm = normalize(fieldName);
    const fieldCandidates = [targetFieldNorm];
    if (targetFieldNorm === 'englishproficiency') fieldCandidates.push('elttest', 'elt', 'englishtest', 'english');

    const all = await DropdownModel.findAll();
    const filtered = (all || []).filter((d: any) => {
      const m = singularize(normalize(d.moduleName));
      if (m !== targetModule) return false;
      const f = normalize(d.fieldName);
      return fieldCandidates.includes(f);
    });

    const mapped = filtered.map((d: any) => ({ ...d, key: d.id }));
    mapped.sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));
    return mapped;
  }

  static async getDropdownsByModule(moduleName: string): Promise<Dropdown[]> {
    const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const singularize = (s: string) => s.replace(/s$/, '');
    const targetModule = singularize(normalize(moduleName));
    const all = await DropdownModel.findAll();
    const filtered = (all || []).filter((d: any) => singularize(normalize(d.moduleName)) === targetModule);
    const mapped = filtered.map((d: any) => ({ ...d, key: d.id }));
    mapped.sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));
    return mapped;
  }

  static async getAllDropdowns(): Promise<Dropdown[]> {
    const rows = await DropdownModel.findAll();
    const mapped = rows.map((d: any) => ({ ...d, key: d.id }));
    mapped.sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));
    return mapped;
  }

  static async createDropdown(dropdownData: InsertDropdown): Promise<Dropdown> {
    return await DropdownModel.create(dropdownData);
  }

  static async deleteDropdown(id: string): Promise<boolean> {
    return await DropdownModel.delete(id);
  }

  // Helper method to get dropdowns organized by field for a specific module
  static async getDropdownsGroupedByField(moduleName: string): Promise<Record<string, Dropdown[]>> {
    const rows = await this.getDropdownsByModule(moduleName);
    const mapped = rows.map((d: any) => ({ ...d, key: d.id }));

    const grouped = mapped.reduce((acc: Record<string, Dropdown[]>, dropdown: any) => {
      const key = dropdown.fieldName;
      if (!acc[key]) acc[key] = [] as any;
      (acc[key] as any).push(dropdown);
      return acc;
    }, {} as Record<string, Dropdown[]>);

    Object.keys(grouped).forEach((field) => {
      (grouped[field] as any).sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));
    });

    return grouped;
  }
}
