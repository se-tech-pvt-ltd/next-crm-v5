import { http } from './http';

export async function listDepartments() {
  return http.get<any[]>('/api/user-departments');
}

export async function listRoles(departmentId?: string) {
  const qs = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : '';
  return http.get<any[]>(`/api/user-roles${qs}`);
}
