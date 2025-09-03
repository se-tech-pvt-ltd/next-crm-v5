import { http } from './http';

export async function getUsers() {
  return http.get<any[]>('/api/users');
}

export async function updateUser(id: string | null, data: any) {
  if (!id) throw new Error('User ID is required');
  return http.put<any>(`/api/users/${id}`, data);
}
