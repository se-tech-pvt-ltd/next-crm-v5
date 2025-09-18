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
    await db.insert(dropdowns).values(dropdownData);
    const [dropdown] = await db.select().from(dropdowns).where(eq(dropdowns.id, dropdownData.id));
    if (!dropdown) throw new Error("Failed to create dropdown - record not found after insert");
    return dropdown;
  }

  static async findAll(): Promise<Dropdown[]> {
    return await db.select().from(dropdowns);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(dropdowns).where(eq(dropdowns.id, id));
    const affected = (result as any)?.affectedRows ?? (result as any)?.rowCount ?? 0;
    return affected > 0;
  }
}
