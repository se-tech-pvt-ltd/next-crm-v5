import { db } from "../config/database.js";
import { currencies } from "../shared/schema.js";
import { eq } from "drizzle-orm";

export class CurrencyModel {
  static async findByCountry(countryName: string) {
    if (!countryName) return null;
    const [row] = await db.select().from(currencies).where(eq(currencies.countryName, countryName));
    return row || null;
  }
}
