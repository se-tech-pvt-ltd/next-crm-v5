import { http } from './http';

export async function createActivity(data: {
  entityType: string;
  entityId: string;
  content: string;
  activityType?: string;
}) {
  return http.post<any>('/api/activities', data);
}
