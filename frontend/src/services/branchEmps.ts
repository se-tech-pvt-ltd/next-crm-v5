import { http } from './http';

export async function listBranchEmps() {
  return http.get<any[]>('/api/branch-emps');
}

export async function getBranchEmp(id: string) {
  return http.get<any>(`/api/branch-emps/${encodeURIComponent(id)}`);
}

export async function createBranchEmp(data: any) {
  return http.post<any>('/api/branch-emps', data);
}

export async function deleteBranchEmp(id: string) {
  return http.delete<any>(`/api/branch-emps/${encodeURIComponent(id)}`);
}
