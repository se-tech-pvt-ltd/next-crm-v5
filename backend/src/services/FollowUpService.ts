import { FollowUpModel } from "../models/FollowUp.js";
import { type FollowUp } from "../shared/schema.js";

interface ListFollowUpsInput {
  userId: string;
  start: Date;
  end: Date;
  entityTypes?: string[];
}

export interface FollowUpListItem extends FollowUp {
  status: "overdue" | "upcoming";
}

export class FollowUpService {
  static async listUserFollowUps({ userId, start, end, entityTypes }: ListFollowUpsInput): Promise<FollowUpListItem[]> {
    const rows = await FollowUpModel.findByUserAndRange(userId, start, end);
    const normalizedTypes = entityTypes?.map((type) => type.toLowerCase());

    const filtered = normalizedTypes
      ? rows.filter((row) => normalizedTypes.includes(String(row.entityType || "").toLowerCase()))
      : rows;

    const now = new Date();

    return filtered.map((row) => ({
      ...row,
      status: row.followUpOn.getTime() < now.getTime() ? "overdue" : "upcoming",
    }));
  }
}
