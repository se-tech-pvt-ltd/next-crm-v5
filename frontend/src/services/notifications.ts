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

export async function listUpdates() {
  return http.get('/api/notifications/updates');
}

export async function createUpdate(payload: { title: string; body: string; excerpt?: string; scheduledAt?: string }) {
  return http.post('/api/notifications/updates', payload);
}
