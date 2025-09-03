import { http } from './http';

export async function createActivity(data: {
  entityType: string;
  entityId: string;
  content: string;
  activityType?: string;
}) {
  const payload = {
    entityType: data.entityType,
    entityId: data.entityId,
    activityType: data.activityType || 'comment',
    title: data.content,
    description: data.content,
  };
  return http.post<any>('/api/activities', payload);
}
