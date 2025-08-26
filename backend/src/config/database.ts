import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema.js";

export const connection = mysql.createPool(
  process.env.DATABASE_URL || "mysql://setcrminternet:password@151.106.112.145:3306/sales-crm"
);

export const db = drizzle(connection, { schema, mode: "default" });
