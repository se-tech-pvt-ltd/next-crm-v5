import { http } from './http';
import type { NotificationStatus } from '@/lib/types';

export async function forgotPassword(email: string) {
  return http.post('/api/notifications/forgot-password', { email });
}

export async function fetchPendingNotifications() {
  return http.get('/api/notifications/pending');
}

export async function updateNotificationStatus(id: string, status: NotificationStatus) {
  if (!id) {
    throw new Error('Notification ID is required');
  }

  return http.patch(`/api/notifications/${id}/status`, { status });
}
