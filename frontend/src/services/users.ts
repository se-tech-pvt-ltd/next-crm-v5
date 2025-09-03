import { http } from './http';

export async function getUsers() {
  return http.get<any[]>('/api/users');
}
