import { eq, and } from "drizzle-orm";
import { db } from "../config/database.js";
import { dropdowns, type Dropdown, type InsertDropdown } from "../shared/schema.js";

export class DropdownModel {
  static async findByModuleAndField(moduleName: string, fieldName: string): Promise<Dropdown[]> {
    return await db
      .select()
      .from(dropdowns)
      .where(and(
        eq(dropdowns.moduleName, moduleName),
        eq(dropdowns.fieldName, fieldName)
      ));
  }

  static async findByModule(moduleName: string): Promise<Dropdown[]> {
    return await db
      .select()
      .from(dropdowns)
      .where(eq(dropdowns.moduleName, moduleName));
  }

  static async create(dropdownData: InsertDropdown): Promise<Dropdown> {
    const [dropdown] = await db.insert(dropdowns).values(dropdownData).returning();
    return dropdown;
  }

  static async findAll(): Promise<Dropdown[]> {
    return await db.select().from(dropdowns);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(dropdowns).where(eq(dropdowns.id, id));
    return (result.rowCount || 0) > 0;
  }
}
