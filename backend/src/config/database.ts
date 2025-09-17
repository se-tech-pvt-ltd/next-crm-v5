import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../shared/schema.js";

export const connection = mysql.createPool(
  process.env.DATABASE_URL || "mysql://setcrminternet:password@151.106.112.145:3306/sales-crm"
);

export const db = drizzle(connection, { schema, mode: "default" });

// Best-effort migration to add new column for attachment-based profile images
try {
  await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_id varchar(50) NULL");
} catch (e) {
  console.warn('[db] Could not ensure profile_image_id column exists:', (e as any)?.message || e);
}
