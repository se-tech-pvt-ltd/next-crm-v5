import { http } from './http';

export async function listUserAccess() {
  return http.get<any[]>('/api/user-access');
}

export async function createUserAccess(data: any) {
  return http.post<any>('/api/user-access', data);
}

export async function updateUserAccess(id: string, data: any) {
  return http.put<any>(`/api/user-access/${encodeURIComponent(id)}`, data);
}

export async function deleteUserAccess(id: string) {
  return http.delete<any>(`/api/user-access/${encodeURIComponent(id)}`);
}
