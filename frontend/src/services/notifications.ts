import { http } from './http';

export async function forgotPassword(email: string) {
  return http.post('/api/notifications/forgot-password', { email });
}

export async function fetchPendingNotifications() {
  return http.get('/api/notifications/pending');
}
