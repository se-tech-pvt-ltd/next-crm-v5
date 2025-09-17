import { db } from "../config/database.js";
import { attachments } from "../shared/schema.js";
import { eq } from "drizzle-orm";

export class AttachmentModel {
  static async create(data: { id: string; path: string }) {
    await db.insert(attachments).values({ id: data.id, path: data.path });
    const [row] = await db.select().from(attachments).where(eq(attachments.id, data.id));
    return row as any;
  }

  static async findById(id: string) {
    const [row] = await db.select().from(attachments).where(eq(attachments.id, id));
    return row as any;
  }
}
