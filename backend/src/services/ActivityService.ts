import { ActivityModel } from "../models/Activity.js";
import { UserModel } from "../models/User.js";
import { AttachmentModel } from "../models/Attachment.js";
import { type Activity, type InsertActivity } from "../shared/schema.js";

export class ActivityService {
  static async getActivities(entityType: string, entityId: string | number): Promise<Activity[]> {
    const activities = await ActivityModel.findByEntity(entityType, entityId);
    if (!Array.isArray(activities) || activities.length === 0) return [];

    // collect unique userIds that are present but missing userProfileImage
    const userIds = Array.from(new Set(activities.map(a => (a as any).userId).filter(Boolean)));
    const profileMap: Record<string, string | null> = {};

    for (const uid of userIds) {
      try {
        const user = await UserModel.findById(String(uid));
        if (user) {
          // profile image may be stored as profile_image_id or profileImageId depending on schema
          const profileImageId = (user as any).profile_image_id || (user as any).profileImageId || (user as any).profileImageId;
          if (profileImageId) {
            try {
              const att = await AttachmentModel.findById(String(profileImageId));
              profileMap[String(uid)] = att?.path || null;
            } catch (err) {
              profileMap[String(uid)] = null;
            }
          } else {
            // user table may have direct path column named profileImageUrl or profile_image_url
            profileMap[String(uid)] = (user as any).profileImageUrl || (user as any).profile_image_url || (user as any).profileImage || null;
          }
        } else {
          profileMap[String(uid)] = null;
        }
      } catch (err) {
        profileMap[String(uid)] = null;
      }
    }

    // attach resolved profile images back to activities where missing
    const enriched = activities.map(a => ({
      ...a,
      userProfileImage: (a as any).userProfileImage || profileMap[String((a as any).userId)] || null,
    }));

    return enriched;
  }

  static async createActivity(activityData: InsertActivity): Promise<Activity> {
    return await ActivityModel.create(activityData);
  }

  static async createActivityWithUser(activityData: InsertActivity, userId?: string): Promise<Activity> {
    let userName = "Next Bot";
    let userProfileImage = null;
    
    if (userId) {
      const user = await UserModel.findById(userId);
      if (user) {
        userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "User";
        if ((user as any).profileImageId) {
          try {
            const att = await AttachmentModel.findById(String((user as any).profileImageId));
            userProfileImage = att?.path || null;
          } catch {}
        }
      }
    }
    
    const activityWithUser = {
      ...activityData,
      entityId: String(activityData.entityId), // Convert to string for consistency
      userId,
      userName,
      userProfileImage,
    };
    
    return await ActivityModel.create(activityWithUser);
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
    userId?: string,
    userName?: string,
    userProfileImage?: string
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
        userId,
        userName: userName || "Next Bot",
        userProfileImage,
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
