import { db } from "../config/database.js";
import { attachments } from "../shared/schema.js";

export class AttachmentModel {
  static async create(data: { id: string; path: string }) {
    await db.insert(attachments).values({ id: data.id, path: data.path });
    const [row] = await db.select().from(attachments).where(attachments.id.eq(data.id as any));
    return row as any;
  }
}
