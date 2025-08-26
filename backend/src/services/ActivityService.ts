import { ActivityModel } from "../models/Activity.js";
import { UserModel } from "../models/User.js";
import { type Activity, type InsertActivity } from "../shared/schema.js";

export class ActivityService {
  static async getActivities(entityType: string, entityId: number): Promise<Activity[]> {
    return await ActivityModel.findByEntity(entityType, entityId);
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
        userProfileImage = user.profileImageUrl;
      }
    }
    
    const activityWithUser = {
      ...activityData,
      userId,
      userName,
      userProfileImage,
    };
    
    return await ActivityModel.create(activityWithUser);
  }

  static async logActivity(
    entityType: string, 
    entityId: number, 
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
        entityId,
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
    fromEntityId: number, 
    toEntityType: string, 
    toEntityId: number
  ): Promise<void> {
    return await ActivityModel.transferActivities(fromEntityType, fromEntityId, toEntityType, toEntityId);
  }
}
