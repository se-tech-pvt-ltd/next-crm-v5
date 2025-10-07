import { http } from './http';

export async function createActivity(data: {
  entityType: string;
  entityId: string;
  content: string;
  activityType?: string;
  followUpAt?: string | Date | null;
}) {
  const payload = {
    entityType: data.entityType,
    entityId: data.entityId,
    activityType: data.activityType || 'comment',
    title: data.content,
    description: data.content,
    followUpAt: data.followUpAt ?? null,
  };
  return http.post<any>('/api/activities', payload);
}
