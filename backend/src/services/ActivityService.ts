import { randomUUID } from "crypto";
import { ActivityModel } from "../models/Activity.js";
import { AttachmentModel } from "../models/Attachment.js";
import { FollowUpModel } from "../models/FollowUp.js";
import { UserModel } from "../models/User.js";
import { type Activity, type InsertActivity } from "../shared/schema.js";

export class ActivityService {
  static async getActivities(entityType: string, entityId: string | number): Promise<Activity[]> {
    const activities = await ActivityModel.findByEntity(entityType, entityId);
    if (!Array.isArray(activities) || activities.length === 0) return [];

    // collect unique userIds that are present
    const userIds = Array.from(new Set(activities.map(a => (a as any).userId).filter(Boolean)));

    // Fetch users and resolve display name and profile image from users table
    const userMap: Record<string, { userName: string; userProfileImage: string | null }> = {};
    for (const uid of userIds) {
      try {
        const user = await UserModel.findById(String(uid));
        if (user) {
          const userName = `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || (user as any).email || 'User';
          // Resolve profile image path if present
          let profileImage: string | null = null;
          const profileImageId = (user as any).profile_image_id || (user as any).profileImageId || (user as any).profileImageId;
          if (profileImageId) {
            try {
              const att = await AttachmentModel.findById(String(profileImageId));
              profileImage = att?.path || null;
            } catch (err) {
              profileImage = null;
            }
          } else {
            profileImage = (user as any).profileImageUrl || (user as any).profile_image_url || (user as any).profileImage || null;
          }
          userMap[String(uid)] = { userName, userProfileImage: profileImage };
        }
      } catch (err) {
        // ignore individual user failures
      }
    }

    // attach resolved userName and profile images from users table (do not rely on stored columns)
    const enriched = activities.map(a => {
      const uid = String((a as any).userId || '');
      const resolved = userMap[uid];
      return {
        ...a,
        userName: resolved ? resolved.userName : (a as any).userName || 'Next Bot',
        userProfileImage: resolved ? resolved.userProfileImage : null,
      };
    });

    return enriched;
  }

  static async createActivity(activityData: InsertActivity): Promise<Activity> {
    return await ActivityService.createActivityWithUser(activityData);
  }

  static async createActivityWithUser(activityData: InsertActivity, userId?: string): Promise<Activity> {
    // Do not persist userName and userProfileImage on activities; only store userId.
    const activityWithUser: InsertActivity = {
      ...activityData,
      entityId: String(activityData.entityId), // Convert to string for consistency
      userId: userId || null,
    };

    const activity = await ActivityModel.create(activityWithUser);

    const rawType = String(activityWithUser.activityType ?? "").toLowerCase();
    const normalizedType = rawType.replace(/[\s_-]/g, "");
    if (normalizedType === "followup") {
      const authorId = userId ?? activityWithUser.userId ?? undefined;
      if (!authorId) {
        await ActivityModel.delete(activity.id);
        throw new Error("User id is required to create follow-up records");
      }

      const followUpOn = activityWithUser.followUpAt ?? null;
      if (!(followUpOn instanceof Date) || Number.isNaN(followUpOn.getTime())) {
        await ActivityModel.delete(activity.id);
        throw new Error("Follow-up date and time are required for follow-up activities");
      }

      const descriptionSource = activityWithUser.description ?? activityWithUser.title;
      const comments = typeof descriptionSource === "string"
        ? descriptionSource.trim()
        : descriptionSource != null
          ? String(descriptionSource)
          : "";

      try {
        await FollowUpModel.create({
          id: randomUUID(),
          userId: String(authorId),
          entityId: String(activity.entityId),
          entityType: String(activity.entityType),
          comments: comments || "Follow-up recorded",
          followUpOn,
        });
      } catch (error) {
        await ActivityModel.delete(activity.id);
        throw error;
      }
    }

    return activity;
  }

  static async logActivity(
    entityType: string,
    entityId: string | number,
    activityType: string,
    title: string,
    description?: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string,
    userId?: string
  ): Promise<void> {
    try {
      await ActivityModel.create({
        entityType,
        entityId: String(entityId), // Convert to string for consistency
        activityType,
        title,
        description,
        fieldName,
        oldValue,
        newValue,
        userId: userId || null,
      });
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }

  static async transferActivities(
    fromEntityType: string,
    fromEntityId: string | number,
    toEntityType: string,
    toEntityId: string | number
  ): Promise<void> {
    return await ActivityModel.transferActivities(fromEntityType, fromEntityId, toEntityType, toEntityId);
  }
}
